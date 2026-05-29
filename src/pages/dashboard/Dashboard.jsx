import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  FileText,
  CheckCircle2,
  RefreshCw,
  Car,
  Fuel,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import TableWrapper from '../../components/TableWrapper';
import StatusTag from '../../components/StatusTag';
import SlipPreviewModal from '../../components/modals/SlipPreviewModal';
import EmployeeRequestModal from '../employee-vehicle-logs/request-form';
import OfficeRequestModal from '../office-vehicle-logs/request-form';
import { dashboardService } from '../../services/dashboard.service';
import { vehicleService } from '../../services/vehicle.service';
import { employeeService } from '../../services/employee.service';
import { officeService } from '../../services/office.service';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const parseDateToISO = (dateStr) => {
  if (!dateStr) return '';
  const cleanStr = dateStr.toString().trim();
  if (!cleanStr) return '';

  const matchIso = cleanStr.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2].padStart(2, '0')}-${matchIso[3].padStart(2, '0')}`;
  }

  const matchDmy = cleanStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (matchDmy) {
    return `${matchDmy[3]}-${matchDmy[2].padStart(2, '0')}-${matchDmy[1].padStart(2, '0')}`;
  }

  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return cleanStr;
};

const formatLocationText = (loc, customLoc) => {
  if (!loc) return '—';
  if (loc === 'Others') return customLoc || 'Others';
  if (loc === 'Office' || loc === 'Employee Travel') return loc;
  if (/^\d+$/.test(loc)) return `Location ${loc}`;
  return loc;
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterVehicles, setMasterVehicles] = useState([]);
  const [expandedVehicles, setExpandedVehicles] = useState({});
  const [selectedSlipRequest, setSelectedSlipRequest] = useState(null);
  const [selectedEditRecord, setSelectedEditRecord] = useState(null);
  
  // Modal states
  const [isEmployeeRequestModalOpen, setIsEmployeeRequestModalOpen] = useState(false);
  const [isOfficeRequestModalOpen, setIsOfficeRequestModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [empLogs, officeLogs, vehiclesList] = await Promise.all([
        employeeService.getEmployeeRequestsFromSheet(),
        officeService.getOfficeRequestsFromSheet(),
        vehicleService.getVehiclesFromSheet()
      ]);

      setMasterVehicles(vehiclesList);

      const getFuelType = (vNo) => {
        const matched = vehiclesList.find(
          (v) => v.vehicleNo.toLowerCase() === vNo.toLowerCase()
        );
        return matched?.fuelType || 'Diesel';
      };

      // Unified mapping
      const mappedEmp = empLogs.map(req => {
        const isoDate = parseDateToISO(req.dateOfVisit || req.timestamp);
        return {
          id: req.id || `emp_${req.rowIndex || Date.now()}`,
          logType: 'employee',
          requestNo: req.requestNo,
          requestDate: isoDate,
          fillingDate: isoDate,
          vehicleNo: 'Personal',
          issuedTo: req.employeeName,
          lastKmReading: req.kmReadingStart,
          currentKmReading: req.kmReadingEnd,
          qty: req.distanceCovered, // Distance in KM
          rate: req.rate,
          totalAmount: req.actualPaid || req.calculatedPrice,
          location: req.siteLocation || 'Employee Travel',
          customLocation: req.siteLocation || '',
          slipNo: req.requestNo,
          slipImage: req.proofEnd || req.proofStart || '',
          slipCopy: req.proofEnd || req.proofStart || '',
          status: req.actual2 !== '' ? 'completed' : 'pending',
          fuelType: 'Personal',
          rowIndex: req.rowIndex,
          proofStart: req.proofStart,
          proofEnd: req.proofEnd
        };
      });

      const mappedOffice = officeLogs.map(req => {
        const isoDate = parseDateToISO(req.dateOfFilling || req.timestamp);
        return {
          id: `office_${req.rowIndex || Date.now()}_${req.requestNo}`,
          logType: 'office',
          requestNo: req.requestNo,
          requestDate: parseDateToISO(req.timestamp),
          fillingDate: isoDate,
          vehicleNo: req.vehicleNo,
          issuedTo: req.requestedBy,
          lastKmReading: req.lastKmReading,
          currentKmReading: req.currentKmReading,
          qty: req.qty, // Litres
          rate: req.rate,
          totalAmount: req.calculatedPrice,
          location: 'Office',
          customLocation: 'Office',
          slipNo: req.requestNo,
          slipImage: req.fuelBillPhoto || '',
          slipCopy: req.fuelBillPhoto || '',
          status: req.actualDriver !== '' ? 'completed' : 'pending',
          plannedDriver: req.plannedDriver,
          actualDriver: req.actualDriver,
          fuelType: getFuelType(req.vehicleNo),
          rowIndex: req.rowIndex,
          mileage: req.mileage
        };
      });

      setAllRequests([...mappedEmp, ...mappedOffice]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const data = useMemo(() => {
    const filter = startDate && endDate ? { start: startDate, end: endDate } : null;
    return dashboardService.getDashboardData(allRequests, filter, user);
  }, [allRequests, startDate, endDate, user]);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedLocation('');
    setSelectedVehicle('');
    setSelectedDriver('');
  };

  const toggleVehicle = (vehicleNo) => {
    setExpandedVehicles((prev) => ({
      ...prev,
      [vehicleNo]: !prev[vehicleNo],
    }));
  };

  const { requests = [], filterOptions = {} } = data || {};

  // Check if any admin filter is active
  const isFilterActive = useMemo(() => {
    return !!(selectedLocation || selectedVehicle || selectedDriver);
  }, [selectedLocation, selectedVehicle, selectedDriver]);

  // Grouped vehicle table data calculations (completed fillings only)
  const groupedData = useMemo(() => {
    if (user?.role !== 'ADMIN') return [];

    const groups = {};

    requests.forEach((req) => {
      const vNo = req.vehicleNo;
      if (!vNo) return;

      if (!groups[vNo]) {
        groups[vNo] = {
          vehicleNo: vNo,
          expectedAvg: 0,
          totalDistance: 0,
          totalQty: 0,
          totalExpense: 0,
          fillingsCount: 0,
          records: [],
        };
      }

      groups[vNo].records.push(req);

      if (recIsCompleted(req)) {
        groups[vNo].fillingsCount += 1;
        if (vNo !== 'Personal') {
          groups[vNo].totalQty += req.qty || 0;
          groups[vNo].totalExpense += req.totalAmount || 0;

          const currentKm = parseFloat(req.currentKmReading);
          const lastKm = parseFloat(req.lastKmReading);
          if (!isNaN(currentKm) && !isNaN(lastKm) && currentKm > lastKm) {
            groups[vNo].totalDistance += (currentKm - lastKm);
          }
        } else {
          groups[vNo].totalDistance += req.qty || 0; // mapped from distanceCovered
          groups[vNo].totalExpense += req.totalAmount || 0; // actualPaid
        }
      }
    });

    return Object.values(groups).map((g) => {
      let expectedAvg = 0;
      if (g.vehicleNo !== 'Personal') {
        const masterVehicle = masterVehicles.find(
          (v) => v.vehicleNo.toLowerCase() === g.vehicleNo.toLowerCase()
        );
        if (masterVehicle && masterVehicle.mileage && masterVehicle.mileage !== '—' && masterVehicle.mileage !== 'NA') {
          expectedAvg = parseFloat(masterVehicle.mileage);
        }
      }

      const actualAvg = g.vehicleNo !== 'Personal' && g.totalQty > 0 ? g.totalDistance / g.totalQty : 0;
      const mileageDiff = g.vehicleNo !== 'Personal' && (actualAvg > 0 && expectedAvg > 0) ? (actualAvg - expectedAvg) : 0;

      return {
        ...g,
        expectedAvg,
        actualAvg: g.vehicleNo === 'Personal' ? 0 : parseFloat(actualAvg.toFixed(2)),
        mileageDiff: g.vehicleNo === 'Personal' ? 0 : parseFloat(mileageDiff.toFixed(2)),
      };
    });
  }, [requests, user, masterVehicles]);

  // Apply filters locally for detailed records list
  const filteredRequests = useMemo(() => {
    if (user?.role !== 'ADMIN') return [];

    return requests.filter((req) => {
      // Filter by Location
      if (selectedLocation) {
        const locStr = req.location === 'Others' ? (req.customLocation || 'Others') : `Location ${req.location}`;
        if (locStr !== selectedLocation) return false;
      }
      // Filter by Vehicle
      if (selectedVehicle && req.vehicleNo !== selectedVehicle) return false;
      // Filter by Driver
      if (selectedDriver && req.issuedTo !== selectedDriver) return false;

      return true;
    });
  }, [requests, selectedLocation, selectedVehicle, selectedDriver, user]);

  const activeMetrics = useMemo(() => {
    const list = user?.role === 'ADMIN' ? filteredRequests : requests;

    const totalRequests = list.length;
    let pendingFilling = 0;
    let completedFilling = 0;
    let totalFuelExpense = 0;
    let totalLitresFilled = 0;
    const uniqueVehicles = new Set();

    list.forEach((req) => {
      if (req.vehicleNo && req.vehicleNo !== 'Personal') {
        uniqueVehicles.add(req.vehicleNo);
      }
      if (req.status === 'pending') {
        pendingFilling++;
      } else if (req.status === 'completed') {
        completedFilling++;
        totalFuelExpense += req.totalAmount || 0;
        if (req.logType !== 'employee' && req.vehicleNo !== 'Personal') {
          totalLitresFilled += req.qty || 0;
        }
      }
    });

    return {
      totalRequests,
      pendingFilling,
      completedFilling,
      totalFuelExpense,
      totalLitresFilled,
      vehiclesCount: uniqueVehicles.size,
    };
  }, [requests, filteredRequests, user]);

  function recIsCompleted(req) {
    return req.status === 'completed';
  }

  // Calculate detailed record statistics for filtered log table
  const getSingleRecordMetrics = (req) => {
    if (req.vehicleNo === 'Personal') {
      return {
        expected: '—',
        actual: '—',
        diff: '—',
        isBetter: false,
        isWorse: false
      };
    }

    const masterVehicle = masterVehicles.find(
      (v) => v.vehicleNo.toLowerCase() === req.vehicleNo.toLowerCase()
    );
    const expected = masterVehicle && masterVehicle.mileage && masterVehicle.mileage !== '—' && masterVehicle.mileage !== 'NA'
      ? parseFloat(masterVehicle.mileage) 
      : 0;

    const actual = parseFloat(req.mileage) || 0;
    const diff = expected > 0 && actual > 0 ? actual - expected : 0;
    
    let diffText = '—';
    let isBetter = false;
    let isWorse = false;

    if (actual > 0 && expected > 0) {
      if (diff > 0) {
        diffText = `+${diff.toFixed(2)} KM/L`;
        isBetter = true;
      } else if (diff < 0) {
        diffText = `${diff.toFixed(2)} KM/L`;
        isWorse = true;
      } else {
        diffText = '0.00 KM/L';
      }
    }

    return {
      expected: expected ? `${expected.toFixed(1)} KM/L` : '—',
      actual: actual ? `${actual.toFixed(2)} KM/L` : '—',
      diff: diffText,
      isBetter,
      isWorse
    };
  };

  const getFuelType = (vehicleNo) => {
    if (vehicleNo === 'Personal') return 'Personal';
    const matched = masterVehicles.find(
      (v) => v.vehicleNo.toLowerCase() === vehicleNo.toLowerCase()
    );
    return matched?.fuelType || 'Diesel';
  };

  if (loading && allRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 pt-2">

      {/* Filters Section (Admin Only) */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className='text-sm font-bold text-slate-700'>Filter By</h3>
            {(startDate || endDate || selectedLocation || selectedVehicle || selectedDriver) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-bold transition-colors"
              >
                <RefreshCw size={12} />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Start Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Location Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="">All Locations</option>
                {filterOptions?.locations?.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="">All Vehicles</option>
                {filterOptions?.vehicles?.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Driver / Employee Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Driver / Employee</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="">All Drivers / Employees</option>
                {filterOptions?.drivers?.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid (All Users) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 font-sans">
        <MetricCard
          title="Total Requests"
          value={activeMetrics?.totalRequests || 0}
          icon={FileText}
          gradient="from-indigo-500 to-indigo-600"
          description="Total logs generated"
        />
        <MetricCard
          title="Pending Logs"
          value={activeMetrics?.pendingFilling || 0}
          icon={Clock}
          gradient="from-amber-500 to-amber-600"
          description="Awaiting filling/payment"
        />
        <MetricCard
          title="Completed Logs"
          value={activeMetrics?.completedFilling || 0}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-emerald-600"
          description="Processed logs history"
        />
        <MetricCard
          title="Total Expense"
          value={formatCurrency(activeMetrics?.totalFuelExpense || 0)}
          icon={IndianRupee}
          gradient="from-rose-500 to-rose-600"
          description="Cost of finished logs"
        />
        <MetricCard
          title="Total Litres Filled"
          value={`${(activeMetrics?.totalLitresFilled || 0).toLocaleString()} L`}
          icon={Fuel}
          gradient="from-sky-500 to-sky-600"
          description="Volume of fuel loaded"
        />
        <MetricCard
          title="Vehicles Count"
          value={activeMetrics?.vehiclesCount || 0}
          icon={Car}
          gradient="from-violet-500 to-violet-600"
          description="Unique active vehicles"
        />
      </div>

      {/* Main Table Content - Admin Collapsible Row / Filtered Logs View */}
      {user?.role === 'ADMIN' ? (
        !isFilterActive ? (
          /* Unfiltered View: Accordion style grouped by Vehicle */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-800 font-sans">Vehicle Grouped Summaries</h3>
              <p className="text-xs text-slate-400 mt-0.5">Click on any vehicle row to view individual record logs downwards</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase bg-slate-50/70">
                    <th className="px-5 py-3.5">Vehicle Number</th>
                    <th className="px-5 py-3.5">Expected Avg.</th>
                    <th className="px-5 py-3.5">Actual Avg.</th>
                    <th className="px-5 py-3.5">No. of Logs</th>
                    <th className="px-5 py-3.5">Total Qty / Distance</th>
                    <th className="px-5 py-3.5">Total Expense</th>
                    <th className="px-5 py-3.5">Mileage Diff</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">
                        No vehicle summaries log found.
                      </td>
                    </tr>
                  ) : (
                    groupedData.map((vehicle) => {
                      const isExpanded = !!expandedVehicles[vehicle.vehicleNo];
                      return (
                        <Fragment key={vehicle.vehicleNo}>
                          {/* Parent Group Row */}
                          <tr
                            onClick={() => toggleVehicle(vehicle.vehicleNo)}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            <td className="px-5 py-4 text-sm font-extrabold text-indigo-600 font-mono tracking-wider">
                              {vehicle.vehicleNo}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-500">
                              {vehicle.vehicleNo === 'Personal' ? '—' : (vehicle.expectedAvg ? `${vehicle.expectedAvg.toFixed(1)} KM/L` : '—')}
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-emerald-600">
                              {vehicle.vehicleNo === 'Personal' ? '—' : (vehicle.actualAvg ? `${vehicle.actualAvg} KM/L` : '—')}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-slate-700">
                              {vehicle.fillingsCount}
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              {vehicle.vehicleNo === 'Personal' ? `${vehicle.totalDistance.toLocaleString()} KM` : `${vehicle.totalQty.toLocaleString()} L`}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                              {formatCurrency(vehicle.totalExpense)}
                            </td>
                            <td
                              className={`px-5 py-4 text-sm font-bold ${
                                vehicle.vehicleNo === 'Personal'
                                  ? 'text-slate-500'
                                  : vehicle.mileageDiff > 0
                                  ? 'text-emerald-600'
                                  : vehicle.mileageDiff < 0
                                  ? 'text-rose-500'
                                  : 'text-slate-500'
                              }`}
                            >
                              {vehicle.vehicleNo === 'Personal'
                                ? '—'
                                : (vehicle.mileageDiff !== 0
                                  ? `${vehicle.mileageDiff > 0 ? '+' : ''}${vehicle.mileageDiff.toFixed(2)} KM/L`
                                  : '0.00 KM/L')}
                            </td>
                            <td className="px-5 py-4 text-slate-400">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </td>
                          </tr>

                          {/* Nested Accordion Details */}
                          {isExpanded && (
                            <tr className="bg-slate-50/40">
                              <td colSpan={8} className="p-0 border-t border-slate-100">
                                <div className="px-6 py-4 bg-slate-50/50">
                                  <div className="border border-slate-200 rounded-xl bg-white shadow-inner overflow-hidden">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                                          <th className="px-4 py-2.5 font-mono">Req/Slip No</th>
                                          <th className="px-4 py-2.5">Date</th>
                                          <th className="px-4 py-2.5">Driver / Employee</th>
                                          <th className="px-4 py-2.5">Location</th>
                                          <th className="px-4 py-2.5">{vehicle.vehicleNo === 'Personal' ? 'Distance (KM)' : 'Qty (L)'}</th>
                                          <th className="px-4 py-2.5">Expense</th>
                                          <th className="px-4 py-2.5 text-right">KM Readings</th>
                                          <th className="px-4 py-2.5">Bill / Proof</th>
                                          <th className="px-4 py-2.5">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-slate-600">
                                        {vehicle.records.map((rec) => {
                                          const locText = formatLocationText(rec.location, rec.customLocation);
                                          return (
                                            <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                              <td className="px-4 py-2 font-bold font-mono text-slate-800">
                                                {rec.slipNo || rec.requestNo}
                                              </td>
                                              <td className="px-4 py-2">
                                                {formatDate(rec.fillingDate || rec.requestDate)}
                                              </td>
                                              <td className="px-4 py-2 font-semibold text-slate-700">
                                                {rec.issuedTo}
                                              </td>
                                              <td className="px-4 py-2">{locText}</td>
                                              <td className="px-4 py-2">
                                                {rec.qty ? `${rec.qty} ${vehicle.vehicleNo === 'Personal' ? 'KM' : 'L'}` : '—'}
                                              </td>
                                              <td className="px-4 py-2">
                                                {rec.totalAmount ? formatCurrency(rec.totalAmount) : '—'}
                                              </td>
                                              <td className="px-4 py-2 text-right">
                                                <div className="text-[10px] text-slate-400">
                                                  {vehicle.vehicleNo === 'Personal' ? 'Start' : 'Last'}: {rec.lastKmReading} KM
                                                </div>
                                                <div className="text-[10px] font-bold text-indigo-500">
                                                  {vehicle.vehicleNo === 'Personal' ? 'End' : 'Fill'}: {rec.currentKmReading || '—'} KM
                                                </div>
                                              </td>
                                              <td className="px-4 py-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSlipRequest(rec);
                                                  }}
                                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
                                                >
                                                  View
                                                </button>
                                              </td>
                                              <td className="px-4 py-2">
                                                <StatusTag status={rec.status} />
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Filtered View: Detailed Flat Records Log */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-800 font-sans">Filtered Records Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-400 uppercase bg-slate-50/70">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 font-mono">Vehicle</th>
                    <th className="px-4 py-3">Driver / Employee</th>
                    <th className="px-4 py-3 font-mono">Slip / Request No</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Qty / Dist</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Bill / Proof</th>
                    <th className="px-4 py-3">Expected Avg</th>
                    <th className="px-4 py-3">Last KM Reading</th>
                    <th className="px-4 py-3">Mileage / Travel Diff</th>
                    <th className="px-4 py-3">Fuel Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                        No requests match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const locText = formatLocationText(req.location, req.customLocation);
                      const recStats = getSingleRecordMetrics(req);
                      return (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">{formatDate(req.fillingDate || req.requestDate)}</td>
                          <td className="px-4 py-3 font-medium">{locText}</td>
                          <td className="px-4 py-3 font-bold text-indigo-600 font-mono tracking-wider">{req.vehicleNo}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{req.issuedTo}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-500">{req.slipNo || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {req.totalAmount ? formatCurrency(req.totalAmount) : '—'}
                          </td>
                          <td className="px-4 py-3">{req.qty ? `${req.qty} ${req.vehicleNo === 'Personal' ? 'KM' : 'L'}` : '—'}</td>
                          <td className="px-4 py-3">
                            {req.rate ? `${formatCurrency(req.rate)}/${req.vehicleNo === 'Personal' ? 'KM' : 'L'}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedSlipRequest(req)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                            >
                              <Eye size={12} />
                              View
                            </button>
                          </td>
                          <td className="px-4 py-3">{recStats.expected}</td>
                          <td className="px-4 py-3 font-mono">{req.lastKmReading} KM</td>
                          <td className={`px-4 py-3 font-bold ${
                            recStats.isBetter ? 'text-emerald-600' : recStats.isWorse ? 'text-rose-500' : 'text-slate-500'
                          }`}>
                            {recStats.diff}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                              {getFuelType(req.vehicleNo)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Standard User View: Shows My Requests Table */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
          <div className="px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 font-sans">My Request History</h3>
            <button
              onClick={() => setIsChoiceModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm whitespace-nowrap"
              id="request-fuel-btn"
            >
              <Plus size={15} />
              New Request
            </button>
          </div>
          <div className="flex-1 overflow-x-auto min-h-0">
            <TableWrapper
              headers={['Request No', 'Slip No', 'Vehicle No', 'Odometer Reading', 'Mileage', 'Location', 'Status', 'Actions']}
              data={requests}
              emptyMessage="No travel or fuel requests logged"
              renderRow={(req) => {
                const locationText = formatLocationText(req.location, req.customLocation);
                const isEmployeeProcessable = req.logType === 'employee' && !req.proofEnd;
                const isOfficeProcessable = req.logType === 'office' && req.status === 'pending' && req.plannedDriver;
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 font-mono">{req.requestNo}</td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-500 font-mono">{req.slipNo || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-700">{req.vehicleNo}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 font-mono">
                      {req.vehicleNo === 'Personal' 
                        ? `${req.lastKmReading} KM${req.currentKmReading ? ` - ${req.currentKmReading} KM` : ''}`
                        : `${req.lastKmReading} KM`
                      }
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 font-mono">
                      {req.vehicleNo === 'Personal' ? '—' : (req.mileage ? `${req.mileage} KM/L` : '—')}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{locationText}</td>
                    <td className="px-5 py-3">
                      <StatusTag status={req.status} />
                    </td>
                    <td className="px-5 py-3">
                      {isEmployeeProcessable ? (
                        <button
                          onClick={() => {
                            const orig = allRequests.find(r => r.id === req.id);
                            setSelectedEditRecord(orig || req);
                            setIsEmployeeRequestModalOpen(true);
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition shadow-sm"
                        >
                          Process
                        </button>
                      ) : isOfficeProcessable ? (
                        <button
                          onClick={() => {
                            navigate('/office-logs/actual-filling');
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm"
                        >
                          Process
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* Slip Preview Modal */}
      {selectedSlipRequest && (
        <SlipPreviewModal
          isOpen={!!selectedSlipRequest}
          onClose={() => setSelectedSlipRequest(null)}
          request={selectedSlipRequest}
        />
      )}

      {/* Choice Modal for New Request (Standard Users) */}
      {isChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 border border-slate-100 transform scale-100 transition-all duration-300">
            <h3 className="text-base font-bold text-slate-800 mb-2 font-sans text-center">Select Request Type</h3>
            <p className="text-xs text-slate-400 text-center mb-6">Choose whether you want to submit a Personal Travel log or an Office Vehicle filling log.</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsEmployeeRequestModalOpen(true);
                }}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition group"
              >
                <div className="h-10 w-10 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition">
                  <Car className="text-indigo-600 h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition">Personal Travel</span>
                <span className="text-[10px] text-slate-400 text-center mt-1">Reimburse KM logs</span>
              </button>
              <button
                onClick={() => {
                  setIsChoiceModalOpen(false);
                  setIsOfficeRequestModalOpen(true);
                }}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl transition group"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition">
                  <Fuel className="text-emerald-600 h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition">Office Vehicle</span>
                <span className="text-[10px] text-slate-400 text-center mt-1">Request advance/filling</span>
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsChoiceModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-bold px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmployeeRequestModalOpen && (
        <EmployeeRequestModal
          isOpen={isEmployeeRequestModalOpen}
          onClose={() => {
            setIsEmployeeRequestModalOpen(false);
            setSelectedEditRecord(null);
          }}
          onRefresh={fetchDashboardData}
          editRecord={selectedEditRecord}
        />
      )}

      {isOfficeRequestModalOpen && (
        <OfficeRequestModal
          isOpen={isOfficeRequestModalOpen}
          onClose={() => setIsOfficeRequestModalOpen(false)}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
}
