import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Play, Download, Image as ImageIcon, Search, Plus } from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import ModalWrapper from '../../components/ModalWrapper';
import ProcessFuelModal from '../../components/modals/ProcessFuelModal';
import RequestFuelModal from '../../components/modals/RequestFuelModal';
import { fuelService } from '../../services/fuel.service';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export default function ActualFilling() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Modal actions
  const [selectedProcessRequest, setSelectedProcessRequest] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fuelService.getFuelRequestsFromSheet();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Dynamic vehicle options from the current tab's records
  const activeTabVehicles = React.useMemo(() => {
    const tabRequests = requests.filter((req) => 
      activeTab === 'pending' ? req.status === 'pending' : req.status === 'completed'
    );
    const unique = new Set(tabRequests.map(r => r.vehicleNo).filter(Boolean));
    return Array.from(unique).sort();
  }, [requests, activeTab]);

  // Reset filters on tab switch
  useEffect(() => {
    setStartDate('');
    setEndDate('');
    setSelectedVehicle('');
  }, [activeTab]);

  // Filter requests based on tab, vehicle, date range, and search query
  const displayedRequests = requests.filter((req) => {
    // Tab match
    const tabMatch = activeTab === 'pending' 
      ? req.status === 'pending' 
      : req.status === 'completed';
    
    if (!tabMatch) return false;

    // Vehicle dropdown match
    if (selectedVehicle && req.vehicleNo !== selectedVehicle) {
      return false;
    }

    // Date range match
    if (startDate || endDate) {
      if (!req.requestDate) return false;
      const reqDateObj = new Date(req.requestDate);
      if (startDate) {
        const startObj = new Date(startDate);
        if (reqDateObj < startObj) return false;
      }
      if (endDate) {
        const endObj = new Date(endDate);
        if (reqDateObj > endObj) return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        req.requestNo.toLowerCase().includes(query) ||
        (req.slipNo && req.slipNo.toLowerCase().includes(query)) ||
        req.vehicleNo.toLowerCase().includes(query) ||
        req.issuedTo.toLowerCase().includes(query) ||
        (req.fuelBillNo && req.fuelBillNo.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleDownloadSlip = (req) => {
    if (req.slipCopy) {
      window.open(req.slipCopy, '_blank');
    } else {
      toast.error('No slip link available');
    }
  };

  const handleViewImage = (imgUrl, title) => {
    if (!imgUrl) {
      toast.error('No image was uploaded for this record');
      return;
    }
    setPreviewTitle(title);
    setPreviewImage(imgUrl);
  };

  const inputCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 pt-2">

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/50">
          <button
            onClick={() => { setActiveTab('pending'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
          Pending
          </button>
          <button
            onClick={() => { setActiveTab('history'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
          History
          </button>
        </div>

        {/* Search and Action Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Start Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 w-full sm:w-auto justify-between sm:justify-start flex-1 sm:flex-initial">
            <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none p-0 w-24 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 w-full sm:w-auto justify-between sm:justify-start flex-1 sm:flex-initial">
            <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 text-xs text-slate-700 focus:outline-none p-0 w-24 cursor-pointer"
            />
          </div>

          {/* Vehicle Select */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="block text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer h-[38px] w-full sm:w-auto sm:min-w-[130px]"
            >
              <option value="">All Vehicles</option>
              {activeTabVehicles.map((vNo) => (
                <option key={vNo} value={vNo}>
                  {vNo}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64 flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'pending' ? "Search pending..." : "Search history..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Clear Filters Button (conditional) */}
          {(startDate || endDate || selectedVehicle) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedVehicle('');
              }}
              className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-3 py-2 rounded-xl transition border border-rose-200 h-[38px] w-full sm:w-auto flex-1 sm:flex-initial justify-center items-center flex"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm whitespace-nowrap h-[38px] w-full sm:w-auto flex-1 sm:flex-initial"
            id="request-fuel-btn"
          >
            <Plus size={15} />
            New Request
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'pending' ? (
          <TableWrapper
            headers={['Actions', 'Request No', 'Slip No', 'Vehicle', 'Vehicle Name', 'Last KM Reading', 'Expected Avg.', 'Issued To', 'Location', 'Slip']}
            data={displayedRequests}
            loading={loading}
            emptyMessage="No pending fuel filling requests"
            renderRow={(req) => {
              const locationText = req.location === 'Others' 
                ? 'Others' 
                : (req.location && req.location.length === 1 ? `Location ${req.location}` : (req.location || '—'));

              return (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedProcessRequest(req)}
                      className="flex items-center gap-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                    >
                      <Play size={10} className="fill-current" />
                      Process
                    </button>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-900 font-mono">{req.requestNo}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-500 font-mono">{req.slipNo || '—'}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">{req.vehicleNo}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{req.vehicleName || '—'}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-600">{req.lastKmReading} KM</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-500">{req.mileage ? `${req.mileage} KM/L` : '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{req.issuedTo}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{locationText}</td>
                  <td className="px-5 py-3">
                    {req.slipCopy ? (
                      <button
                        onClick={() => handleDownloadSlip(req)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Download Slip"
                      >
                        <Download size={14} />
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            }}
          />
        ) : (
          <TableWrapper
            headers={['Request No', 'Slip No', 'Vehicle', 'Vehicle Name', 'Expected Avg.', 'Actual Avg.', 'Qty (L)', 'Rate', 'Total', 'Current KM', 'Distance Travelled', 'Fuel Bill', 'Filling Date', 'KM Reading', 'Bill Copy']}
            data={displayedRequests}
            loading={loading}
            emptyMessage="No completed filling records found"
            renderRow={(req) => {
              const distanceTravelled = req.currentKmReading - req.lastKmReading;
              const actualAvg = req.qty > 0 ? (distanceTravelled / req.qty) : 0;
              return (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-bold text-slate-900 font-mono">{req.requestNo}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-500 font-mono">{req.slipNo || '—'}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">{req.vehicleNo}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{req.vehicleName || '—'}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-500">{req.mileage ? `${req.mileage} KM/L` : '—'}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-900">
                    {actualAvg > 0 ? `${actualAvg.toFixed(2)} KM/L` : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-800">{req.qty} L</td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-medium">₹{req.rate}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-900">{formatCurrency(req.totalAmount)}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-600">{req.currentKmReading} KM</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                    {isNaN(distanceTravelled) ? '—' : `${distanceTravelled} KM`}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                      {req.fuelBillNo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-semibold">{formatDate(req.fillingDate)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleViewImage(req.readingImage, `KM Reading - ${req.currentKmReading} KM`)}
                      className={`p-1.5 rounded transition-colors ${req.readingImage ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800' : 'text-slate-300 cursor-not-allowed'}`}
                      title="View KM Photo"
                      disabled={!req.readingImage}
                    >
                      <ImageIcon size={14} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleViewImage(req.billImage, `Fuel Bill - ${req.fuelBillNo}`)}
                      className={`p-1.5 rounded transition-colors ${req.billImage ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800' : 'text-slate-300 cursor-not-allowed'}`}
                      title="View Bill Photo"
                      disabled={!req.billImage}
                    >
                      <ImageIcon size={14} />
                    </button>
                  </td>
                </tr>
              );
            }}
          />
        )}
      </div>

      {/* Process Filling Modal */}
      {selectedProcessRequest && (
        <ProcessFuelModal
          isOpen={!!selectedProcessRequest}
          onClose={() => setSelectedProcessRequest(null)}
          request={selectedProcessRequest}
          onSuccess={loadRequests}
        />
      )}



      {/* Document Image Overlay Modal */}
      <ModalWrapper
        isOpen={!!previewImage}
        onClose={() => { setPreviewImage(null); setPreviewTitle(''); }}
        title={previewTitle}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col items-center">
          <img 
            src={previewImage} 
            alt={previewTitle} 
            className="w-full h-auto object-contain rounded-xl border border-slate-200 max-h-[60vh] shadow-sm" 
          />
          <button
            onClick={() => { setPreviewImage(null); setPreviewTitle(''); }}
            className="mt-4 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm w-full"
          >
            Close Document
          </button>
        </div>
      </ModalWrapper>

      {/* Request Fuel Modal */}
      {isRequestModalOpen && (
        <RequestFuelModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={loadRequests}
        />
      )}
    </div>
  );
}
