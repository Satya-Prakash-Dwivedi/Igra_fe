import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Users, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Input from '../components/Input';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceCards = [
    {
      icon: <Shield size={24} />,
      title: 'Secure by Default',
      description: 'Enterprise-grade encryption for all your cinematic assets.',
    },
    {
      icon: <Zap size={24} />,
      title: 'Fast Delivery',
      description: 'Proprietary streaming tech for instant review and approval.',
    },
    {
      icon: <Users size={24} />,
      title: 'Global Teams',
      description: 'Collaborate with creators from all over the world in real-time.',
    },
  ];

  const avatars = [
    'https://i.pravatar.cc/40?u=11',
    'https://i.pravatar.cc/40?u=12',
    'https://i.pravatar.cc/40?u=13',
    'https://i.pravatar.cc/40?u=14',
    'https://i.pravatar.cc/40?u=15',
  ];

  return (
    <div className="flex min-h-screen w-full bg-bg-dark text-text-main overflow-hidden">
      {/* Left Side — Branding Panel */}
      <div className="hidden md:flex w-[60%] bg-bg-card relative flex-col items-center justify-center p-12 overflow-hidden border-r border-border">
        {/* Cinematic Radial Glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary opacity-[0.06] rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="absolute top-12 left-12 flex items-center gap-2">
          <img src="/favicon.png" alt="Igra" className="w-6 h-6 object-contain" />
          <span className="text-lg font-bold tracking-tighter uppercase">Igra Studios</span>
        </div>

        <div className="relative w-full max-w-lg z-10 space-y-8">
          <div className="space-y-4">
            {serviceCards.map((card, idx) => (
              <div 
                key={idx}
                className="bg-bg-dark border border-border p-6 rounded-xl transition-all duration-300 hover:border-primary/50 group cursor-default"
              >
                <div className="text-primary mb-3">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-text-main mb-1">{card.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {avatars.map((avatar, i) => (
                <img 
                  key={i}
                  src={avatar} 
                  className="w-10 h-10 rounded-full border-2 border-bg-card object-cover" 
                  alt="Customer"
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-text-muted">
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <span>Join 500+ cinematic creators worldwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Form Panel */}
      <div className="w-full md:w-[40%] flex flex-col p-8 md:p-12 lg:p-16 z-20 bg-bg-dark">
        <div className="md:hidden flex items-center gap-2 mb-12">
          <img src="/favicon.png" alt="Igra" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tighter uppercase">Igra Studios</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
            <p className="text-text-muted text-sm">
              Start your cinematic journey with Igra Studios today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              showPasswordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-md text-xs text-error">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-bg-dark px-2 text-text-muted">or</span>
              </div>
            </div>

            <Button type="button" variant="outline" fullWidth>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Sign up with Google
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
