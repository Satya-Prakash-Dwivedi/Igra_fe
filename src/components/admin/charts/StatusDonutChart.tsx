import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '../../Button';

interface StatusDonutChartProps {
  data: {
    draft?: number;
    pendingPayment?: number;
    pendingReview: number;
    inProgress: number;
    finalizing?: number;
    awaitingApproval?: number;
    completed: number;
    cancelled?: number;
  };
  className?: string;
}

const COLORS = {
  'Draft': '#52525B', // Zinc 500
  'Pending Payment': '#F43F5E', // Rose 500
  'Under Review': '#F59E0B', // Amber 500
  'In Progress': '#3B82F6', // Blue 500
  'Finalizing': '#8B5CF6', // Violet 500
  'Awaiting Approval': '#EC4899', // Pink 500
  'Completed': '#10B981', // Emerald 500
  'Cancelled': '#EF4444', // Red 500
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-bg-card border border-border p-3 rounded-xl shadow-xl flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }} />
        <div>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">{data.name}</p>
          <p className="text-white text-sm font-bold">
            {data.value} Orders
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ data, className }) => {
  const chartData = [
    { name: 'Draft', value: data.draft || 0 },
    { name: 'Pending Payment', value: data.pendingPayment || 0 },
    { name: 'Under Review', value: data.pendingReview },
    { name: 'In Progress', value: data.inProgress },
    { name: 'Finalizing', value: data.finalizing || 0 },
    { name: 'Awaiting Approval', value: data.awaitingApproval || 0 },
    { name: 'Completed', value: data.completed },
    { name: 'Cancelled', value: data.cancelled || 0 },
  ].filter(item => item.value > 0); // Only show statuses that have orders

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div className={cn('w-full h-[300px] flex items-center justify-center border border-dashed border-border rounded-xl', className)}>
        <p className="text-text-muted text-sm font-medium">No active orders</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-[300px] relative', className)}>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
        <p className="text-white text-3xl font-bold">{total}</p>
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Total</p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={110}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            cornerRadius={8}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-text-muted font-medium ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusDonutChart;
