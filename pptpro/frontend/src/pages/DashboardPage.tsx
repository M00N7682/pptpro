// 대시보드 페이지 (로그인 후 메인 페이지)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="dashboard-page">
      <div className="main-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">Welcome to PPT Pro</h1>
            <p className="welcome-subtitle">
              Professional presentation creation powered by artificial intelligence.
              Transform your ideas into compelling business presentations.
            </p>
          </div>
          <div className="user-info">
            <span className="greeting">Hello, {user?.name}</span>
          </div>
        </div>

        {/* Main Actions */}
        <div className="actions-grid">
          {/* Create New Presentation */}
          <div className="action-card primary-card">
            <div className="card-icon">
              <div className="icon-presentation"></div>
            </div>
            <div className="card-content">
              <h3 className="card-title">Create New Presentation</h3>
              <p className="card-description">
                Start from scratch with AI-powered storyline generation.
                Define your topic, audience, and goals to generate a structured presentation.
              </p>
              <div className="card-actions">
                <Button
                  onClick={() => navigate('/storyline')}
                  variant="primary"
                  size="large"
                  className="action-button"
                >
                  Start Creating
                </Button>
              </div>
            </div>
          </div>

          {/* Improve Existing Slides */}
          <div className="action-card secondary-card">
            <div className="card-icon">
              <div className="icon-improve"></div>
            </div>
            <div className="card-content">
              <h3 className="card-title">Improve Existing Slides</h3>
              <p className="card-description">
                Upload your existing PowerPoint and get AI-powered suggestions
                for structure, content, and visual improvements.
              </p>
              <div className="card-actions">
                <Button
                  variant="secondary"
                  size="large"
                  className="action-button"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>

          {/* My Projects */}
          <div className="action-card tertiary-card">
            <div className="card-icon">
              <div className="icon-projects"></div>
            </div>
            <div className="card-content">
              <h3 className="card-title">My Projects</h3>
              <p className="card-description">
                View, manage, and continue working on your presentation projects.
                Track progress and download completed presentations.
              </p>
              <div className="card-actions">
                <Button
                  onClick={() => navigate('/projects')}
                  variant="success"
                  size="large"
                  className="action-button"
                >
                  Open Projects
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-section">
          <h2 className="stats-title">Your Progress</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Projects Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">Presentations Generated</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0</div>
              <div className="stat-label">AI Storylines</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <h2 className="activity-title">Recent Activity</h2>
          <div className="empty-activity">
            <div className="empty-icon">
              <div className="icon-empty"></div>
            </div>
            <p className="empty-message">
              No recent activity. Start by creating your first presentation!
            </p>
            <Button
              onClick={() => navigate('/storyline')}
              variant="primary"
            >
              Create First Presentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;