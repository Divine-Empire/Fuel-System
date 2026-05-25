import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from '../pages/auth/Login';
import Settings from '../pages/Settings';
import Dashboard from '../pages/dashboard/Dashboard';
import ActualFilling from '../pages/actual-filling/ActualFilling';
import Payment from '../pages/payment/payment';
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
          path="actual-filling"
          element={
            <AdminRoute user={user}>
              <ActualFilling />
            </AdminRoute>
          }
        />
        <Route
          path="payment"
          element={
            <AdminRoute user={user}>
              <Payment />
            </AdminRoute>
          }
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
