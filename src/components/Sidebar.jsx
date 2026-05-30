import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  LogOut as LogOutIcon,
  X,
  LayoutGrid,
  FileText,
  Fuel,
  Car,
  User as UserIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import divineLogo from '../Assets/divine-logo.svg';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isEmpLogsActive = location.pathname.startsWith('/employee-logs');
  const isOfficeLogsActive = location.pathname.startsWith('/office-logs');
  const [empLogsOpen, setEmpLogsOpen] = useState(isEmpLogsActive);
  const [officeLogsOpen, setOfficeLogsOpen] = useState(isOfficeLogsActive);

  useEffect(() => {
    if (isEmpLogsActive) {
      setEmpLogsOpen(true);
    }
  }, [isEmpLogsActive]);

  useEffect(() => {
    if (isOfficeLogsActive) {
      setOfficeLogsOpen(true);
    }
  }, [isOfficeLogsActive]);


  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 sm:w-72 lg:w-56 2xl:w-60 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src={divineLogo} alt="Divine Empire Logo" className="w-8 h-8 object-contain" />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-900 leading-tight">Fuel System</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</p>
          
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
              ${isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
            `}
          >
            {({ isActive }) => (
              <>
                <LayoutGrid size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="text-sm">Dashboard</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </>
            )}
          </NavLink>

          {/* Employee-Logs (Admin Only) */}
          {user?.role === 'ADMIN' && (
            <div>
              <button
                type="button"
                onClick={() => setEmpLogsOpen(!empLogsOpen)}
                className={`
                  flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium
                  ${isEmpLogsActive ? 'text-indigo-700 font-semibold bg-indigo-50/40' : ''}
                `}
              >
                <FileText size={17} className={isEmpLogsActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="text-sm">Employee-Logs</span>
                <span className="ml-auto">
                  {empLogsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>
              
              {empLogsOpen && (
                <div className="pl-4 mt-1 space-y-0.5 border-l border-slate-100 ml-5">
                  <NavLink
                    to="/employee-logs/approval"
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150
                      ${isActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
                    `}
                  >
                    <span className="text-sm">HOD-Approval</span>
                  </NavLink>
                  <NavLink
                    to="/employee-logs/payment"
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150
                      ${isActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
                    `}
                  >
                    <span className="text-sm">Accounts Payment</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Office-Logs */}
          {user?.role === 'ADMIN' ? (
            <div>
              <button
                type="button"
                onClick={() => setOfficeLogsOpen(!officeLogsOpen)}
                className={`
                  flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium
                  ${isOfficeLogsActive ? 'text-indigo-700 font-semibold bg-indigo-50/40' : ''}
                `}
              >
                <Fuel size={17} className={isOfficeLogsActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="text-sm">Office-Logs</span>
                <span className="ml-auto">
                  {officeLogsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>
              
              {officeLogsOpen && (
                <div className="pl-4 mt-1 space-y-0.5 border-l border-slate-100 ml-5">
                  <NavLink
                    to="/office-logs/advance-payment"
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150
                      ${isActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
                    `}
                  >
                    <span className="text-sm">Advance Payment</span>
                  </NavLink>
                  <NavLink
                    to="/office-logs/actual-filling"
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150
                      ${isActive
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
                    `}
                  >
                    <span className="text-sm">Driver Submission</span>
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/office-logs/actual-filling"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Fuel size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="text-sm">Driver Submission</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </>
              )}
            </NavLink>
          )}

          {/* Vehicles (Admin Only) */}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/master"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Car size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="text-sm">Vehicles</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </>
              )}
            </NavLink>
          )}

          {/* Settings (Admin Only) */}
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  <Settings size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="text-sm">Settings</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </>
              )}
            </NavLink>
          )}

          {/* Profile (Employee/User Only) */}
          {user?.role !== 'ADMIN' && (
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  <UserIcon size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="text-sm">Profile</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-slate-200 bg-white">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{user?.role || 'EMPLOYEE'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all font-semibold text-xs"
          >
            <LogOutIcon size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;