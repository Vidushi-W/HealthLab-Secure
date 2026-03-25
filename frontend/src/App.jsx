import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ExperimentList from './components/ExperimentList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import RecommendationPage from './pages/RecommendationPage';
import ResearchReviews from './pages/ResearchReviews';
import MyStudies from './pages/MyStudies';
import StudyDashboard from './pages/StudyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResearcherExperiments from './pages/ResearcherExperiments';
import Community from './pages/Community';
import PostDetail from './pages/PostDetail';
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
          <Link to="/community" className="nav-btn">Community</Link>
          <Link to="/recommended" className="nav-btn">Recommended</Link>
          <Link to="/my-studies" className="nav-btn">My Studies</Link>
          {user && (user.role || '').toLowerCase() === 'researcher' && (
            <Link to="/researcher/experiments" className="nav-btn">My Experiments</Link>
          )}
          {user && (user.role || '').toLowerCase() === 'researcher' && (
            <Link to="/researcher/reviews" className="nav-btn">Research Reviews</Link>
          )}
          {user && (user.role || '').toLowerCase() === 'admin' && (
            <Link to="/admin" className="nav-btn admin-link">Admin Dashboard</Link>
          )}
          {user ? (
            <button className="nav-btn profile" onClick={handleLogout}>Logout ({user.name ? user.name.split(' ')[0] : 'User'})</button>
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
      <Route path="/community" element={<Layout><Community /></Layout>} />
      <Route path="/community/:id" element={<Layout><PostDetail /></Layout>} />
      <Route path="/recommended" element={<Layout><RecommendationPage /></Layout>} />
      {user && (user.role || '').toLowerCase() === 'researcher' && (
        <Route path="/researcher/reviews" element={<Layout><ResearchReviews /></Layout>} />
      )}
      <Route path="/my-studies" element={<Layout><MyStudies /></Layout>} />
      <Route path="/dashboard/:participationId" element={<Layout><StudyDashboard /></Layout>} />
      <Route path="/researcher/experiments" element={<Layout><ResearcherExperiments /></Layout>} />
      {user && (user.role || '').toLowerCase() === 'admin' && (
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
      )}
    </Routes>
  );
}

export default App;
