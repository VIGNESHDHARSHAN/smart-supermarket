import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';

/**
 * StaffProtectedRoute Guard
 * Protects all /staff/* routes from unauthorized access.
 * If staff is not signed in, safely redirects to /staff/login without allowing
 * improper back-history navigation to unauthorized views.
 */
export default function StaffProtectedRoute() {
  const location = useLocation();
  const { isStaffAuthenticated } = useSupermarket();

  if (!isStaffAuthenticated) {
    // Redirect securely to /staff/login and save original attempted location
    return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
