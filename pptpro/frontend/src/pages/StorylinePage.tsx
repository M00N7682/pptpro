import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storylineApi } from '../api/storyline';
import { Button, LoadingSpinner, ProgressSteps, ConfirmDialog, useToast } from '../components/ui';
import type { StorylineRequest, StorylineResult } from '../api/storyline';
import './StorylinePage.css';

const DRAFT_STORAGE_KEY = 'pptpro-storyline-draft';

const StorylinePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StorylineResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [formData, setFormData] = useState<StorylineRequest>({
    topic: '',
    target: '',
    goal: '',
    narrative_style: 'consulting',
    create_project: false,
    project_title: ''
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        toast.info('Draft recovered from your previous session');
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    const hasContent = formData.topic || formData.target || formData.goal;
    if (hasContent) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

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
    
    try {
      const result = await storylineApi.generateStoryline(formData);
      setResult(result);
      toast.success('Storyline generated successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to generate storyline. Please try again.';
      toast.error(errorMessage);
      console.error('Storyline generation error:', err);
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
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setShowResetConfirm(false);
    toast.info('Form reset successfully');
  };

  const handleResetClick = () => {
    const hasContent = formData.topic || formData.target || formData.goal || result;
    if (hasContent) {
      setShowResetConfirm(true);
    } else {
      handleReset();
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const newRequest: StorylineRequest = {
        ...formData,
        create_project: true,
        project_title: formData.project_title || `${formData.topic} Project`
      };
      const newResult = await storylineApi.generateStoryline(newRequest);
      setResult(newResult);
      
      if (newResult.project_id && newResult.outline) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        toast.success('Project created! Moving to template selection...');
        
        // Navigate to template selection page
        setTimeout(() => {
          navigate('/template-selection', {
            state: {
              slides: newResult.outline.map((item: any) => ({
                order: item.order,
                head_message: item.head_message,
                slide_purpose: item.purpose,
              })),
              projectId: newResult.project_id,
            },
          });
        }, 800);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to create project. Please try again.';
      toast.error(errorMessage);
      console.error('Project creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps = [
    { label: 'Storyline', description: 'Create structure' },
    { label: 'Templates', description: 'Select design' },
    { label: 'Content', description: 'Edit slides' },
    { label: 'Export', description: 'Download PPT' },
  ];

  return (
    <div className="storyline-page">
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Form?"
        message="This will clear all your inputs and the generated storyline. This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
      
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="header-top">
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
          <div className="progress-container">
            <ProgressSteps 
              steps={workflowSteps}
              currentStep={1}
              completedSteps={[]}
            />
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

                  <div className="form-actions">
                    <Button
                      type="submit"
                      disabled={loading}
                      loading={loading}
                      variant="primary"
                      size="large"
                      className="generate-button"
                    >
                      {loading ? 'Generating...' : 'Generate Storyline'}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handleResetClick}
                      variant="ghost"
                      size="large"
                      disabled={loading}
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
                        onClick={handleResetClick}
                        variant="secondary"
                        size="large"
                        disabled={loading}
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
                          {loading ? 'Creating Project...' : 'Create Project & Continue'}
                        </Button>
                      )}

                      {result.project_id && (
                        <Button
                          onClick={() => {
                            toast.success('Opening project...');
                            navigate(`/projects/${result.project_id}`);
                          }}
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