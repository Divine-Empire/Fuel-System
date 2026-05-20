import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from '../pages/auth/Login';
import Settings from '../pages/Settings';
import Dashboard from '../pages/dashboard/Dashboard';
import Receivables from '../pages/receivables/Receivables';
import FollowUpModal from '../components/modals/FollowUpModal';
import PaymentModal from '../components/modals/PaymentModal';

import Compare from '../pages/compare/Compare';
import Campaigns from '../pages/campaigns/Campaigns';

export default function AppRoutes() {
  // Modal state handlers that will connect to Receivables
  const [selectedFollowUpSale, setSelectedFollowUpSale] = useState(null);
  const [selectedPaymentSale, setSelectedPaymentSale] = useState(null);



  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route 
            path="receivables" 
            element={
              <Receivables 
                onOpenFollowUp={(sale) => setSelectedFollowUpSale(sale)}
                onOpenPayment={(sale) => setSelectedPaymentSale(sale)}
              />
            } 
          />
          <Route path="compare" element={<Compare />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Conditionally rendered workflow modals */}
      {selectedFollowUpSale && (
        <FollowUpModal
          isOpen={!!selectedFollowUpSale}
          onClose={() => setSelectedFollowUpSale(null)}
          sale={selectedFollowUpSale}
        />
      )}

      {selectedPaymentSale && (
        <PaymentModal
          isOpen={!!selectedPaymentSale}
          onClose={() => setSelectedPaymentSale(null)}
          sale={selectedPaymentSale}
        />
      )}
    </>
  );
}
