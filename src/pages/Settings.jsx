import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus, Users, UserPlus, Save, X } from 'lucide-react';
import { getUsers, saveUsers } from '../utils/storageManager';

export default function Settings() {
  const [users, setUsers] = useState(getUsers());
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ id: '', name: '', password: '', role: 'USER' });

  const handleSaveUser = () => {
    if (!editingUser.name.trim() || !editingUser.password.trim()) {
      toast.error('Fill all fields');
      return;
    }
    const updated = users.map(u => u.id === editingUserId ? editingUser : u);
    setUsers(updated);
    saveUsers(updated);
    setEditingUserId(null);
    setEditingUser(null);
    toast.success('User updated!');
  };

  const handleDeleteUser = (id) => {
    if (id === 'admin') {
      toast.error('Cannot delete primary admin account');
      return;
    }
    if (confirm('Delete this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      saveUsers(updated);
      toast.success('User deleted!');
    }
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUser.id.trim() || !newUser.name.trim() || !newUser.password.trim()) {
      toast.error('Fill all fields');
      return;
    }
    if (users.some(u => u.id === newUser.id.trim())) {
      toast.error('User ID already exists');
      return;
    }
    const updated = [
      ...users,
      {
        ...newUser,
        id: newUser.id.trim(),
        name: newUser.name.trim(),
        password: newUser.password.trim()
      }
    ];
    setUsers(updated);
    saveUsers(updated);
    setNewUser({ id: '', name: '', password: '', role: 'USER' });
    setShowAddUser(false);
    toast.success('User account created!');
  };

  const inputCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all";
  const selectCls = "block w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";

  return (
    <div className="space-y-5 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
      <div className="space-y-4">
        {showAddUser && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-indigo-600" />
              Register New Account
            </h3>
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Username / ID</label>
                  <input
                    type="text"
                    value={newUser.id}
                    onChange={e => setNewUser(p => ({ ...p, id: e.target.value }))}
                    placeholder="e.g. rohit_s"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Rohit Sharma"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                    className={selectCls}
                  >
                    <option value="USER">USER — Standard</option>
                    <option value="ADMIN">ADMIN — Full Access</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Save size={13} />Save User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <X size={13} />Cancel
                </button>
              </div>
            </form>
          </div>
        )
      }

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Active Accounts ({users.length})</h3>
          </div>
          {!showAddUser && (
            <button
              onClick={() => setShowAddUser(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm w-fit"
            >
              <UserPlus size={13} /> Add User Account
            </button>
          )}
        </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['SN', 'Name', 'Username', 'Password', 'Role', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-indigo-50/20 transition-colors">
                    {editingUserId === user.id ? (
                      <>
                        <td className="px-5 py-3 text-sm text-slate-500">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full font-bold"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={editingUser.id}
                            disabled
                            className="text-sm bg-slate-100 border border-slate-200 rounded px-2 py-1 w-full text-slate-400 font-mono"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={editingUser.password}
                            onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                            className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={editingUser.role}
                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                            className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 cursor-pointer"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveUser}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2.5 py-1 border border-slate-200 text-slate-500 rounded text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 text-sm text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3 text-sm font-bold text-slate-800">{user.name}</td>
                        <td className="px-5 py-3 text-sm font-mono text-slate-500">{user.id}</td>
                        <td className="px-5 py-3 text-sm text-slate-300">••••••••</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{user.role}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => { setEditingUserId(user.id); setEditingUser({ ...user }); }}
                              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
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
    </div>
  );
}
