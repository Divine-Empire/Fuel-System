import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Search, Filter, RefreshCw } from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import { compareService } from '../../services/compare.service';
import formatCurrency from '../../utils/formatCurrency';

export default function Compare() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reconciling, setReconciling] = useState(false);

  const runReconciliation = () => {
    setReconciling(true);
    setTimeout(() => {
      setData(compareService.reconcile());
      setReconciling(false);
    }, 400);
  };

  useEffect(() => { runReconciliation(); }, []);

  const stats = {
    matched: data.filter(r => r.status === 'matched').length,
    unmatched: data.filter(r => r.status === 'unmatched').length,
    missingInTally: data.filter(r => r.status === 'missing_in_tally').length,
    missingInSales: data.filter(r => r.status === 'missing_in_sales').length,
  };

  const filteredData = data.filter(item => {
    const matchesSearch =
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || item.status === statusFilter);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'matched':          return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5 w-fit"><CheckCircle2 size={11} /> Matched</span>;
      case 'unmatched':        return <span className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1.5 w-fit"><XCircle size={11} /> Unmatched</span>;
      case 'missing_in_tally': return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1.5 w-fit"><AlertTriangle size={11} /> Missing Tally</span>;
      case 'missing_in_sales': return <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center gap-1.5 w-fit"><HelpCircle size={11} /> Missing Sales</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reconciliation Desk</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-verify Sales Ledger invoices with Tally accounting entries</p>
        </div>
        <button
          onClick={runReconciliation}
          disabled={reconciling}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors self-start shadow-sm disabled:opacity-70"
        >
          <RefreshCw size={13} className={reconciling ? 'animate-spin' : ''} />
          {reconciling ? 'Reconciling...' : 'Run Reconciler'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Perfect Matches', val: stats.matched, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Discrepancies', val: stats.unmatched, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          { label: 'Missing in Tally', val: stats.missingInTally, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Missing in Sales', val: stats.missingInSales, icon: HelpCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        ].map(({ label, val, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
              <h3 className={`text-2xl font-black mt-1 ${color}`}>{val}</h3>
            </div>
            <div className={`p-3 ${bg} ${color} rounded-xl border ${border}`}>
              <Icon size={19} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
            <option value="missing_in_tally">Missing in Tally</option>
            <option value="missing_in_sales">Missing in Sales</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <TableWrapper
          headers={['Invoice No', 'Customer', 'Sales Amount', 'Tally Amount', 'Variance', 'Status']}
          data={filteredData}
          emptyMessage="No reconciliation records match your filters"
          renderRow={(item, idx) => {
            const variance = item.salesAmount !== null && item.tallyAmount !== null ? item.salesAmount - item.tallyAmount : null;
            return (
              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-5 py-3">
                  <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{item.invoiceNo}</span>
                </td>
                <td className="px-5 py-3 font-bold text-slate-700 text-sm">{item.customerName}</td>
                <td className="px-5 py-3">
                  {item.salesAmount !== null
                    ? <span className="text-sm font-bold text-slate-800">{formatCurrency(item.salesAmount)}</span>
                    : <span className="text-xs text-rose-500 font-bold uppercase">Missing</span>}
                </td>
                <td className="px-5 py-3">
                  {item.tallyAmount !== null
                    ? <span className="text-sm font-bold text-slate-800">{formatCurrency(item.tallyAmount)}</span>
                    : <span className="text-xs text-rose-500 font-bold uppercase">Missing</span>}
                </td>
                <td className="px-5 py-3">
                  {variance !== null && variance !== 0
                    ? <span className={`text-sm font-black ${variance > 0 ? 'text-amber-600' : 'text-rose-600'}`}>{variance > 0 ? '+' : ''}{formatCurrency(variance)}</span>
                    : <span className="text-xs text-slate-300 font-bold">—</span>}
                </td>
                <td className="px-5 py-3">{getStatusBadge(item.status)}</td>
              </tr>
            );
          }}
        />
      </div>
    </div>
  );
}
