import React, { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Search, User } from 'lucide-react'
import messageService from '../../services/messageService'
import type { Message, DirectMessageThread } from '../../services/messageService'
import { serializeError, createLogger } from '../../services/logger'
import { useAuth } from '../../hooks/useAuth'
import { io, Socket } from 'socket.io-client'
import { cn } from '../../components/Button'

const logger = createLogger('AdminMessages')

const AdminMessages: React.FC = () => {
  const { user } = useAuth()
  const [threads, setThreads] = useState<DirectMessageThread[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    fetchThreads()
  }, [])

  useEffect(() => {
    if (activeUserId) {
      fetchMessages(activeUserId)
      setupSocket(activeUserId)
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [activeUserId])

  const setupSocket = (userId: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    const token = localStorage.getItem('token')
    const url = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'
    const socket = io(url, { auth: { token } })
    
    socket.on('connect', () => {
      socket.emit('join-dm', userId)
    })

    socket.on('new-dm', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      setTimeout(() => scrollToBottom(), 100)
    })

    socketRef.current = socket
  }

  const fetchThreads = async () => {
    try {
      setThreadsLoading(true)
      const data = await messageService.listDirectMessageThreads()
      setThreads(data)
    } catch (err: any) {
      setError('Failed to load threads')
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
      // optimistic update is handled by socket emitting back to us, but we can wait for socket.
    } catch (err) {
      setContent(tempContent)
      logger.error('failed_to_send_message', { err: serializeError(err) })
    }
  }

  const activeThread = threads.find(t => t.userId === activeUserId)

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Sidebar: Thread List */}
      <div className="w-80 border-r border-border bg-bg-dark flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-main mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-main focus:border-primary/50 outline-none shadow-sm transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {threadsLoading ? (
            <div className="p-4 text-center text-text-muted text-sm">Loading...</div>
          ) : threads.length === 0 ? (
            <div className="p-4 text-center text-text-muted text-sm">No messages yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {threads.map(thread => (
                <li key={thread.userId}>
                  <button 
                    onClick={() => setActiveUserId(thread.userId)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-bg-card transition-colors flex items-start gap-3 relative',
                      activeUserId === thread.userId && 'bg-bg-card border-l-2 border-primary'
                    )}
                  >
                    <img 
                      src={thread.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full border border-border/50 object-cover shadow-sm bg-bg-dark"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-sm font-semibold text-text-main truncate pr-2">{thread.user.name}</h4>
                        <span className="text-[10px] text-text-muted whitespace-nowrap">
                          {new Date(thread.latestMessage.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        thread.unreadCount > 0 ? "text-text-main font-medium" : "text-text-muted"
                      )}>
                        {thread.latestMessage.senderRole === 'client' ? '' : 'You: '}
                        {thread.latestMessage.content}
                      </p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                        {thread.unreadCount}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 bg-bg-dark flex flex-col h-full bg-[url('/noise.png')] opacity-95">
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted bg-bg-card/50 m-6 rounded-2xl border border-border mt-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-bg-dark border border-border flex items-center justify-center mb-4 shadow-inner">
              <Send size={24} className="text-primary/50" />
            </div>
            <p className="font-medium text-text-main">Select a conversation</p>
            <p className="text-sm mt-1">Choose a conversation from the sidebar to start chatting</p>
          </div>
        ) : (
          <>
            <div className="h-16 border-b border-border bg-bg-card/80 backdrop-blur-md px-6 flex items-center justify-between z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <img 
                  src={activeThread?.user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full border border-border/50 object-cover"
                />
                <div>
                  <h3 className="text-sm font-semibold text-text-main">{activeThread?.user.name}</h3>
                  <p className="text-xs text-text-muted">{activeThread?.user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messagesLoading ? (
                <div className="text-center text-text-muted text-sm py-8">Loading history...</div>
              ) : (
                messages.map((msg, i) => {
                  let isMe = msg.senderRole !== 'client' // Admin or staff
                  return (
                    <div key={msg._id} className={cn("flex items-start gap-4 max-w-2xl", isMe ? "ml-auto flex-row-reverse" : "")}>
                      <img 
                        src={msg.senderId?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                        alt="av" 
                        className="w-8 h-8 rounded-full bg-bg-dark border border-border/50 flex-shrink-0 object-cover"
                      />
                      <div className={cn("space-y-1", isMe && "text-right")}>
                        <div className={cn("flex items-center gap-2", isMe && "flex-row-reverse")}>
                          <span className="text-text-main text-xs font-semibold">{msg.senderId?.name}</span>
                          <span className="text-text-muted text-[10px] tracking-wider uppercase">
                            {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        <div className={cn(
                          "p-3 text-sm leading-relaxed shadow-sm",
                          isMe 
                            ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                            : "bg-bg-card border border-border/50 text-text-main rounded-2xl rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-bg-card border-t border-border">
              <form onSubmit={handleSend} className="flex items-center gap-3 bg-bg-dark border border-border rounded-xl px-4 py-2 focus-within:border-primary/50 transition-all shadow-inner">
                <button type="button" className="text-text-muted hover:text-text-main transition-colors">
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder="Write a message..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-text-main py-2 text-sm placeholder:text-text-muted"
                />
                <button 
                  type="submit" 
                  disabled={!content.trim()}
                  className="bg-primary hover:bg-primary-hover disabled:bg-bg-card disabled:text-text-muted text-white p-2 rounded-lg transition-colors shadow-md disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminMessages
