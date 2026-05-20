import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import TableWrapper from '../../components/TableWrapper';
import StatusTag from '../../components/StatusTag';
import { dashboardService } from '../../services/dashboard.service';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = {
  Received: '#10b981',
  Partial: '#f59e0b',
  Pending: '#f43f5e'
};

export default function Dashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    const filter = startDate && endDate ? { start: startDate, end: endDate } : null;
    const res = dashboardService.getDashboardData(filter);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { metrics, revenueTrend, statusData, recentFollowUps, pendingPayments } = data || {};

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time collections and receivables analytics</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <Calendar size={15} className="text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-transparent border-0 focus:ring-0 p-1 cursor-pointer focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-transparent border-0 focus:ring-0 p-1 cursor-pointer focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={handleReset}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title="Reset Filters"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Revenue" value={formatCurrency(metrics?.totalRevenue)} icon={TrendingUp} gradient="from-indigo-500 to-indigo-600" description="Gross invoiced amount" />
        <MetricCard title="Received" value={formatCurrency(metrics?.receivedAmount)} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" description={`${metrics?.totalRevenue ? Math.round((metrics.receivedAmount / metrics.totalRevenue) * 100) : 0}% collected`} />
        <MetricCard title="Pending" value={formatCurrency(metrics?.pendingAmount)} icon={IndianRupee} gradient="from-amber-500 to-amber-600" description="Active balances" />
        <MetricCard title="Overdue" value={formatCurrency(metrics?.overdueAmount)} icon={AlertCircle} gradient="from-rose-500 to-rose-600" description="Unpaid >10 days" />
        <MetricCard title="Customers" value={metrics?.customersCount} icon={Users} gradient="from-sky-500 to-sky-600" description="Unique buyers" />
        <MetricCard title="Invoices" value={metrics?.invoicesCount} icon={FileText} gradient="from-violet-500 to-violet-600" description="Total bills" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Revenue & Collection Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatDate} stroke="#cbd5e1" fontSize={10} tickLine={false} />
                <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  labelFormatter={formatDate}
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Total Invoiced" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="received" name="Collected" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Invoice Status Share</h3>
          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Invoices`, '']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-800">{metrics?.invoicesCount}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total Bills</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            {statusData?.map((entry) => (
              <div key={entry.name} className="flex flex-col items-center">
                <span className="text-sm font-bold text-slate-800">{entry.value}</span>
                <span className="text-[10px] font-semibold flex items-center gap-1 mt-0.5 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
        {/* Recent Follow-ups */}
        <div className="flex flex-col min-h-0">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <PhoneCall size={16} className="text-indigo-500" />
            Recent Customer Follow-ups
          </h3>
          <TableWrapper
            headers={['Customer', 'Invoice No', 'Note', 'Call Date']}
            data={recentFollowUps}
            emptyMessage="No recent follow-ups logged"
            renderRow={(fu, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-sm font-bold text-slate-700">{fu.customerName}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{fu.invoiceNo}</span>
                </td>
                <td className="px-5 py-3">
                  <p className="text-xs text-slate-500 line-clamp-2 max-w-xs">{fu.note}</p>
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-slate-600">{formatDate(fu.nextCallingDate)}</td>
              </tr>
            )}
          />
        </div>

        {/* Top Pending */}
        <div className="flex flex-col min-h-0">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <IndianRupee size={16} className="text-amber-500" />
            Top Pending Invoices
          </h3>
          <TableWrapper
            headers={['Customer', 'Invoice No', 'Status', 'Pending']}
            data={pendingPayments}
            emptyMessage="No pending invoices"
            renderRow={(sale, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-sm font-bold text-slate-700">{sale.customerName}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{sale.invoiceNo}</span>
                </td>
                <td className="px-5 py-3"><StatusTag status={sale.status} /></td>
                <td className="px-5 py-3 text-sm font-bold text-slate-800">{formatCurrency(sale.pendingAmount)}</td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
}
