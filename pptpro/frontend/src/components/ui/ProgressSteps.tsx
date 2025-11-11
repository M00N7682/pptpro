/**
 * Progress indicator component for multi-step processes
 */
import React from 'react';
import './ProgressSteps.css';

interface Step {
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentStep, completedSteps = [] }) => {
  return (
    <div className="progress-steps">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = completedSteps.includes(stepNumber);
        const isCurrent = stepNumber === currentStep;
        const isPast = stepNumber < currentStep;

        return (
          <div key={index} className="progress-steps__item">
            <div className="progress-steps__step-wrapper">
              <div
                className={`progress-steps__step ${
                  isCompleted || isPast ? 'progress-steps__step--completed' : ''
                } ${isCurrent ? 'progress-steps__step--current' : ''}`}
              >
                {isCompleted || isPast ? '✓' : stepNumber}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`progress-steps__line ${
                    isCompleted || isPast ? 'progress-steps__line--completed' : ''
                  }`}
                />
              )}
            </div>
            <div className="progress-steps__content">
              <div className={`progress-steps__label ${isCurrent ? 'progress-steps__label--current' : ''}`}>
                {step.label}
              </div>
              {step.description && (
                <div className="progress-steps__description">{step.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSteps;
