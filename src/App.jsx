import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SupermarketProvider } from './context/SupermarketContext';

// Customer Pages
import CustomerLayout from './layouts/CustomerLayout';
import CustomerHome from './pages/customer/CustomerHome';
import ProductSearch from './pages/customer/ProductSearch';
import ProductDetails from './pages/customer/ProductDetails';
import ShoppingList from './pages/customer/ShoppingList';
import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerScanGo from './pages/customer/CustomerScanGo';
import CustomerSettings from './pages/customer/CustomerSettings';

// Staff Pages
import StaffLayout from './layouts/StaffLayout';
import StaffLogin from './pages/staff/StaffLogin';
import Dashboard from './pages/staff/Dashboard';
import POSBilling from './pages/staff/POSBilling';
import Inventory from './pages/staff/Inventory';
import Purchases from './pages/staff/Purchases';
import SalesHistory from './pages/staff/SalesHistory';
import Products from './pages/staff/Products';
import StaffOrders from './pages/staff/StaffOrders';
import StaffVerification from './pages/staff/StaffVerification';
import StaffSettings from './pages/staff/StaffSettings';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SupermarketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/customer" replace />} />
              
              {/* Customer Routes */}
              <Route path="/customer/login" element={<CustomerLogin />} />
              <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<CustomerHome />} />
                <Route path="products" element={<ProductSearch />} />
                <Route path="products/:id" element={<ProductDetails />} />
                <Route path="list" element={<ShoppingList />} />
                <Route path="orders" element={<CustomerOrders />} />
                <Route path="scan" element={<CustomerScanGo />} />
                <Route path="settings" element={<CustomerSettings />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<Navigate to="/staff/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="verify" element={<StaffVerification />} />
                <Route path="orders" element={<StaffOrders />} />
                <Route path="pos" element={<POSBilling />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="sales" element={<SalesHistory />} />
                <Route path="products" element={<Products />} />
                <Route path="settings" element={<StaffSettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SupermarketProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}


export default App;
