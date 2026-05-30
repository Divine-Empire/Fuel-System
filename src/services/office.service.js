
const updateMultipleCells = async (sheetName, updatesList) => {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL is missing in environment variables");
  }

  // Try batch updateCells
  try {
    const bodyParams = new URLSearchParams({
      action: 'updateCells',
      sheetName: sheetName,
      updates: JSON.stringify(updatesList.map(u => ({
        rowIndex: u.rowIndex.toString(),
        columnIndex: u.col.toString(),
        value: u.val !== null && u.val !== undefined ? u.val.toString() : ''
      })))
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success) {
        return { success: true };
      }
    }
  } catch (error) {
    console.warn("Batch updateCells failed, falling back to sequential updateCell:", error);
  }

  // Sequential fallback
  for (const update of updatesList) {
    const bodyParams = new URLSearchParams({
      action: 'updateCell',
      sheetName: sheetName,
      rowIndex: update.rowIndex.toString(),
      columnIndex: update.col.toString(),
      value: update.val !== null && update.val !== undefined ? update.val.toString() : ''
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) {
      throw new Error(`Update of row ${update.rowIndex} column ${update.col} failed`);
    }
    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || `Update of row ${update.rowIndex} column ${update.col} failed`);
    }
  }

  return { success: true };
};

export const officeService = {
  getOfficeRequestsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Office-Logs&headerRow=6&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch office logs");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);

      return rows.map((row) => {
        const timestamp = (row[0] || '').toString().trim();
        const requestNo = (row[1] || '').toString().trim();
        const vehicleNo = (row[2] || '').toString().trim().toUpperCase();
        const requestedBy = (row[3] || '').toString().trim();
        const amountReq = parseFloat(row[4]) || 0;
        const planned1 = (row[5] || '').toString().trim();
        const actual1 = (row[6] || '').toString().trim();
        const delay = (row[7] || '').toString().trim();
        const modeOfAdvanceAmt = (row[8] || '').toString().trim();
        const advancePaid = parseFloat(row[9]) || 0;
        const plannedDriver = (row[10] || '').toString().trim();
        const actualDriver = (row[11] || '').toString().trim();
        const delayDriver = (row[12] || '').toString().trim();
        const dateOfFilling = (row[13] || '').toString().trim();
        const lastKmReading = parseFloat(row[14]) || 0;
        const currentKmReading = parseFloat(row[15]) || 0;
        const photoOfReading = (row[16] || '').toString().trim();
        const qty = parseFloat(row[17]) || 0;
        const rate = parseFloat(row[18]) || 0;
        const calculatedPrice = parseFloat(row[19]) || 0;
        const fuelBillPhoto = (row[20] || '').toString().trim();
        const fuelMachineBeforeStart = (row[21] || '').toString().trim();
        const fuelMachineAfter = (row[22] || '').toString().trim();
        const mileage = parseFloat(row[23]) || 0;
        const approvedBy = (row[24] || '').toString().trim();
        const remarks = (row[25] || '').toString().trim();
        const rowIndex = row[row.length - 1];

        return {
          timestamp,
          requestNo,
          vehicleNo,
          requestedBy,
          amountReq,
          planned1,
          actual1,
          delay,
          modeOfAdvanceAmt,
          advancePaid,
          plannedDriver,
          actualDriver,
          delayDriver,
          dateOfFilling,
          lastKmReading,
          currentKmReading,
          photoOfReading,
          qty,
          rate,
          calculatedPrice,
          fuelBillPhoto,
          fuelMachineBeforeStart,
          fuelMachineAfter,
          mileage,
          approvedBy,
          remarks,
          rowIndex
        };
      });
    } catch (error) {
      console.error("Error fetching office requests from sheet:", error);
      throw error;
    }
  },

  uploadFileToDrive: async (base64Data, fileName, mimeType = 'image/png') => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;
    if (!APPS_SCRIPT_URL || !FOLDER_ID) {
      throw new Error("Apps Script URL or Folder ID is missing in environment variables");
    }

    const bodyParams = new URLSearchParams({
      action: 'uploadFile',
      base64Data: base64Data,
      fileName: fileName,
      mimeType: mimeType,
      folderId: FOLDER_ID
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) throw new Error("Upload request failed");
    const resJson = await response.json();
    if (!resJson.success) throw new Error(resJson.error || "File upload failed");
    return resJson.fileUrl;
  },

  createOfficeRequestToSheet: async (requestData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Columns: A to X (24 columns)
    const rowData = Array(24).fill('');
    rowData[0] = formattedTimestamp;                    // Col A (1): Timestamp
    rowData[1] = '';                                    // Col B (2): Request-No (GAS generated)
    rowData[2] = requestData.vehicleNo || '';           // Col C (3): Vehicle No
    rowData[3] = requestData.requestedBy || '';         // Col D (4): Requested by
    rowData[4] = parseFloat(requestData.amountReq) || 0; // Col E (5): Amount Req

    const bodyParams = new URLSearchParams({
      action: 'insert',
      sheetName: 'Office-Logs',
      generateRequestNo: 'true',
      rowData: JSON.stringify(rowData)
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || 'Failed to submit office travel log');
    }

    return resJson;
  },

  processAdvancePaymentToSheet: async (rowIndex, paymentData) => {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const updatesList = [
      { rowIndex, col: 7, val: formattedTimestamp },                                // Col G (7): Actual1 (Advance paid timestamp)
      { rowIndex, col: 9, val: paymentData.modeOfAdvanceAmt || '' },                // Col I (9): Mode of Advance Amt
      { rowIndex, col: 10, val: parseFloat(paymentData.advancePaid) || 0 },         // Col J (10): Advance-Paid
      { rowIndex, col: 25, val: paymentData.approvedBy || '' },                     // Col Y (25): Approved By
      { rowIndex, col: 26, val: paymentData.remarks || '' }                         // Col Z (26): Remarks
    ];

    return await updateMultipleCells('Office-Logs', updatesList);
  },

  processActualFillingToSheet: async (rowIndex, fillingData) => {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const updatesList = [
      { rowIndex, col: 12, val: formattedTimestamp },                                // Col L (12): Actual1 (Driver) (Actual filling timestamp)
      { rowIndex, col: 14, val: fillingData.dateOfFilling || '' },                   // Col N (14): Date of Filling
      { rowIndex, col: 15, val: parseFloat(fillingData.lastKmReading) || 0 },        // Col O (15): Last KM Reading
      { rowIndex, col: 16, val: parseFloat(fillingData.currentKmReading) || 0 },     // Col P (16): Current KM Reading
      { rowIndex, col: 17, val: fillingData.photoOfReading || '' },                  // Col Q (17): photo of reading
      { rowIndex, col: 18, val: parseFloat(fillingData.qty) || 0 },                  // Col R (18): Qty
      { rowIndex, col: 19, val: parseFloat(fillingData.rate) || 0 },                 // Col S (19): Rate
      { rowIndex, col: 20, val: parseFloat(fillingData.calculatedPrice) || 0 },      // Col T (20): Calculated Price
      { rowIndex, col: 21, val: fillingData.fuelBillPhoto || '' },                   // Col U (21): Fuel-Bill-Photo
      { rowIndex, col: 22, val: fillingData.fuelMachineBeforeStart || '' },          // Col V (22): Fuel machine before start
      { rowIndex, col: 23, val: fillingData.fuelMachineAfter || '' },                // Col W (23): Fuel machine after
      { rowIndex, col: 24, val: parseFloat(fillingData.mileage) || 0 }               // Col X (24): Mileage
    ];

    return await updateMultipleCells('Office-Logs', updatesList);
  },

  getRequestedByFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch requestors");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);
      // Filter by Col G (index 6) === 'WAREHOUSE' and map Col H (index 7)
      const requestors = rows
        .filter(row => (row[6] || '').toString().trim().toUpperCase() === 'WAREHOUSE')
        .map(row => (row[7] || '').toString().trim())
        .filter(req => req !== '');
      
      return Array.from(new Set(requestors));
    } catch (error) {
      console.error("Error fetching requestors from sheet:", error);
      return [];
    }
  },

  getApprovedByFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch approvers");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);
      // Col K is index 10 (0-based)
      const approvers = rows
        .map(row => (row[10] || '').toString().trim())
        .filter(app => app !== '');
      
      return Array.from(new Set(approvers));
    } catch (error) {
      console.error("Error fetching approvers from sheet:", error);
      return [];
    }
  },

  getAdvanceModesFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch advance modes");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);
      // Col I is index 8 (0-based)
      const modes = rows
        .map(row => (row[8] || '').toString().trim())
        .filter(mode => mode !== '');
      
      return Array.from(new Set(modes));
    } catch (error) {
      console.error("Error fetching advance modes from sheet:", error);
      return [];
    }
  },

  getLastOdometerFromOfficeLogs: async (vehicleNo) => {
    try {
      const logs = await officeService.getOfficeRequestsFromSheet();
      const matching = logs.filter(log => log.vehicleNo.trim().toUpperCase() === vehicleNo.trim().toUpperCase() && log.currentKmReading > 0);
      if (matching.length > 0) {
        return matching[matching.length - 1].currentKmReading;
      }
      return null;
    } catch (e) {
      console.error("Error fetching last odometer from office logs:", e);
      return null;
    }
  }
};
