import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalWrapper from '../ModalWrapper';
import { fuelService } from '../../services/fuel.service';
import { calculateTotalAmount, calculateDistanceCovered } from '../../utils/calculateTotal';
import { Upload, Eye, Camera, Receipt } from 'lucide-react';

export default function ProcessFuelModal({ isOpen, onClose, request, onSuccess }) {
  const [fillingDate, setFillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');
  const [currentKmReading, setCurrentKmReading] = useState('');
  const [fuelBillNo, setFuelBillNo] = useState('');
  const [readingImage, setReadingImage] = useState('');
  const [billImage, setBillImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculated values
  const [totalCost, setTotalCost] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);

  useEffect(() => {
    if (request) {
      // prefill defaults if any
      setFillingDate(new Date().toISOString().split('T')[0]);
      setQty('');
      setRate('');
      setCurrentKmReading('');
      setFuelBillNo('');
      setReadingImage('');
      setBillImage('');
    }
  }, [request]);

  // Live calculations
  useEffect(() => {
    const q = parseFloat(qty);
    const r = parseFloat(rate);
    setTotalCost(calculateTotalAmount(q, r));
  }, [qty, rate]);

  useEffect(() => {
    if (request) {
      const cur = parseFloat(currentKmReading);
      const last = parseFloat(request.lastKmReading);
      setDistanceCovered(calculateDistanceCovered(cur, last));
    }
  }, [currentKmReading, request]);

  if (!request) return null;

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Image size must be less than 2MB');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericQty = parseFloat(qty);
    const numericRate = parseFloat(rate);
    const numericCurrentKm = parseFloat(currentKmReading);
    const lastKm = parseFloat(request.lastKmReading);

    if (isNaN(numericQty) || numericQty <= 0) {
      return toast.error('Quantity must be a positive number');
    }
    if (isNaN(numericRate) || numericRate <= 0) {
      return toast.error('Rate must be a positive number');
    }
    if (isNaN(numericCurrentKm) || numericCurrentKm <= lastKm) {
      return toast.error(`Current KM reading must be greater than Last KM reading (${lastKm} KM)`);
    }
    if (!fuelBillNo.trim()) {
      return toast.error('Fuel Bill No is required');
    }

    setSubmitting(true);
    try {
      fuelService.processFuelFilling(request.id, {
        currentKmReading: numericCurrentKm,
        qty: numericQty,
        rate: numericRate,
        fillingDate,
        fuelBillNo: fuelBillNo.trim(),
        readingImage,
        billImage
      });

      toast.success(`Fuel filling completed for ${request.slipNo}!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process fuel filling');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";
  const fileLabelCls = "flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500 hover:text-slate-700 relative overflow-hidden group min-h-[90px]";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Process Fuel Filling: ${request.slipNo}`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Readonly Info Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs font-semibold">
          <div>
            <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Vehicle Number</span>
            <span className="text-slate-700 text-sm font-bold">{request.vehicleNo}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 uppercase tracking-wider">Last KM Reading</span>
            <span className="text-slate-700 text-sm font-bold">{request.lastKmReading} KM</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date of Filling</label>
            <input
              type="date"
              value={fillingDate}
              onChange={(e) => setFillingDate(e.target.value)}
              className={inputCls}
              required
            />
          </div>
          
          <div>
            <label className={labelCls}>Current KM Reading</label>
            <input
              type="number"
              value={currentKmReading}
              onChange={(e) => setCurrentKmReading(e.target.value)}
              placeholder={`> ${request.lastKmReading}`}
              className={inputCls}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Quantity (Litres)</label>
            <input
              type="number"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Litres"
              className={inputCls}
              required
            />
          </div>
          
          <div>
            <label className={labelCls}>Rate (Per Litre)</label>
            <input
              type="number"
              step="any"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Rate"
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Fuel Bill No</label>
            <input
              type="text"
              value={fuelBillNo}
              onChange={(e) => setFuelBillNo(e.target.value)}
              placeholder="Bill No"
              className={inputCls}
              required
            />
          </div>
        </div>

        {/* Live Calculation Display */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Live Calculated Total</span>
            <span className="text-lg font-black text-indigo-700">₹{totalCost.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Distance Covered</span>
            <span className="text-lg font-black text-indigo-700">
              {distanceCovered > 0 ? `${distanceCovered} KM` : '—'}
            </span>
          </div>
        </div>

        {/* Document uploads */}
        <div className="grid grid-cols-2 gap-4">
          {/* KM Reading Image */}
          <div>
            <label className={labelCls}>KM Reading Photo</label>
            <label className={fileLabelCls}>
              {readingImage ? (
                <>
                  <img src={readingImage} alt="KM Reading" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                    <Camera size={14} /> Change
                  </div>
                </>
              ) : (
                <>
                  <Camera size={20} className="mb-1 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capture KM Reading</span>
                  <span className="text-[8px] text-slate-400">Click to upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setReadingImage)}
                className="hidden"
              />
            </label>
          </div>

          {/* Bill Photo */}
          <div>
            <label className={labelCls}>Bill Receipt Photo</label>
            <label className={fileLabelCls}>
              {billImage ? (
                <>
                  <img src={billImage} alt="Bill Receipt" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                    <Receipt size={14} /> Change
                  </div>
                </>
              ) : (
                <>
                  <Receipt size={20} className="mb-1 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upload Fuel Bill</span>
                  <span className="text-[8px] text-slate-400">Click to upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, setBillImage)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-sm"
            disabled={submitting}
          >
            {submitting ? 'Saving Filling...' : 'Complete Fuel Filling'}
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
