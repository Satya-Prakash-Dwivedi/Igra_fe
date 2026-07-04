import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '../../Button';

interface StaffWorkloadChartProps {
  data: Array<{ staffId: string; name: string; activeOrders: number }>;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border p-3 rounded-xl shadow-xl">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-primary text-sm font-bold">
          {payload[0].value} Active Orders
        </p>
      </div>
    );
  }
  return null;
};

const StaffWorkloadChart: React.FC<StaffWorkloadChartProps> = ({ data, className }) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn('w-full h-[300px] flex items-center justify-center border border-dashed border-border rounded-xl', className)}>
        <p className="text-text-muted text-sm font-medium">No staff assigned to active orders</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-[300px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis 
            type="number" 
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(254, 67, 49, 0.05)' }} />
          <Bar dataKey="activeOrders" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#FE4331' : 'rgba(254, 67, 49, 0.6)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StaffWorkloadChart;
