import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight,
  Fingerprint,
  Lock,
  ArrowRight
} from 'lucide-react';
import authService from '../services/authService';
import { toast } from 'sonner';
import Button from '../components/Button';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your identity...');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;
      
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Security protocol failed: Missing authorization token.');
        return;
      }

      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Identity verified successfully.');
        toast.success(res.message || 'Identity verified successfully.');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 4000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Authorization failed. Protocol expired.');
        toast.error(err.response?.data?.message || 'Email verification failed.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cinematic Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary opacity-[0.03] rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary opacity-[0.02] rounded-full blur-[120px]" />
      
      <div className="w-full max-w-lg bg-bg-card/40 border border-white/5 backdrop-blur-3xl rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 bg-white text-black rounded-[1.5rem] flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:rotate-6 transition-transform duration-500">
             {status === 'success' ? <ShieldCheck size={36} /> : status === 'error' ? <ShieldAlert size={36} /> : <Fingerprint size={36} className="animate-pulse" />}
          </div>
          
          <div className="space-y-3 mb-12">
            <div className="flex items-center justify-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-[0.4em]">Authorization Protocol</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight italic">
               Identity <span className="text-primary not-italic">verification</span>
            </h1>
          </div>
          
          <div className="w-full">
            {status === 'verifying' && (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center text-primary">
                  <div className="relative mb-6">
                     <Loader2 className="animate-spin text-primary/20" size={64} strokeWidth={1} />
                     <Loader2 className="animate-spin absolute inset-0 text-primary" size={64} strokeWidth={2} style={{ animationDuration: '3s' }} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 italic">{message}</p>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary animate-progress" style={{ width: '100%' }} />
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] text-emerald-500 backdrop-blur-xl">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] italic mb-2">{message}</p>
                  <p className="text-[10px] text-text-dim/40 uppercase tracking-widest flex items-center justify-center gap-2">
                     Redirecting to tactical login
                     <Loader2 size={10} className="animate-spin" />
                  </p>
                </div>
                <Link to="/login">
                   <Button fullWidth className="h-16 rounded-2xl bg-white text-black hover:bg-emerald-500 hover:text-white border-none text-[10px] font-bold uppercase tracking-widest shadow-2xl transition-all duration-500">
                      Access portal now
                   </Button>
                </Link>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-8 bg-error/5 border border-error/10 rounded-[2rem] text-error backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] italic">{message}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={() => navigate('/login')}
                    className="h-16 rounded-2xl bg-white text-black hover:bg-primary hover:text-white border-none text-[10px] font-bold uppercase tracking-widest shadow-2xl transition-all duration-500"
                  >
                    Return to login
                  </Button>
                  <p className="text-[9px] font-bold text-text-dim/20 uppercase tracking-[0.3em]">
                     Security error code: ERR_AUTH_PROTOCOL_EXPIRED
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/5 w-full flex items-center justify-center gap-8 opacity-10">
             <Lock size={16} />
             <div className="w-1 h-1 rounded-full bg-white" />
             <Package size={16} />
             <div className="w-1 h-1 rounded-full bg-white" />
             <ShieldCheck size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
