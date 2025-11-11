import React, { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { createProject, listProjects, deleteProject } from '../api/projects';
import { useNavigate } from 'react-router-dom';
import { Button, LoadingSpinner } from '../components/ui';
import type { Project } from '../api/projects';
import './ProjectsPage.css';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      setProjects(res);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      const p = await createProject({ title });
      setProjects((s) => [p, ...s]);
      setTitle('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((s) => s.filter((p) => p.id !== id));
    } catch (err: unknown) {
      console.error(err);
      alert('Delete failed');
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="projects-page">
        <div className="loading-container">
          <LoadingSpinner size="large" message="프로젝트를 불러오는 중..." />
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-container">
        {/* 헤더 */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">PPT 프로젝트를 관리하고 AI로 스토리라인을 생성하세요</p>
          </div>
          <Button
            onClick={() => navigate('/storyline')}
            variant="primary"
            size="large"
            className="header-action"
          >
            AI 스토리라인 생성
          </Button>
        </div>

        {/* 프로젝트 생성 */}
        <div className="card card--bordered create-project">
          <div className="card-header">
            <h2 className="section-title">새 프로젝트 만들기</h2>
          </div>
          <div className="card-body">
            <form className="create-form" onSubmit={handleCreate}>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="프로젝트 제목을 입력하세요..." 
                className="project-input"
                required
              />
              <Button 
                type="submit"
                variant="primary" 
                disabled={loading || !title.trim()}
                loading={loading}
              >
                프로젝트 생성
              </Button>
            </form>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* 프로젝트 목록 */}
        <div className="card card--bordered projects-list">
          <div className="card-header">
            <h2 className="section-title">프로젝트 목록</h2>
            <div className="projects-count">{projects.length}개 프로젝트</div>
          </div>
          <div className="card-body">
            {projects.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon">□</div>
                <h3 className="empty-title">프로젝트가 없습니다</h3>
                <p className="empty-description">
                  새로운 프로젝트를 만들거나 AI 스토리라인 생성을 통해 시작해보세요.
                </p>
                <Button
                  onClick={() => navigate('/storyline')}
                  variant="primary"
                  size="large"
                >
                  첫 번째 프로젝트 시작하기
                </Button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((p) => (
                  <div key={p.id} className="project-card">
                    <div className="project-content">
                      <div className="project-header">
                        <h3 className="project-title">{p.title}</h3>
                        <div className="project-meta">
                          <span className="project-topic">{p.topic || '주제 없음'}</span>
                        </div>
                      </div>
                      
                      <div className="project-info">
                        <div className="info-item">
                          <span className="info-label">타겟:</span>
                          <span className="info-value">{p.target_audience || '설정되지 않음'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">목표:</span>
                          <span className="info-value">{p.goal || '설정되지 않음'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="project-actions">
                      <Button 
                        onClick={() => navigate(`/projects/${p.id}`)} 
                        variant="primary"
                        size="medium"
                      >
                        프로젝트 열기
                      </Button>
                      <Button 
                        onClick={() => handleDelete(p.id)} 
                        variant="danger"
                        size="medium"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
