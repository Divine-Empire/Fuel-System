
const updateMultipleCells = async (sheetName, updatesList) => {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL is missing in environment variables");
  }

  // 1. Try batch updateCells
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

  // 2. Sequential fallback to prevent concurrent write lock crashes
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

export const employeeService = {
  getEmployeeRequestsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Employee-Logs&headerRow=6&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch employee logs");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);

      return rows.map((row) => {
        const timestamp = (row[0] || '').toString().trim();
        const requestNo = (row[1] || '').toString().trim();
        const dateOfVisit = (row[2] || '').toString().trim();
        const department = (row[3] || '').toString().trim();
        const employeeName = (row[4] || '').toString().trim();
        const startTime = (row[5] || '').toString().trim();
        const kmReadingStart = parseFloat(row[6]) || 0;
        const proofStart = (row[7] || '').toString().trim();
        const endTime = (row[8] || '').toString().trim();
        const kmReadingEnd = parseFloat(row[9]) || 0;
        const proofEnd = (row[10] || '').toString().trim();
        const purposeOfVisit = (row[11] || '').toString().trim();
        const clientName = (row[12] || '').toString().trim();
        const siteLocation = (row[13] || '').toString().trim();
        const machineDetails = (row[14] || '').toString().trim();
        const journeyOutcome = (row[15] || '').toString().trim();

        // Stage 1 columns (Planned1, Actual1, Delay1, Approval by HOD)
        const planned1 = (row[16] || '').toString().trim();
        const actual1 = (row[17] || '').toString().trim();
        const delay1 = (row[18] || '').toString().trim();
        const approvalByHod = (row[19] || '').toString().trim();

        // Stage 2 columns (Planned2, Actual2, Delay2, Distance covered, Rate, Calculated Price, Actual-Paid, Remarks, Payment Status)
        const planned2 = (row[20] || '').toString().trim();
        const actual2 = (row[21] || '').toString().trim();
        const delay2 = (row[22] || '').toString().trim();
        const distanceCovered = row[23] !== '' && row[23] !== null && row[23] !== undefined ? parseFloat(row[23]) : 0;
        const rate = row[24] !== '' && row[24] !== null && row[24] !== undefined ? parseFloat(row[24]) : 0;
        const calculatedPrice = row[25] !== '' && row[25] !== null && row[25] !== undefined ? parseFloat(row[25]) : 0;
        const actualPaid = row[26] !== '' && row[26] !== null && row[26] !== undefined ? parseFloat(row[26]) : 0;
        const remarks = (row[27] || '').toString().trim();
        const paymentStatus = (row[28] || 'pending').toString().trim();

        let vehicleType = 'Car';
        let distance = '';
        let approvedBy = '';
        let hodRemarks = '';
        if (row.length > 30) {
          vehicleType = (row[29] || '').toString().trim() || 'Car';
        }
        if (row.length > 31) {
          distance = (row[30] || '').toString().trim();
        }
        if (row.length > 32) {
          approvedBy = (row[31] || '').toString().trim();
        }
        if (row.length > 33) {
          hodRemarks = (row[32] || '').toString().trim();
        }

        // RowIndex is the last element
        const rowIndex = parseInt(row[row.length - 1]) || null;

        return {
          id: `emp_${rowIndex || Date.now()}_${requestNo || timestamp}`,
          timestamp,
          requestNo,
          dateOfVisit,
          department,
          employeeName,
          startTime,
          kmReadingStart,
          proofStart,
          endTime,
          kmReadingEnd,
          proofEnd,
          purposeOfVisit,
          clientName,
          siteLocation,
          machineDetails,
          journeyOutcome,
          planned1,
          actual1,
          delay1,
          approvalByHod,
          planned2,
          actual2,
          delay2,
          distanceCovered,
          rate,
          calculatedPrice,
          actualPaid,
          remarks,
          paymentStatus,
          vehicleType,
          distance,
          approvedBy,
          hodRemarks,
          rowIndex
        };
      });
    } catch (error) {
      console.error("Error fetching employee requests from sheet:", error);
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

  createEmployeeRequestToSheet: async (requestData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Columns: A to AE (31 columns)
    const rowData = [
      formattedTimestamp,                          // Col A (1): Timestamp
      '',                                          // Col B (2): Request-No (will be generated by GAS because of generateRequestNo: true)
      requestData.dateOfVisit || '',               // Col C (3): Date of Visit
      requestData.department || '',                // Col D (4): Department
      requestData.employeeName || '',              // Col E (5): Employee-Name
      requestData.startTime || '',                 // Col F (6): Start-Time
      parseFloat(requestData.kmReadingStart) || 0, // Col G (7): KM Reading (Start)
      requestData.proofStart || '',                // Col H (8): Proof (Start)
      requestData.endTime || '',                   // Col I (9): End-Time
      (requestData.kmReadingEnd !== '' && requestData.kmReadingEnd !== undefined && requestData.kmReadingEnd !== null) ? parseFloat(requestData.kmReadingEnd) : '',   // Col J (10): KM Reading (End)
      requestData.proofEnd || '',                  // Col K (11): Proof (End)
      requestData.purposeOfVisit || '',            // Col L (12): Purpose of Visit
      requestData.clientName || '',                // Col M (13): Client-Name
      requestData.siteLocation || '',              // Col N (14): Site-Location
      requestData.machineDetails || '',            // Col O (15): Machine-Details
      requestData.journeyOutcome || '',            // Col P (16): Journey Outcome
      '',                                          // Col Q (17): Planned1
      '',                                          // Col R (18): Actual1
      '',                                          // Col S (19): Delay1
      '',                                          // Col T (20): Approval by HOD
      '',                                          // Col U (21): Planned2
      '',                                          // Col V (22): Actual2
      '',                                          // Col W (23): Delay2
      '',                                          // Col X (24): Distance covered
      '',                                          // Col Y (25): Rate
      '',                                          // Col Z (26): Calculated Price
      '',                                          // Col AA (27): Actual-Paid
      '',                                          // Col AB (28): Remarks
      '',                                          // Col AC (29): Payment Status
      requestData.vehicleType || 'Car',            // Col AD (30): Vehicle Type
      requestData.distance !== undefined && requestData.distance !== null ? requestData.distance.toString() : '' // Col AE (31): Calculated Distance (KM)
    ];

    const bodyParams = new URLSearchParams({
      action: 'insert',
      sheetName: 'Employee-Logs',
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
      throw new Error(resJson.error || 'Failed to submit employee travel log');
    }

    return resJson;
  },

  approveEmployeeRequestsToSheet: async (rowIndexes, approvedBy, remarks) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Construct flat list of updates
    const updatesList = rowIndexes.flatMap((rowIndex) => [
      { rowIndex, col: 18, val: formattedTimestamp },
      { rowIndex, col: 20, val: 'Approved' },
      { rowIndex, col: 32, val: approvedBy || '' },
      { rowIndex, col: 33, val: remarks || '' }
    ]);

    return await updateMultipleCells('Employee-Logs', updatesList);
  },

  processEmployeePaymentToSheet: async (rowIndex, paymentData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const updatesList = [
      { rowIndex, col: 25, val: parseFloat(paymentData.rate).toString() },            // Col Y: Rate
      { rowIndex, col: 26, val: parseFloat(paymentData.calculatedPrice).toString() },  // Col Z: Calculated Price
      { rowIndex, col: 27, val: parseFloat(paymentData.actualPaid).toString() },       // Col AA: Actual-Paid
      { rowIndex, col: 28, val: paymentData.remarks || '' },                          // Col AB: Remarks
      { rowIndex, col: 29, val: paymentData.paymentStatus }                           // Col AC: Payment Status
    ];

    // Actual2 (Col V / 22): timestamp if status is paid, else empty string
    if (paymentData.paymentStatus === 'paid') {
      updatesList.push({ rowIndex, col: 22, val: formattedTimestamp });
    } else {
      updatesList.push({ rowIndex, col: 22, val: '' });
    }

    return await updateMultipleCells('Employee-Logs', updatesList);
  },

  completeEmployeeJourneyInSheet: async (rowIndex, journeyData) => {
    const updatesList = [
      { rowIndex, col: 9, val: journeyData.endTime || '' },                              // Col I (9): End-Time
      { rowIndex, col: 10, val: parseFloat(journeyData.kmReadingEnd) || 0 },              // Col J (10): KM Reading (End)
      { rowIndex, col: 11, val: journeyData.proofEnd || '' },                            // Col K (11): Proof (End)
      { rowIndex, col: 16, val: journeyData.journeyOutcome || '' },                       // Col P (16): Journey Outcome
      { rowIndex, col: 31, val: journeyData.distance !== undefined && journeyData.distance !== null ? journeyData.distance.toString() : '' } // Col AE (31): Calculated Distance (KM)
    ];
    return await updateMultipleCells('Employee-Logs', updatesList);
  },

  getEmployeesFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch employees");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);
      // Col I is index 8 (0-based)
      const employees = rows
        .map(row => (row[8] || '').toString().trim())
        .filter(emp => emp !== '');
      
      return Array.from(new Set(employees));
    } catch (error) {
      console.error("Error fetching employees from sheet:", error);
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

  getEmployeesWithDepartmentsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch employees and departments");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);
      // Col G is index 6, Col H is index 7 (0-based)
      return rows
        .map(row => ({
          department: (row[6] || '').toString().trim(),
          employeeName: (row[7] || '').toString().trim()
        }))
        .filter(item => item.employeeName !== '' && item.department !== '');
    } catch (error) {
      console.error("Error fetching employees and departments from sheet:", error);
      return [];
    }
  }
};
