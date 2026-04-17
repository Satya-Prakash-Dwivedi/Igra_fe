import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import messageService from '../services/messageService';
import type { Message } from '../services/messageService';
import { serializeError, createLogger } from '../services/logger';
import { useAuth } from '../hooks/useAuth';
import { io, Socket } from 'socket.io-client';
import { cn } from '../components/Button';

const logger = createLogger('Messages');

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchMessages();
    setupSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const setupSocket = () => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');
    const url = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    const socket = io(url, { auth: { token } });
    
    socket.on('connect', () => {
      socket.emit('join-dm', user.id);
    });

    socket.on('new-dm', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollToBottom(), 100);
    });

    socketRef.current = socket;
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messageService.getDirectMessages();
      setMessages(data.messages);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      logger.error('failed_to_load_user_messages', { err: serializeError(err) });
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
      logger.error('failed_to_send_user_message', { err: serializeError(err) });
    }
  };

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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/noise.png')] opacity-95">
          {loading ? (
            <div className="text-center text-text-muted text-sm py-4">Loading history...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-4">No messages yet. Say hi!</div>
          ) : (
            messages.map((msg) => {
              let isMe = msg.senderRole === 'client';
              return (
                <div key={msg._id} className={cn("flex items-start gap-4 max-w-2xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                  <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center bg-bg-dark text-text-main font-bold text-sm flex-shrink-0 overflow-hidden">
                    {msg.senderId?.avatar ? (
                      <img src={msg.senderId.avatar} className="w-full h-full object-cover" />
                    ) : (
                      isMe ? 'ME' : 'IS'
                    )}
                  </div>
                  <div className={cn("space-y-1", isMe && "text-right")}>
                    <div className={cn("flex items-center gap-2", isMe && "flex-row-reverse")}>
                      <span className="text-text-main text-sm font-semibold">{isMe ? 'You' : msg.senderId?.name || 'Igra Studios'}</span>
                      <span className="text-text-muted text-[10px] uppercase tracking-wider">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    <div className={cn(
                      "p-4 text-sm leading-relaxed shadow-sm",
                      isMe 
                        ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                        : "bg-bg-dark border border-border/50 text-text-main rounded-2xl rounded-tl-none"
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
        <div className="p-4 bg-bg-card border-t border-border">
          <form onSubmit={handleSend} className="flex items-center gap-3 bg-bg-dark border border-border rounded-xl px-4 py-2 focus-within:border-primary/50 transition-all shadow-inner">
            <button type="button" className="text-text-muted hover:text-text-main transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Write your message..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-text-main placeholder:text-text-muted py-2 text-sm"
            />
            <button 
              type="submit"
              disabled={!content.trim()}
              className="bg-primary hover:bg-primary-hover disabled:bg-bg-card disabled:text-text-muted text-white p-2 rounded-lg transition-colors shadow-lg disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </form>
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
