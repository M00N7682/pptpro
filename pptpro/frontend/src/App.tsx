import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import StorylinePage from './pages/StorylinePage';
import TemplateSelectionPage from './pages/TemplateSelectionPage';
import SlideEditPage from './pages/SlideEditPage';
import PPTPreviewPage from './pages/PPTPreviewPage';
import SlideContentEditPage from './pages/SlideContentEditPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import { ToastProvider } from './components/ui';

// Styles
import './App.css';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <ToastProvider>
        <div className="App">
          <NavBar />
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            } 
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storyline"
            element={
              <ProtectedRoute>
                <StorylinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/template-selection"
            element={
              <ProtectedRoute>
                <TemplateSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/slide-edit"
            element={
              <ProtectedRoute>
                <SlideEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ppt-preview"
            element={
              <ProtectedRoute>
                <PPTPreviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/slides/:slideId/edit"
            element={
              <ProtectedRoute>
                <SlideContentEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/slides"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/slides/:slideId/edit"
            element={
              <ProtectedRoute>
                <SlideContentEditPage />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            }
          />

          {/* Catch All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ToastProvider>
    </Router>
  );
}

export default App;
