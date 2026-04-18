import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const loggedInUser = await login({ email, password });
      if (loggedInUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary opacity-[0.05] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 opacity-[0.03] rounded-full blur-[120px]" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-6xl w-full gap-16 items-center relative z-10">
        {/* Branding Section */}
        <div className="hidden lg:block space-y-12">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-xl">
                <Package size={28} />
             </div>
             <span className="text-2xl font-black tracking-tighter uppercase text-white leading-none italic">
                IGRA <br />
                <span className="text-primary not-italic text-xs tracking-widest block mt-1">STUDIOS</span>
             </span>
          </div>
          
          <div className="space-y-6">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
                Portal Beta
             </div>
             <h1 className="text-6xl font-black text-white tracking-tight leading-[1.1]">
                BUILD YOUR <br />
                <span className="text-primary italic">DIGITAL LEGACY</span> <br />
                EXPERTLY.
             </h1>
             <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-sm">
                Streamline your content production with professional asset synchronization.
             </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-10">
               <div className="lg:hidden flex justify-center mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black">
                     <Package size={32} />
                  </div>
               </div>
               <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">LOGIN</h2>
               <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Access your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <Shield size={12} className="text-gray-600" />
                 </div>
                 <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-primary-hover focus:bg-white/[0.05] transition-all"
                   placeholder="name@email.com"
                   required
                 />
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">Forgot?</Link>
                 </div>
                 <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-primary-hover focus:bg-white/[0.05] transition-all pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-primary transition-colors cursor-pointer p-1 rounded-md"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                 </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? 'Authenticating...' : 'Login'}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>

              <div className="text-center pt-2">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Don't have an account? <Link to="/register" className="text-primary hover:border-b border-primary transition-all ml-1">Register Now</Link>
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
