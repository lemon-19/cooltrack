import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Reusable confirmation dialog component
 * @param {object} props
 * @param {boolean} props.isOpen - Dialog visibility
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {function} props.onConfirm - Callback on confirm
 * @param {function} props.onCancel - Callback on cancel
 * @param {boolean} props.isLoading - Show loading state
 * @param {string} props.confirmText - Confirm button text (default: "Confirm")
 * @param {string} props.cancelText - Cancel button text (default: "Cancel")
 * @param {'danger'|'warning'|'info'} props.variant - Dialog variant (default: "info")
 */
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}) => {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      bgIcon: 'bg-red-100',
      textIcon: 'text-red-600',
      btnConfirm: 'bg-red-600 hover:bg-red-700',
      border: 'border-l-4 border-red-500',
    },
    warning: {
      bgIcon: 'bg-yellow-100',
      textIcon: 'text-yellow-600',
      btnConfirm: 'bg-yellow-600 hover:bg-yellow-700',
      border: 'border-l-4 border-yellow-500',
    },
    info: {
      bgIcon: 'bg-blue-100',
      textIcon: 'text-blue-600',
      btnConfirm: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-l-4 border-blue-500',
    },
  };

  const config = variantConfig[variant] || variantConfig.info;
  const Icon = variant === 'danger' || variant === 'warning' ? AlertCircle : CheckCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 ${config.border}`}>
        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`${config.bgIcon} ${config.textIcon} p-3 rounded-full shrink-0`}>
              <Icon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-2 text-sm">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 ${config.btnConfirm} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2`}
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
