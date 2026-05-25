const SPREADSHEET_ID = "18EsOdByS0Pj0Y0p56glGKznXUdXF5AJVEMsppiIoYzY";

// Cache the spreadsheet object to avoid repeated openById calls
let cachedSpreadsheet = null;

function getSpreadsheet() {
    if (!cachedSpreadsheet) {
        cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    return cachedSpreadsheet;
}

// Parse stringified JSON arrays/objects from cells
function parseCellValue(val) {
    if (typeof val === 'string') {
        var trimmed = val.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                return val;
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

// Generate unique Request No. (REQ-001, REQ-002, etc.) in Col B (index 1)
function generateNextRequestNo(sheet) {
    var lastRow = sheet.getLastRow();
    var maxSeq = 0;
    if (lastRow >= 2) {
        var values = sheet.getRange(1, 2, lastRow, 1).getValues();
        for (var i = 0; i < values.length; i++) {
            var val = values[i][0].toString().trim();
            var match = val.match(/^REQ-(\d+)$/i);
            if (match) {
                var num = parseInt(match[1], 10);
                if (num > maxSeq) {
                    maxSeq = num;
                }
            }
        }
    }
    var nextNum = maxSeq + 1;
    return "REQ-" + String(nextNum).padStart(3, '0');
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
            // Find header row dynamically or use parameter
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
            
            // Get all data rows
            const allDataRows = sheet.getRange(headerRowIndex + 1, 1, lastRow - headerRowIndex, lastCol).getValues();
            
            // Map rows, parse serialized cells (e.g. documents JSON), and append absolute index
            let mappedRows = allDataRows.map(function(row, idx) {
                const sheetRowNumber = headerRowIndex + idx + 1;
                const parsedRow = row.map(parseCellValue);
                return [...parsedRow, sheetRowNumber];
            });

            // Filter out empty rows
            mappedRows = mappedRows.filter(function(row) {
                const idIdx = headerRow.findIndex(h => {
                    const val = h.toString().toLowerCase().replace(/\s+/g, ' ').trim();
                    return val === 'id' || val === 'id no.' || val === 'request-no' || val === 'vehicle no';
                });
                const nameIdx = headerRow.findIndex(h => {
                    const val = h.toString().toLowerCase().replace(/\s+/g, ' ').trim();
                    return val === 'equipment name' || val === 'driver name' || val === 'issued to';
                });
                
                if (idIdx === -1 && nameIdx === -1) {
                    return row.slice(0, -1).some(function(cell) {
                        return cell !== null && cell !== undefined && cell.toString().trim() !== '';
                    });
                }

                const idVal = idIdx !== -1 ? row[idIdx] || '' : '';
                const idStr = typeof idVal === 'object' ? JSON.stringify(idVal) : idVal.toString();
                const nameVal = nameIdx !== -1 ? row[nameIdx] || '' : '';
                const nameStr = typeof nameVal === 'object' ? JSON.stringify(nameVal) : nameVal.toString();

                return idStr.trim() !== '' || nameStr.trim() !== '';
            });

            // Calculate pending and history counts (Planned & Actual columns based classification)
            const plannedIdx = headerRow.findIndex(h => h.toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'planned');
            const actualIdx = headerRow.findIndex(h => h.toString().toLowerCase().replace(/\s+/g, ' ').trim() === 'actual');
            
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

            // Apply filter parameter
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

            // Apply search filter if present
            if (search) {
                mappedRows = mappedRows.filter(function(row) {
                    const cellsToSearch = row.slice(0, -1);
                    return cellsToSearch.some(function(cell) {
                        if (cell === null || cell === undefined) return false;
                        var cellStr = typeof cell === 'object' ? JSON.stringify(cell) : cell.toString();
                        return cellStr.toLowerCase().indexOf(search) !== -1;
                    });
                });
            }

            totalRows = mappedRows.length;

            if (page !== null && limit !== null) {
                const startIndex = (page - 1) * limit;
                const chunk = mappedRows.slice(startIndex, startIndex + limit);
                data = [headerRow, ...chunk];
            } else {
                data = [headerRow, ...mappedRows];
            }
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

            // Generate Request No at index 1 if requested
            if (params.generateRequestNo === "true") {
                rowData[1] = generateNextRequestNo(sheet);
            }

            // Generate Slip No at index 7 if requested
            if (params.generateSlipNo === "true") {
                rowData[7] = generateNextSlipNo(sheet, 7);
            }

            // Stringify nested structures (e.g. documents array)
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

            // Get existing row data first, then batch update
            var existingData = sheet.getRange(rowIndex, 1, 1, rowData.length).getValues()[0];

            // Stringify nested structures in payload
            var processedRowData = rowData.map(function(item) {
                if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
                    return JSON.stringify(item);
                }
                return item;
            });

            // Merge: only update non-empty values
            var mergedData = existingData.map(function (existingVal, i) {
                return (processedRowData[i] !== '' && processedRowData[i] !== undefined) ? processedRowData[i] : existingVal;
            });

            // Conditional Sequence Generation
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

            // Stringify if value is object/array
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
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function handleFileUpload(e) {
    try {
        var params = e.parameter;

        if (!params.base64Data || !params.fileName || !params.mimeType || !params.folderId) {
            throw new Error("Missing required parameters for file upload");
        }

        var fileUrl = uploadFileToDrive(params.base64Data, params.fileName, params.mimeType, params.folderId);

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
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function uploadFileToDrive(base64Data, fileName, mimeType, folderId) {
    try {
        let fileData = base64Data;
        if (base64Data.indexOf('base64,') !== -1) {
            fileData = base64Data.split('base64,')[1];
        }

        const decoded = Utilities.base64Decode(fileData);
        const blob = Utilities.newBlob(decoded, mimeType, fileName);
        const folder = DriveApp.getFolderById(folderId);
        const file = folder.createFile(blob);

        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        return "https://drive.google.com/uc?export=view&id=" + file.getId();
    } catch (error) {
        console.error("Error in uploadFileToDrive:", error);
        return null;
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