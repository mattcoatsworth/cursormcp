import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import MetricsGrid from "./MetricsGrid";
import { format, isToday, isYesterday, subDays, differenceInDays } from "date-fns";

// Sample data for different metrics
const sessionsData = [
  { time: "12 AM", Apr1: 85, Mar31: 60 },
  { time: "2 AM", Apr1: 50, Mar31: 45 },
  { time: "4 AM", Apr1: 20, Mar31: 25 },
  { time: "6 AM", Apr1: 10, Mar31: 30 },
  { time: "8 AM", Apr1: 0, Mar31: 50 },
  { time: "10 AM", Apr1: null, Mar31: 80 },
  { time: "12 PM", Apr1: null, Mar31: 100 },
  { time: "2 PM", Apr1: null, Mar31: 120 },
  { time: "4 PM", Apr1: null, Mar31: 140 },
  { time: "6 PM", Apr1: null, Mar31: 160 },
  { time: "8 PM", Apr1: null, Mar31: 150 },
  { time: "10 PM", Apr1: null, Mar31: 110 }
];

const salesData = [
  { time: "12 AM", Apr1: 35.99, Mar31: 20.50 },
  { time: "2 AM", Apr1: 29.99, Mar31: 15.75 },
  { time: "4 AM", Apr1: 19.99, Mar31: 25.99 },
  { time: "6 AM", Apr1: 45.50, Mar31: 39.99 },
  { time: "8 AM", Apr1: 0, Mar31: 85.25 },
  { time: "10 AM", Apr1: null, Mar31: 120.50 },
  { time: "12 PM", Apr1: null, Mar31: 210.75 },
  { time: "2 PM", Apr1: null, Mar31: 175.25 },
  { time: "4 PM", Apr1: null, Mar31: 150.99 },
  { time: "6 PM", Apr1: null, Mar31: 190.25 },
  { time: "8 PM", Apr1: null, Mar31: 200.50 },
  { time: "10 PM", Apr1: null, Mar31: 170.75 }
];

const ordersData = [
  { time: "12 AM", Apr1: 2, Mar31: 1 },
  { time: "2 AM", Apr1: 1, Mar31: 1 },
  { time: "4 AM", Apr1: 1, Mar31: 0 },
  { time: "6 AM", Apr1: 1, Mar31: 1 },
  { time: "8 AM", Apr1: 0, Mar31: 2 },
  { time: "10 AM", Apr1: null, Mar31: 3 },
  { time: "12 PM", Apr1: null, Mar31: 4 },
  { time: "2 PM", Apr1: null, Mar31: 3 },
  { time: "4 PM", Apr1: null, Mar31: 2 },
  { time: "6 PM", Apr1: null, Mar31: 3 },
  { time: "8 PM", Apr1: null, Mar31: 4 },
  { time: "10 PM", Apr1: null, Mar31: 2 }
];

const conversionData = [
  { time: "12 AM", Apr1: 2.35, Mar31: 1.67 },
  { time: "2 AM", Apr1: 2.00, Mar31: 2.22 },
  { time: "4 AM", Apr1: 5.00, Mar31: 0.00 },
  { time: "6 AM", Apr1: 10.00, Mar31: 3.33 },
  { time: "8 AM", Apr1: 0.00, Mar31: 4.00 },
  { time: "10 AM", Apr1: null, Mar31: 3.75 },
  { time: "12 PM", Apr1: null, Mar31: 4.00 },
  { time: "2 PM", Apr1: null, Mar31: 2.50 },
  { time: "4 PM", Apr1: null, Mar31: 1.43 },
  { time: "6 PM", Apr1: null, Mar31: 1.88 },
  { time: "8 PM", Apr1: null, Mar31: 2.67 },
  { time: "10 PM", Apr1: null, Mar31: 1.82 }
];

// Channel list (not using Popover for now due to React hooks error)
const channels = [
  { id: 'all', name: 'All channels' },
  { id: 'online', name: 'Online Store' },
  { id: 'facebook', name: 'Facebook & Instagram' },
  { id: 'sms', name: 'Postscript SMS Marketing' },
  { id: 'pos1310', name: 'Shopify POS (1310)' },
  { id: 'pos3pl', name: 'Shopify POS (3PL)' },
  { id: 'other', name: 'Other' }
];

export default function EcommerceDashboard() {
  // State management
  const [selectedMetric, setSelectedMetric] = useState<'sessions' | 'sales' | 'orders' | 'conversion'>('sessions');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({ 
    from: new Date(), 
    to: new Date() 
  });
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  
  const getDateRangeLabel = (range: { from: Date; to: Date }) => {
    const { from, to } = range;
    
    // Check if both dates are the same
    if (from.getTime() === to.getTime()) {
      if (isToday(from)) return 'Today';
      if (isYesterday(from)) return 'Yesterday';
      return format(from, 'MMM d, yyyy');
    }
    
    // Check common ranges
    const days = differenceInDays(to, from) + 1;
    if (isToday(to) && days === 7) return 'Last 7 days';
    if (isToday(to) && days === 30) return 'Last 30 days';
    if (isToday(to) && days === 90) return 'Last 90 days';
    
    // Custom range
    return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`;
  };
  
  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
    console.log('Date range changed:', range);
    // Here you would typically fetch new data for the selected date range
  };
  
  // Handle channel selection
  const handleChannelSelect = (channel: typeof channels[0]) => {
    setSelectedChannel(channel);
    setShowChannelMenu(false);
    // Here you would typically fetch new data for the selected channel
  };

  // Get the correct data based on selected metric
  const getMetricData = () => {
    switch (selectedMetric) {
      case 'sales':
        return salesData;
      case 'orders':
        return ordersData;
      case 'conversion':
        return conversionData;
      case 'sessions':
      default:
        return sessionsData;
    }
  };
  
  // Get title text for chart based on selected date range
  const getMetricTitleText = () => {
    if (isToday(dateRange.from) && isToday(dateRange.to)) {
      return `Today vs Yesterday`;
    }
    
    if (dateRange.from.getTime() === dateRange.to.getTime()) {
      return `${format(dateRange.from, 'MMM d, yyyy')} vs Previous Day`;
    }
    
    // For ranges
    return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')} vs Previous Period`;
  };

  // Format values based on metric
  const formatMetricValue = (value: number, metric: string) => {
    switch (metric) {
      case 'sales':
        return `$${value.toFixed(2)}`;
      case 'conversion':
        return `${value.toFixed(2)}%`;
      default:
        return value;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <DateRangePicker 
            onApply={handleDateRangeChange}
            onCancel={() => {}} // No-op for cancel since we don't need to do anything
            initialRange={dateRange}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button 
              variant="outline"
              onClick={() => setShowChannelMenu(!showChannelMenu)}
            >
              {selectedChannel.name} <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            
            {showChannelMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-50 w-56">
                <div className="py-1">
                  {channels.map((channel) => (
                    <div 
                      key={channel.id} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleChannelSelect(channel)}
                    >
                      {channel.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center text-green-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>2 live visitors
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${selectedMetric === 'sessions' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedMetric('sessions')}
        >
          <CardContent className="p-4">
            <p className="text-sm">Sessions</p>
            <p className="text-xl font-semibold">242 <span className="text-green-500 text-sm">▲ 54%</span></p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${selectedMetric === 'sales' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedMetric('sales')}
        >
          <CardContent className="p-4">
            <p className="text-sm">Total sales</p>
            <p className="text-xl font-semibold">$216.46 <span className="text-green-500 text-sm">▲ 35%</span></p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${selectedMetric === 'orders' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedMetric('orders')}
        >
          <CardContent className="p-4">
            <p className="text-sm">Orders</p>
            <p className="text-xl font-semibold">5 <span className="text-green-500 text-sm">▲ 25%</span></p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${selectedMetric === 'conversion' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedMetric('conversion')}
        >
          <CardContent className="p-4">
            <p className="text-sm">Conversion rate</p>
            <p className="text-xl font-semibold">2.07% <span className="text-green-500 text-sm">▲ 8%</span></p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="mb-2 text-sm font-medium">{getMetricTitleText()}</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getMetricData()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis 
              tickFormatter={(value) => formatYAxisTick(Number(value), selectedMetric)}
            />
            <Tooltip 
              formatter={(value, name) => {
                return [formatMetricValue(value as number, selectedMetric), name === 'Apr1' ? 'Today' : 'Yesterday'];
              }}
            />
            <Line 
              type="monotone" 
              dataKey="Apr1" 
              name="Today" 
              stroke="#0ea5e9" 
              strokeWidth={2} 
              dot={false} 
            />
            <Line 
              type="monotone" 
              dataKey="Mar31" 
              name="Yesterday" 
              stroke="#60a5fa" 
              strokeWidth={2} 
              strokeDasharray="4 4" 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Add MetricsGrid component below the chart */}
      <div className="mt-6">
        <MetricsGrid />
      </div>

      <div className="text-right text-sm text-muted-foreground">Next payout: $1,022.75</div>
    </div>
  );
}

// Helper functions for formatting
function formatYAxisTick(value: number, metric: string): string {
  switch (metric) {
    case 'sales':
      return `$${value}`;
    case 'conversion':
      return `${value}%`;
    default:
      return value.toString();
  }
}