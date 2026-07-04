import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isPast } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import type { AdminOrder } from '../../../services/adminService';
import { cn } from '../../Button';
import StatusBadge from '../StatusBadge';

interface UrgentDeadlinesPanelProps {
  orders: AdminOrder[];
  className?: string;
}

const UrgentDeadlinesPanel: React.FC<UrgentDeadlinesPanelProps> = ({ orders, className }) => {
  const navigate = useNavigate();

  if (!orders || orders.length === 0) {
    return (
      <div className={cn('bg-bg-card border border-white/10 rounded-xl p-6 shadow-sm h-full flex flex-col', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Clock size={18} />
          </div>
          <h2 className="text-white font-bold text-lg tracking-tight">Deadlines at Risk</h2>
        </div>
        <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl">
          <p className="text-text-muted text-sm font-medium">All deadlines are safe</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-bg-card border border-error/20 rounded-xl p-6 shadow-sm flex flex-col min-h-[350px] max-h-[500px] lg:max-h-none lg:h-full', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded bg-error/10 flex items-center justify-center text-error relative">
          <AlertTriangle size={18} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full"></span>
        </div>
        <h2 className="text-white font-bold text-lg tracking-tight">Deadlines at Risk</h2>
        <span className="ml-auto bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          Action Required
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {orders.map((order) => {
          const deadline = new Date(order.customDeadline!);
          const past = isPast(deadline);
          
          return (
            <div
              key={order._id}
              onClick={() => navigate(`/admin/orders/${order._id}`)}
              className={cn(
                "group flex flex-col gap-2 p-4 border rounded-lg transition-colors cursor-pointer",
                past 
                  ? "bg-error/5 border-error/30 hover:bg-error/10" 
                  : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    #{order.orderNumber.slice(-3)}
                  </span>
                  <span className="text-text-muted text-xs mx-1 hidden sm:block">•</span>
                  <span className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[180px]">
                    {order.title || 'Untitled'}
                  </span>
                </div>
                <div className="self-start sm:self-auto">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mt-2 gap-2 sm:gap-0">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold">
                    {order.assignedTo?.name?.[0] || 'U'}
                  </div>
                  <span className="truncate max-w-[100px]">{order.assignedTo?.name || 'Unassigned'}</span>
                </div>
                <div className={cn("font-bold flex items-center gap-1", past ? "text-error" : "text-amber-500")}>
                  <Clock size={12} className="shrink-0" />
                  <span className="truncate">
                    {past ? 'Overdue ' : 'Due '}
                    {formatDistanceToNow(deadline, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UrgentDeadlinesPanel;
