import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Lock, 
  Mail, 
  ArrowRight, 
  Globe, 
  Cpu, 
  Zap, 
  ChevronRight,
  Shield,
  User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import Button from '../components/Button';
import Input from '../components/Input';
import { createLogger, serializeError } from '../services/logger';

const logger = createLogger('Login');

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userData = await login({ email: email.trim(), password });
      if (userData.role === 'admin' || userData.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      logger.error('login.failed', { error: serializeError(err) });
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    
    setIsResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      const response = await authService.resendVerification(email.trim());
      setResendSuccess(response.message);
    } catch (err: any) {
      console.error('Resend verification failed:', err);
      setError(err?.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-6xl w-full gap-20 items-center relative z-10">
        {/* Left Side */}
        <div className="hidden lg:block space-y-12 animate-in slide-in-from-left-8 duration-700">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
             <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                <Package size={24} />
             </div>
             <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-white uppercase italic leading-none">
                  Igra
                </span>
                <span className="text-primary text-[8px] tracking-[0.3em] font-bold uppercase">Studios</span>
             </div>
          </div>
          
          <div className="space-y-6">
             <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                Welcome to the <br />
                <span className="text-primary">Studio Portal</span>
             </h1>
             <p className="text-text-dim/60 text-base max-w-sm">
                Manage your video projects, collaborate with our editors, and track your content delivery in real-time.
             </p>
          </div>

          <div className="flex items-center gap-8 opacity-20">
             <div className="flex flex-col items-center gap-2">
                <Globe size={18} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Global</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <Cpu size={18} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Speed</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <Shield size={18} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Secure</span>
             </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="flex justify-center lg:justify-end animate-in slide-in-from-right-8 duration-700">
          <div className="w-full max-w-md bg-bg-card/40 border border-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-10">
               <div className="lg:hidden flex justify-center mb-8">
                  <div className="w-14 h-14 bg-white text-black rounded-xl flex items-center justify-center shadow-xl">
                     <Package size={28} />
                  </div>
               </div>
               <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Secure Access</p>
               <h2 className="text-3xl font-bold text-white tracking-tight italic">Welcome <span className="text-primary not-italic">Back</span></h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Email Address</label>
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-12 rounded-xl bg-white/5 border-white/5 focus:ring-2 focus:ring-primary/50 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Password</label>
                                       <Link to="/forgot-password" className="text-primary/60 hover:text-primary font-bold uppercase tracking-widest text-[10px]">Forgot?</Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  showPasswordToggle
                  className="h-12 rounded-xl bg-white/5 border-white/5 focus:ring-2 focus:ring-primary/50 text-sm"
                  required
                />
              </div>

              {error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-error/10 border border-error/20 rounded-xl text-[10px] font-bold text-error uppercase tracking-widest animate-in shake">
                    <Shield size={14} />
                    {error}
                  </div>
                  
                  {error.includes('verify your email') && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend Verification Link'}
                    </button>
                  )}
                </div>
              )}

              {resendSuccess && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-bold text-primary uppercase tracking-widest animate-in slide-in-from-top-2">
                  <Zap size={14} />
                  {resendSuccess}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="h-14 rounded-2xl font-bold text-sm shadow-2xl shadow-primary/20"
              >
                Sign In
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="text-center pt-2">
                 <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest flex items-center justify-center gap-2">
                    Don't have an account? 
                    <Link to="/register" className="text-primary hover:underline flex items-center gap-1">
                       Sign Up <ChevronRight size={10} />
                    </Link>
                 </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
