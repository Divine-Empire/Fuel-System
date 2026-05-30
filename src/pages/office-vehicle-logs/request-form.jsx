import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Car, User, Wallet, Compass } from 'lucide-react';
import { officeService } from '../../services/office.service';
import { vehicleService } from '../../services/vehicle.service';

export default function OfficeRequestModal({ isOpen, onClose, onRefresh }) {
  const [vehicles, setVehicles] = useState([]);
  const [requestors, setRequestors] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState('');

  // Form states
  const [vehicleNo, setVehicleNo] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [amountReq, setAmountReq] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      try {
        const [vehiclesList, requestorsList] = await Promise.all([
          vehicleService.getVehiclesFromSheet(),
          officeService.getRequestedByFromSheet()
        ]);

        const cleanedVehicles = vehiclesList.filter(v => v && v.vehicleNo);
        setVehicles(cleanedVehicles);

        const cleanedRequestors = requestorsList.filter(Boolean);
        setRequestors(cleanedRequestors);
      } catch (error) {
        console.error("Failed to load master data from sheet:", error);
        setVehicles([]);
        setRequestors([]);
      } finally {
        setLoadingMaster(false);
      }
    };

    if (isOpen) {
      fetchMasterData();
      // Reset form on open
      setVehicleNo('');
      setRequestedBy('');
      setAmountReq('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!vehicleNo) return toast.error('Please select Vehicle No');
    if (!requestedBy) return toast.error('Please select Requested By');
    if (!amountReq || parseFloat(amountReq) <= 0) {
      return toast.error('Please enter a valid requested amount');
    }

    setSubmitting(true);
    setSubmissionStep("Saving travel log request...");

    try {
      await officeService.createOfficeRequestToSheet({
        vehicleNo,
        requestedBy,
        amountReq
      });

      toast.success("Office travel log request submitted successfully!");
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit office travel log request");
    } finally {
      setSubmitting(false);
      setSubmissionStep('');
    }
  };

  const inputCls = "w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800 disabled:opacity-50 disabled:bg-slate-50";
  const selectCls = "w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800 disabled:opacity-50 disabled:bg-slate-50";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {submitting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-50 animate-fadeIn">
            <div className="flex flex-col items-center space-y-4">
              <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-bold text-slate-700">{submissionStep}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="text-indigo-600 animate-pulse" size={20} />
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">New Office Travel Log</h3>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              disabled={submitting}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {loadingMaster ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-semibold text-slate-500">Loading master values...</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
                <div>
                  <label className={labelCls}>
                    <Car size={13} className="inline mr-1 text-slate-400" />
                    Vehicle No
                  </label>
                  <select
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className={selectCls}
                    required
                    disabled={submitting}
                  >
                    <option value="" disabled>Select Vehicle</option>
                    {vehicles.map((v, idx) => (
                      <option key={idx} value={v.vehicleNo}>
                        {v.vehicleNo} {v.driverName ? `(${v.driverName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    <User size={13} className="inline mr-1 text-slate-400" />
                    Requested By
                  </label>
                  <select
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className={selectCls}
                    required
                    disabled={submitting}
                  >
                    <option value="" disabled>Select Requestor</option>
                    {requestors.map((req, idx) => (
                      <option key={idx} value={req}>{req}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    <Wallet size={13} className="inline mr-1 text-slate-400" />
                    Amount Req (₹)
                  </label>
                  <input
                    type="number"
                    value={amountReq}
                    onChange={(e) => setAmountReq(e.target.value)}
                    placeholder="e.g. 500"
                    className={inputCls}
                    required
                    disabled={submitting}
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
              disabled={submitting || loadingMaster}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Request'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
