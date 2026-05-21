import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import TableWrapper from '../../components/TableWrapper';
import RequestFuelModal from '../../components/modals/RequestFuelModal';
import SlipPreviewModal from '../../components/modals/SlipPreviewModal';
import { fuelService } from '../../services/fuel.service';
import { downloadFuelSlip } from '../../utils/generateFuelSlip';
import { useAuthStore } from '../../store/authStore';

export default function RequestFilling() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSlipRequest, setSelectedSlipRequest] = useState(null);

  const loadRequests = () => {
    setLoading(true);
    try {
      const data = fuelService.getFuelRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fuel requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let result = [...requests];

    // Filter by user role
    if (user?.role === 'USER') {
      result = result.filter(
        (req) => req.issuedTo && req.issuedTo.toLowerCase() === user.name.toLowerCase()
      );
    }

    // Apply Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (req) =>
          req.requestNo.toLowerCase().includes(query) ||
          (req.slipNo && req.slipNo.toLowerCase().includes(query)) ||
          req.vehicleNo.toLowerCase().includes(query) ||
          req.issuedTo.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(result);
  }, [requests, searchQuery, user]);

  const handleDownloadSlip = async (req) => {
    try {
      await downloadFuelSlip(req);
      const name = req.slipNo || req.requestNo;
      toast.success(`Slip ${name} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download slip');
    }
  };

  const inputCls = "block w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 pt-2">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Request No, Slip No, Vehicle No, or Driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputCls}
          />
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm whitespace-nowrap"
          id="request-fuel-btn"
        >
          <Plus size={15} />
          New Request
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0 flex flex-col">
        <TableWrapper
          headers={['Request No', 'Slip No', 'Vehicle No', 'Expected Avg.', 'Issued To', 'Last KM', 'Location', 'Slip', 'Actions']}
          data={filteredRequests}
          loading={loading}
          emptyMessage="No fuel requests found"
          renderRow={(req) => {
            const locationText = req.location === 'Others' 
              ? (req.customLocation || 'Others') 
              : `Location ${req.location}`;

            return (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-sm font-bold text-slate-900 font-mono">{req.requestNo}</td>
                <td className="px-5 py-3 text-sm font-bold text-slate-500 font-mono">{req.slipNo || '—'}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-700">{req.vehicleNo}</td>
                <td className="px-5 py-3 text-sm font-medium text-slate-500">{req.mileage ? `${req.mileage} KM/L` : '—'}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{req.issuedTo}</td>
                <td className="px-5 py-3 text-sm font-medium text-slate-500">{req.lastKmReading} KM</td>
                <td className="px-5 py-3 text-sm text-slate-600">{locationText}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setSelectedSlipRequest(req)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    <Eye size={13} />
                    View
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadSlip(req)}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Download Slip"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* Modals */}
      <RequestFuelModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={loadRequests}
      />

      {selectedSlipRequest && (
        <SlipPreviewModal
          isOpen={!!selectedSlipRequest}
          onClose={() => setSelectedSlipRequest(null)}
          request={selectedSlipRequest}
        />
      )}
    </div>
  );
}
