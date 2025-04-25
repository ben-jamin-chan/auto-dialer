import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtext }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-center">
          <div 
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500">{title}</h2>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
            {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;