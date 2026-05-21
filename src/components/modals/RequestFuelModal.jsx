import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalWrapper from '../ModalWrapper';
import { fuelService } from '../../services/fuel.service';
import { vehicleService } from '../../services/vehicle.service';
import { downloadFuelSlip } from '../../utils/generateFuelSlip';
import { generateRequestNo, generateSlipNo } from '../../utils/generateSlipNo';
import { useAuthStore } from '../../store/authStore';

export default function RequestFuelModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [lastKmReading, setLastKmReading] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState('A');
  const [customLocation, setCustomLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const data = vehicleService.getVehicles();
      setVehicles(data);
      if (user?.role === 'USER') {
        setIssuedTo(user.name);
      }
    }
  }, [isOpen, user]);

  const handleVehicleChange = (selectedNo) => {
    setVehicleNo(selectedNo);
    const vehicle = vehicles.find(v => v.vehicleNo === selectedNo);
    if (vehicle) {
      if (user?.role !== 'USER') {
        setIssuedTo(vehicle.driverName || '');
      }
      setMileage(vehicle.mileage.toString());

      // Fetch lastKmReading from the Last Entry in the History tab of ActualFilling by matching the vehicle no
      const allRequests = fuelService.getFuelRequests();
      const vehicleHistory = allRequests.filter(
        r => r.vehicleNo.toUpperCase() === selectedNo.toUpperCase() && r.status === 'completed'
      );

      if (vehicleHistory.length > 0) {
        // Sort history by createdAt/fillingDate descending to get the last entry
        vehicleHistory.sort((a, b) => new Date(b.createdAt || b.fillingDate) - new Date(a.createdAt || a.fillingDate));
        const lastEntry = vehicleHistory[0];
        setLastKmReading(lastEntry.currentKmReading.toString());
      } else {
        // Fallback to vehicle master lastKmReading
        setLastKmReading(vehicle.lastKmReading.toString());
      }
    } else {
      if (user?.role !== 'USER') {
        setIssuedTo('');
      }
      setLastKmReading('');
      setMileage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicleNo) return toast.error('Please select a vehicle');
    if (!issuedTo.trim()) return toast.error('Recipient name is required');
    if (!lastKmReading || parseFloat(lastKmReading) < 0) {
      return toast.error('Please enter a valid Last KM Reading');
    }
    if (location === 'Others' && !customLocation.trim()) {
      return toast.error('Please enter custom location');
    }

    setSubmitting(true);
    try {
      const requests = fuelService.getFuelRequests();
      const tempRequestNo = generateRequestNo(requests);
      const tempSlipNo = location === 'A' ? generateSlipNo(requests) : null;

      let slipImageBase64 = '';

      if (location !== 'Others') {
        // Construct temporary slip structure to generate image
        const slipDataForImage = {
          requestNo: tempRequestNo,
          slipNo: tempSlipNo,
          vehicleNo: vehicleNo.toUpperCase(),
          issuedTo: issuedTo.trim(),
          location,
          customLocation: customLocation.trim(),
          lastKmReading: parseFloat(lastKmReading),
          mileage: parseFloat(mileage),
          requestDate: new Date().toISOString().split('T')[0]
        };

        // Trigger automatic canvas slip download and get data url
        slipImageBase64 = await downloadFuelSlip(slipDataForImage);
      }

      // Save to localStorage
      const newRequest = fuelService.createFuelRequest({
        vehicleNo: vehicleNo.toUpperCase(),
        issuedTo: issuedTo.trim(),
        lastKmReading: parseFloat(lastKmReading),
        mileage: parseFloat(mileage),
        location,
        customLocation: location === 'Others' ? customLocation.trim() : ''
      });

      // Update the request record in localStorage with the slip image
      if (slipImageBase64) {
        const currentRequests = fuelService.getFuelRequests();
        const updatedRequests = currentRequests.map(r => {
          if (r.id === newRequest.id) {
            return { ...r, slipImage: slipImageBase64 };
          }
          return r;
        });
        fuelService.saveFuelRequests(updatedRequests);
      }

      const notifyNo = tempSlipNo || tempRequestNo;
      if (location === 'Others') {
        toast.success(`Fuel request ${notifyNo} submitted successfully!`);
      } else {
        toast.success(`Fuel request ${notifyNo} submitted & slip downloaded!`);
      }
      
      // Reset state
      setVehicleNo('');
      setIssuedTo('');
      setLastKmReading('');
      setMileage('');
      setLocation('A');
      setCustomLocation('');
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit fuel request');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";
  const disabledInputCls = "block w-full text-sm bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Request Fuel Filling" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Vehicle No</label>
          <select
            value={vehicleNo}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className={selectCls}
            disabled={submitting}
            required
          >
            <option value="">Select a Vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.vehicleNo}>
                {v.vehicleNo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Issued To (Driver/Staff Name)</label>
          <input
            type="text"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            placeholder="e.g. Rohit Sharma"
            className={user?.role === 'USER' ? disabledInputCls : inputCls}
            disabled={submitting || user?.role === 'USER'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Last KM Reading</label>
            <input
              type="number"
              value={lastKmReading}
              readOnly
              placeholder="Select a vehicle first"
              className={disabledInputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Mileage (KM/L)</label>
            <input
              type="number"
              value={mileage}
              readOnly
              placeholder="Select a vehicle first"
              className={disabledInputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={selectCls}
            disabled={submitting}
          >
            <option value="A">Location A</option>
            <option value="Others">Others</option>
          </select>
        </div>

        {location === 'Others' && (
          <div className="animate-fadeIn">
            <label className={labelCls}>Specify Custom Location</label>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="e.g. Site Office C"
              className={inputCls}
              disabled={submitting}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? 'Generating Slip...' : 'Submit & Download Slip'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-sm font-bold transition"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
