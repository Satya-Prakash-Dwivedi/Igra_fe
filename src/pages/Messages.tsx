import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  User as UserIcon, 
  ShieldCheck, 
  Info,
  Loader2
} from 'lucide-react';
import messageService from '../services/messageService';
import type { Message } from '../services/messageService';
import { createLogger, serializeError } from '../services/logger';
import { cn } from '../components/Button';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socketService';

const logger = createLogger('Messages');

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    if (user?._id) {
      socketService.connect();
      socketService.joinDM(user._id);

      const socket = socketService.getSocket();
      socket.on('new-dm', (msg: Message) => {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(), 100);
      });

      return () => {
        socket.off('new-dm');
        socketService.leaveDM(user._id);
      };
    }
  }, [user?._id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getDirectMessages();
      setMessages(data.messages);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      logger.error('messages.load_failed', { error: serializeError(err) });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tempContent = content;
    setContent('');

    try {
      await messageService.sendDirectMessage({ content: tempContent });
    } catch (err) {
      setContent(tempContent);
      logger.error('messages.send_failed', { error: serializeError(err) });
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col p-6 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-text-dim/60 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Direct chat with Igra Studios editors
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-3 bg-bg-card/40 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-xl">
           <div className="flex -space-x-1.5">
              {[1,2,3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-dark bg-bg-card flex items-center justify-center overflow-hidden">
                   <UserIcon size={12} className="text-text-dim/40" />
                </div>
              ))}
           </div>
           <span className="text-[10px] font-bold text-text-dim/40 uppercase tracking-widest">Editors online</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative z-10">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="animate-spin text-primary/40" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim/40">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
              <MessageSquare size={48} className="text-text-dim/20" />
              <div className="space-y-1">
                <p className="text-white font-bold text-lg">No history found</p>
                <p className="text-text-dim text-sm">Send a message to start the conversation.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (!msg) return null;
              const isMe = msg.senderRole === 'client';
              const senderAvatar = msg.senderId && typeof msg.senderId === 'object' ? msg.senderId.avatar : null;
              const senderName = msg.senderId && typeof msg.senderId === 'object' ? msg.senderId.name : (isMe ? 'You' : 'Editor');
              
              return (
                <div key={msg._id} className={cn("flex items-start gap-4 max-w-[85%] animate-in duration-300", isMe ? "ml-auto flex-row-reverse" : "slide-in-from-left-2")}>
                  <div className="w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center bg-bg-dark text-white font-bold text-xs flex-shrink-0 overflow-hidden shadow-lg">
                    {senderAvatar ? (
                      <img src={senderAvatar} className="w-full h-full object-cover" />
                    ) : (
                      isMe ? <UserIcon size={18} className="text-primary" /> : <ShieldCheck size={18} className="text-success" />
                    )}
                  </div>
                  <div className={cn("space-y-1.5", isMe ? "text-right" : "text-left")}>
                    <div className={cn("flex items-center gap-2", isMe && "flex-row-reverse")}>
                      <span className="text-white text-[10px] font-bold">{senderName}</span>
                      <span className="text-text-dim/40 text-[9px] font-bold uppercase tracking-wider">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className={cn(
                      "px-4 py-3 text-sm font-medium leading-relaxed shadow-xl",
                      isMe 
                        ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                        : "bg-bg-dark border border-white/5 text-text-dim rounded-2xl rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-black/40 border-t border-white/5">
          <form onSubmit={handleSend} className="flex items-center gap-3 bg-bg-dark/60 border border-white/5 rounded-xl px-4 py-2 focus-within:border-primary/40 transition-all shadow-inner">
            <button type="button" className="text-text-dim/40 hover:text-white transition-colors p-2" title="Attach file">
              <Paperclip size={18} />
            </button>
            <input 
              type="text" 
              placeholder="Type your message..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-text-dim/20 py-2 text-sm"
            />
            <Button 
              type="submit"
              disabled={!content.trim()}
              className="h-10 w-10 p-0 flex items-center justify-center rounded-lg"
            >
              <Send size={18} />
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-center gap-2 text-text-dim/20">
             <ShieldCheck size={10} />
             <span className="text-[9px] font-bold uppercase tracking-widest">End-to-end encrypted</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-text-dim/60 text-xs">Need technical help?</p>
        <Link to="/support" className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-lg border border-white/5 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
           Open support ticket
        </Link>
      </div>
    </div>
  );
};

export default Messages;
