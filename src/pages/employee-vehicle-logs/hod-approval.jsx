import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  Clock, 
  Search, 
  PlusCircle, 
  Eye, 
  RefreshCw,
  X
} from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import EmployeeRequestModal from './request-form';

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



export default function EmployeeApproval() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Data states
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  
  // Filtering & Selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIndexes, setSelectedRowIndexes] = useState(new Set());
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // New HOD approver states
  const [approvers, setApprovers] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const fetchLogs = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployeeRequestsFromSheet();
      setLogs(data);
      setSelectedRowIndexes(new Set());
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

  const fetchApprovers = async () => {
    setLoadingApprovers(true);
    try {
      const list = await employeeService.getApprovedByFromSheet();
      setApprovers(list);
    } catch (e) {
      console.error("Error fetching HOD approvers:", e);
    } finally {
      setLoadingApprovers(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchApprovers();
  }, []);

  // Filter logs based on active tab and search query
  const filteredLogs = logs.filter(log => {
    // 1. Tab Condition
    // Pending: Planned1 is not null/empty, Actual1 is null/empty
    // History: Planned1 is not null/empty, Actual1 is not null/empty
    const hasPlanned1 = log.planned1 !== '';
    const hasActual1 = log.actual1 !== '';
    
    if (activeTab === 'pending') {
      if (!hasPlanned1 || hasActual1) return false;
    } else {
      if (!hasPlanned1 || !hasActual1) return false;
    }

    // 2. Search query filter
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

  // Handle individual row select toggle
  const handleSelectRow = (rowIndex) => {
    const next = new Set(selectedRowIndexes);
    if (next.has(rowIndex)) {
      next.delete(rowIndex);
    } else {
      next.add(rowIndex);
    }
    setSelectedRowIndexes(next);
  };

  // Handle select all toggle
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allRowIndexes = filteredLogs.map(log => log.rowIndex).filter(idx => idx !== null);
      setSelectedRowIndexes(new Set(allRowIndexes));
    } else {
      setSelectedRowIndexes(new Set());
    }
  };

  // Trigger Approved By modal dialog
  const triggerApprovalDialog = () => {
    if (selectedRowIndexes.size === 0) return;
    setApprovedBy('');
    setApprovalRemarks('');
    setIsApprovalModalOpen(true);
  };

  // Process bulk HOD approval
  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!approvedBy) {
      return toast.error("Please select who is approving these request(s)");
    }

    setSubmittingApproval(true);
    setIsApprovalModalOpen(false);
    
    try {
      const rowIndexesArray = Array.from(selectedRowIndexes);
      await employeeService.approveEmployeeRequestsToSheet(rowIndexesArray, approvedBy, approvalRemarks.trim());
      
      toast.success(`Successfully approved ${selectedRowIndexes.size} request(s)!`);
      fetchLogs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit approvals: " + error.message);
    } finally {
      setSubmittingApproval(false);
    }
  };

  // Check if all filtered pending logs are selected
  const allFilteredPendingIndexes = filteredLogs.map(l => l.rowIndex).filter(idx => idx !== null);
  const isAllSelected = allFilteredPendingIndexes.length > 0 && 
    allFilteredPendingIndexes.every(idx => selectedRowIndexes.has(idx));

  return (
    <div className="space-y-6">
      {/* Tabs and search bar and action buttons row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        <div className="flex gap-6">
          <button
            onClick={() => { setActiveTab('pending'); setSelectedRowIndexes(new Set()); }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock size={16} />
            Pending Approval
            {logs.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {logs.filter(l => l.planned1 !== '' && l.actual1 === '').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('history'); setSelectedRowIndexes(new Set()); }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckCircle size={16} />
            Approval History
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
          
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5 h-9 whitespace-nowrap"
          >
            <PlusCircle size={14} />
            New Request
          </button>
        </div>
      </div>

      {/* Bulk actions for Pending tab */}
      {activeTab === 'pending' && selectedRowIndexes.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
          <span className="text-sm font-semibold text-indigo-800">
            {selectedRowIndexes.size} travel request(s) selected
          </span>
          <button
            onClick={triggerApprovalDialog}
            disabled={submittingApproval}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition shadow-sm active:transform active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle size={14} />
            {submittingApproval ? 'Approving...' : 'Approve Selected'}
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                {activeTab === 'pending' && (
                  <th className="px-5 py-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
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
                {activeTab === 'history' && (
                  <>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Planned1</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual1</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Delay</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Approved By</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">HOD Remarks</th>
                    <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {activeTab === 'pending' && <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-4 mx-auto" /></td>}
                    {Array.from({ length: 15 + (activeTab === 'history' ? 4 : 0) }).map((_, cIdx) => (
                      <td key={cIdx} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded w-5/6" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap text-slate-600 text-sm">
                    {activeTab === 'pending' && (
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIndexes.has(log.rowIndex)}
                          onChange={() => handleSelectRow(log.rowIndex)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
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

                    {activeTab === 'history' && (
                      <>
                        {/* Planned1 */}
                        <td className="px-5 py-4">
                          {formatColonDate(log.planned1)}
                        </td>

                        {/* Actual1 */}
                        <td className="px-5 py-4">
                          {formatColonDate(log.actual1)}
                        </td>
                        
                        {/* Delay */}
                        <td className="px-5 py-4 text-rose-600 font-semibold">
                          {log.delay1 || '—'}
                        </td>

                        {/* Approved By */}
                        <td className="px-5 py-4 text-slate-700 font-medium">
                          {log.approvedBy || '—'}
                        </td>

                        {/* HOD Remarks */}
                        <td className="px-5 py-4 text-slate-600 max-w-[200px] truncate" title={log.hodRemarks}>
                          {log.hodRemarks || '—'}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                            <CheckCircle size={10} /> {log.approvalByHod || 'Approved'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15 + (activeTab === 'pending' ? 1 : 6)} className="px-5 py-14 text-center">
                    <p className="text-slate-400 font-medium text-sm">
                      {searchQuery ? 'No matching logs found' : 'No logs found in this category'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      <EmployeeRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRefresh={fetchLogs}
      />

      {submittingApproval && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-100 flex flex-col items-center space-y-4 max-w-xs text-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-semibold text-slate-800">Approving travel request(s)...</span>
            <span className="text-[10px] text-slate-400">Please do not refresh or close this page</span>
          </div>
        </div>
      )}

      {/* Approved By Dialog Modal */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-indigo-600" size={18} />
                <h3 className="font-extrabold text-slate-800 text-base">Approve {selectedRowIndexes.size} Request(s)</h3>
              </div>
              <button 
                onClick={() => setIsApprovalModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmApproval} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Approved By
                </label>
                {loadingApprovers ? (
                  <div className="text-xs text-slate-400 animate-pulse">Loading HOD list...</div>
                ) : (
                  <select
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Approver</option>
                    {approvers.map((app, idx) => (
                      <option key={idx} value={app}>{app}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Remarks / Approval Notes
                </label>
                <input
                  type="text"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Enter approval remarks (optional)"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                >
                  Confirm Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
