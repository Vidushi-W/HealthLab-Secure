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
import FundRequests from './pages/FundRequests';
import OpenFundRequests from './pages/OpenFundRequests';
import MyContributions from './pages/MyContributions';
import ResearcherWallet from './pages/ResearcherWallet';
import ResearcherWalletDetail from './pages/ResearcherWalletDetail';
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

  const researcherSoftPageBg =
    location.pathname === '/researcher/experiments' ||
    location.pathname === '/researcher/reviews';

  const Layout = ({ children }) => (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">HealthLab</div>
        <nav>
          <Link to="/" className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/experiments" className={`nav-btn ${location.pathname === '/experiments' ? 'active' : ''}`}>Experiments</Link>
          <Link to="/community" className={`nav-btn ${location.pathname === '/community' ? 'active' : ''}`}>Community</Link>
          <Link to="/fund" className={`nav-btn ${location.pathname === '/fund' ? 'active' : ''}`}>Fund</Link>
          <Link to="/recommended" className={`nav-btn ${location.pathname === '/recommended' ? 'active' : ''}`}>Recommended</Link>
          <Link to="/my-studies" className={`nav-btn ${location.pathname === '/my-studies' ? 'active' : ''}`}>My Studies</Link>

          {user && (user.role || '').toLowerCase() === 'researcher' && (
            <Link to="/researcher/experiments" className={`nav-btn ${location.pathname === '/researcher/experiments' ? 'active' : ''}`}>My Experiments</Link>
          )}

          {user && (user.role || '').toLowerCase() === 'researcher' && (
            <Link to="/researcher/reviews" className={`nav-btn ${location.pathname === '/researcher/reviews' ? 'active' : ''}`}>Research Reviews</Link>
          )}

          {user && (user.role || '').toLowerCase() === 'admin' && (
            <Link to="/admin" className={`nav-btn admin-link ${location.pathname === '/admin' ? 'active' : ''}`}>Admin Dashboard</Link>
          )}

          {user ? (
            <button className="nav-btn profile" onClick={handleLogout}>
              Logout ({user.name ? user.name.split(' ')[0] : 'User'})
            </button>
          ) : (
            <Link to="/login" className={`nav-btn profile ${location.pathname === '/login' ? 'active' : ''}`}>Login</Link>
          )}
        </nav>
      </header>

      <main
        className={`main-content${researcherSoftPageBg ? ' main-content--researcher-soft' : ''}`}
      >
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
      <Route path="/fund" element={<Layout><OpenFundRequests /></Layout>} />
      <Route path="/recommended" element={<Layout><RecommendationPage /></Layout>} />

      {user && (user.role || '').toLowerCase() === 'researcher' && (
        <Route path="/researcher/reviews" element={<Layout><ResearchReviews /></Layout>} />
      )}

      {user && (user.role || '').toLowerCase() === 'researcher' && (
        <Route path="/fund-requests" element={<Layout><FundRequests /></Layout>} />
      )}

      {user && (user.role || '').toLowerCase() === 'researcher' && (
        <Route path="/researcher/wallet" element={<Layout><ResearcherWallet /></Layout>} />
      )}

      {user && (user.role || '').toLowerCase() === 'researcher' && (
        <Route path="/researcher/wallet/:experimentId" element={<Layout><ResearcherWalletDetail /></Layout>} />
      )}

      <Route path="/my-studies" element={<Layout><MyStudies /></Layout>} />
      <Route path="/my-contributions" element={<Layout><MyContributions /></Layout>} />
      <Route path="/dashboard/:participationId" element={<Layout><StudyDashboard /></Layout>} />
      <Route path="/researcher/experiments" element={<Layout><ResearcherExperiments /></Layout>} />

      {user && (user.role || '').toLowerCase() === 'admin' && (
        <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
      )}
    </Routes>
  );
}

export default App;