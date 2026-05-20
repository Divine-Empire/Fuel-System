import React, { useState, useEffect } from 'react';
import { Megaphone, Play, Pause, Send, Plus, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import TableWrapper from '../../components/TableWrapper';
import StatusTag from '../../components/StatusTag';
import MetricCard from '../../components/MetricCard';
import ModalWrapper from '../../components/ModalWrapper';
import { campaignService } from '../../services/campaign.service';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Pending Payments');
  const [audienceCount, setAudienceCount] = useState('10');
  const [template, setTemplate] = useState('Dear Customer, your payment is pending. Please clear it soon.');
  const [submitting, setSubmitting] = useState(false);

  const load = () => setCampaigns(campaignService.getCampaigns());
  useEffect(() => { load(); }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter a campaign name'); return; }
    setSubmitting(true);
    try {
      campaignService.createCampaign({ name, type, audienceCount });
      toast.success('Campaign created as draft!');
      setName(''); setIsModalOpen(false); load();
    } catch { toast.error('Failed to create campaign'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = (id, status) => {
    try { campaignService.updateCampaignStatus(id, status); toast.success(`Updated to ${status}`); load(); }
    catch { toast.error('Failed to update'); }
  };

  const handleSendNow = (id) => {
    const all = campaignService.getCampaigns();
    const updated = all.map(c => c.id === id ? { ...c, status: 'sent', sentCount: c.audienceCount, pendingCount: 0, lastSent: new Date().toLocaleString() } : c);
    campaignService.saveCampaigns(updated);
    toast.success('Campaign dispatched!'); load();
  };

  const totalAudience = campaigns.reduce((a, c) => a + c.audienceCount, 0);
  const totalSent = campaigns.reduce((a, c) => a + c.sentCount, 0);
  const dispatchRate = totalAudience > 0 ? Math.round((totalSent / totalAudience) * 100) : 0;

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campaign Panel</h1>
          <p className="text-sm text-slate-500 mt-1">Configure automated notifications, reminders, and payment requests</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors self-start shadow-sm">
          <Plus size={13} /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Campaigns" value={campaigns.length} icon={Megaphone} gradient="from-indigo-500 to-indigo-600" description="All templates" />
        <MetricCard title="Active Campaigns" value={campaigns.filter(c => c.status === 'active').length} icon={TrendingUp} gradient="from-emerald-500 to-emerald-600" description="Running jobs" />
        <MetricCard title="Total Reach" value={totalAudience} icon={Users} gradient="from-amber-500 to-amber-600" description="Targeted customers" />
        <MetricCard title="Dispatch Rate" value={`${dispatchRate}%`} icon={Send} gradient="from-sky-500 to-sky-600" description={`${totalSent} of ${totalAudience} sent`} />
      </div>

      <div className="flex-1 min-h-0">
        <TableWrapper
          headers={['Campaign Name', 'Type', 'Audience', 'Dispatched', 'Remaining', 'Last Sent', 'Status', 'Actions']}
          data={campaigns}
          emptyMessage="No campaigns yet. Click 'New Campaign' to start."
          renderRow={(camp) => (
            <tr key={camp.id} className="hover:bg-indigo-50/30 transition-colors">
              <td className="px-5 py-3 font-bold text-slate-800 text-sm">{camp.name}</td>
              <td className="px-5 py-3"><span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{camp.type}</span></td>
              <td className="px-5 py-3 font-bold text-slate-700">{camp.audienceCount}</td>
              <td className="px-5 py-3 font-bold text-emerald-600">{camp.sentCount}</td>
              <td className="px-5 py-3 font-semibold text-slate-500">{camp.pendingCount}</td>
              <td className="px-5 py-3 text-xs text-slate-400">{camp.lastSent}</td>
              <td className="px-5 py-3"><StatusTag status={camp.status} /></td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-1.5">
                  {(camp.status === 'paused' || camp.status === 'draft') && (
                    <button onClick={() => handleStatusChange(camp.id, 'active')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Activate"><Play size={13} fill="currentColor" /></button>
                  )}
                  {camp.status === 'active' && (
                    <button onClick={() => handleStatusChange(camp.id, 'paused')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Pause"><Pause size={13} fill="currentColor" /></button>
                  )}
                  {camp.status !== 'sent' && (
                    <button onClick={() => handleSendNow(camp.id)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Send Now"><Send size={13} /></button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      <ModalWrapper isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Campaign Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. End of Month Reminder" className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer">
                <option value="Pending Payments">Pending Payments</option>
                <option value="Overdue Payments">Overdue Payments</option>
                <option value="Follow-up Reminder">Follow-up Reminder</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Audience Size</label>
              <input type="number" value={audienceCount} onChange={e => setAudienceCount(e.target.value)} min={1} className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message Template</label>
            <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={3} className="block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 rounded-lg transition-colors">{submitting ? 'Creating...' : 'Create Campaign'}</button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
