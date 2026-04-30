import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Mail, 
  ArrowRight, 
  ChevronLeft,
  Shield,
  Zap
} from 'lucide-react';
import authService from '../services/authService';
import Button from '../components/Button';
import Input from '../components/Input';
import { createLogger, serializeError } from '../services/logger';

const logger = createLogger('ForgotPassword');

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.forgotPassword(email);
      setSuccess(response.message);
    } catch (err: any) {
      logger.error('forgotPassword.failed', { error: serializeError(err) });
      setError(err?.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="w-full bg-bg-card/40 border border-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-10">
             <div className="flex justify-center mb-8">
                <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/')}>
                   <Package size={28} />
                </div>
             </div>
             <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Identity Recovery</p>
             <h2 className="text-3xl font-bold text-white tracking-tight italic">Forgot <span className="text-primary not-italic">Password</span></h2>
             <p className="mt-4 text-text-dim/60 text-sm leading-relaxed">
                Enter your registered email address and we'll transmit a secure reset link to your inbox.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-dim/40 ml-1">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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

            {success && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs font-bold text-primary animate-in slide-in-from-top-2">
                <Zap size={16} />
                {success}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="h-14 rounded-2xl font-bold text-sm shadow-2xl shadow-primary/20"
            >
              Send Reset Link
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="text-center pt-2">
               <Link to="/login" className="text-xs font-bold text-text-dim/40 flex items-center justify-center gap-2 hover:text-white transition-colors group">
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Login
               </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
