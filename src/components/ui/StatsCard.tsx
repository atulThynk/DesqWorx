import React from 'react';
import Card from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueClassName?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className = '',
  valueClassName = '',
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className={`mt-1 text-2xl font-semibold ${valueClassName || 'text-gray-900'}`}>
            {value}
          </p>
          {trend && (
            <div className="mt-1 flex items-center">
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <svg
                className={`ml-1 w-3 h-3 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={trend.isPositive ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  );
};

export default StatsCard;