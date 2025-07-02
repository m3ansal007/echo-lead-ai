
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: 'up' | 'down';
}

const StatsCard = ({ title, value, change, icon: Icon, trend }: StatsCardProps) => {
  return (
    <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800/50 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
          <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className={cn(
            "text-sm font-medium",
            trend === 'up' ? "text-green-500" : "text-red-500"
          )}>
            {change}
          </span>
          <span className="text-sm text-gray-400 ml-2">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
