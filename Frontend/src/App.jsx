import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { QuizApp } from './components/QuizApp';
import { AdminRoute } from './components/AdminRoute';
import { AdminPage } from './pages/AdminPage';

function App() {
  const { user, dbUser, loading } = useAuth();

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<QuizApp user={user} dbUser={dbUser} onLogout={handleLogout} />} />
        <Route path="/admin-portal" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
