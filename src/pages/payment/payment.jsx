import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Image as ImageIcon, CheckSquare, Square, CheckCircle2, IndianRupee, Fuel, FileText } from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import ModalWrapper from '../../components/ModalWrapper';
import LoadingSpinner from '../../components/LoadingSpinner';
import MetricCard from '../../components/MetricCard';
import { fuelService } from '../../services/fuel.service';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export default function Payment() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [requests, setRequests] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Image preview state
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fuelService.getFuelRequestsFromSheet();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Derive dropdown lists from completed requests
  const completedRequests = requests.filter(req => req.planned2 !== '');
  const uniqueVehicles = Array.from(new Set(completedRequests.map(r => r.vehicleNo).filter(Boolean))).sort();
  const uniqueDrivers = Array.from(new Set(completedRequests.map(r => r.issuedTo).filter(Boolean))).sort();

  // Filter requests based on tab, search query, date range, driver, and vehicle
  const displayedRequests = requests.filter((req) => {
    // Only completed fuel fillings can go to payment
    if (req.planned2 === '') return false;

    // Tab filter
    const isPaid = req.actual2 !== '';
    const tabMatch = activeTab === 'pending' ? !isPaid : isPaid;
    if (!tabMatch) return false;

    // Date range filter
    if (req.requestDate) {
      const reqDate = new Date(req.requestDate);
      if (startDate) {
        const start = new Date(startDate);
        if (reqDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (reqDate > end) return false;
      }
    } else if (startDate || endDate) {
      return false;
    }

    // Driver filter
    if (selectedDriver && req.issuedTo !== selectedDriver) {
      return false;
    }

    // Vehicle filter
    if (selectedVehicle && req.vehicleNo !== selectedVehicle) {
      return false;
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

  const stats = React.useMemo(() => {
    let totalAmt = 0;
    let totalLitres = 0;
    let totalReqs = displayedRequests.length;
    let selectedAmt = 0;
    let selectedCount = 0;

    displayedRequests.forEach((req) => {
      totalAmt += req.totalAmount || 0;
      totalLitres += req.qty || 0;
      if (selectedIds.includes(req.id)) {
        selectedAmt += req.totalAmount || 0;
        selectedCount += 1;
      }
    });

    const avgRate = totalLitres > 0 ? (totalAmt / totalLitres) : 0;

    return {
      totalAmt,
      totalLitres,
      totalReqs,
      selectedAmt,
      selectedCount,
      avgRate
    };
  }, [displayedRequests, selectedIds]);

  const handleSelectAll = (checked) => {
    const visibleIds = displayedRequests.map((r) => r.id);
    if (checked) {
      const merged = Array.from(new Set([...selectedIds, ...visibleIds]));
      setSelectedIds(merged);
    } else {
      setSelectedIds(selectedIds.filter((id) => !visibleIds.includes(id)));
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  const handleSubmitPayments = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      const selectedRequests = requests.filter((req) => selectedIds.includes(req.id));
      for (const req of selectedRequests) {
        if (req.rowIndex) {
          await fuelService.processPaymentToSheet(req.rowIndex);
        }
      }
      toast.success(`Successfully processed payments for ${selectedIds.length} records!`);
      setSelectedIds([]);
      await loadRequests();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process payments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewImage = (imgUrl, title) => {
    if (!imgUrl) {
      toast.error('No image uploaded for this record');
      return;
    }
    setPreviewTitle(title);
    setPreviewImage(imgUrl);
  };

  const visibleIds = displayedRequests.map((r) => r.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  // Checkbox JSX element to pass into table headers array
  const checkboxHeader = (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        checked={isAllSelected}
        onChange={(e) => handleSelectAll(e.target.checked)}
        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
      />
    </div>
  );

  const inputCls =
    "block w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 pt-2">
      {submitting && (
        <LoadingSpinner message="Processing Payments..." fullPage={true} />
      )}
      {/* Header Actions */}
      <div className="flex justify-end items-center flex-shrink-0">
        {activeTab === 'pending' && selectedIds.length > 0 && (
          <button
            onClick={handleSubmitPayments}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <CheckCircle2 size={14} />
            Submit Payments ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <MetricCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmt)}
          icon={IndianRupee}
          description="Across filtered payments"
          gradient="from-emerald-500 to-teal-500"
        />
        <MetricCard
          title="Total Litres"
          value={`${stats.totalLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`}
          icon={Fuel}
          description="Fuel volume filtered"
          gradient="from-indigo-500 to-purple-500"
        />
        <MetricCard
          title="Total Payments"
          value={stats.totalReqs.toString()}
          icon={FileText}
          description="Matching requests count"
          gradient="from-amber-500 to-orange-500"
        />
        {activeTab === 'pending' ? (
          <MetricCard
            title="Selected Amount"
            value={formatCurrency(stats.selectedAmt)}
            icon={CheckSquare}
            description={`${stats.selectedCount} of ${stats.totalReqs} selected`}
            gradient="from-blue-500 to-indigo-500"
          />
        ) : (
          <MetricCard
            title="Average Fuel Price"
            value={`₹${stats.avgRate.toFixed(2)}/L`}
            icon={IndianRupee}
            description="Avg rate per litre"
            gradient="from-blue-500 to-indigo-500"
          />
        )}
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/50">
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedIds([]);
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
              setSelectedDriver('');
              setSelectedVehicle('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedIds([]);
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
              setSelectedDriver('');
              setSelectedVehicle('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            History
          </button>
        </div>

        {/* Filters and Search Container */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Start Date */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full cursor-pointer"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full cursor-pointer"
              title="End Date"
            />
          </div>

          {/* Vehicle Dropdown */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer w-full"
            >
              <option value="">All Vehicles</option>
              {uniqueVehicles.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Driver Dropdown */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer w-full"
            >
              <option value="">All Drivers</option>
              {uniqueDrivers.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'pending'
                  ? "Search pending (req, vehicle, bill)..."
                  : "Search paid history (req, vehicle, bill)..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'pending' ? (
          <TableWrapper
            headers={[
              checkboxHeader,
              'Request No',
              'Slip No',
              'Vehicle',
              'Issued To',
              'Qty (L)',
              'Rate',
              'Total Amount',
              'Fuel Bill',
              'Filling Date',
              'KM Reading',
              'Bill Copy',
            ]}
            data={displayedRequests}
            loading={loading}
            emptyMessage="No pending fuel payments found"
            renderRow={(req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(req.id)}
                      onChange={(e) => handleSelectRow(req.id, e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </td>
                <td className="px-5 py-3 text-sm font-bold text-slate-900 font-mono">{req.requestNo}</td>
                <td className="px-5 py-3 text-sm font-bold text-slate-500 font-mono">{req.slipNo || '—'}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-700">{req.vehicleNo}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{req.issuedTo}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-800">{req.qty} L</td>
                <td className="px-5 py-3 text-xs text-slate-500 font-medium">₹{req.rate}</td>
                <td className="px-5 py-3 text-sm font-bold text-slate-900">{formatCurrency(req.totalAmount)}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                    {req.fuelBillNo}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 font-semibold">{formatDate(req.fillingDate)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleViewImage(req.readingImage, `KM Reading - ${req.currentKmReading} KM`)}
                    className={`p-1.5 rounded transition-colors ${
                      req.readingImage
                        ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="View KM Photo"
                    disabled={!req.readingImage}
                  >
                    <ImageIcon size={14} />
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleViewImage(req.billImage, `Fuel Bill - ${req.fuelBillNo}`)}
                    className={`p-1.5 rounded transition-colors ${
                      req.billImage
                        ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="View Bill Photo"
                    disabled={!req.billImage}
                  >
                    <ImageIcon size={14} />
                  </button>
                </td>
              </tr>
            )}
          />
        ) : (
          <TableWrapper
            headers={[
              'Request No',
              'Slip No',
              'Vehicle',
              'Issued To',
              'Qty (L)',
              'Rate',
              'Total Amount',
              'Fuel Bill',
              'Filling Date',
              'Paid Date',
              'KM Reading',
              'Bill Copy',
            ]}
            data={displayedRequests}
            loading={loading}
            emptyMessage="No payment history found"
            renderRow={(req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-sm font-bold text-slate-900 font-mono">{req.requestNo}</td>
                <td className="px-5 py-3 text-sm font-bold text-slate-500 font-mono">{req.slipNo || '—'}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-700">{req.vehicleNo}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{req.issuedTo}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-800">{req.qty} L</td>
                <td className="px-5 py-3 text-xs text-slate-500 font-medium">₹{req.rate}</td>
                <td className="px-5 py-3 text-sm font-bold text-slate-900">{formatCurrency(req.totalAmount)}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                    {req.fuelBillNo}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 font-semibold">{formatDate(req.fillingDate)}</td>
                <td className="px-5 py-3 text-xs text-emerald-600 font-bold">{formatDate(req.actual2)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleViewImage(req.readingImage, `KM Reading - ${req.currentKmReading} KM`)}
                    className={`p-1.5 rounded transition-colors ${
                      req.readingImage
                        ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="View KM Photo"
                    disabled={!req.readingImage}
                  >
                    <ImageIcon size={14} />
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleViewImage(req.billImage, `Fuel Bill - ${req.fuelBillNo}`)}
                    className={`p-1.5 rounded transition-colors ${
                      req.billImage
                        ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="View Bill Photo"
                    disabled={!req.billImage}
                  >
                    <ImageIcon size={14} />
                  </button>
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {/* Document Image Overlay Modal */}
      <ModalWrapper
        isOpen={!!previewImage}
        onClose={() => {
          setPreviewImage(null);
          setPreviewTitle('');
        }}
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
            onClick={() => {
              setPreviewImage(null);
              setPreviewTitle('');
            }}
            className="mt-4 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm w-full"
          >
            Close Document
          </button>
        </div>
      </ModalWrapper>
    </div>
  );
}
