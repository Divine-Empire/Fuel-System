
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

const updateCellRange = async (sheetName, rowIndex, startColumn, values2D) => {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (!APPS_SCRIPT_URL) {
    throw new Error("Apps Script URL is missing in environment variables");
  }

  try {
    const bodyParams = new URLSearchParams({
      action: 'updateRange',
      sheetName: sheetName,
      rowIndex: rowIndex.toString(),
      startColumn: startColumn.toString(),
      values: JSON.stringify(values2D)
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
    console.warn("Batch updateRange failed, falling back to individual cell updates:", error);
  }

  // Fallback: construct updates list and use updateMultipleCells
  const updatesList = [];
  values2D.forEach((rowValues) => {
    rowValues.forEach((val, colOffset) => {
      updatesList.push({
        rowIndex,
        col: startColumn + colOffset,
        val
      });
    });
  });

  return await updateMultipleCells(sheetName, updatesList);
};

const fetchWithRetry = async (url, options = {}, retries = 2, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`Network response was not ok (HTTP ${response.status})`);
    } catch (err) {
      lastError = err;
    }
    if (i < retries) {
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
};

export const employeeService = {
  getEmployeeRequestsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    try {
      const response = await fetchWithRetry(`${APPS_SCRIPT_URL}?sheet=Employee-Logs&headerRow=7&_t=${Date.now()}`);
      
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
        const vehicleType = (row[5] || '').toString().trim() || 'Car';
        const startTime = (row[6] || '').toString().trim();
        const kmReadingStart = parseFloat(row[7]) || 0;
        const proofStart = (row[8] || '').toString().trim();
        const endTime = (row[9] || '').toString().trim();
        const kmReadingEnd = parseFloat(row[10]) || 0;
        const proofEnd = (row[11] || '').toString().trim();
        const distanceCovered = row[12] !== '' && row[12] !== null && row[12] !== undefined ? parseFloat(row[12]) : 0;
        const purposeOfVisit = (row[13] || '').toString().trim();
        const clientName = (row[14] || '').toString().trim();
        const siteLocation = (row[15] || '').toString().trim();
        const machineDetails = (row[16] || '').toString().trim();
        const journeyOutcome = (row[17] || '').toString().trim();

        // Stage 1 columns (Planned1, Actual1, Delay, Status, Approved By, Remarks)
        const planned1 = (row[18] || '').toString().trim();
        const actual1 = (row[19] || '').toString().trim();
        const delay1 = (row[20] || '').toString().trim();
        const approvalByHod = (row[21] || '').toString().trim(); // Status
        const approvedBy = (row[22] || '').toString().trim(); // Approved By
        const hodRemarks = (row[23] || '').toString().trim(); // Remarks

        // Stage 2 columns (Planned2, Actual2, Delay2, Rate, Calculated Price, Actual-Paid, Remarks, Payment Status)
        const planned2 = (row[24] || '').toString().trim();
        const actual2 = (row[25] || '').toString().trim();
        const delay2 = (row[26] || '').toString().trim();
        const rate = row[27] !== '' && row[27] !== null && row[27] !== undefined ? parseFloat(row[27]) : 0;
        const calculatedPrice = row[28] !== '' && row[28] !== null && row[28] !== undefined ? parseFloat(row[28]) : 0;
        const actualPaid = row[29] !== '' && row[29] !== null && row[29] !== undefined ? parseFloat(row[29]) : 0;
        const remarks = (row[30] || '').toString().trim();
        const paymentStatus = (row[31] || 'pending').toString().trim();

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
          distance: distanceCovered.toString(),
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

  uploadFileToDrive: async (base64Data, fileName, mimeType = 'image/jpeg') => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const bodyParams = new URLSearchParams({
      action: 'uploadFile',
      base64Data: base64Data,
      fileName: fileName,
      mimeType: mimeType || 'image/jpeg',
      folderId: FOLDER_ID || ''
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) throw new Error(`Upload request failed with status ${response.status}`);
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

    // Columns: A to AF (32 columns)
    const rowData = Array(32).fill('');
    rowData[0] = formattedTimestamp;                          // Col A (1): Timestamp
    rowData[1] = '';                                          // Col B (2): Request-No (generated by GAS)
    rowData[2] = requestData.dateOfVisit || '';               // Col C (3): Date of Visit
    rowData[3] = requestData.department || '';                // Col D (4): Department
    rowData[4] = requestData.employeeName || '';              // Col E (5): Employee-Name
    rowData[5] = requestData.vehicleType || 'Car';            // Col F (6): Vehicle Type
    rowData[6] = requestData.startTime || '';                 // Col G (7): Start-Time
    rowData[7] = parseFloat(requestData.kmReadingStart) || 0; // Col H (8): KM Reading (Start)
    rowData[8] = requestData.proofStart || '';                // Col I (9): Proof (Start)
    rowData[9] = requestData.endTime || '';                   // Col J (10): End-Time
    rowData[10] = (requestData.kmReadingEnd !== '' && requestData.kmReadingEnd !== undefined && requestData.kmReadingEnd !== null) ? parseFloat(requestData.kmReadingEnd) : ''; // Col K (11): KM Reading (End)
    rowData[11] = requestData.proofEnd || '';                 // Col L (12): Proof (End)
    rowData[12] = requestData.distance !== undefined && requestData.distance !== null ? parseFloat(requestData.distance) || 0 : ''; // Col M (13): Distance Covered
    rowData[13] = requestData.purposeOfVisit || '';           // Col N (14): Purpose of Visit
    rowData[14] = requestData.clientName || '';               // Col O (15): Client-Name
    rowData[15] = requestData.siteLocation || '';             // Col P (16): Site-Location
    rowData[16] = requestData.machineDetails || '';           // Col Q (17): Machine-Details
    rowData[17] = requestData.journeyOutcome || '';           // Col R (18): Journey Outcome

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
      { rowIndex, col: 20, val: formattedTimestamp }, // Col T (20): Actual1
      { rowIndex, col: 22, val: 'Approved' },         // Col V (22): Status
      { rowIndex, col: 23, val: approvedBy || '' },   // Col W (23): Approved By
      { rowIndex, col: 24, val: remarks || '' }       // Col X (24): Remarks
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

    // Parallelize the actual2 status update (Col 26) and contiguous payment range update (Col 28-32)
    const statusUpdate = updateMultipleCells('Employee-Logs', [
      {
        rowIndex,
        col: 26, // Col Z (26): Actual2
        val: paymentData.paymentStatus === 'paid' ? formattedTimestamp : ''
      }
    ]);

    const rangeValues = [
      [
        parseFloat(paymentData.rate).toString(),
        parseFloat(paymentData.calculatedPrice).toString(),
        parseFloat(paymentData.actualPaid).toString(),
        paymentData.remarks || '',
        paymentData.paymentStatus
      ]
    ];

    const rangeUpdate = updateCellRange('Employee-Logs', rowIndex, 28, rangeValues); // Col AB (28)

    const [resStatus, resRange] = await Promise.all([statusUpdate, rangeUpdate]);

    if (resStatus.success && resRange.success) {
      return { success: true };
    }
    throw new Error("Employee payment processing failed");
  },

  completeEmployeeJourneyInSheet: async (rowIndex, journeyData) => {
    // Parallelize the contiguous end-journey range update (Col 10-13) and the non-contiguous fields (Col 18)
    const rangeValues = [
      [
        journeyData.endTime || '',
        parseFloat(journeyData.kmReadingEnd) || 0,
        journeyData.proofEnd || '',
        journeyData.distance !== undefined && journeyData.distance !== null ? journeyData.distance.toString() : ''
      ]
    ];

    const rangeUpdate = updateCellRange('Employee-Logs', rowIndex, 10, rangeValues); // Col J (10)

    const otherFieldsUpdate = updateMultipleCells('Employee-Logs', [
      { rowIndex, col: 18, val: journeyData.journeyOutcome || '' } // Col R (18): Journey Outcome
    ]);

    const [resRange, resOther] = await Promise.all([rangeUpdate, otherFieldsUpdate]);

    if (resRange.success && resOther.success) {
      return { success: true };
    }
    throw new Error("Employee journey completion failed");
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
  },

  getEmailsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch emails");
      
      if (!resJson.data || resJson.data.length <= 1) {
        return [];
      }

      const rows = resJson.data.slice(1);
      // Col L is index 11 (0-based)
      const emails = rows
        .map(row => (row[11] || '').toString().trim())
        .filter(email => email !== '' && email.includes('@'));
      
      return Array.from(new Set(emails));
    } catch (error) {
      console.error("Error fetching emails from sheet:", error);
      return [];
    }
  },

  submitEmailLogs: async (records, toEmail, ccEmail, remarks = '') => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    // 1. Fetch current Email-Logs sheet to find next available row (starting at row 2 onwards)
    const readResponse = await fetch(`${APPS_SCRIPT_URL}?sheet=Email-Logs&_t=${Date.now()}`);
    if (!readResponse.ok) throw new Error("Failed to connect to spreadsheet");
    const readJson = await readResponse.json();
    if (!readJson.success) throw new Error(readJson.error || "Failed to read Email-Logs sheet");

    const nextRowIndex = readJson.data ? readJson.data.length + 1 : 2;

    // 2. Prepare 2D array of data: [Timestamp, Sequence-No., Date, Approved By, Start-Reading, End-Reading, Distance, To, CC, Employee-Name, Remarks]
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const values2D = records.map(req => [
      formattedTimestamp,                                                              // Col A: Timestamp
      '',                                                                              // Col B: Sequence-No. (populated by backend)
      req.requestDate || req.fillingDate || '',                                        // Col C: Date
      req.approvedBy || '',                                                            // Col D: Approved By
      req.lastKmReading !== undefined ? parseFloat(req.lastKmReading) || 0 : 0,         // Col E: Start-Reading
      req.currentKmReading !== undefined ? parseFloat(req.currentKmReading) || 0 : 0,   // Col F: End-Reading
      req.distance !== undefined ? parseFloat(req.distance) || 0 : 0,                    // Col G: Distance
      toEmail || '',                                                                   // Col H: To
      ccEmail || '',                                                                   // Col I: CC
      req.employeeName || req.issuedTo || '',                                           // Col J: Employee-Name
      remarks || ''                                                                    // Col K: Remarks
    ]);

    // 3. Write data to sheet using updateRange action
    const bodyParams = new URLSearchParams({
      action: 'updateRange',
      sheetName: 'Email-Logs',
      rowIndex: nextRowIndex.toString(),
      startColumn: '1',
      values: JSON.stringify(values2D)
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
      throw new Error(resJson.error || 'Failed to submit email logs to sheet');
    }

    return resJson;
  }
};
