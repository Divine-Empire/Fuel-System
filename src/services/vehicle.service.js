import { fuelService } from './fuel.service';

const VEHICLES_STORAGE_KEY = 'fuel_system_vehicles';
const DELETED_VEHICLES_KEY = 'fuel_system_deleted_vehicles';

const DEFAULT_VEHICLES = [];
export const vehicleService = {
  initializeVehicles: () => {
    const data = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const cleaned = parsed.filter(v => !['veh_1', 'veh_2', 'veh_3', 'veh_4'].includes(v.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(cleaned));
        }
      } catch (e) {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(DEFAULT_VEHICLES));
      }
    } else {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(DEFAULT_VEHICLES));
    }
  },

  getVehicles: () => {
    vehicleService.initializeVehicles();
    const data = localStorage.getItem(VEHICLES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveVehicles: (vehicles) => {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
  },

  createVehicle: (vehicleData) => {
    const vehicles = vehicleService.getVehicles();
    
    // Check if vehicle number already exists
    const normalizedNo = vehicleData.vehicleNo.trim().toUpperCase();
    const exists = vehicles.some(v => v.vehicleNo === normalizedNo);
    if (exists) {
      throw new Error(`Vehicle No ${normalizedNo} is already registered.`);
    }

    const newVehicle = {
      id: `veh_${Date.now()}`,
      vehicleNo: normalizedNo,
      mileage: parseFloat(vehicleData.mileage) || 0,
      lastKmReading: parseFloat(vehicleData.lastKmReading) || 0,
      fuelType: vehicleData.fuelType || 'Diesel',
      driverName: vehicleData.driverName?.trim() || '',
      documents: vehicleData.documents || [],
      createdAt: new Date().toISOString()
    };

    const updated = [newVehicle, ...vehicles];
    vehicleService.saveVehicles(updated);
    
    // If it was previously marked as deleted, remove it from deleted list
    const deleted = JSON.parse(localStorage.getItem(DELETED_VEHICLES_KEY) || '[]');
    if (deleted.includes(normalizedNo)) {
      localStorage.setItem(DELETED_VEHICLES_KEY, JSON.stringify(deleted.filter(no => no !== normalizedNo)));
    }

    return newVehicle;
  },

  deleteVehicle: (id, vehicleNo) => {
    // If it's a sheet vehicle, add vehicleNo to deleted list
    if (id.startsWith('veh_sheet_')) {
      const deleted = JSON.parse(localStorage.getItem(DELETED_VEHICLES_KEY) || '[]');
      if (!deleted.includes(vehicleNo)) {
        localStorage.setItem(DELETED_VEHICLES_KEY, JSON.stringify([...deleted, vehicleNo]));
      }
    } else {
      // Local storage vehicle, delete from VEHICLES_STORAGE_KEY
      const vehicles = vehicleService.getVehicles();
      const filtered = vehicles.filter(v => v.id !== id);
      vehicleService.saveVehicles(filtered);
    }
  },

  updateVehicleOdometer: (vehicleNo, newKmReading) => {
    const vehicles = vehicleService.getVehicles();
    const normalizedNo = vehicleNo.trim().toUpperCase();
    const updated = vehicles.map(v => {
      if (v.vehicleNo === normalizedNo) {
        // Ensure odometer only goes forward
        if (newKmReading > v.lastKmReading) {
          return { ...v, lastKmReading: newKmReading };
        }
      }
      return v;
    });
    vehicleService.saveVehicles(updated);
  },

  getVehiclesFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    let sheetVehicles = [];
    if (APPS_SCRIPT_URL) {
      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Vehicles&headerRow=1`);
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success) {
            const rows = resJson.data.slice(1);
            sheetVehicles = rows.map(row => {
              const vehicleNo = (row[2] || '').toString().trim().toUpperCase();
              const vehicleName = (row[1] || '').toString().trim();
              const driverName = (row[3] || '').toString().trim();
              const fuelType = (row[4] || 'Diesel').toString().trim();
              const rawMileage = row[5];
              const mileage = (rawMileage !== null && rawMileage !== undefined && rawMileage !== '') ? rawMileage.toString().trim() : '—';
              const lastKmReading = parseFloat(row[6]) || 0;
              
              const documents = [];
              if (row[7] && row[8]) {
                documents.push({ id: `doc_${vehicleNo}_1`, docType: row[7].toString().trim(), docImage: row[8].toString().trim() });
              }
              if (row[9] && row[10]) {
                documents.push({ id: `doc_${vehicleNo}_2`, docType: row[9].toString().trim(), docImage: row[10].toString().trim() });
              }
              if (row[11] && row[12]) {
                documents.push({ id: `doc_${vehicleNo}_3`, docType: row[11].toString().trim(), docImage: row[12].toString().trim() });
              }

              return {
                id: `veh_sheet_${vehicleNo}`,
                vehicleNo,
                vehicleName,
                driverName,
                fuelType,
                mileage,
                lastKmReading,
                documents,
                createdAt: new Date().toISOString()
              };
            }).filter(v => v.vehicleNo !== '');
          }
        }
      } catch (error) {
        console.error("Error fetching vehicles from sheet:", error);
      }
    }

    // Load local storage registered vehicles
    const localVehicles = vehicleService.getVehicles();

    // Merge: sheet vehicles + local vehicles
    const allVehiclesMap = new Map();
    
    // Add sheet vehicles
    sheetVehicles.forEach(v => {
      allVehiclesMap.set(v.vehicleNo, v);
    });

    // Add/overwrite local vehicles
    localVehicles.forEach(v => {
      allVehiclesMap.set(v.vehicleNo, v);
    });

    return Array.from(allVehiclesMap.values());
  },

  createVehicleToSheet: async (vehicleData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const now = new Date();
    const formattedTimestamp = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    // Build rowData array
    const rowData = [
      formattedTimestamp,                        // Col A (0): Timestamp
      vehicleData.vehicleName || '',             // Col B (1): Vehicle-Name
      vehicleData.vehicleNo.trim().toUpperCase(),// Col C (2): Vehicle No
      vehicleData.driverName || '',              // Col D (3): Driver's Name
      vehicleData.fuelType || 'Diesel',          // Col E (4): Fuel Type
      vehicleData.mileage || 0,                  // Col F (5): Mileage
      vehicleData.lastKmReading || 0,             // Col G (6): Last KM Reading
      '',                                        // Col H (7): Doc-Name1
      '',                                        // Col I (8): Img1
      '',                                        // Col J (9): Doc-Name2
      '',                                        // Col K (10): Img2
      '',                                        // Col L (11): Doc-Name3
      ''                                         // Col M (12): Img3
    ];

    // Upload documents (up to 3) to Google Drive and store URLs in rowData
    const docs = vehicleData.documents || [];
    for (let i = 0; i < Math.min(docs.length, 3); i++) {
      const doc = docs[i];
      if (doc && doc.docType && doc.docImage) {
        // Upload image to drive
        const driveUrl = await fuelService.uploadFileToDrive(doc.docImage, `${vehicleData.vehicleNo}_${doc.docType}`);
        rowData[7 + i * 2] = doc.docType;
        rowData[8 + i * 2] = driveUrl;
      }
    }

    const bodyParams = new URLSearchParams({
      action: 'insert',
      sheetName: 'Vehicles',
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
      throw new Error(resJson.error || 'Failed to submit vehicle data');
    }

    return resJson;
  }
};
