import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus, Users, Wallet, Target, UserPlus, Save, X } from 'lucide-react';
import { getSettings, saveSettings, getUsers, saveUsers } from '../utils/storageManager';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('groupHeads');
  const [settings, setSettings] = useState(getSettings());
  const [users, setUsers] = useState(getUsers());
  const [newGroupHead, setNewGroupHead] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ id: '', name: '', password: '', role: 'USER' });

  const handleAddGroupHead = () => {
    if (!newGroupHead.trim()) { toast.error('Enter group head name'); return; }
    const updated = { ...settings, groupHeads: [...settings.groupHeads, newGroupHead.trim()] };
    setSettings(updated); saveSettings(updated); setNewGroupHead('');
    toast.success('Group head added!');
  };

  const handleDeleteGroupHead = (i) => {
    const updated = { ...settings, groupHeads: settings.groupHeads.filter((_, idx) => idx !== i) };
    setSettings(updated); saveSettings(updated); toast.success('Deleted!');
  };

  const handleAddPaymentMode = () => {
    if (!newPaymentMode.trim()) { toast.error('Enter payment mode'); return; }
    const updated = { ...settings, paymentModes: [...settings.paymentModes, newPaymentMode.trim()] };
    setSettings(updated); saveSettings(updated); setNewPaymentMode('');
    toast.success('Payment mode added!');
  };

  const handleDeletePaymentMode = (i) => {
    const updated = { ...settings, paymentModes: settings.paymentModes.filter((_, idx) => idx !== i) };
    setSettings(updated); saveSettings(updated); toast.success('Deleted!');
  };

  const handleSaveUser = () => {
    if (!editingUser.name.trim() || !editingUser.password.trim()) { toast.error('Fill all fields'); return; }
    const updated = users.map(u => u.id === editingUserId ? editingUser : u);
    setUsers(updated); saveUsers(updated); setEditingUserId(null); setEditingUser(null);
    toast.success('User updated!');
  };

  const handleDeleteUser = (id) => {
    if (confirm('Delete this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated); saveUsers(updated); toast.success('User deleted!');
    }
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUser.id.trim() || !newUser.name.trim() || !newUser.password.trim()) { toast.error('Fill all fields'); return; }
    if (users.some(u => u.id === newUser.id.trim())) { toast.error('User ID already exists'); return; }
    const updated = [...users, { ...newUser, id: newUser.id.trim(), name: newUser.name.trim(), password: newUser.password.trim() }];
    setUsers(updated); saveUsers(updated);
    setNewUser({ id: '', name: '', password: '', role: 'USER' }); setShowAddUser(false);
    toast.success('User account created!');
  };

  const tabs = [
    { key: 'groupHeads', label: 'Group Heads', icon: Target },
    { key: 'paymentModes', label: 'Payment Modes', icon: Wallet },
    { key: 'users', label: 'User Accounts', icon: Users },
  ];

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure accounts, platform options, and reporting variables</p>
      </div>

      {/* Tab Nav */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === key
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* GROUP HEADS */}
      {activeTab === 'groupHeads' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Configure Group Heads</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage tracking segments for ledger reports</p>
          </div>
          <div className="flex gap-3 max-w-md">
            <input type="text" value={newGroupHead} onChange={e => setNewGroupHead(e.target.value)} placeholder="New group head name" className={inputCls} onKeyPress={e => e.key === 'Enter' && handleAddGroupHead()} />
            <button onClick={handleAddGroupHead} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition whitespace-nowrap">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.groupHeads.map((head, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-sm">{head}</span>
                <button onClick={() => handleDeleteGroupHead(i)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {settings.groupHeads.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">No group heads yet.</p>}
        </div>
      )}

      {/* PAYMENT MODES */}
      {activeTab === 'paymentModes' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Configure Payment Modes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Define approved payment options and gateways</p>
          </div>
          <div className="flex gap-3 max-w-md">
            <input type="text" value={newPaymentMode} onChange={e => setNewPaymentMode(e.target.value)} placeholder="New payment mode" className={inputCls} onKeyPress={e => e.key === 'Enter' && handleAddPaymentMode()} />
            <button onClick={handleAddPaymentMode} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition whitespace-nowrap">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.paymentModes.map((mode, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-sm">{mode}</span>
                <button onClick={() => handleDeletePaymentMode(i)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {settings.paymentModes.length === 0 && <p className="text-center text-slate-400 py-6 text-sm">No payment modes yet.</p>}
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {showAddUser ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Register New Account</h3>
              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Username / ID</label><input type="text" value={newUser.id} onChange={e => setNewUser(p => ({...p, id: e.target.value}))} placeholder="e.g. gautam_g" className={inputCls} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Display Name</label><input type="text" value={newUser.name} onChange={e => setNewUser(p => ({...p, name: e.target.value}))} placeholder="e.g. Gautam Gupta" className={inputCls} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label><input type="password" value={newUser.password} onChange={e => setNewUser(p => ({...p, password: e.target.value}))} placeholder="••••••••" className={inputCls} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                    <select value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value}))} className={selectCls}>
                      <option value="USER">USER — Standard</option>
                      <option value="ADMIN">ADMIN — Full Access</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"><Save size={13} />Save User</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"><X size={13} />Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setShowAddUser(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm">
              <UserPlus size={13} /> Add User Account
            </button>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Active Accounts ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['SN','Name','Username','Password','Role','Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-indigo-50/20 transition-colors">
                      {editingUserId === user.id ? (
                        <>
                          <td className="px-5 py-3 text-sm text-slate-500">{idx+1}</td>
                          <td className="px-5 py-3"><input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full" /></td>
                          <td className="px-5 py-3"><input type="text" value={editingUser.id} disabled className="text-sm bg-slate-100 border border-slate-200 rounded px-2 py-1 w-full text-slate-400" /></td>
                          <td className="px-5 py-3"><input type="text" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full" /></td>
                          <td className="px-5 py-3"><select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></td>
                          <td className="px-5 py-3"><div className="flex gap-2"><button onClick={handleSaveUser} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold">Save</button><button onClick={() => setEditingUserId(null)} className="px-2.5 py-1 border border-slate-200 text-slate-500 rounded text-xs font-bold">Cancel</button></div></td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 text-sm text-slate-400">{idx+1}</td>
                          <td className="px-5 py-3 text-sm font-bold text-slate-800">{user.name}</td>
                          <td className="px-5 py-3 text-sm font-mono text-slate-500">{user.id}</td>
                          <td className="px-5 py-3 text-sm text-slate-300">••••••••</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{user.role}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditingUserId(user.id); setEditingUser({...user}); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No accounts found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
