import { vehicleService } from './vehicle.service';

export const fuelService = {
  processPaymentToSheet: async (rowIndex) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    // Format current timestamp as '2026-05-24 17:12:59'
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Update cells: Col 37 (Actual2) = formattedTimestamp, Col 39 (Payment-Status) = 'paid'
    const updates = [
      { col: 37, val: formattedTimestamp }, // AK: Actual2
      { col: 39, val: 'paid' } // AM: Payment-Status
    ];

    await Promise.all(updates.map(async (update) => {
      const bodyParams = new URLSearchParams({
        action: 'updateCell',
        sheetName: 'Fuel-Filling',
        rowIndex: rowIndex.toString(),
        columnIndex: update.col.toString(),
        value: update.val
      });

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      if (!response.ok) throw new Error(`Update of column ${update.col} failed`);
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || `Update of column ${update.col} failed`);
    }));

    return { success: true };
  },

  getLocationsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return ['Location A'];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch locations");
      const rows = resJson.data.slice(1);
      const locations = rows.map(row => (row[7] || '').toString().trim()).filter(loc => loc !== '');
      return Array.from(new Set(locations));
    } catch (error) {
      console.error("Error fetching locations from sheet:", error);
      return ['Location A'];
    }
  },

  getDepartmentsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return ['Admin', 'Service', 'Sales'];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch departments");
      const rows = resJson.data.slice(1);
      const departments = rows.map(row => (row[6] || '').toString().trim()).filter(dep => dep !== '');
      return Array.from(new Set(departments));
    } catch (error) {
      console.error("Error fetching departments from sheet:", error);
      return ['Admin', 'Service', 'Sales'];
    }
  },

  getLastOdometerFromSheet: async (vehicleNo) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return null;
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Fuel-Filling`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success || !resJson.data || resJson.data.length <= 1) return null;
      
      const header = resJson.data[0];
      const vehicleNoIdx = header.findIndex(h => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '').includes('vehicleno'));
      const currentKmIdx = header.findIndex(h => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '').includes('currentkmreading'));
      const dateIdx = header.findIndex(h => h.toString().toLowerCase().replace(/[^a-z0-9]/g, '').includes('timestamp'));
      
      if (vehicleNoIdx !== -1 && currentKmIdx !== -1) {
        const matchingRows = resJson.data.slice(1).filter(row => {
          const vNo = (row[vehicleNoIdx] || '').toString().trim().toUpperCase();
          const curKm = row[currentKmIdx];
          return vNo === vehicleNo.trim().toUpperCase() && curKm !== null && curKm !== '' && !isNaN(parseFloat(curKm));
        });
        
        if (matchingRows.length > 0) {
          matchingRows.sort((a, b) => {
            const tA = new Date(a[dateIdx] || 0);
            const tB = new Date(b[dateIdx] || 0);
            return tB - tA;
          });
          return parseFloat(matchingRows[0][currentKmIdx]);
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching odometer history from sheet:", error);
      return null;
    }
  },

  uploadFileToDrive: async (base64Data, fileName) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;
    if (!APPS_SCRIPT_URL || !FOLDER_ID) {
      throw new Error("Apps Script URL or Folder ID is missing in environment variables");
    }
    
    const bodyParams = new URLSearchParams({
      action: 'uploadFile',
      base64Data: base64Data,
      fileName: fileName,
      mimeType: 'application/pdf',
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

  createFuelRequestToSheet: async (requestData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const rowData = new Array(41).fill('');
    rowData[0] = formattedTimestamp;
    rowData[1] = '';
    
    if (requestData.isPersonalVehicle) {
      rowData[2] = requestData.vehicleNo; // "PERSONAL BIKE" or "PERSONAL CAR"
      rowData[3] = '';
      rowData[4] = '';
      rowData[5] = '';
      rowData[6] = 'Others';
      rowData[7] = '';
      rowData[8] = '';
      
      rowData[9] = requestData.dateOfVisit || '';
      rowData[10] = requestData.department || '';
      rowData[11] = requestData.vehicleName || '';
      rowData[12] = requestData.employeeName || '';
      rowData[13] = requestData.startTime || '';
      rowData[14] = parseFloat(requestData.kmReadingStart) || 0;
      rowData[15] = requestData.proofStart || '';
      rowData[16] = requestData.endTime || '';
      rowData[17] = parseFloat(requestData.kmReadingEnd) || 0;
      rowData[18] = requestData.proofEnd || '';
      rowData[19] = requestData.purposeOfVisit || '';
      rowData[20] = requestData.clientName || '';
      rowData[21] = requestData.siteLocation || '';
      rowData[22] = requestData.machineDetails || '';
      
      // rowData[23] is Planned1 (col-X) - do not send to preserve sheet formulas
    } else {
      rowData[2] = requestData.vehicleNo.toUpperCase();
      rowData[3] = requestData.issuedTo.trim();
      rowData[4] = parseFloat(requestData.lastKmReading) || 0;
      rowData[5] = parseFloat(requestData.mileage) || 0;
      rowData[6] = requestData.location;
      rowData[7] = '';
      rowData[8] = requestData.slipCopy || '';
      rowData[11] = requestData.vehicleName || '';
      rowData[39] = requestData.location === 'Others' ? requestData.customLocation.trim() : '';
      
      // rowData[23] is Planned1 (col-X) - do not send to preserve sheet formulas
    }

    const bodyParams = new URLSearchParams({
      action: 'insert',
      sheetName: 'Fuel-Filling',
      rowData: JSON.stringify(rowData),
      generateRequestNo: 'true'
    });

    if (!requestData.isPersonalVehicle && requestData.location !== 'Others') {
      bodyParams.append('generateSlipNo', 'true');
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) throw new Error("Insert request failed");
    const resJson = await response.json();
    if (!resJson.success) throw new Error(resJson.error || "Insert failed");
    return resJson;
  },

  getFuelRequestsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      console.warn("VITE_APPS_SCRIPT_URL is not defined in environment variables. Returning empty array.");
      return [];
    }
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Fuel-Filling&headerRow=6`);
      if (!response.ok) throw new Error("Network response was not ok");
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch fuel requests");
      
      const rows = resJson.data.slice(1);
      return rows.map(row => {
        const timestamp = row[0];
        let requestDate = '';
        if (timestamp) {
          const parts = timestamp.split(' ');
          if (parts[0]) {
            const dateParts = parts[0].split('/');
            if (dateParts.length === 3) {
              requestDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            } else {
              requestDate = parts[0];
            }
          }
        }
        const requestNo = (row[1] || '').toString().trim();
        const vehicleNo = (row[2] || '').toString().trim();
        const issuedTo = (row[3] || '').toString().trim();
        const lastKmReading = parseFloat(row[4]) || 0;
        const mileage = parseFloat(row[5]) || 0;
        const location = (row[6] || '').toString().trim();
        const slipNo = (row[7] || '').toString().trim();
        const slipCopy = (row[8] || '').toString().trim();
        const customLocation = (row[39] || '').toString().trim();
        
        // Personal Travel Log fields
        const dateOfVisit = (row[9] || '').toString().trim();
        const department = (row[10] || '').toString().trim();
        const vehicleName = (row[11] || '').toString().trim();
        const employeeName = (row[12] || '').toString().trim();
        const startTime = (row[13] || '').toString().trim();
        const kmReadingStart = parseFloat(row[14]) || 0;
        const proofStart = (row[15] || '').toString().trim();
        const endTime = (row[16] || '').toString().trim();
        const kmReadingEnd = parseFloat(row[17]) || 0;
        const proofEnd = (row[18] || '').toString().trim();
        const purposeOfVisit = (row[19] || '').toString().trim();
        const clientName = (row[20] || '').toString().trim();
        const siteLocation = (row[21] || '').toString().trim();
        const machineDetails = (row[22] || '').toString().trim();

        // Filling fields
        const planned1 = (row[23] || '').toString().trim();
        const actual1 = (row[24] || '').toString().trim();
        const delay1 = (row[25] || '').toString().trim();
        const fillingDate = (row[26] || '').toString().trim();
        const currentKmReading = row[27] !== '' && row[27] !== null && row[27] !== undefined ? parseFloat(row[27]) : null;
        const qty = row[28] !== '' && row[28] !== null && row[28] !== undefined ? parseFloat(row[28]) : null;
        const rate = row[29] !== '' && row[29] !== null && row[29] !== undefined ? parseFloat(row[29]) : null;
        const fuelBillNo = (row[30] || '').toString().trim();
        const totalAmount = row[31] !== '' && row[31] !== null && row[31] !== undefined ? parseFloat(row[31]) : null;
        const distanceCovered = row[32] !== '' && row[32] !== null && row[32] !== undefined ? parseFloat(row[32]) : null;
        const readingImage = (row[33] || '').toString().trim();
        const billImage = (row[34] || '').toString().trim();

        const planned2 = (row[35] || '').toString().trim();
        const actual2 = (row[36] || '').toString().trim();
        const delay2 = (row[37] || '').toString().trim();
        const paymentStatus = (row[38] || 'pending').toString().trim();
        
        // RowIndex is the last element
        const rowIndex = parseInt(row[row.length - 1]) || null;
        
        // Determine status based on Pending vs Completed condition
        let status = 'unknown';
        if (planned1 !== '') {
          if (actual1 === '') {
            status = 'pending';
          } else {
            status = 'completed';
          }
        }

        return {
          id: `fuel_${rowIndex || Date.now()}_${requestNo || timestamp}`,
          timestamp,
          requestDate,
          requestNo,
          vehicleNo,
          issuedTo,
          lastKmReading,
          mileage,
          location,
          customLocation,
          slipNo,
          slipCopy,
          dateOfVisit,
          department,
          vehicleName,
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
          planned1,
          actual1,
          delay1,
          fillingDate,
          currentKmReading,
          qty,
          rate,
          fuelBillNo,
          totalAmount,
          distanceCovered,
          readingImage,
          billImage,
          planned2,
          actual2,
          delay2,
          paymentStatus,
          status,
          rowIndex
        };
      }).filter(req => req.status !== 'unknown');
    } catch (error) {
      console.error("Error fetching fuel requests from sheet:", error);
      throw error;
    }
  },

  processFuelFillingToSheet: async (rowIndex, vehicleNo, lastKmReading, fillingData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    // Format current timestamp as '2026-05-24 17:12:59'
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const formattedTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Update cells individually to avoid touching formula columns like Planned1 (Col X) and Delay1 (Col Z)
    const updates = [
      { col: 25, val: formattedTimestamp }, // Y: Actual1
      { col: 27, val: fillingData.fillingDate }, // AA: Date of Filling
      { col: 28, val: parseFloat(fillingData.currentKmReading) }, // AB: Current KM Reading
      { col: 29, val: parseFloat(fillingData.qty) }, // AC: Qty
      { col: 30, val: parseFloat(fillingData.rate) }, // AD: Rate
      { col: 31, val: fillingData.fuelBillNo.trim() }, // AE: Fuel-Bill-No
      { col: 32, val: parseFloat(fillingData.qty) * parseFloat(fillingData.rate) }, // AF: Calculated Price
      { col: 33, val: parseFloat(fillingData.currentKmReading) - parseFloat(lastKmReading) }, // AG: Distance Covered
      { col: 34, val: fillingData.readingImage || '' }, // AH: KM Reading Photo
      { col: 35, val: fillingData.billImage || '' }, // AI: Fuel-Bill-Photo
      { col: 39, val: 'pending' } // AM: Payment-Status
    ];

    await Promise.all(updates.map(async (update) => {
      const bodyParams = new URLSearchParams({
        action: 'updateCell',
        sheetName: 'Fuel-Filling',
        rowIndex: rowIndex.toString(),
        columnIndex: update.col.toString(),
        value: typeof update.val === 'object' ? JSON.stringify(update.val) : update.val.toString()
      });

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      if (!response.ok) throw new Error(`Update of column ${update.col} failed`);
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || `Update of column ${update.col} failed`);
    }));

    // Update odometer locally and in vehicle master
    vehicleService.updateVehicleOdometer(vehicleNo, parseFloat(fillingData.currentKmReading));

    return { success: true };
  }
};
