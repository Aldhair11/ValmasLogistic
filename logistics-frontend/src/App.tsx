import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sileo';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CreateShipment from './pages/CreateShipment';
import ShipmentDetail from './pages/ShipmentDetail';
import TrackShipment from './pages/TrackShipment';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Customers from './pages/masters/Customers';
import Vehicles from './pages/masters/Vehicles';
import Couriers from './pages/masters/Couriers';
import Branches from './pages/masters/Branches';
import Users from './pages/Users';
import Shipments from './pages/Shipments';
import CashRegister from './pages/CashRegister';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" theme="system" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track/:trackingNumber" element={<TrackShipment />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="dashboard" element={<Home />} />
              <Route path="shipments/new" element={<CreateShipment />} />
              <Route path="shipments/list" element={<Shipments />} />
              <Route path="cash" element={<CashRegister />} />
              <Route path="shipments/:id" element={<ShipmentDetail />} />
              <Route
                path="masters/customers"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Worker']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="masters/vehicles"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Worker']}>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="masters/couriers"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Worker']}>
                    <Couriers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="masters/branches"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Branches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
