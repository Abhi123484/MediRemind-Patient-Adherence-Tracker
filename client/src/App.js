import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import CalendarView from './pages/CalendarView';
import MedicationManager from './pages/MedicationManager';
import MyDoctor from './pages/MyDoctor';
import DoctorDashboard from './pages/DoctorDashboard';
import './App.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            {user?.role === 'doctor' ? <DoctorDashboard /> : <PatientDashboard />}
          </PrivateRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <PrivateRoute roles={['patient']}>
            <CalendarView />
          </PrivateRoute>
        }
      />
      <Route
        path="/medications"
        element={
          <PrivateRoute roles={['patient']}>
            <MedicationManager />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-doctor"
        element={
          <PrivateRoute roles={['patient']}>
            <MyDoctor />
          </PrivateRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <PrivateRoute roles={['doctor']}>
            <DoctorDashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
