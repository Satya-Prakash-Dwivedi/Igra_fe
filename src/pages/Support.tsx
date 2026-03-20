import React from 'react';
import { 
  MessageCircle, 
  FileText, 
  Video, 
  BookOpen, 
  Plus 
} from 'lucide-react';
import Button from '../components/Button';
import { cn } from '../components/Button';

const Support: React.FC = () => {
  const cards = [
    {
      title: 'Live Chat Support',
      subtitle: 'Get in touch with the team now',
      icon: <MessageCircle size={24} />,
      active: true,
    },
    {
      title: 'Documentation',
      subtitle: 'Read our guides and API docs',
      icon: <FileText size={24} />,
      active: false,
      comingSoon: true,
    },
    {
      title: 'Video Tutorials',
      subtitle: 'Watch how to get the most out of Igra',
      icon: <Video size={24} />,
      active: false,
      comingSoon: true,
    },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark min-h-screen max-w-6xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-text-main font-bold text-2xl md:text-3xl">Support</h1>
        <p className="text-text-muted text-sm mt-2 max-w-2xl">
          Need help with a specific order, payment, or have a question about the app? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {cards.map((card, idx) => (
          <div 
            key={idx}
            className={cn(
              "relative bg-bg-card border rounded-xl p-8 transition-all duration-300 group overflow-hidden",
              card.active 
                ? "border-primary shadow-lg shadow-primary/5 cursor-pointer" 
                : "border-border opacity-60 cursor-default"
            )}
          >
            {card.comingSoon && (
              <span className="absolute top-4 right-4 text-text-muted text-[10px] font-bold tracking-widest uppercase">
                COMING SOON
              </span>
            )}
            
            <div className={cn(
              "mb-6 transition-transform duration-300 group-hover:scale-110",
              card.active ? "text-primary" : "text-text-muted"
            )}>
              {card.icon}
            </div>
            
            <h3 className="text-text-main font-bold text-lg mb-2">{card.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-8 opacity-60 relative group overflow-hidden mb-10">
        <span className="absolute top-4 right-4 text-text-muted text-[10px] font-bold tracking-widest uppercase">
          COMING SOON
        </span>
        <div className="flex items-start gap-6">
          <div className="text-text-muted">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-text-main font-bold text-lg mb-1">Knowledge Base</h3>
            <p className="text-text-muted text-sm">Find answers to common questions about our services and platform.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center md:justify-start">
        <Button className="flex items-center gap-2 px-8 py-4 font-bold rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus size={20} />
          Create support ticket
        </Button>
      </div>
    </div>
  );
};

export default Support;
