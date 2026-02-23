import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ExperimentList from './components/ExperimentList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import RecommendationPage from './pages/RecommendationPage';
import AdminDashboard from './pages/AdminDashboard';
import { getCurrentUser, logoutUser } from './api/auth';

function App() {
  const [user, setUser] = useState(getCurrentUser());
  const location = useLocation();

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location]);

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/login';
  };

  const Layout = ({ children }) => (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">HealthLab</div>
        <nav>
          <Link to="/" className="nav-btn">Home</Link>
          <Link to="/experiments" className="nav-btn">Experiments</Link>
          <Link to="/recommended" className="nav-btn">Recommended</Link>
          <button className="nav-btn">My Studies</button>
          {user && user.role === 'admin' && (
            <Link to="/admin" className="nav-btn admin-link">Admin Dashboard</Link>
          )}
          {user ? (
            <button className="nav-btn profile" onClick={handleLogout}>Logout ({user.name.split(' ')[0]})</button>
          ) : (
            <Link to="/login" className="nav-btn profile">Login</Link>
          )}
        </nav>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/experiments" element={<Layout><ExperimentList /></Layout>} />
      <Route path="/recommended" element={<Layout><RecommendationPage /></Layout>} />
      {user && user.role === 'admin' && (
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
      )}
    </Routes>
  );
}

export default App;
