import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Search, 
  RefreshCw, 
  X,
  Eye
} from 'lucide-react';
import { employeeService } from '../../services/employee.service';

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

const formatSimpleTime = (timeStr) => {
  if (!timeStr) return '—';
  try {
    let cleanStr = timeStr.toString().trim();
    if (!cleanStr) return '—';

    // If it contains a space or T separating date and time (e.g. "1899-12-30 07:00:00")
    if (cleanStr.includes(' ') || cleanStr.includes('T')) {
      const parts = cleanStr.split(/[ T]/);
      const timePart = parts.find(p => p.includes(':'));
      if (timePart) {
        cleanStr = timePart;
      }
    }

    if (cleanStr.includes(':')) {
      const lower = cleanStr.toLowerCase();
      const isAm = lower.includes('am');
      const isPm = lower.includes('pm');
      
      let partsStr = cleanStr;
      if (isAm || isPm) {
        partsStr = cleanStr.replace(/(am|pm)/i, '').trim();
      }
      
      const parts = partsStr.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
        
        const hStr = String(hours).padStart(2, '0');
        const mStr = String(minutes).padStart(2, '0');
        return `${hStr}:${mStr}`;
      }
    }
    
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return cleanStr;
  } catch {
    return timeStr.toString();
  }
};



export default function EmployeePayment() {
  // Data states
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  
  // Filtering & Modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogForPayment, setSelectedLogForPayment] = useState(null);
  
  // Modal form states
  const [rate, setRate] = useState(4);
  const [actualPaid, setActualPaid] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [remarks, setRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchLogs = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployeeRequestsFromSheet();
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

  // Filter logs based on active tab and search query
  const filteredLogs = logs.filter(log => {
    // Pending: Planned2 is not null/empty, Actual2 is null/empty
    // History: Planned2 is not null/empty, Actual2 is not null/empty
    const hasPlanned2 = log.planned2 !== '';
    const hasActual2 = log.actual2 !== '';
    
    if (activeTab === 'pending') {
      if (!hasPlanned2 || hasActual2) return false;
    } else {
      if (!hasPlanned2 || !hasActual2) return false;
    }

    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (log.requestNo || '').toLowerCase().includes(query) ||
      (log.employeeName || '').toLowerCase().includes(query) ||
      (log.department || '').toLowerCase().includes(query) ||
      (log.purposeOfVisit || '').toLowerCase().includes(query) ||
      (log.clientName || '').toLowerCase().includes(query)
    );
  });

  const openPaymentModal = (log) => {
    setSelectedLogForPayment(log);
    
    // Set rate to whatever is in the log (if present and > 0, otherwise default 4)
    const initialRate = log.rate && parseFloat(log.rate) > 0 ? parseFloat(log.rate) : 4;
    setRate(initialRate);
    
    // Prefill payment status. If log.paymentStatus is "partial" or "paid", use that; otherwise default to "paid"
    const currentStatus = log.paymentStatus ? log.paymentStatus.toLowerCase() : 'pending';
    setPaymentStatus(currentStatus === 'pending' ? 'paid' : currentStatus);

    // If status is partial, prefill with actualPaid from sheet, otherwise leave empty ""
    if (currentStatus === 'partial') {
      setActualPaid(log.actualPaid !== undefined && log.actualPaid !== null ? log.actualPaid : '');
    } else {
      setActualPaid('');
    }
    
    setRemarks(log.remarks || '');
  };

  const closePaymentModal = () => {
    setSelectedLogForPayment(null);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedLogForPayment) return;

    const distanceVal = selectedLogForPayment.distance !== '' 
      ? parseFloat(selectedLogForPayment.distance) || 0 
      : Math.max(0, (parseFloat(selectedLogForPayment.kmReadingEnd) || 0) - (parseFloat(selectedLogForPayment.kmReadingStart) || 0));
    const distanceCovered = distanceVal > 0 ? distanceVal : 0;
    const calculatedPrice = distanceCovered * parseFloat(rate);

    if (actualPaid === '' || parseFloat(actualPaid) < 0) {
      return toast.error("Please enter a valid actual paid amount");
    }

    setSubmittingPayment(true);

    try {
      await employeeService.processEmployeePaymentToSheet(selectedLogForPayment.rowIndex, {
        distanceCovered,
        rate: parseFloat(rate),
        calculatedPrice,
        actualPaid: parseFloat(actualPaid),
        remarks: remarks.trim(),
        paymentStatus
      });

      toast.success("Payment processed successfully!");
      closePaymentModal();
      fetchLogs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process payment: " + error.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Helper calculations for modal
  const modalDistance = selectedLogForPayment 
    ? (selectedLogForPayment.distance !== '' 
        ? parseFloat(selectedLogForPayment.distance) || 0 
        : Math.max(0, (parseFloat(selectedLogForPayment.kmReadingEnd) || 0) - (parseFloat(selectedLogForPayment.kmReadingStart) || 0)))
    : 0;
  const modalCalculatedPrice = modalDistance * (parseFloat(rate) || 0);

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
            Pending Process
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {logs.filter(l => l.planned2 !== '' && l.actual2 === '').length}
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
                {logs.filter(l => l.planned2 !== '' && l.actual2 !== '').length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by Employee, Client, Req No..."
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

      {/* Main Table */}
      <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                {activeTab === 'pending' && (
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                )}
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Request-No</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date of Visit</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee-Name</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Start-Time</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">KM Reading (Start)</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Proof (Start)</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">End-Time</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">KM Reading (End)</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Proof (End)</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Purpose of Visit</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Client-Name</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Site-Location</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Machine-Details</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Journey Outcome</th>
                {activeTab === 'pending' ? (
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated KM</th>
                ) : (
                  <>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">KM Covered</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Calculated Price</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Paid</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Planned2</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual2</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Delay</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {Array.from({ length: 15 + (activeTab === 'pending' ? 2 : 9) }).map((_, cIdx) => (
                      <td key={cIdx} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded w-5/6" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const kmCoveredEst = log.distance !== '' ? log.distance : Math.max(0, (parseFloat(log.kmReadingEnd) || 0) - (parseFloat(log.kmReadingStart) || 0));
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap text-slate-600 text-sm">
                      {activeTab === 'pending' && (
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => openPaymentModal(log)}
                            className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-150 rounded-lg py-1.5 px-3.5 text-xs font-bold transition-all"
                          >
                            <CreditCard size={12} />
                            Process
                          </button>
                        </td>
                      )}

                      {/* Request-No */}
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {log.requestNo || '—'}
                      </td>
                      
                      {/* Date of Visit */}
                      <td className="px-5 py-4">
                        {formatSimpleDate(log.dateOfVisit)}
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          log.department.toLowerCase() === 'service'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {log.department}
                        </span>
                      </td>

                      {/* Employee-Name */}
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {log.employeeName || '—'}
                      </td>

                      {/* Start-Time */}
                      <td className="px-5 py-4">
                        {formatSimpleTime(log.startTime)}
                      </td>

                      {/* KM Reading (Start) */}
                      <td className="px-5 py-4">
                        {log.kmReadingStart !== undefined && log.kmReadingStart !== null && log.kmReadingStart !== '' ? log.kmReadingStart : '—'}
                      </td>

                      {/* Proof (Start) */}
                      <td className="px-5 py-4">
                        {log.proofStart ? (
                          <a 
                            href={log.proofStart} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600 transition-colors"
                          >
                            <Eye size={10} /> View
                          </a>
                        ) : '—'}
                      </td>

                      {/* End-Time */}
                      <td className="px-5 py-4">
                        {formatSimpleTime(log.endTime)}
                      </td>

                      {/* KM Reading (End) */}
                      <td className="px-5 py-4">
                        {log.kmReadingEnd !== undefined && log.kmReadingEnd !== null && log.kmReadingEnd !== '' ? log.kmReadingEnd : '—'}
                      </td>

                      {/* Proof (End) */}
                      <td className="px-5 py-4">
                        {log.proofEnd ? (
                          <a 
                            href={log.proofEnd} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600 transition-colors"
                          >
                            <Eye size={10} /> View
                          </a>
                        ) : '—'}
                      </td>

                      {/* Purpose of Visit */}
                      <td className="px-5 py-4 max-w-xs truncate" title={log.purposeOfVisit}>
                        {log.purposeOfVisit || '—'}
                      </td>

                      {/* Client-Name */}
                      <td className="px-5 py-4">
                        {log.clientName || '—'}
                      </td>

                      {/* Site-Location */}
                      <td className="px-5 py-4">
                        {log.siteLocation || '—'}
                      </td>

                      {/* Machine-Details */}
                      <td className="px-5 py-4">
                        {log.machineDetails || '—'}
                      </td>

                      {/* Journey Outcome */}
                      <td className="px-5 py-4 max-w-xs truncate" title={log.journeyOutcome}>
                        {log.journeyOutcome || '—'}
                      </td>

                      {activeTab === 'pending' ? (
                        /* Estimated KM */
                        <td className="px-5 py-4 text-slate-700 font-semibold">
                          {kmCoveredEst} KM
                        </td>
                      ) : (
                        <>
                          {/* KM Covered */}
                          <td className="px-5 py-4 text-slate-700 font-semibold">
                            {log.distance || log.distanceCovered || '0'} KM
                          </td>

                          {/* Rate */}
                          <td className="px-5 py-4">
                            ₹{log.rate}
                          </td>

                          {/* Calculated Price */}
                          <td className="px-5 py-4 text-slate-700 font-semibold">
                            ₹{log.calculatedPrice}
                          </td>

                          {/* Actual Paid */}
                          <td className="px-5 py-4 text-indigo-600 font-extrabold">
                            ₹{log.actualPaid}
                          </td>

                          {/* Planned2 */}
                          <td className="px-5 py-4">
                            {formatColonDate(log.planned2)}
                          </td>

                          {/* Actual2 */}
                          <td className="px-5 py-4">
                            {formatColonDate(log.actual2)}
                          </td>

                          {/* Delay */}
                          <td className="px-5 py-4 text-rose-600 font-semibold">
                            {log.delay2 || '—'}
                          </td>

                          {/* Remarks */}
                          <td className="px-5 py-4 max-w-xs truncate" title={log.remarks}>
                            {log.remarks || '—'}
                          </td>

                          {/* Payment Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                              log.paymentStatus.toLowerCase() === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : log.paymentStatus.toLowerCase() === 'partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {log.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15 + (activeTab === 'pending' ? 2 : 9)} className="px-5 py-14 text-center">
                    <p className="text-slate-400 font-medium text-sm">
                      {searchQuery ? 'No matching payment records found' : 'No payment records found'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {selectedLogForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-base">Process Travel Payment</h3>
              </div>
              {!submittingPayment && (
                <button 
                  onClick={closePaymentModal}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            {submittingPayment ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-semibold text-slate-600 text-center animate-pulse">
                  Processing payment in Google Sheet...
                </span>
                <span className="text-xs text-slate-400 text-center">Please do not close this window</span>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="p-6 overflow-y-auto space-y-4">
                
                {/* Reference Info */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Request No:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForPayment.requestNo || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Employee:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForPayment.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Odometer Start:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForPayment.kmReadingStart} KM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Odometer End:</span>
                    <span className="text-slate-800 font-bold">{selectedLogForPayment.kmReadingEnd} KM</span>
                  </div>
                </div>

                {/* Calculations Block */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Distance</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{modalDistance} KM</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Calculated Price</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">₹{modalCalculatedPrice}</span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide block">Actual Paid</span>
                    <span className="text-sm font-extrabold text-indigo-700 mt-1 block">₹{actualPaid || 0}</span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Rate per KM (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => {
                        setRate(e.target.value);
                        // Update actual paid to new calculation
                        const newCalc = modalDistance * (parseFloat(e.target.value) || 0);
                        setActualPaid(newCalc);
                      }}
                      className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Actual-Paid (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actualPaid}
                      onChange={(e) => setActualPaid(e.target.value)}
                      className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="pending">Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter transaction ID, reference, or description..."
                      rows={2.5}
                      className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
                    disabled={submittingPayment}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    disabled={submittingPayment}
                  >
                    Confirm Payment
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
