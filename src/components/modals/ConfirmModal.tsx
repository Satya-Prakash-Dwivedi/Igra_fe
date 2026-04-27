import React from 'react';
import { X, ShieldAlert, type LucideIcon } from 'lucide-react';
import Button from '../Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'primary' | 'error' | 'success';
  icon?: LucideIcon;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading,
  variant = 'primary',
  icon: Icon
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          iconBg: 'bg-error/10 border-error/20 text-error shadow-error/5',
          confirmBtn: 'bg-error hover:bg-error/90 shadow-error/10',
          accentColor: 'text-error'
        };
      case 'success':
        return {
          iconBg: 'bg-primary/10 border-primary/20 text-primary shadow-primary/5',
          confirmBtn: 'bg-primary hover:bg-primary/90 shadow-primary/10',
          accentColor: 'text-primary'
        };
      default:
        return {
          iconBg: 'bg-primary/10 border-primary/20 text-primary shadow-primary/5',
          confirmBtn: 'bg-primary hover:bg-primary/90 shadow-primary/10',
          accentColor: 'text-primary'
        };
    }
  };

  const styles = getVariantStyles();

  // Split title into parts to colorize the last word
  const titleParts = title.split(' ');
  const lastWord = titleParts.pop();
  const titleStart = titleParts.join(' ');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg-card border border-white/5 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-text-dim/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {Icon && (
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xl ${styles.iconBg}`}>
              <Icon size={28} />
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight italic">
              {titleStart} <span className={`${styles.accentColor} not-italic`}>{lastWord}</span>
            </h2>
            <p className="text-text-dim/60 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex flex-col w-full gap-3 pt-2">
            <Button
              variant="primary"
              onClick={onConfirm}
              isLoading={isLoading}
              className={`h-12 rounded-xl font-bold text-sm border-none shadow-lg ${styles.confirmBtn}`}
            >
              {confirmText}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-12 rounded-xl font-bold text-sm border-white/5 bg-white/5 hover:bg-white/10"
            >
              {cancelText}
            </Button>
          </div>

          <div className="flex items-center gap-2 opacity-20">
            <ShieldAlert size={10} className="text-text-dim" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Authorized Action Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
