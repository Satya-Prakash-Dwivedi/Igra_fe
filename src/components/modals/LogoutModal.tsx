import React from 'react';
import { LogOut, X, ShieldAlert } from 'lucide-react';
import Button from '../Button';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

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
          <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error shadow-xl shadow-error/5">
            <LogOut size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight italic">
              Terminate <span className="text-primary not-italic">Session</span>?
            </h2>
            <p className="text-text-dim/60 text-sm">
              Are you sure you want to log out? You will need to re-authenticate to access your studio dashboard.
            </p>
          </div>

          <div className="flex flex-col w-full gap-3 pt-4">
            <Button
              variant="primary"
              onClick={onConfirm}
              isLoading={isLoading}
              className="h-14 rounded-2xl font-bold text-sm bg-error hover:bg-error/90 border-none shadow-xl shadow-error/10"
            >
              Confirm Logout
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-14 rounded-2xl font-bold text-sm border-white/5 bg-white/5 hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
          
          <div className="flex items-center gap-2 opacity-20">
             <ShieldAlert size={12} className="text-text-dim" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Secure termination protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
