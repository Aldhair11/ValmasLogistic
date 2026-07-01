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
              <Route path="shipments/:id" element={<ShipmentDetail />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
