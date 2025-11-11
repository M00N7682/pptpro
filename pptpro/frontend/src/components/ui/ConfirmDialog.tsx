/**
 * Confirmation Dialog component
 */
import React from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h3>{title}</h3>
        </div>
        <div className="confirm-dialog__body">
          <p>{message}</p>
        </div>
        <div className="confirm-dialog__footer">
          <button className="confirm-dialog__button confirm-dialog__button--cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`confirm-dialog__button confirm-dialog__button--${confirmVariant}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
