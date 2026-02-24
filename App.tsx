
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Tests from './pages/Tests';
import Admin from './pages/Admin';
import Accounts from './pages/Accounts';
import ClientDashboard from './pages/ClientDashboard';
import HomeTestRequest from './pages/HomeTestRequest';
import Layout from './components/Layout';
import { User, AuthState, UserRole } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const saved = localStorage.getItem('lab_auth');
      if (saved && saved !== "undefined") {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Auth initialization error:", e);
    }
    return { user: null, isAuthenticated: false };
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem('lab_auth', JSON.stringify(auth));
    } catch (e) {
      console.error("Auth save error:", e);
    }
  }, [auth]);

  const handleLogin = (user: User) => {
    setAuth({ user, isAuthenticated: true });
    navigate('/');
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('lab_auth');
    navigate('/login');
  };

  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // إذا كان المستخدم عميلاً، نوجهه لصفحة العميل فقط
  if (auth.user?.role === UserRole.CLIENT) {
    return (
      <Layout user={auth.user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<ClientDashboard user={auth.user} />} />
          <Route path="/home-test" element={<HomeTestRequest user={auth.user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout user={auth.user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/tests" element={<Tests />} />
        {auth.user?.role === UserRole.ADMIN && (
          <Route path="/admin" element={<Admin />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
