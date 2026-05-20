import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalWrapper from '../ModalWrapper';
import { salesService } from '../../services/sales.service';
import formatDate from '../../utils/formatDate';

export default function FollowUpModal({ isOpen, onClose, sale }) {
  const [note, setNote] = useState('');
  const [nextCallingDate, setNextCallingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setNote(''); setNextCallingDate(''); }
  }, [isOpen]);

  if (!sale) return null;
  const currentSale = salesService.getSales().find(s => s.id === sale.id) || sale;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) { toast.error('Please enter a follow-up note'); return; }
    if (!nextCallingDate) { toast.error('Please select next calling date'); return; }
    setSubmitting(true);
    try {
      salesService.addFollowUp(currentSale.id, { note: note.trim(), nextCallingDate });
      toast.success('Follow-up logged successfully!');
      window.dispatchEvent(new Event('refresh_sales'));
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error saving follow-up');
    } finally { setSubmitting(false); }
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={`Follow-up: ${currentSale.customerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info */}
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Invoice: {currentSale.invoiceNo}</span>
          <span className="text-indigo-600">Follow-up #{(currentSale.followUps?.length || 0) + 1}</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Follow-up Note</label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} required placeholder="e.g. Customer asked for 1 week extension..." className={`${inputCls} resize-none`} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Next Calling Date</label>
          <input type="date" value={nextCallingDate} onChange={e => setNextCallingDate(e.target.value)} required className={`${inputCls} cursor-pointer`} />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 rounded-lg transition-colors">
            {submitting ? 'Saving...' : 'Log Follow-up'}
          </button>
        </div>
      </form>

      {/* History */}
      {currentSale.followUps?.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Past Follow-ups ({currentSale.followUps.length})</h4>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {[...currentSale.followUps].reverse().map((fu, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs">
                <p className="font-semibold text-slate-700">{fu.note}</p>
                <p className="text-slate-400 mt-1">Next call: <span className="font-semibold text-indigo-600">{formatDate(fu.nextCallingDate)}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}
