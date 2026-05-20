import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  PlusCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone
} from 'lucide-react';
import TableWrapper from '../../components/TableWrapper';
import StatusTag from '../../components/StatusTag';
import { salesService } from '../../services/sales.service';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import ReceivableFormModal from '../../components/modals/ReceivableFormModal';

export default function Receivables({ onOpenFollowUp, onOpenPayment }) {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('invoiceDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const itemsPerPage = 8;

  const loadSales = () => {
    const data = salesService.getSales();
    setSales(data);
  };

  useEffect(() => {
    loadSales();
    const handleRefresh = () => loadSales();
    window.addEventListener('refresh_sales', handleRefresh);
    return () => window.removeEventListener('refresh_sales', handleRefresh);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const filteredSales = sales
    .filter((sale) => {
      const matchSearch =
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.phone.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || sale.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'invoiceDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Receivables Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Manage invoice balances, payment records, and client follow-ups</p>
        </div>
        
        <button 
          onClick={() => setIsFormModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors self-start shadow-sm"
        >
          <PlusCircle size={15} /> Add Entry
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, invoice, phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="block w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-4">
        <TableWrapper
          headers={['Invoice Details', 'Customer', 'Total', 'Collected', 'Balance Due', 'Status', 'Actions']}
          data={paginatedSales}
          emptyMessage="No receivables found. Start by adding your first follow-up or payment entry."
          renderRow={(sale) => (
            <tr key={sale.id} className="hover:bg-indigo-50/30 transition-colors">
              <td className="px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 self-start">{sale.invoiceNo}</span>
                  <span className="text-xs text-slate-400 mt-1">{formatDate(sale.invoiceDate)}</span>
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{sale.customerName}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone size={10} />{sale.phone}
                  </span>
                </div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <span className="text-sm font-bold text-slate-800">{formatCurrency(sale.totalAmount)}</span>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(sale.receivedAmount)}</span>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <span className={`text-sm font-bold ${sale.pendingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {formatCurrency(sale.pendingAmount)}
                </span>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <StatusTag status={sale.status} />
              </td>
              <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenFollowUp && onOpenFollowUp(sale)}
                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Log Follow-up"
                  >
                    <MessageSquare size={15} />
                  </button>
                  {sale.pendingAmount > 0 && (
                    <button
                      onClick={() => onOpenPayment && onOpenPayment(sale)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Add Payment"
                    >
                      <PlusCircle size={15} />
                    </button>
                  )}
                  {sale.billCopy && (
                    <a
                      href={sale.billCopy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Invoice"
                    >
                      <FileText size={15} />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          )}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-bold text-slate-700 px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ReceivableFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
      />
    </div>
  );
}
