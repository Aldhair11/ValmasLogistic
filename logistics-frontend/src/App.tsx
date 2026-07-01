import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sileo';
import { AuthProvider } from './context/AuthContext';
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
