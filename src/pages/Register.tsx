import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const res = await register({ name, email, password });
      toast.success(res?.message || 'Registration successful. Please check your email to verify your account.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary opacity-[0.05] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 opacity-[0.03] rounded-full blur-[120px]" />
      
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
                Join the Network
             </div>
             <h1 className="text-6xl font-black text-white tracking-tight leading-[1.1]">
                START YOUR <br />
                <span className="text-primary italic">CREATIVE JOURNEY</span> <br />
                TODAY.
             </h1>
             <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-sm">
                Get access to world-class digital fulfillment tools and specialized production suites.
             </p>
          </div>
        </div>

        {/* Register Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-10">
               <div className="lg:hidden flex justify-center mb-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black">
                     <Package size={32} />
                  </div>
               </div>
               <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">REGISTER</h2>
               <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Create a new account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Full Name</label>
                 <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-primary-hover focus:bg-white/[0.05] transition-all"
                      placeholder="John Doe"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Email Address</label>
                 <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-primary-hover focus:bg-white/[0.05] transition-all"
                      placeholder="name@email.com"
                      required
                    />
                 </div>
              </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Password</label>
                  <div className="relative group">
                     <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" />
                     <input
                       type={showPassword ? 'text' : 'password'}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-primary-hover focus:bg-white/[0.05] transition-all"
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
                className="w-full mt-4 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? 'Creating Account...' : 'Register'}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>

              <div className="text-center pt-2">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Already have an account? <Link to="/login" className="text-primary hover:border-b border-primary transition-all ml-1">Login Here</Link>
                 </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
