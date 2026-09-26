const SPREADSHEET_ID = "18EsOdByS0Pj0Y0p56glGKznXUdXF5AJVEMsppiIoYzY";

// Cache the spreadsheet object to avoid repeated openById calls
let cachedSpreadsheet = null;

function getSpreadsheet() {
    if (!cachedSpreadsheet) {
        cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    return cachedSpreadsheet;
}

function parseCellValue(val) {
    if (typeof val === 'string' && val.length >= 2) {
        var firstChar = val.charAt(0);
        var lastChar = val.charAt(val.length - 1);
        if ((firstChar === '[' && lastChar === ']') || (firstChar === '{' && lastChar === '}')) {
            try {
                return JSON.parse(val);
            } catch (e) {}
        } else if (val.indexOf('[') !== -1 || val.indexOf('{') !== -1) {
            var trimmed = val.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                try {
                    return JSON.parse(trimmed);
                } catch (e) {}
            }
        }
    }
    return val;
}

// Find absolute row index dynamically matching a unique ID in a specific column index
function findRowIndexById(sheet, idValue, idColumnIndex) {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1 || !idValue) return -1;

    var colIdx = parseInt(idColumnIndex);
    if (isNaN(colIdx) || colIdx < 0) {
        colIdx = 1; // Default to Column B (index 1)
    }

    var values = sheet.getRange(2, colIdx + 1, lastRow - 1, 1).getValues();
    var targetIdStr = idValue.toString().trim().toLowerCase();
    for (var i = 0; i < values.length; i++) {
        if (values[i][0].toString().trim().toLowerCase() === targetIdStr) {
            return 2 + i; // 1-based sheet row number
        }
    }
    return -1;
}

// Generate unique Request/Sequence No. (REQ-001, SEQ-001, etc.) in Col B (index 1)
function generateNextRequestNo(sheet, prefix) {
    var prfx = prefix || "REQ";
    var lastRow = sheet.getLastRow();
    var maxSeq = 0;
    if (lastRow >= 2) {
        var values = sheet.getRange(1, 2, lastRow, 1).getValues();
        var regex = new RegExp("^" + prfx + "-(\\d+)$", "i");
        for (var i = 0; i < values.length; i++) {
            var val = values[i][0].toString().trim();
            var match = val.match(regex);
            if (match) {
                var num = parseInt(match[1], 10);
                if (num > maxSeq) {
                    maxSeq = num;
                }
            }
        }
    }
    var nextNum = maxSeq + 1;
    return prfx + "-" + String(nextNum).padStart(3, '0');
}

// Generate unique Slip No. (SLIP-001, SLIP-002, etc.) in Col H (index 7)
function generateNextSlipNo(sheet, colIdx) {
    var lastRow = sheet.getLastRow();
    var maxSeq = 0;
    var targetCol = parseInt(colIdx);
    if (isNaN(targetCol) || targetCol < 0) {
        targetCol = 7; // Default to Column H
    }
    if (lastRow >= 2) {
        var values = sheet.getRange(1, targetCol + 1, lastRow, 1).getValues();
        for (var i = 0; i < values.length; i++) {
            var val = values[i][0].toString().trim();
            var match = val.match(/^SLIP-(\d+)$/i);
            if (match) {
                var num = parseInt(match[1], 10);
                if (num > maxSeq) {
                    maxSeq = num;
                }
            }
        }
    }
    var nextNum = maxSeq + 1;
    return "SLIP-" + String(nextNum).padStart(3, '0');
}

function doGet(e) {
    const sheetName = e.parameter.sheet || "Data";
    const page = e.parameter.page ? parseInt(e.parameter.page) : null;
    const limit = e.parameter.limit ? parseInt(e.parameter.limit) : null;
    const search = e.parameter.search ? e.parameter.search.toLowerCase().trim() : '';
    const filter = e.parameter.filter ? e.parameter.filter.toLowerCase().trim() : '';
    const headerRowParam = e.parameter.headerRow ? parseInt(e.parameter.headerRow) : null;

    try {
        const ss = getSpreadsheet();
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            return jsonError(`Sheet '${sheetName}' not found`);
        }

        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
        
        let data;
        let totalRows = 0;
        let pendingCount = 0;
        let historyCount = 0;

        if (lastRow > 0) {
            let headerRowIndex = -1;
            if (headerRowParam !== null) {
                headerRowIndex = headerRowParam;
            } else {
                const preRead = sheet.getRange(1, 1, Math.min(15, lastRow), lastCol).getValues();
                for (let i = 0; i < preRead.length; i++) {
                    const row = preRead[i];
                    const hasHeader = row.some(cell => {
                        const val = cell.toString().toLowerCase().replace(/\s+/g, ' ').trim();
                        return val === 'timestamp' || val === 'id no.' || val === 'request-no' || val === 'vehicle no' || val === 'planned' || val === 'actual';
                    });
                    if (hasHeader) {
                        headerRowIndex = i + 1;
                        break;
                    }
                }
            }

            if (headerRowIndex === -1) {
                headerRowIndex = lastRow < 6 ? 1 : 6;
            }
            if (headerRowIndex > lastRow) {
                headerRowIndex = lastRow;
            }

            const rawHeaderRow = sheet.getRange(headerRowIndex, 1, 1, lastCol).getValues()[0];
            const headerRow = [...rawHeaderRow, 'RowIndex'];
            
            let allDataRows = [];
            if (lastRow > headerRowIndex) {
                allDataRows = sheet.getRange(headerRowIndex + 1, 1, lastRow - headerRowIndex, lastCol).getValues();
            }
            
            let mappedRows = allDataRows.map(function(row, idx) {
                const sheetRowNumber = headerRowIndex + idx + 1;
                return [...row, sheetRowNumber];
            });

            const idIdx = headerRow.findIndex(h => {
                const val = h.toString().toLowerCase().replace(/\s+/g, ' ').trim();
                return val === 'id' || val === 'id no.' || val === 'request-no' || val === 'vehicle no';
            });
            const nameIdx = headerRow.findIndex(h => {
                const val = h.toString().toLowerCase().replace(/\s+/g, ' ').trim();
                return val === 'equipment name' || val === 'driver name' || val === 'issued to';
            });
            const plannedIdx = headerRow.findIndex(h => h.toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'planned');
            const actualIdx = headerRow.findIndex(h => h.toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'actual');

            mappedRows = mappedRows.filter(function(row) {
                if (idIdx === -1 && nameIdx === -1) {
                    return row.slice(0, -1).some(function(cell) {
                        return cell !== null && cell !== undefined && cell.toString().trim() !== '';
                    });
                }
                const idVal = idIdx !== -1 ? row[idIdx] || '' : '';
                const nameVal = nameIdx !== -1 ? row[nameIdx] || '' : '';
                return idVal.toString().trim() !== '' || nameVal.toString().trim() !== '';
            });

            mappedRows.forEach(function(row) {
                const plannedVal = plannedIdx !== -1 ? row[plannedIdx]?.toString() || '' : '';
                const actualVal = actualIdx !== -1 ? row[actualIdx]?.toString() || '' : '';
                if (plannedVal.trim() !== '') {
                    if (actualVal.trim() === '') {
                        pendingCount++;
                    } else {
                        historyCount++;
                    }
                }
            });

            if (filter === 'pending') {
                mappedRows = mappedRows.filter(function(row) {
                    const plannedVal = plannedIdx !== -1 ? row[plannedIdx]?.toString() || '' : '';
                    const actualVal = actualIdx !== -1 ? row[actualIdx]?.toString() || '' : '';
                    return plannedVal.trim() !== '' && actualVal.trim() === '';
                });
            } else if (filter === 'history') {
                mappedRows = mappedRows.filter(function(row) {
                    const plannedVal = plannedIdx !== -1 ? row[plannedIdx]?.toString() || '' : '';
                    const actualVal = actualIdx !== -1 ? row[actualIdx]?.toString() || '' : '';
                    return plannedVal.trim() !== '' && actualVal.trim() !== '';
                });
            }

            if (search) {
                mappedRows = mappedRows.filter(function(row) {
                    const cellsToSearch = row.slice(0, -1);
                    return cellsToSearch.some(function(cell) {
                        if (cell === null || cell === undefined) return false;
                        var cellStr = typeof cell === 'object' ? JSON.stringify(cell).toLowerCase() : cell.toString().toLowerCase();
                        return cellStr.indexOf(search) !== -1;
                    });
                });
            }

            totalRows = mappedRows.length;

            let finalRows = mappedRows;
            if (page !== null && limit !== null) {
                const startIndex = (page - 1) * limit;
                finalRows = mappedRows.slice(startIndex, startIndex + limit);
            }
            
            const parsedFinalRows = finalRows.map(function(row) {
                const rowData = row.slice(0, -1).map(parseCellValue);
                return [...rowData, row[row.length - 1]];
            });

            data = [headerRow, ...parsedFinalRows];
        } else {
            data = [[]];
        }

        const result = {
            success: true,
            updated: new Date().toISOString(),
            totalRows: totalRows,
            pendingCount: pendingCount,
            historyCount: historyCount,
            data: data
        };

        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return jsonError(err.message || "Server error");
    }
}

function jsonError(msg) {
    return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: msg })
    ).setMimeType(ContentService.MimeType.JSON);
}

function jsonSuccess(msg, additionalData) {
    const response = { success: true, message: msg, ...additionalData };
    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

function fetchSheetData(sheetName) {
    try {
        var ss = getSpreadsheet();
        var sheet = ss.getSheetByName(sheetName);
        var data = sheet.getDataRange().getDisplayValues();

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            data: data
        })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        console.error("Error fetching sheet data:", error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doPost(e) {
    try {
        var params = e.parameter;
        var action = params.action || 'insert';

        if (action === 'uploadFile') {
            return handleFileUpload(e);
        }

        var sheetName = params.sheetName;
        var ss = getSpreadsheet();
        var sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            throw new Error("Sheet '" + sheetName + "' not found");
        }

        // ============== OPTIMIZED INSERT ==============
        if (action === 'insert') {
            var rowData = JSON.parse(params.rowData);

            if (params.generateRequestNo === "true") {
                rowData[1] = generateNextRequestNo(sheet);
            }

            if (params.generateSlipNo === "true") {
                rowData[7] = generateNextSlipNo(sheet, 7);
            }

            var processedRowData = rowData.map(function(item) {
                if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
                    return JSON.stringify(item);
                }
                return item;
            });

            sheet.appendRow(processedRowData);
            SpreadsheetApp.flush();

            return jsonSuccess("Data inserted successfully");
        }

        // ============== OPTIMIZED UPDATE ==============
        else if (action === 'update') {
            var rowIndex = -1;
            if (params.idValue) {
                rowIndex = findRowIndexById(sheet, params.idValue, params.idColumnIndex);
            }
            if (rowIndex === -1 && params.rowIndex) {
                rowIndex = parseInt(params.rowIndex);
            }

            if (isNaN(rowIndex) || rowIndex < 2) {
                throw new Error("Row not found or invalid row index for update");
            }

            var rowData = JSON.parse(params.rowData);
            var existingData = sheet.getRange(rowIndex, 1, 1, rowData.length).getValues()[0];

            var processedRowData = rowData.map(function(item) {
                if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
                    return JSON.stringify(item);
                }
                return item;
            });

            var mergedData = existingData.map(function (existingVal, i) {
                return (processedRowData[i] !== '' && processedRowData[i] !== undefined) ? processedRowData[i] : existingVal;
            });

            if (params.generateRequestNo === "true" && (!mergedData[1] || mergedData[1].toString().trim() === '')) {
                mergedData[1] = generateNextRequestNo(sheet);
            }

            if (params.generateSlipNo === "true" && (!mergedData[7] || mergedData[7].toString().trim() === '')) {
                mergedData[7] = generateNextSlipNo(sheet, 7);
            }

            sheet.getRange(rowIndex, 1, 1, mergedData.length).setValues([mergedData]);
            SpreadsheetApp.flush();

            return jsonSuccess("Data updated successfully");
        }

        // ============== UPDATE CELL ==============
        else if (action === 'updateCell') {
            var rowIndex = -1;
            if (params.idValue) {
                rowIndex = findRowIndexById(sheet, params.idValue, params.idColumnIndex);
            }
            if (rowIndex === -1 && params.rowIndex) {
                rowIndex = parseInt(params.rowIndex);
            }
            var columnIndex = parseInt(params.columnIndex);
            var value = params.value;

            if (isNaN(rowIndex) || rowIndex < 1 || isNaN(columnIndex) || columnIndex < 1) {
                throw new Error("Invalid row or column index for update");
            }

            if (value !== null && typeof value === 'string') {
                try {
                    var parsed = JSON.parse(value);
                    if (parsed !== null && (Array.isArray(parsed) || typeof parsed === 'object')) {
                        value = JSON.stringify(parsed);
                    }
                } catch(e) {}
            } else if (value !== null && (Array.isArray(value) || typeof value === 'object')) {
                value = JSON.stringify(value);
            }

            sheet.getRange(rowIndex, columnIndex).setValue(value);
            SpreadsheetApp.flush();

            return jsonSuccess("Cell updated successfully");
        }

        // ============== UPDATE MULTIPLE CELLS ==============
        else if (action === 'updateCells') {
            var updates = JSON.parse(params.updates);
            if (!Array.isArray(updates)) {
                throw new Error("Updates must be an array");
            }

            for (var i = 0; i < updates.length; i++) {
                var update = updates[i];
                var rIndex = -1;
                if (update.idValue) {
                    rIndex = findRowIndexById(sheet, update.idValue, update.idColumnIndex);
                }
                if (rIndex === -1 && update.rowIndex) {
                    rIndex = parseInt(update.rowIndex);
                }
                var cIndex = parseInt(update.columnIndex);
                var val = update.value;

                if (isNaN(rIndex) || rIndex < 1 || isNaN(cIndex) || cIndex < 1) {
                    continue;
                }

                if (val !== null && typeof val === 'string') {
                    try {
                        var parsed = JSON.parse(val);
                        if (parsed !== null && (Array.isArray(parsed) || typeof parsed === 'object')) {
                            val = JSON.stringify(parsed);
                        }
                    } catch(e) {}
                } else if (val !== null && (Array.isArray(val) || typeof val === 'object')) {
                    val = JSON.stringify(val);
                }

                sheet.getRange(rIndex, cIndex).setValue(val);
            }
            SpreadsheetApp.flush();

            return jsonSuccess("Cells updated successfully");
        }

        // ============== UPDATE RANGE ==============
        else if (action === 'updateRange') {
            var rowIndex = parseInt(params.rowIndex);
            var startColumn = parseInt(params.startColumn);
            var values = JSON.parse(params.values);

            if (isNaN(rowIndex) || rowIndex < 1 || isNaN(startColumn) || startColumn < 1 || !Array.isArray(values) || !Array.isArray(values[0])) {
                throw new Error("Invalid parameters for updateRange");
            }

            if (sheetName === 'Email-Logs' && startColumn === 1) {
                rowIndex = sheet.getLastRow() + 1;
                var currentNextSeq = generateNextRequestNo(sheet, "SEQ");
                for (var i = 0; i < values.length; i++) {
                    if (!values[i][1] || values[i][1].toString().trim() === '') {
                        values[i][1] = currentNextSeq;
                    }
                }
            }

            var processedValues = values.map(function(row) {
                return row.map(function(item) {
                    if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
                        return JSON.stringify(item);
                    }
                    return item;
                });
            });

            sheet.getRange(rowIndex, startColumn, processedValues.length, processedValues[0].length).setValues(processedValues);
            SpreadsheetApp.flush();

            return jsonSuccess("Range updated successfully");
        }

        // ============== DELETE ==============
        else if (action === 'delete') {
            var rowIndex = -1;
            if (params.idValue) {
                rowIndex = findRowIndexById(sheet, params.idValue, params.idColumnIndex);
            }
            if (rowIndex === -1 && params.rowIndex) {
                rowIndex = parseInt(params.rowIndex);
            }

            if (isNaN(rowIndex) || rowIndex < 2) {
                throw new Error("Row not found or invalid row index for delete");
            }

            sheet.deleteRow(rowIndex);
            SpreadsheetApp.flush();

            return jsonSuccess("Row deleted successfully");
        }

        // ============== MARK DELETED ==============
        else if (action === 'markDeleted') {
            var rowIndex = -1;
            if (params.idValue) {
                rowIndex = findRowIndexById(sheet, params.idValue, params.idColumnIndex);
            }
            if (rowIndex === -1 && params.rowIndex) {
                rowIndex = parseInt(params.rowIndex);
            }
            var columnIndex = parseInt(params.columnIndex);
            var value = params.value || 'Yes';

            if (isNaN(rowIndex) || rowIndex < 2) {
                throw new Error("Row not found or invalid row index for marking as deleted");
            }
            if (isNaN(columnIndex) || columnIndex < 1) {
                throw new Error("Invalid column index for marking as deleted");
            }

            sheet.getRange(rowIndex, columnIndex).setValue(value);
            SpreadsheetApp.flush();

            return jsonSuccess("Row marked as deleted successfully");
        }

        // ============== BATCH INSERT ==============
        else if (action === 'batchInsert') {
            var rowsData = JSON.parse(params.rowsData);

            if (!Array.isArray(rowsData) || rowsData.length === 0) {
                throw new Error("Invalid rows data for batch insert");
            }

            if (sheetName === 'Email-Logs') {
                var currentNextSeq = generateNextRequestNo(sheet, "SEQ");
                for (var i = 0; i < rowsData.length; i++) {
                    if (!rowsData[i][1] || rowsData[i][1].toString().trim() === '') {
                        rowsData[i][1] = currentNextSeq;
                    }
                }
            }

            var processedRowsData = rowsData.map(function(row) {
                return row.map(function(item) {
                    if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
                        return JSON.stringify(item);
                    }
                    return item;
                });
            });

            var lastRow = sheet.getLastRow();
            sheet.getRange(lastRow + 1, 1, processedRowsData.length, processedRowsData[0].length).setValues(processedRowsData);

            SpreadsheetApp.flush();

            return jsonSuccess("Batch insert successful", { rowsInserted: rowsData.length });
        }

        else {
            throw new Error("Unknown action: " + action);
        }
    } catch (error) {
        console.error("Error in doPost:", error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.message || error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function handleFileUpload(e) {
    try {
        var params = e.parameter;

        if (!params.base64Data || !params.fileName) {
            throw new Error("Missing required parameters for file upload (base64Data, fileName)");
        }

        var mimeType = params.mimeType || 'image/jpeg';
        var folderId = params.folderId || '';

        var fileUrl = uploadFileToDrive(params.base64Data, params.fileName, mimeType, folderId);

        if (!fileUrl) {
            throw new Error("Failed to upload file to Google Drive");
        }

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            fileUrl: fileUrl,
            message: "File uploaded successfully"
        })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        console.error("Error in handleFileUpload:", error);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.message || error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function uploadFileToDrive(base64Data, fileName, mimeType, folderId) {
    try {
        var fileData = base64Data;
        if (fileData.indexOf('base64,') !== -1) {
            fileData = fileData.split('base64,')[1];
        }
        
        // Clean base64 string (spaces to + replacement for url-encoded transfers)
        fileData = fileData.replace(/ /g, '+').trim();

        var decoded = Utilities.base64Decode(fileData);
        var blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', fileName || 'photo.jpg');
        
        // Resolve target folder with fallbacks
        var folder = null;
        if (folderId && folderId.toString().trim() !== '') {
            try {
                folder = DriveApp.getFolderById(folderId.toString().trim());
            } catch (errFolder) {
                console.warn("Could not find folder by ID: " + errFolder.toString());
            }
        }
        
        // Fallback: use spreadsheet parent folder
        if (!folder) {
            try {
                var ss = getSpreadsheet();
                var ssFile = DriveApp.getFileById(ss.getId());
                var parents = ssFile.getParents();
                if (parents.hasNext()) {
                    folder = parents.next();
                }
            } catch (errParent) {
                console.warn("Could not get spreadsheet parent folder: " + errParent.toString());
            }
        }

        // Final fallback: root Drive folder
        if (!folder) {
            folder = DriveApp.getRootFolder();
        }

        var file = folder.createFile(blob);

        // Safe sharing (prevent failure on Google Workspace organization restrictions)
        try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
            try {
                file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (e2) {
                console.warn("Public sharing not permitted by domain policy: " + shareErr.toString());
            }
        }

        return "https://drive.google.com/uc?export=view&id=" + file.getId();
    } catch (error) {
        console.error("Error in uploadFileToDrive:", error);
        throw new Error("Upload failed: " + (error.message || error.toString()));
    }
}

function generateNextCalibrationNo(sheet) {
    var lastRow = sheet.getLastRow();
    var maxSeq = 0;
    if (lastRow >= 2) {
        var calNoColIdx = 2; // Default to Column B
        var preRead = sheet.getRange(1, 1, Math.min(15, lastRow), sheet.getLastColumn()).getValues();
        var headerRowIndex = -1;
        for (var r = 0; r < preRead.length; r++) {
            var row = preRead[r];
            var hasTimestamp = row.some(cell => cell.toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'timestamp');
            var hasId = row.some(cell => cell.toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'id no.');
            if (hasTimestamp || hasId) {
                headerRowIndex = r + 1;
                break;
            }
        }
        if (headerRowIndex === -1) {
            headerRowIndex = lastRow < 6 ? 1 : 6;
        }
        if (headerRowIndex > preRead.length) {
            headerRowIndex = preRead.length;
        }
        var headerCols = preRead[headerRowIndex - 1];
        for (var c = 0; c < headerCols.length; c++) {
            if (headerCols[c].toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'calibration-no.') {
                calNoColIdx = c + 1;
                break;
            }
        }
        
        var values = sheet.getRange(1, calNoColIdx, lastRow, 1).getValues();
        for (var i = 0; i < values.length; i++) {
            var val = values[i][0].toString().trim();
            var match = val.match(/^CB-(\d+)$/i);
            if (match) {
                var num = parseInt(match[1], 10);
                if (num > maxSeq) {
                    maxSeq = num;
                }
            }
        }
    }
    var nextNum = maxSeq + 1;
    var paddedNum = nextNum < 1000 ? ("000" + nextNum).slice(-3) : nextNum.toString();
    return "CB-" + paddedNum;
}
