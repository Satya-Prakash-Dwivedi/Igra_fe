import { useState } from 'react'
import {
  LifeBuoy,
  MessageSquare,
  BookOpen,
  Mail,
  ArrowRight,
  Plus,
  Search,
  ChevronRight,
  Info,
  ExternalLink,
  ShieldQuestion,
  Globe,
  Cpu
} from 'lucide-react'
import Button, { cn } from '../components/Button'
import SupportTicketModal from '../components/modals/SupportTicketModal'

const Support = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  const cards = [
    {
      title: 'Community Chat',
      subtitle: 'Connect with other creators and our staff on our official Discord server.',
      icon: <MessageSquare size={24} />,
      tag: 'Live',
      active: true,
      onClick: () => window.open('https://discord.gg/igrastudios', '_blank'),
    },
    {
      title: 'Email Support',
      subtitle: 'For complex issues, reach out to our team directly via email.',
      icon: <Mail size={24} />,
      tag: '24h Response',
      active: true,
      onClick: () => window.location.href = 'mailto:support@igrastudios.com',
    },
    {
      title: 'API Status',
      subtitle: 'Check the real-time status of our services and production systems.',
      icon: <Cpu size={24} />,
      tag: 'Operational',
      active: false,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-6 animate-in fade-in duration-700 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-10 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Help Center</p>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Support
          </h1>
          <p className="text-text-dim/60 text-sm max-w-xl">
            Our team is here to help you with any issues or questions you might have regarding your projects or account.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-dark bg-bg-card overflow-hidden grayscale hover:grayscale-0 transition-all">
                   <img src={`https://i.pravatar.cc/100?u=support${i}`} alt="Support" className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
           <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Specialists online
           </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.active ? card.onClick : undefined}
            className={cn(
              'relative bg-bg-card/40 backdrop-blur-xl border rounded-2xl p-8 transition-all duration-300 group overflow-hidden flex flex-col shadow-xl',
              card.active
                ? 'border-white/5 cursor-pointer hover:border-primary/20 hover:bg-white/[0.05] hover:-translate-y-1'
                : 'border-white/[0.02] opacity-40 cursor-default'
            )}
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div
                  className={cn(
                    'w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 transition-all',
                    card.active ? 'text-primary group-hover:bg-primary group-hover:text-white' : 'text-text-dim/20'
                  )}
                >
                  {card.icon}
                </div>
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border",
                  card.active ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-text-dim/40 bg-white/5 border-white/5"
                )}>
                  {card.tag}
                </span>
            </div>

            <div className="relative z-10 flex-1">
               <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {card.title}
               </h3>
               <p className="text-text-dim/40 text-xs leading-relaxed mb-6">
                  {card.subtitle}
               </p>
            </div>

            {card.active && (
               <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5 group-hover:border-primary/10 transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Open Link</span>
                  <ArrowRight
                    size={16}
                    className="text-primary group-hover:translate-x-1 transition-transform"
                  />
               </div>
            )}
          </div>
        ))}
      </div>

      {/* Knowledge Base */}
      <div className="bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-12 relative group overflow-hidden shadow-xl z-10">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-text-dim/20 border border-white/5 shadow-xl group-hover:bg-primary/5 group-hover:text-primary/40 transition-all">
             <BookOpen size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Knowledge Base</h3>
            <p className="text-text-dim/40 text-sm max-w-xl">
               Search our comprehensive guides for immediate answers regarding production standards, billing, and platform features.
            </p>
          </div>
          <div className="text-center">
             <Button variant="outline" className="h-10 px-6 rounded-lg text-[10px] border-white/10 text-text-dim/40 cursor-not-allowed">
                Coming Soon
             </Button>
          </div>
        </div>
      </div>

      {/* Ticket Action */}
      <div className="flex flex-col items-center gap-8 border-t border-white/5 pt-16 relative z-10">
        <div className="text-center space-y-2">
           <LifeBuoy size={40} className="mx-auto text-primary/20 mb-4" />
           <h2 className="text-2xl font-bold text-white">Still need help?</h2>
           <p className="text-text-dim/40 text-sm max-w-sm mx-auto">
              If our guides aren't enough, please create a support ticket and we'll get back to you shortly.
           </p>
        </div>
        
        <Button
          onClick={() => setIsTicketModalOpen(true)}
          className="h-14 px-10 rounded-xl font-bold"
        >
          <Plus size={20} className="mr-2" />
          Create Support Ticket
        </Button>
      </div>

      <SupportTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
    </div>
  )
}

export default Support
