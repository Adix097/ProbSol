import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LoadingPage from './pages/LoadingPage';
import RoadmapPage from './pages/RoadmapPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          {/* Public: anyone can open these */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Logged-in users only. ProtectedRoute redirects to /login otherwise */}
          <Route element={<ProtectedRoute />}>
            <Route path="/roadmaps/:id/generating" element={<LoadingPage />} />
            <Route path="/roadmaps/:id" element={<RoadmapPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Any other URL */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
