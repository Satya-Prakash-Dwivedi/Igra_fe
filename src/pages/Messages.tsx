import React from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';

const Messages: React.FC = () => {
  return (
    <div className="flex-1 p-6 md:p-8 bg-bg-dark h-[calc(100vh-64px)] flex flex-col max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-text-main font-bold text-2xl md:text-3xl">Chat with Igra Studios</h1>
        <p className="text-text-muted text-sm mt-1">
          Your direct line to your editors. Feel free to ask questions or provide feedback. Or just say hi! 👋
        </p>
      </div>

      <div className="flex-1 bg-bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              IS
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-text-main text-sm font-semibold">Igra Studios</span>
                <span className="text-text-muted text-[10px] uppercase tracking-wider">Today</span>
              </div>
              <div className="bg-bg-dark border border-border/50 rounded-2xl rounded-tl-none p-4 text-text-main text-sm leading-relaxed shadow-sm">
                Welcome to Igra Studios! Let me know if there's anything I can help you with.
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-bg-card border-t border-border">
          <div className="flex items-center gap-3 bg-bg-dark border border-border rounded-xl px-4 py-2 focus-within:border-primary/50 transition-all shadow-inner">
            <button className="text-text-muted hover:text-text-main transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Write your message..."
              className="flex-1 bg-transparent border-none outline-none text-text-main placeholder:text-text-muted py-2 text-sm"
            />
            <button className="bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition-colors shadow-lg">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link to="/support" className="text-primary text-sm font-medium hover:underline transition-all">
          Or, open a support ticket →
        </Link>
      </div>
    </div>
  );
};

export default Messages;
