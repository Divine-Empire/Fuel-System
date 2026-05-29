import { Bell, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Header = ({ onMenuClick, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const getStageHeader = () => {
    switch (location.pathname) {
      case '/dashboard':
        return {
          title: 'Dashboard Overview',
        };
      case '/request-filling':
        return {
          title: 'Request Filling',
        };
      case '/actual-filling':
        return {
          title: 'Actual Filling',
        };
      case '/payment':
        return {
          title: 'Payments',
        };
      case '/employee-logs/approval':
        return {
          title: 'Employee Travel Logs',
        };
      case '/employee-logs/payment':
        return {
          title: 'Employee Travel Payments',
        };
      case '/office-logs/advance-payment':
        return {
          title: 'Office Logs - Advance Payment',
        };
      case '/office-logs/actual-filling':
        return {
          title: 'Office Logs - Actual Fuel Filling',
        };
      case '/master':
        return {
          title: 'Vehicle Master',
        };
      case '/profile':
        return {
          title: 'My Profile',
        };
      case '/settings':
        return {
          title: 'Settings',
        };
      default:
        return {
          title: 'Fuel System',
        };
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex justify-between items-center py-2.5 px-4 sm:px-6 min-h-[3.5rem]">

        {/* Left: Mobile hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="block">
            <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {getStageHeader().title}
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Profile */}
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={handleLogout} title="Click to sign out">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-700">{user?.name || 'Admin'}</p>
              <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm flex items-center justify-center border border-slate-200 bg-white">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white group-hover:bg-indigo-700 transition-colors">
                  {(user?.name || 'A')[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;