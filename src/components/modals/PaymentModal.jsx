import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalWrapper from '../ModalWrapper';
import { salesService } from '../../services/sales.service';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export default function PaymentModal({ isOpen, onClose, sale }) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('online');
  const [proof, setProof] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sale) setAmount(sale.pendingAmount.toString());
  }, [sale]);

  if (!sale) return null;
  const currentSale = salesService.getSales().find(s => s.id === sale.id) || sale;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { toast.error('Enter a valid amount'); return; }
    if (parsed > currentSale.pendingAmount) { toast.error(`Cannot exceed pending balance of ${formatCurrency(currentSale.pendingAmount)}`); return; }
    if (!receivedAt) { toast.error('Select payment date'); return; }
    setSubmitting(true);
    try {
      salesService.addPayment(currentSale.id, { amount: parsed, mode, proof, remarks, receivedAt });
      toast.success('Payment recorded!');
      setProof(''); setRemarks('');
      window.dispatchEvent(new Event('refresh_sales'));
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error saving payment');
    } finally { setSubmitting(false); }
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Record Payment: ${currentSale.customerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info bar */}
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Invoice: {currentSale.invoiceNo}</span>
          <span className="text-rose-600">Pending: {formatCurrency(currentSale.pendingAmount)}</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Amount (₹)</label>
          <input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)} required max={currentSale.pendingAmount} min={0.01} className={`${inputCls} font-bold`} placeholder="Enter amount" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className={selectCls}>
              <option value="online">Online / UPI</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date Received</label>
            <input type="date" value={receivedAt} onChange={e => setReceivedAt(e.target.value)} required className={`${inputCls} cursor-pointer`} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Proof URL (Optional)</label>
          <input type="text" value={proof} onChange={e => setProof(e.target.value)} className={inputCls} placeholder="e.g. /dummy/receipt.jpg" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Remarks (Optional)</label>
          <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className={inputCls} placeholder="Transaction ID, cheque details..." />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 rounded-lg transition-colors">
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>

      {/* Payment History */}
      {currentSale.payments?.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Past Collections ({currentSale.payments.length})</h4>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {currentSale.payments.map((p, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                    <span className="text-[10px] font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{p.mode}</span>
                  </div>
                  {p.remarks && <p className="text-slate-400 mt-1">{p.remarks}</p>}
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <span>Received: {formatDate(p.receivedAt)}</span>
                  {p.proof && <a href={p.proof} target="_blank" rel="noopener noreferrer" className="block text-indigo-500 hover:underline mt-0.5 font-semibold">View Proof</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}
