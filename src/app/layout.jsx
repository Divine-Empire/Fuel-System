import { useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { LayoutGrid, User as UserIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      {user?.role === 'USER' ? (
        <div className="hidden lg:block">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      ) : (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56 2xl:ml-60 h-screen relative">
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} />

        <main className={`flex-1 flex flex-col p-5 md:p-6 overflow-hidden min-h-0 bg-slate-50 ${user?.role === 'USER' ? 'pb-20 lg:pb-6' : ''}`}>
          <div className="w-full max-w-[1800px] mx-auto flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>

        <Footer />

        {/* Bottom fixed navigation bar for USER role on mobile */}
        {user?.role === 'USER' && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex justify-around items-center h-16 px-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-150
                ${isActive ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'}
              `}
            >
              <LayoutGrid size={20} />
              <span className="text-[10px] tracking-tight">Dashboard</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => `
                flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-150
                ${isActive ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'}
              `}
            >
              <UserIcon size={20} />
              <span className="text-[10px] tracking-tight">Profile</span>
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
}
