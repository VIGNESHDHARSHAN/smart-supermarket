import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';

/**
 * DeliveryProtectedRoute Guard
 * Protects all /delivery/* routes (except /delivery/login).
 * If delivery partner is not authenticated, safely redirects to /delivery/login.
 */
export default function DeliveryProtectedRoute() {
  const location = useLocation();
  const { isDeliveryAuthenticated } = useSupermarket();

  if (!isDeliveryAuthenticated) {
    const fullPath = location.pathname + location.search;
    return <Navigate to={`/delivery/login?redirect=${encodeURIComponent(fullPath)}`} replace state={{ from: fullPath }} />;
  }

  return <Outlet />;
}
