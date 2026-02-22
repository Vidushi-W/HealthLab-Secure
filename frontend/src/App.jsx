import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExperimentList from './components/ExperimentList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import RecommendationPage from './pages/RecommendationPage';
import { getCurrentUser, logoutUser } from './api/auth';

function App() {
  const user = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="*"
          element={
            <div className="app-container">
              <header className="app-header">
                <div className="logo">HealthLab</div>
                <nav>
                  {/* Changed buttons to Links and added logic for auth state */}
                  <Link to="/" className="nav-btn">Home</Link>
                  <Link to="/experiments" className="nav-btn">Experiments</Link>
                  <Link to="/recommended" className="nav-btn">Recommended</Link>
                  <button className="nav-btn">My Studies</button>
                  {user ? (
                    <button className="nav-btn profile" onClick={handleLogout}>Logout ({user.name.split(' ')[0]})</button>
                  ) : (
                    <Link to="/login" className="nav-btn profile">Login</Link>
                  )}
                </nav>
              </header>
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/experiments" element={<ExperimentList />} />
                  <Route path="/recommended" element={<RecommendationPage />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
