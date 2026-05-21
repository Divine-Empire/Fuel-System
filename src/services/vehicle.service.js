const VEHICLES_STORAGE_KEY = 'fuel_system_vehicles';

const DEFAULT_VEHICLES = [
  {
    id: 'veh_1',
    vehicleNo: 'CG04AB1234',
    mileage: 14.5,
    lastKmReading: 15420,
    fuelType: 'Diesel',
    driverName: 'Rohit Sharma',
    documents: [],
    createdAt: '2026-05-21T10:00:00Z'
  },
  {
    id: 'veh_2',
    vehicleNo: 'MH12PQ5678',
    mileage: 12.0,
    lastKmReading: 42350,
    fuelType: 'Petrol',
    driverName: 'Virat Kohli',
    documents: [],
    createdAt: '2026-05-18T09:15:00Z'
  },
  {
    id: 'veh_3',
    vehicleNo: 'DL01XY9999',
    mileage: 16.0,
    lastKmReading: 8900,
    fuelType: 'Diesel',
    driverName: 'MS Dhoni',
    documents: [],
    createdAt: '2026-05-20T14:30:00Z'
  },
  {
    id: 'veh_4',
    vehicleNo: 'KA03MN4321',
    mileage: 11.2,
    lastKmReading: 23150,
    fuelType: 'Diesel',
    driverName: 'KL Rahul',
    documents: [],
    createdAt: '2026-05-21T11:45:00Z'
  }
];

export const vehicleService = {
  initializeVehicles: () => {
    if (!localStorage.getItem(VEHICLES_STORAGE_KEY)) {
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
    return newVehicle;
  },

  deleteVehicle: (id) => {
    const vehicles = vehicleService.getVehicles();
    const filtered = vehicles.filter(v => v.id !== id);
    vehicleService.saveVehicles(filtered);
    return filtered;
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
  }
};
