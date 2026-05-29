import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  Clock, 
  Search, 
  Eye, 
  RefreshCw,
  Fuel,
  X,
  Camera
} from 'lucide-react';
import { officeService } from '../../services/office.service';
import { vehicleService } from '../../services/vehicle.service';

const formatSimpleDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const cleanStr = dateStr.toString().trim();
    if (!cleanStr) return '—';
    
    const parts = cleanStr.split(/[/\-\sT]/);
    if (parts.length >= 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      
      if (parts[0].length === 4 && p1 <= 12 && p2 <= 31) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
      if (p0 <= 31 && p1 <= 12 && parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
      }
    }
    
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      return cleanStr.replace(/\//g, '-');
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr.toString().replace(/\//g, '-');
  }
};

const formatColonDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const cleanStr = dateStr.toString().trim();
    if (!cleanStr) return '—';
    
    const parts = cleanStr.split(/[/\-\sT:]/);
    if (parts.length >= 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      
      if (parts[0].length === 4 && p1 <= 12 && p2 <= 31) {
        return `${parts[2].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[0]}`;
      }
      if (p0 <= 31 && p1 <= 12 && parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2]}`;
      }
    }
    
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      return cleanStr.replace(/[\/\-]/g, ':');
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}:${month}:${year}`;
  } catch {
    return dateStr.toString().replace(/[\/\-]/g, ':');
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function OfficeActualFilling() {
  // Data states
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  
  // Filtering & Modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogForFilling, setSelectedLogForFilling] = useState(null);
  const [loadingLastKm, setLoadingLastKm] = useState(false);

  // Form states inside modal
  const [dateOfFilling, setDateOfFilling] = useState(new Date().toISOString().split('T')[0]);
  const [lastKmReading, setLastKmReading] = useState(0);
  const [currentKmReading, setCurrentKmReading] = useState('');
  const [qty, setQty] = useState('');
  const [rate, setRate] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [mileage, setMileage] = useState(0);

  // Files
  const [photoOfReadingFile, setPhotoOfReadingFile] = useState(null);
  const [photoOfReadingPreview, setPhotoOfReadingPreview] = useState('');
  
  const [fuelBillPhotoFile, setFuelBillPhotoFile] = useState(null);
  const [fuelBillPhotoPreview, setFuelBillPhotoPreview] = useState('');
  
  const [fuelMachineBeforeStartFile, setFuelMachineBeforeStartFile] = useState(null);
  const [fuelMachineBeforeStartPreview, setFuelMachineBeforeStartPreview] = useState('');
  
  const [fuelMachineAfterFile, setFuelMachineAfterFile] = useState(null);
  const [fuelMachineAfterPreview, setFuelMachineAfterPreview] = useState('');

  const [submittingFilling, setSubmittingFilling] = useState(false);
  const [submissionStep, setSubmissionStep] = useState('');

  const fetchLogs = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await officeService.getOfficeRequestsFromSheet();
      setLogs(data);
      if (showToast) {
        toast.success("Logs refreshed from Google Sheet");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load logs from Google Sheets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Recalculate price dynamically
  useEffect(() => {
    const qVal = parseFloat(qty) || 0;
    const rVal = parseFloat(rate) || 0;
    setCalculatedPrice(parseFloat((qVal * rVal).toFixed(2)));
  }, [qty, rate]);

  // Recalculate mileage dynamically
  useEffect(() => {
    const lastKm = parseFloat(lastKmReading) || 0;
    const currKm = parseFloat(currentKmReading) || 0;
    const qVal = parseFloat(qty) || 0;

    if (qVal > 0 && currKm >= lastKm) {
      setMileage(parseFloat(((currKm - lastKm) / qVal).toFixed(2)));
    } else {
      setMileage(0);
    }
  }, [lastKmReading, currentKmReading, qty]);

  // Filter logs based on active tab and search query
  const filteredLogs = logs.filter(log => {
    // Sub-stage 2 Actual Filling:
    // Pending: PlannedDriver (Col K) is not empty, ActualDriver (Col L) is empty
    // History: PlannedDriver (Col K) is not empty, ActualDriver (Col L) is not empty
    const hasPlannedDriver = log.plannedDriver !== '';
    const hasActualDriver = log.actualDriver !== '';
    
    if (activeTab === 'pending') {
      if (!hasPlannedDriver || hasActualDriver) return false;
    } else {
      if (!hasPlannedDriver || !hasActualDriver) return false;
    }

    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (log.requestNo || '').toLowerCase().includes(query) ||
      (log.vehicleNo || '').toLowerCase().includes(query) ||
      (log.requestedBy || '').toLowerCase().includes(query)
    );
  });

  const openFillingModal = async (log) => {
    setSelectedLogForFilling(log);
    setLoadingLastKm(true);
    
    // Reset inputs
    setDateOfFilling(new Date().toISOString().split('T')[0]);
    setCurrentKmReading('');
    setQty('');
    setRate('');
    setPhotoOfReadingFile(null);
    setPhotoOfReadingPreview('');
    setFuelBillPhotoFile(null);
    setFuelBillPhotoPreview('');
    setFuelMachineBeforeStartFile(null);
    setFuelMachineBeforeStartPreview('');
    setFuelMachineAfterFile(null);
    setFuelMachineAfterPreview('');

    try {
      // 1. Check last KM from office logs
      let lastKm = await officeService.getLastOdometerFromOfficeLogs(log.vehicleNo);
      
      // 2. Fallback to Vehicles sheet
      if (lastKm === null || lastKm <= 0) {
        const vehicles = await vehicleService.getVehiclesFromSheet();
        const match = vehicles.find(v => v.vehicleNo.trim().toUpperCase() === log.vehicleNo.trim().toUpperCase());
        lastKm = match ? match.lastKmReading : 0;
      }
      
      setLastKmReading(lastKm || 0);
    } catch (e) {
      console.error("Error fetching last KM reading:", e);
      setLastKmReading(0);
    } finally {
      setLoadingLastKm(false);
    }
  };

  const closeFillingModal = () => {
    if (submittingFilling) return;
    setSelectedLogForFilling(null);
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProcessFilling = async (e) => {
    e.preventDefault();

    // Validations
    if (!dateOfFilling) return toast.error("Please enter Date of Filling");
    if (!currentKmReading || parseFloat(currentKmReading) < lastKmReading) {
      return toast.error(`Current KM Reading must be greater than or equal to Last KM (${lastKmReading} KM)`);
    }
    if (!qty || parseFloat(qty) <= 0) return toast.error("Please enter valid Fuel Qty");
    if (!rate || parseFloat(rate) <= 0) return toast.error("Please enter valid Fuel Rate");

    if (!photoOfReadingFile) return toast.error("Odometer Photo is required");
    if (!fuelBillPhotoFile) return toast.error("Fuel Bill Photo is required");
    if (!fuelMachineBeforeStartFile) return toast.error("Dispenser Before Photo is required");
    if (!fuelMachineAfterFile) return toast.error("Dispenser After Photo is required");

    setSubmittingFilling(true);

    try {
      // Step 1: Upload photoOfReading
      setSubmissionStep("Uploading odometer photo...");
      const base64Reading = await fileToBase64(photoOfReadingFile);
      const photoOfReadingUrl = await officeService.uploadFileToDrive(
        base64Reading, 
        `odometer_office_${selectedLogForFilling.requestNo}.png`, 
        photoOfReadingFile.type
      );

      // Step 2: Upload fuelBillPhoto
      setSubmissionStep("Uploading fuel bill photo...");
      const base64Bill = await fileToBase64(fuelBillPhotoFile);
      const fuelBillPhotoUrl = await officeService.uploadFileToDrive(
        base64Bill, 
        `fuel_bill_office_${selectedLogForFilling.requestNo}.png`, 
        fuelBillPhotoFile.type
      );

      // Step 3: Upload fuelMachineBeforeStart
      setSubmissionStep("Uploading dispenser before photo...");
      const base64Before = await fileToBase64(fuelMachineBeforeStartFile);
      const fuelMachineBeforeStartUrl = await officeService.uploadFileToDrive(
        base64Before, 
        `dispenser_before_office_${selectedLogForFilling.requestNo}.png`, 
        fuelMachineBeforeStartFile.type
      );

      // Step 4: Upload fuelMachineAfter
      setSubmissionStep("Uploading dispenser after photo...");
      const base64After = await fileToBase64(fuelMachineAfterFile);
      const fuelMachineAfterUrl = await officeService.uploadFileToDrive(
        base64After, 
        `dispenser_after_office_${selectedLogForFilling.requestNo}.png`, 
        fuelMachineAfterFile.type
      );

      // Step 5: Save to Sheet
      setSubmissionStep("Saving details to spreadsheet...");
      await officeService.processActualFillingToSheet(selectedLogForFilling.rowIndex, {
        dateOfFilling,
        lastKmReading,
        currentKmReading: parseFloat(currentKmReading),
        photoOfReading: photoOfReadingUrl,
        qty: parseFloat(qty),
        rate: parseFloat(rate),
        calculatedPrice,
        fuelBillPhoto: fuelBillPhotoUrl,
        fuelMachineBeforeStart: fuelMachineBeforeStartUrl,
        fuelMachineAfter: fuelMachineAfterUrl,
        mileage
      });

      toast.success(`Fuel filling processed successfully for ${selectedLogForFilling.requestNo}!`);
      setSelectedLogForFilling(null);
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to process fuel filling details");
    } finally {
      setSubmittingFilling(false);
      setSubmissionStep('');
    }
  };

  const tableHeaders = [
    ...(activeTab === 'pending' ? ['Actions'] : []),
    'Request-No',
    'Vehicle No',
    'Requested by',
    'Amount Req (₹)',
    'Mode of Advance Amt.',
    'Advance-Paid (₹)',
    ...(activeTab === 'history' ? ['Planned1 (Driver)', 'Actual1 (Driver)', 'Delay1 (Driver)'] : []),
    'Date of Filling',
    'Last KM Reading',
    'Current KM Reading',
    'photo of reading',
    'Qty',
    'Rate',
    'Calculated Price (₹)',
    'Fuel-Bill-Photo',
    'Fuel machine before start',
    'Fuel machine after',
    'Mileage'
  ];

  const labelCls = "text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5";
  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-semibold text-slate-800 disabled:bg-slate-50 disabled:opacity-75";

  return (
    <div className="space-y-6">
      {/* Tabs and search bar and action buttons row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock size={16} />
            Pending Filling
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {logs.filter(l => l.plannedDriver !== '' && l.actualDriver === '').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle size={16} />
            Filling History
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {logs.filter(l => l.plannedDriver !== '' && l.actualDriver !== '').length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by vehicle, request no or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
            />
          </div>

          <button
            onClick={() => fetchLogs(true)}
            className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center text-xs font-bold bg-white h-9"
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {tableHeaders.map((header, idx) => (
                  <th key={idx} className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-slate-400 font-semibold">Loading data from Google Sheet...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.rowIndex} className="hover:bg-slate-50/50 transition">
                      {activeTab === 'pending' && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openFillingModal(log)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-[10px] shadow-sm transition"
                          >
                            <Fuel size={12} /> Process
                          </button>
                        </td>
                      )}

                      {/* Request-No */}
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {log.requestNo || '—'}
                      </td>

                      {/* Vehicle No */}
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {log.vehicleNo || '—'}
                      </td>

                      {/* Requested by */}
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {log.requestedBy || '—'}
                      </td>

                      {/* Amount Req */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {log.amountReq ? `₹${log.amountReq}` : '—'}
                      </td>

                      {/* Mode of Advance Amt */}
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {log.modeOfAdvanceAmt || '—'}
                      </td>

                      {/* Advance-Paid */}
                      <td className="px-5 py-4 font-extrabold text-indigo-600">
                        {log.advancePaid ? `₹${log.advancePaid}` : '—'}
                      </td>

                      {activeTab === 'history' && (
                        <>
                          {/* Planned Driver */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {formatColonDate(log.plannedDriver)}
                          </td>

                          {/* Actual Driver */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {formatColonDate(log.actualDriver)}
                          </td>

                          {/* Delay Driver */}
                          <td className="px-5 py-4 font-semibold text-rose-600 whitespace-nowrap">
                            {log.delayDriver || '—'}
                          </td>
                        </>
                      )}

                      {/* Date of Filling */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {formatSimpleDate(log.dateOfFilling)}
                      </td>

                      {/* Last KM Reading */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {log.lastKmReading ? `${log.lastKmReading} KM` : '—'}
                      </td>

                      {/* Current KM Reading */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {log.currentKmReading ? `${log.currentKmReading} KM` : '—'}
                      </td>

                      {/* photo of reading */}
                      <td className="px-5 py-4">
                        {log.photoOfReading ? (
                          <a 
                            href={log.photoOfReading} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600 transition-colors"
                          >
                            <Eye size={10} /> View
                          </a>
                        ) : '—'}
                      </td>

                      {/* Qty */}
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {log.qty ? `${log.qty} L` : '—'}
                      </td>

                      {/* Rate */}
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {log.rate ? `₹${log.rate}` : '—'}
                      </td>

                      {/* Calculated Price */}
                      <td className="px-5 py-4 text-slate-700 font-bold">
                        {log.calculatedPrice ? `₹${log.calculatedPrice}` : '—'}
                      </td>

                      {/* Fuel-Bill-Photo */}
                      <td className="px-5 py-4">
                        {log.fuelBillPhoto ? (
                          <a 
                            href={log.fuelBillPhoto} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600 transition-colors"
                          >
                            <Eye size={10} /> View
                          </a>
                        ) : '—'}
                      </td>

                      {/* Fuel machine before start */}
                      <td className="px-5 py-4">
                        {log.fuelMachineBeforeStart ? (
                          <a 
                            href={log.fuelMachineBeforeStart} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600 transition-colors"
                          >
                            <Eye size={10} /> View
                          </a>
                        ) : '—'}
                      </td>

                      {/* Fuel machine after */}
                      <td className="px-5 py-4">
                        {log.fuelMachineAfter ? (
                          <a 
                            href={log.fuelMachineAfter} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600 transition-colors"
                          >
                            <Eye size={10} /> View
                          </a>
                        ) : '—'}
                      </td>

                      {/* Mileage */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {log.mileage ? `${log.mileage} KM/L` : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-5 py-14 text-center">
                    <p className="text-slate-400 font-medium text-sm">
                      {searchQuery ? 'No matching logs found' : 'No logs found'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actual Fuel Filling Modal */}
      {selectedLogForFilling && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-base">Fuel Filling Processing</h3>
              </div>
              {!submittingFilling && (
                <button 
                  onClick={closeFillingModal}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            {loadingLastKm ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-semibold text-slate-600">Retrieving last odometer reading...</span>
              </div>
            ) : submittingFilling ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-bold text-indigo-600 text-center animate-pulse">
                  {submissionStep}
                </span>
                <span className="text-xs text-slate-400 text-center">Please do not close this window</span>
              </div>
            ) : (
              <form onSubmit={handleProcessFilling} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Reference Info */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-1 text-xs grid grid-cols-2 gap-x-4">
                  <div>
                    <span className="text-slate-500 font-medium mr-1.5">Req No:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForFilling.requestNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium mr-1.5">Vehicle No:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForFilling.vehicleNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium mr-1.5">Requestor:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForFilling.requestedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium mr-1.5">Advance Paid:</span>
                    <span className="text-indigo-600 font-extrabold">₹{selectedLogForFilling.advancePaid}</span>
                  </div>
                </div>

                {/* Form fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Date of Filling</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateOfFilling}
                        onChange={(e) => setDateOfFilling(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Last KM Reading (KM)</label>
                    <input
                      type="number"
                      value={lastKmReading}
                      className={`${inputCls} bg-slate-100 text-slate-500`}
                      disabled
                      readOnly
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Current KM Reading (KM)</label>
                    <input
                      type="number"
                      value={currentKmReading}
                      onChange={(e) => setCurrentKmReading(e.target.value)}
                      placeholder="e.g. 15600"
                      className={inputCls}
                      required
                      min={lastKmReading}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Qty (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="e.g. 45"
                      className={inputCls}
                      required
                      min="0.01"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Rate (₹/Liter)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="e.g. 96.50"
                      className={inputCls}
                      required
                      min="0.01"
                    />
                  </div>

                  {/* Calculations summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-3 md:col-span-2">
                    <div className="text-center border-r border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Calculated Price</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 block">₹{calculatedPrice}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide block">Est. Mileage</span>
                      <span className="text-sm font-extrabold text-indigo-700 mt-1 block">{mileage} KM/L</span>
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1">
                    <Camera size={13} className="text-indigo-500" />
                    Required Photo Uploads
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Odometer Photo */}
                    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Current Odometer Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, setPhotoOfReadingFile, setPhotoOfReadingPreview)}
                        className="hidden" 
                        id="photoOfReading"
                      />
                      <label htmlFor="photoOfReading" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 bg-white cursor-pointer transition text-[10px] font-bold text-indigo-600 gap-1 min-h-[90px]">
                        {photoOfReadingPreview ? (
                          <img src={photoOfReadingPreview} alt="Preview" className="h-16 w-auto object-cover rounded-md" />
                        ) : (
                          <>
                            <Camera size={20} className="text-slate-400" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Fuel Bill Photo */}
                    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Fuel Bill Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, setFuelBillPhotoFile, setFuelBillPhotoPreview)}
                        className="hidden" 
                        id="fuelBillPhoto"
                      />
                      <label htmlFor="fuelBillPhoto" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 bg-white cursor-pointer transition text-[10px] font-bold text-indigo-600 gap-1 min-h-[90px]">
                        {fuelBillPhotoPreview ? (
                          <img src={fuelBillPhotoPreview} alt="Preview" className="h-16 w-auto object-cover rounded-md" />
                        ) : (
                          <>
                            <Camera size={20} className="text-slate-400" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Dispenser Before Start */}
                    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Dispenser (Before Start)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, setFuelMachineBeforeStartFile, setFuelMachineBeforeStartPreview)}
                        className="hidden" 
                        id="fuelMachineBeforeStart"
                      />
                      <label htmlFor="fuelMachineBeforeStart" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 bg-white cursor-pointer transition text-[10px] font-bold text-indigo-600 gap-1 min-h-[90px]">
                        {fuelMachineBeforeStartPreview ? (
                          <img src={fuelMachineBeforeStartPreview} alt="Preview" className="h-16 w-auto object-cover rounded-md" />
                        ) : (
                          <>
                            <Camera size={20} className="text-slate-400" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Dispenser After */}
                    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Dispenser (After Finish)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, setFuelMachineAfterFile, setFuelMachineAfterPreview)}
                        className="hidden" 
                        id="fuelMachineAfter"
                      />
                      <label htmlFor="fuelMachineAfter" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-3 bg-white cursor-pointer transition text-[10px] font-bold text-indigo-600 gap-1 min-h-[90px]">
                        {fuelMachineAfterPreview ? (
                          <img src={fuelMachineAfterPreview} alt="Preview" className="h-16 w-auto object-cover rounded-md" />
                        ) : (
                          <>
                            <Camera size={20} className="text-slate-400" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeFillingModal}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    Save Filling details
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
