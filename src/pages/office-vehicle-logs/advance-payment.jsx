import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  Clock, 
  Search, 
  PlusCircle, 
  Eye, 
  RefreshCw,
  Wallet,
  X
} from 'lucide-react';
import { officeService } from '../../services/office.service';
import OfficeRequestModal from './request-form';

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

export default function OfficeAdvancePayment() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Data states
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  
  // Filtering & Modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogForAdvance, setSelectedLogForAdvance] = useState(null);
  const [advanceModes, setAdvanceModes] = useState([]);
  const [approvedByList, setApprovedByList] = useState([]);
  
  // Modal form states
  const [modeOfAdvanceAmt, setModeOfAdvanceAmt] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);

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

  const fetchAdvanceModes = async () => {
    try {
      const modes = await officeService.getAdvanceModesFromSheet();
      setAdvanceModes(modes);
      if (modes.length > 0) {
        setModeOfAdvanceAmt(modes[0]);
      }
    } catch (e) {
      console.error("Error loading advance modes:", e);
    }
  };

  const fetchApprovedByList = async () => {
    try {
      const list = await officeService.getApprovedByFromSheet();
      setApprovedByList(list);
      if (list.length > 0) {
        setApprovedBy(list[0]);
      }
    } catch (e) {
      console.error("Error loading approved by list:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchAdvanceModes();
    fetchApprovedByList();
  }, []);

  // Filter logs based on active tab and search query
  const filteredLogs = logs.filter(log => {
    // Sub-stage 1 Advance Payment:
    // Pending: Planned1 is not empty, Actual1 is empty
    // History: Planned1 is not empty, Actual1 is not empty
    const hasPlanned1 = log.planned1 !== '';
    const hasActual1 = log.actual1 !== '';
    
    if (activeTab === 'pending') {
      if (!hasPlanned1 || hasActual1) return false;
    } else {
      if (!hasPlanned1 || !hasActual1) return false;
    }

    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (log.requestNo || '').toLowerCase().includes(query) ||
      (log.vehicleNo || '').toLowerCase().includes(query) ||
      (log.requestedBy || '').toLowerCase().includes(query)
    );
  });

  const openAdvanceModal = (log) => {
    setSelectedLogForAdvance(log);
    // Prefill the advancePaid with amountReq
    setAdvancePaid(log.amountReq || '');
    if (advanceModes.length > 0) {
      setModeOfAdvanceAmt(advanceModes[0]);
    }
    if (approvedByList.length > 0) {
      setApprovedBy(approvedByList[0]);
    } else {
      setApprovedBy('');
    }
    setRemarks('');
  };

  const closeAdvanceModal = () => {
    if (submittingAdvance) return;
    setSelectedLogForAdvance(null);
    setAdvancePaid('');
    setApprovedBy('');
    setRemarks('');
  };

  const handleProcessAdvance = async (e) => {
    e.preventDefault();

    if (!modeOfAdvanceAmt) {
      return toast.error('Please select Mode of Advance Amt.');
    }
    if (!advancePaid || parseFloat(advancePaid) < 0) {
      return toast.error('Please enter a valid Advance Paid amount');
    }
    if (!approvedBy) {
      return toast.error('Please select who approved this advance');
    }

    setSubmittingAdvance(true);

    try {
      await officeService.processAdvancePaymentToSheet(selectedLogForAdvance.rowIndex, {
        modeOfAdvanceAmt,
        advancePaid: parseFloat(advancePaid),
        approvedBy,
        remarks: remarks.trim()
      });
      
      toast.success(`Advance payment processed for ${selectedLogForAdvance.requestNo}!`);
      setSelectedLogForAdvance(null);
      setRemarks('');
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to process advance payment");
    } finally {
      setSubmittingAdvance(false);
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
    ...(activeTab === 'history' ? ['Planned1', 'Actual1', 'Delay', 'Approved By', 'Remarks'] : []),
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
            Pending Payment
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {logs.filter(l => l.planned1 !== '' && l.actual1 === '').length}
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
            Payment History
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {logs.filter(l => l.planned1 !== '' && l.actual1 !== '').length}
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

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5 h-9 whitespace-nowrap"
          >
            <PlusCircle size={14} />
            New Request
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
                            onClick={() => openAdvanceModal(log)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-[10px] shadow-sm transition"
                          >
                            <Wallet size={12} /> Process
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
                          {/* Planned1 */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {formatColonDate(log.planned1)}
                          </td>

                          {/* Actual1 */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {formatColonDate(log.actual1)}
                          </td>

                          {/* Delay */}
                          <td className="px-5 py-4 font-semibold text-rose-600 whitespace-nowrap">
                            {log.delay || '—'}
                          </td>

                          {/* Approved By */}
                          <td className="px-5 py-4 text-slate-700 font-medium">
                            {log.approvedBy || '—'}
                          </td>

                          {/* Remarks */}
                          <td className="px-5 py-4 text-slate-600 max-w-[200px] truncate" title={log.remarks}>
                            {log.remarks || '—'}
                          </td>
                        </>
                      )}

                      {/* Date of Filling */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {formatSimpleDate(log.dateOfFilling)}
                      </td>

                      {/* Last KM Reading */}
                      <td className="px-5 py-4">
                        {log.lastKmReading ? `${log.lastKmReading} KM` : '—'}
                      </td>

                      {/* Current KM Reading */}
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        {log.qty ? `${log.qty} L` : '—'}
                      </td>

                      {/* Rate */}
                      <td className="px-5 py-4">
                        {log.rate ? `₹${log.rate}` : '—'}
                      </td>

                      {/* Calculated Price */}
                      <td className="px-5 py-4 text-slate-700 font-semibold">
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

      {/* Process Advance Modal */}
      {selectedLogForAdvance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-base">Process Office Advance</h3>
              </div>
              {!submittingAdvance && (
                <button 
                  onClick={closeAdvanceModal}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            {submittingAdvance ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-semibold text-slate-600 text-center animate-pulse">
                  Processing advance payment in Google Sheet...
                </span>
                <span className="text-xs text-slate-400 text-center">Please do not close this window</span>
              </div>
            ) : (
              <form onSubmit={handleProcessAdvance} className="p-6 overflow-y-auto space-y-4">
                {/* Reference Info */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Request No:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForAdvance.requestNo || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Vehicle No:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForAdvance.vehicleNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Requested By:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForAdvance.requestedBy}</span>
                  </div>
                  <div className="flex justify-between border-t border-indigo-100/50 pt-1 mt-1 font-bold">
                    <span className="text-indigo-600">Amount Requested:</span>
                    <span className="text-indigo-700">₹{selectedLogForAdvance.amountReq}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Mode of Advance Amt.
                    </label>
                    <select
                      value={modeOfAdvanceAmt}
                      onChange={(e) => setModeOfAdvanceAmt(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                      required
                    >
                      <option value="" disabled>Select Mode</option>
                      {advanceModes.map((mode, idx) => (
                        <option key={idx} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Advance-Paid (₹)
                    </label>
                    <input
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Approved By
                    </label>
                    <select
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                      required
                    >
                      <option value="" disabled>Select Approver</option>
                      {approvedByList.map((app, idx) => (
                        <option key={idx} value={app}>{app}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Remarks
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks (optional)"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeAdvanceModal}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                  >
                    Submit & Pay
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Request Modal */}
      <OfficeRequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRefresh={fetchLogs}
      />
    </div>
  );
}
