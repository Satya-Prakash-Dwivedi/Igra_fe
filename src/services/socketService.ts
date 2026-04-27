import { io, Socket } from 'socket.io-client';
import { createLogger } from './logger';

const logger = createLogger('socketService');

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:5000');

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    logger.info('socket.connecting', { url: SOCKET_URL });
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    });

    this.socket.on('connect', () => {
      logger.info('socket.connected', { id: this.socket?.id });
    });

    this.socket.on('connect_error', (error) => {
      logger.error('socket.connect_error', { error: error.message });
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('socket.disconnected', { reason });
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinOrder(orderId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('join-order', orderId);
      logger.info('socket.joining_order', { orderId });
    }
  }

  leaveOrder(orderId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('leave-order', orderId);
      logger.info('socket.leaving_order', { orderId });
    }
  }

  joinDM(userId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('join-dm', userId);
      logger.info('socket.joining_dm', { userId });
    }
  }

  leaveDM(userId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('leave-dm', userId);
      logger.info('socket.leaving_dm', { userId });
    }
  }
}

export const socketService = new SocketService();
export default socketService;
