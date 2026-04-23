import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Loader2 } from 'lucide-react';
import authService from '../services/authService';
import { toast } from 'sonner';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;
      
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
        toast.success(res.message || 'Email verified successfully!');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The token may be expired.');
        toast.error(err.response?.data?.message || 'Email verification failed.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary opacity-[0.05] rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl relative text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black">
             <Package size={32} />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Email Verification</h2>
        
        <div className="mt-8 space-y-4">
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center text-primary">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold uppercase tracking-widest">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500">
              <p className="text-sm font-bold uppercase tracking-widest">{message}</p>
              <p className="text-xs mt-2 text-gray-400">Redirecting to login...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
              <p className="text-[10px] font-bold uppercase tracking-widest">{message}</p>
              <button 
                onClick={() => navigate('/login')}
                className="mt-6 py-3 px-6 bg-primary/20 hover:bg-primary/40 text-primary rounded-xl font-bold uppercase tracking-widest text-xs transition-all inline-block"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
