import { fuelRequests as mockFuelRequests } from '../mock/fuelRequests';
import { generateRequestNo, generateSlipNo } from '../utils/generateSlipNo';
import { vehicleService } from './vehicle.service';

const FUEL_STORAGE_KEY = 'fuel_system_requests';

export const fuelService = {
  initializeFuelRequests: () => {
    const data = localStorage.getItem(FUEL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(mockFuelRequests));
    } else {
      try {
        const parsed = JSON.parse(data);
        if (parsed.length > 0 && !parsed[0].hasOwnProperty('requestNo')) {
          localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(mockFuelRequests));
          return;
        }

        let migrated = false;
        const vehicles = vehicleService.getVehicles();
        const updated = parsed.map(req => {
          if (!req.hasOwnProperty('mileage')) {
            migrated = true;
            const vehicle = vehicles.find(v => v.vehicleNo === req.vehicleNo);
            return {
              ...req,
              mileage: vehicle ? vehicle.mileage : 12.0
            };
          }
          return req;
        });

        if (migrated) {
          localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (e) {
        localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(mockFuelRequests));
      }
    }
  },

  getFuelRequests: () => {
    fuelService.initializeFuelRequests();
    const data = localStorage.getItem(FUEL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFuelRequests: (requests) => {
    localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(requests));
  },

  createFuelRequest: (requestData) => {
    const requests = fuelService.getFuelRequests();
    const newRequestNo = generateRequestNo(requests);
    const newSlipNo = requestData.location === 'A' ? generateSlipNo(requests) : null;
    
    const newRequest = {
      id: `fuel_${Date.now()}`,
      requestNo: newRequestNo,
      slipNo: newSlipNo,
      vehicleNo: requestData.vehicleNo,
      issuedTo: requestData.issuedTo,
      lastKmReading: parseFloat(requestData.lastKmReading),
      mileage: parseFloat(requestData.mileage) || 0,
      currentKmReading: null,
      location: requestData.location,
      customLocation: requestData.customLocation || '',
      requestDate: new Date().toISOString().split('T')[0],
      qty: null,
      rate: null,
      totalAmount: null,
      fillingDate: null,
      fuelBillNo: '',
      readingImage: '',
      billImage: '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const updated = [newRequest, ...requests];
    fuelService.saveFuelRequests(updated);
    return newRequest;
  },

  processFuelFilling: (id, fillingData) => {
    const requests = fuelService.getFuelRequests();
    const updated = requests.map((req) => {
      if (req.id === id) {
        const qty = parseFloat(fillingData.qty);
        const rate = parseFloat(fillingData.rate);
        const totalAmount = qty * rate;
        
        return {
          ...req,
          currentKmReading: parseFloat(fillingData.currentKmReading),
          qty,
          rate,
          totalAmount,
          fillingDate: fillingData.fillingDate || new Date().toISOString().split('T')[0],
          fuelBillNo: fillingData.fuelBillNo || '',
          readingImage: fillingData.readingImage || '',
          billImage: fillingData.billImage || '',
          status: 'completed',
          paymentStatus: 'pending'
        };
      }
      return req;
    });
    fuelService.saveFuelRequests(updated);
    const completedReq = updated.find(r => r.id === id);
    if (completedReq) {
      vehicleService.updateVehicleOdometer(completedReq.vehicleNo, completedReq.currentKmReading);
    }
    return completedReq;
  },

  getPendingRequests: () => {
    return fuelService.getFuelRequests().filter(req => req.status === 'pending');
  },

  getCompletedRequests: () => {
    return fuelService.getFuelRequests().filter(req => req.status === 'completed');
  },

  getPendingPayments: () => {
    return fuelService.getFuelRequests().filter(req => req.status === 'completed' && (!req.paymentStatus || req.paymentStatus === 'pending'));
  },

  getCompletedPayments: () => {
    return fuelService.getFuelRequests().filter(req => req.status === 'completed' && req.paymentStatus === 'paid');
  },

  processPayments: (ids) => {
    const requests = fuelService.getFuelRequests();
    const updated = requests.map(req => {
      if (ids.includes(req.id)) {
        return {
          ...req,
          paymentStatus: 'paid',
          paymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return req;
    });
    fuelService.saveFuelRequests(updated);
    return true;
  }
};
