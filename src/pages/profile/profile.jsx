import { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Lock, Fingerprint, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/user.service';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [userId, setUserId] = useState(user?.id || '');
  const [password, setPassword] = useState(user?.password || '');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Name is required');
    if (!userId.trim()) return toast.error('User ID is required');
    if (!password.trim()) return toast.error('Password is required');

    // Restrict credentials update if the user-type is not admin
    const isIdChanged = userId.trim().toLowerCase() !== user.id.toLowerCase();
    const isPasswordChanged = password.trim() !== user.password;

    if (!isAdmin && (isIdChanged || isPasswordChanged)) {
      return toast.error('Only Admins can update credentials (User ID and Password)');
    }

    setSubmitting(true);
    try {
      const allUsers = await userService.getUsersFromSheet();
      
      // Check if User ID matches someone else's ID
      const duplicate = allUsers.find(
        (u) => u.id.toLowerCase() === userId.trim().toLowerCase() && u.id.toLowerCase() !== user.id.toLowerCase()
      );

      if (duplicate) {
        toast.error(`User ID '${userId}' is already taken by another account`);
        setSubmitting(false);
        return;
      }

      // Update in Master sheet
      await userService.updateUserInSheet({
        id: userId.trim(),
        name: name.trim(),
        password: password.trim(),
        role: user.role
      }, user.id);

      // Update in authStore context
      updateUser({
        ...user,
        id: userId.trim(),
        name: name.trim(),
        password: password.trim()
      });

      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "block w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed";
  const labelCls = "text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1";

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 pt-2">
      <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 flex-shrink-0">
        
        {/* Left Side: Profile Summary */}
        <div className="p-6 md:p-8 flex flex-col items-center justify-center space-y-4 md:w-1/3 bg-slate-50/50">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-indigo-100 shadow-md bg-white flex items-center justify-center">
            <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl font-extrabold text-white">
              {(name || user?.name || 'U')[0].toUpperCase()}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800">{name || 'Your Name'}</h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
              {user?.role || 'USER'}
            </p>
          </div>
        </div>

        {/* Right Side: Form fields */}
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-4 flex-1">
          <div>
            <label className={labelCls}>Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className={inputCls}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>User ID (Login Username) {!isAdmin && <span className="text-[10px] text-amber-500 font-bold lowercase font-sans">(admin only)</span>}</label>
            <div className="relative">
              <Fingerprint size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                className={inputCls}
                disabled={submitting || !isAdmin}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Password {!isAdmin && <span className="text-[10px] text-amber-500 font-bold lowercase font-sans">(admin only)</span>}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={inputCls}
                disabled={submitting || !isAdmin}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
