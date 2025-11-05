import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storylineApi } from '../api/storyline';
import { Button, LoadingSpinner } from '../components/ui';
import type { StorylineRequest, StorylineResult } from '../api/storyline';
import './StorylinePage.css';

const StorylinePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<StorylineResult | null>(null);
  
  const [formData, setFormData] = useState<StorylineRequest>({
    topic: '',
    target: '',
    goal: '',
    narrative_style: 'consulting',
    create_project: false,
    project_title: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev: StorylineRequest) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await storylineApi.generateStoryline(formData);
      setResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || '스토리라인 생성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      topic: '',
      target: '',
      goal: '',
      narrative_style: 'consulting',
      create_project: false,
      project_title: ''
    });
    setResult(null);
    setError('');
  };

  const handleCreateProject = async () => {
    setLoading(true);
    setError('');
    try {
      const newRequest: StorylineRequest = {
        ...formData,
        create_project: true,
        project_title: formData.project_title || `${formData.topic} 프로젝트`
      };
      const newResult = await storylineApi.generateStoryline(newRequest);
      setResult(newResult);
      if (newResult.project_id) {
        navigate(`/projects/${newResult.project_id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '프로젝트 생성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="storyline-page">
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            size="small"
            className="back-button"
          >
            ← Dashboard
          </Button>
          <div className="header-content">
            <h1 className="page-title">AI Storyline Generator</h1>
            <p className="page-subtitle">
              Define your presentation topic, target audience, and goals to generate a structured, 
              compelling presentation outline powered by AI.
            </p>
          </div>
        </div>

        <div className="content-layout">
          {/* Input Section */}
          <div className="input-section">
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">Presentation Details</h2>
                <p className="section-description">
                  Provide the core information about your presentation
                </p>
              </div>
              
              <div className="card-body">
                <form onSubmit={handleGenerate} className="storyline-form">
                  <div className="form-group">
                    <label className="form-label">Topic *</label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      placeholder="e.g., Digital Transformation Strategy"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Audience *</label>
                    <input
                      type="text"
                      name="target"
                      value={formData.target}
                      onChange={handleInputChange}
                      placeholder="e.g., C-Level executives, IT managers"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Presentation Goal *</label>
                    <textarea
                      name="goal"
                      value={formData.goal}
                      onChange={handleInputChange}
                      placeholder="e.g., Convince stakeholders of the need for digital transformation and get approval for implementation plan"
                      rows={3}
                      className="form-textarea"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Narrative Style</label>
                    <select
                      name="narrative_style"
                      value={formData.narrative_style}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="consulting">Consulting Style</option>
                      <option value="academic">Academic Style</option>
                      <option value="business">Business Style</option>
                      <option value="creative">Creative Style</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        name="create_project"
                        checked={formData.create_project}
                        onChange={handleInputChange}
                        className="form-checkbox"
                      />
                      <label className="checkbox-label">
                        Create project immediately after generating storyline
                      </label>
                    </div>
                  </div>

                  {formData.create_project && (
                    <div className="form-group">
                      <label className="form-label">Project Title</label>
                      <input
                        type="text"
                        name="project_title"
                        value={formData.project_title}
                        onChange={handleInputChange}
                        placeholder="Leave empty to auto-generate based on topic"
                        className="form-input"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <div className="form-actions">
                    <Button
                      type="submit"
                      disabled={loading}
                      loading={loading}
                      variant="primary"
                      size="large"
                      className="generate-button"
                    >
                      Generate Storyline
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handleReset}
                      variant="ghost"
                      size="large"
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="results-section">
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">Generated Storyline</h2>
                <p className="section-description">
                  AI-generated presentation structure and outline
                </p>
              </div>
              
              <div className="card-body">
                {loading && (
                  <div className="loading-state">
                    <LoadingSpinner size="large" message="AI is generating your storyline..." />
                  </div>
                )}

                {result && !loading && (
                  <div className="results-content">
                    {/* Overall Narrative */}
                    <div className="narrative-section">
                      <h3 className="result-title">Overall Narrative</h3>
                      <div className="narrative-content">
                        {result.overall_narrative}
                      </div>
                    </div>

                    {/* Slide Outline */}
                    <div className="outline-section">
                      <h3 className="result-title">Slide Structure</h3>
                      <div className="slides-list">
                        {result.outline.map((slide, index) => (
                          <div key={index} className="slide-item">
                            <div className="slide-number">{slide.order}</div>
                            <div className="slide-content">
                              <h4 className="slide-title">{slide.head_message}</h4>
                              <p className="slide-purpose">{slide.purpose}</p>
                              <div className="slide-template">
                                <span className="template-badge">
                                  {slide.template_suggestion}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="result-actions">
                      <Button
                        onClick={handleReset}
                        variant="secondary"
                        size="large"
                      >
                        Generate New
                      </Button>
                      
                      {!result.project_id && (
                        <Button
                          onClick={handleCreateProject}
                          disabled={loading}
                          loading={loading}
                          variant="success"
                          size="large"
                        >
                          Create Project
                        </Button>
                      )}

                      {result.project_id && (
                        <Button
                          onClick={() => navigate(`/projects/${result.project_id}`)}
                          variant="primary"
                          size="large"
                        >
                          Open Project
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {!result && !loading && (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <div className="icon-storyline"></div>
                    </div>
                    <h3 className="empty-title">Ready to Generate</h3>
                    <p className="empty-description">
                      Fill in the presentation details on the left and click "Generate Storyline" 
                      to create your AI-powered presentation structure.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorylinePage;