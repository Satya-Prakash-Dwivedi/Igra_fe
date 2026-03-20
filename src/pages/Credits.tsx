import React from 'react';
import { CreditCard, Plus, Check } from 'lucide-react';
import Button from '../components/Button';

const Credits: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$450',
      credits: '500 credits ($0.90 per credit)',
      description: 'Ideal for small creators just starting out.',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$800',
      credits: '1,000 credits ($0.80 per credit)',
      description: 'Best for growing channels with consistent output.',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$1,900',
      credits: '2,500 credits ($0.76 per credit)',
      description: 'For power users and media agencies.',
      popular: false,
    },
  ];

  const badges = [
    "🎧 Team Online 24/7",
    "⚡ Professional & Fast",
    "✓ Satisfaction Guarantee",
    "📈 10K+ Projects Complete",
  ];

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-text-main font-bold text-2xl md:text-3xl">Credits & Plans</h1>
        <Button className="flex items-center gap-2">
          <Plus size={18} />
          Add credits
        </Button>
      </div>

      {/* Available Credits Card */}
      <div className="bg-bg-card border border-border rounded-xl p-6 w-56 mb-10 shadow-lg">
        <CreditCard size={20} className="text-text-muted mb-4" />
        <p className="text-text-muted text-sm font-medium">Available Credits</p>
        <h2 className="text-text-main text-4xl font-bold mt-1">0</h2>
      </div>

      {/* Plans Section */}
      <div className="bg-bg-card border border-border rounded-xl p-8 mb-10">
        <div className="mb-10">
          <h2 className="text-text-main font-bold text-2xl">Choose a Plan</h2>
          <p className="text-text-muted text-sm mt-1">Choose a credit plan that suits your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative pt-6">
          {plans.map((plan, idx) => (
            <div key={idx} className="relative flex flex-col">
              {plan.popular && (
                <div className="absolute -top-10 inset-x-0 flex justify-center">
                  <span className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className={`flex-1 bg-bg-dark border rounded-xl p-8 flex flex-col transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary' 
                  : 'border-border hover:border-border/80'
              }`}>
                <h3 className="text-text-main font-bold text-xl mb-2">{plan.name}</h3>
                <p className="text-text-muted text-sm leading-relaxed min-h-[40px] mb-6">
                  {plan.description}
                </p>
                
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-text-main text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-muted text-sm">/mo</span>
                </div>
                
                <p className="text-text-muted text-sm mb-10">{plan.credits}</p>

                <div className="mt-auto">
                  <Button 
                    variant={plan.popular ? 'primary' : 'outline'} 
                    fullWidth 
                    className={`py-3 rounded-lg font-bold text-sm ${
                      !plan.popular ? 'border-primary text-primary hover:bg-primary/5' : ''
                    }`}
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
        {badges.map((badge, idx) => (
          <div key={idx} className="border border-border rounded-full px-5 py-2 text-text-muted text-xs font-medium bg-bg-card/30">
            {badge}
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-bg-card border border-border rounded-xl p-8 min-h-[200px] flex flex-col">
        <h2 className="text-text-main font-semibold text-lg mb-4">Recent Transactions</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm italic">You don't have any transactions yet.</p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
