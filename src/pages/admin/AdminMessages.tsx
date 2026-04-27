import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Search, MessageSquare, ShieldCheck, Clock, Check, MoreVertical, Zap, User, Inbox, CreditCard, ShieldAlert, Calendar, Loader2 } from 'lucide-react'
import messageService from '../../services/messageService'
import type { Message, DirectMessageThread } from '../../services/messageService'
import { serializeError, createLogger } from '../../services/logger'
import socketService from '../../services/socketService'
import Button, { cn } from '../../components/Button'

const logger = createLogger('AdminMessages')

const AdminMessages: React.FC = () => {
  const [threads, setThreads] = useState<DirectMessageThread[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [content, setContent] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchThreads()
  }, [])

  useEffect(() => {
    if (activeUserId) {
      fetchMessages(activeUserId)
      
      socketService.connect()
      socketService.joinDM(activeUserId)

      const socket = socketService.getSocket()
      socket.on('new-dm', (msg: Message) => {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => scrollToBottom(), 100)
      })

      return () => {
        socket.off('new-dm')
        socketService.leaveDM(activeUserId)
      }
    }
  }, [activeUserId])

  const fetchThreads = async () => {
    try {
      setThreadsLoading(true)
      const data = await messageService.listDirectMessageThreads()
      setThreads(data)
    } catch (err: any) {
      logger.error('failed_to_load_threads', { err: serializeError(err) })
    } finally {
      setThreadsLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      setMessagesLoading(true)
      const data = await messageService.getDirectMessagesForUser(userId)
      setMessages(data.messages)
      
      // Update thread unread count locally
      setThreads(prev => prev.map(t => t.userId === userId ? { ...t, unreadCount: 0 } : t))
      setTimeout(() => scrollToBottom(), 100)
    } catch (err) {
      logger.error('failed_to_load_messages', { err: serializeError(err) })
    } finally {
      setMessagesLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !activeUserId) return

    const tempContent = content
    setContent('')

    try {
      await messageService.replyDirectMessage(activeUserId, { content: tempContent })
    } catch (err) {
      setContent(tempContent)
      logger.error('failed_to_send_message', { err: serializeError(err) })
    }
  }

  const activeThread = threads.find(t => t.userId === activeUserId)

  return (
    <div className="absolute inset-0 flex h-full w-full bg-bg-dark overflow-hidden animate-in fade-in duration-700">
      {/* Sidebar: Thread List */}
      <div className="w-[320px] border-r border-white/5 bg-white/[0.01] flex flex-col h-full z-20">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Studio <span className="text-primary italic">Connect</span></h2>
              <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-0.5 opacity-40">Communications</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer border border-white/5">
               <Inbox size={14} />
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-primary transition-all duration-300" size={12} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-white/5 rounded-lg text-[10px] font-medium text-white placeholder:text-text-muted/10 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-inner"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4 space-y-1">
          {threadsLoading ? (
            <div className="flex flex-col items-center py-20 gap-4 opacity-40">
               <Loader2 className="w-4 h-4 animate-spin text-primary" />
               <p className="text-[7px] font-bold uppercase tracking-widest">Scanning...</p>
            </div>
          ) : (
            threads.map(thread => (
              <button 
                key={thread.userId}
                onClick={() => setActiveUserId(thread.userId)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-all duration-300 flex items-start gap-3 relative group border',
                  activeUserId === thread.userId 
                    ? 'bg-primary/10 border-primary/20 shadow-lg' 
                    : 'border-transparent hover:bg-white/5'
                )}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={thread.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                    alt="avatar" 
                    className={cn(
                      "w-9 h-9 rounded-lg object-cover border transition-all duration-500",
                      activeUserId === thread.userId ? "border-primary shadow-lg shadow-primary/20" : "border-white/10 group-hover:border-white/20"
                    )}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-bg-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={cn(
                       "text-[12px] font-bold tracking-tight truncate pr-2 transition-colors",
                       activeUserId === thread.userId ? "text-primary" : "text-white"
                    )}>{thread.user.name}</h4>
                    <span className="text-[7px] font-bold text-text-muted/40 whitespace-nowrap">
                      {new Date(thread.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[9px] truncate transition-opacity",
                    thread.unreadCount > 0 ? "text-white font-bold" : "text-text-muted opacity-40 group-hover:opacity-60"
                  )}>
                    {thread.latestMessage.senderRole === 'client' ? '' : 'You: '}
                    {thread.latestMessage.content}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 flex flex-col bg-bg-dark relative overflow-hidden h-full">
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 shadow-2xl">
                <MessageSquare size={24} className="text-text-muted/10" />
             </div>
             <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-20">Select a Session</p>
          </div>
        ) : (
          <>
            <div className="h-16 border-b border-white/5 bg-bg-dark/60 backdrop-blur-3xl px-8 flex items-center justify-between z-30">
              <div className="flex items-center gap-3">
                 <img 
                   src={activeThread?.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                   alt="avatar" 
                   className="w-8 h-8 rounded-lg border border-white/10 object-cover"
                 />
                 <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">{activeThread?.user.name}</h3>
                    <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-emerald-500 opacity-60">Connected</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[8px] font-mono text-white/20">ID-{activeUserId.slice(-8).toUpperCase()}</span>
                 <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-text-muted hover:text-white transition-all">
                    <MoreVertical size={14} />
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative z-10">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                   <Loader2 size={18} className="animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                   {messages.map((msg, i) => {
                     let isMe = msg.senderRole !== 'client' 
                     return (
                       <div key={msg._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                         <div className={cn(
                           "group relative px-4 py-2.5 max-w-[70%] shadow-lg",
                           isMe 
                             ? "bg-primary text-white rounded-xl rounded-tr-none" 
                             : "bg-white/[0.03] border border-white/10 text-white rounded-xl rounded-tl-none"
                         )}>
                           <p className="text-[12px] leading-relaxed font-medium">{msg.content}</p>
                           <div className={cn(
                             "absolute top-full mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                             isMe ? "right-0 flex-row-reverse" : "left-0"
                           )}>
                             <span className="text-[6px] font-bold text-text-muted uppercase tracking-widest">
                               {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           </div>
                         </div>
                       </div>
                     )
                   })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 pb-6 pt-2 bg-bg-dark z-30">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-lg px-4 py-2 focus-within:border-primary/40 focus-within:bg-white/[0.03] transition-all">
                <button type="button" className="text-text-muted/20 hover:text-primary transition-all">
                  <Paperclip size={16} />
                </button>
                <input 
                  type="text" 
                  placeholder="Type an encrypted reply..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white py-1.5 text-[12px] font-medium placeholder:text-text-muted/20"
                />
                <Button 
                  type="submit" 
                  disabled={!content.trim()}
                  className="w-8 h-8 rounded-lg p-0 flex items-center justify-center shadow-lg shadow-primary/10"
                >
                  <Send size={14} />
                </Button>
              </form>
              <div className="mt-3 flex items-center justify-center gap-2 opacity-10">
                 <div className="w-0.5 h-0.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                 <p className="text-[7px] font-bold text-text-muted uppercase tracking-[0.4em]">Secure Link Protocol Active</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminMessages
