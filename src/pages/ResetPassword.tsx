import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Lock, 
  ArrowRight, 
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';
import authService from '../services/authService';
import Button from '../components/Button';
import Input from '../components/Input';
import { createLogger, serializeError } from '../services/logger';

const logger = createLogger('ResetPassword');

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      logger.error('resetPassword.failed', { error: serializeError(err) });
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500 text-center">
          <div className="w-full bg-bg-card/40 border border-white/5 backdrop-blur-xl rounded-2xl p-10 shadow-2xl">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Password Reset!</h2>
            <p className="text-text-dim/60 text-sm mb-8">
              Your password has been successfully reset. Redirecting you to login...
            </p>
            <Button onClick={() => navigate('/login')} className="w-full h-12 rounded-xl uppercase tracking-widest font-bold text-[10px]">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="w-full bg-bg-card/40 border border-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-10">
             <div className="flex justify-center mb-8">
                <div className="w-14 h-14 bg-white text-black rounded-xl flex items-center justify-center shadow-xl">
                   <Package size={28} />
                </div>
             </div>
             <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Security Protocol</p>
             <h2 className="text-3xl font-bold text-white tracking-tight italic">Update <span className="text-primary not-italic">Identity</span></h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim/40 ml-1">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                showPasswordToggle
                className="h-14 rounded-2xl bg-black/20 border-white/5 focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim/40 ml-1">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                showPasswordToggle
                className="h-14 rounded-2xl bg-black/20 border-white/5 focus:ring-2 focus:ring-primary/40 text-sm font-medium"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-error/5 border border-error/20 rounded-2xl text-xs font-bold text-error animate-in shake">
                <Shield size={16} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="h-14 rounded-2xl font-bold text-sm shadow-2xl shadow-primary/20"
            >
              Reset Password
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
