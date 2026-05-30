
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from '../pages/auth/Login';
import Settings from '../pages/Settings';
import Dashboard from '../pages/dashboard/Dashboard';
import EmployeeApproval from '../pages/employee-vehicle-logs/hod-approval';
import EmployeePayment from '../pages/employee-vehicle-logs/accounts-payment';
import OfficeAdvancePayment from '../pages/office-vehicle-logs/advance-payment';
import OfficeActualFilling from '../pages/office-vehicle-logs/driver-submission';
import Master from '../pages/vehicle-master/vehicle-master';
import Profile from '../pages/profile/profile';
import { useAuthStore } from '../store/authStore';

const AdminRoute = ({ children, user }) => {
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Protected Admin Routes */}
        <Route
          path="employee-logs/approval"
          element={
            <AdminRoute user={user}>
              <EmployeeApproval />
            </AdminRoute>
          }
        />
        <Route
          path="employee-logs/payment"
          element={
            <AdminRoute user={user}>
              <EmployeePayment />
            </AdminRoute>
          }
        />
        <Route
          path="office-logs/advance-payment"
          element={
            <AdminRoute user={user}>
              <OfficeAdvancePayment />
            </AdminRoute>
          }
        />
        <Route
          path="office-logs/actual-filling"
          element={
            <OfficeActualFilling />
          }
        />
        <Route
          path="office-logs"
          element={<Navigate to="/office-logs/advance-payment" replace />}
        />
        <Route
          path="master"
          element={
            <AdminRoute user={user}>
              <Master />
            </AdminRoute>
          }
        />
        <Route
          path="settings"
          element={
            <AdminRoute user={user}>
              <Settings />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


