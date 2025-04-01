import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, BarChart2, PieChart, TrendingUp } from "lucide-react";

// Define types for our metrics
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  type?: "currency" | "percentage" | "number" | "decimal";
  highlight?: boolean;
}

// Shopify metrics data (in a real app, this would come from the API)
const shopifyMetrics = {
  totalSales: 0,
  orderRevenue: 0,
  aov: 0,
  averageOrderValue: 0,
  orders: 0
};

// Triple Whale metrics data (in a real app, this would come from the API)
const tripleWhaleMetrics = {
  adSpend: 0,
  roas: 0.00,
  netProfit: 0,
  mer: 0,
  ncRoas: 0.00
};

// Component for individual metric card
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = "bg-white",
  type = "number",
  highlight = false
}) => {
  // Format value based on type
  const formattedValue = (() => {
    if (type === "currency") {
      return typeof value === "number" 
        ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : value;
    }
    if (type === "percentage") {
      return typeof value === "number" 
        ? `${value}%` 
        : value;
    }
    if (type === "decimal") {
      return typeof value === "number" 
        ? value.toFixed(2) 
        : value;
    }
    return value;
  })();

  // Create a border on the left side with the specified color if highlighted
  const borderStyle = highlight 
    ? { borderBottom: `3px solid ${color === "bg-white" ? "#3b82f6" : color}` }
    : {};

  return (
    <Card className={`${color} h-full`} style={borderStyle}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
          {icon && <div>{icon}</div>}
          <div>{title}</div>
        </div>
        <div className="text-2xl font-semibold">{formattedValue}</div>
      </CardContent>
    </Card>
  );
};

// Component for Shop/Shopify metrics section
const ShopifyMetricsSection: React.FC = () => {
  return (
    <div className="mt-6">
      <div className="flex items-center mb-2">
        <DollarSign className="w-5 h-5 text-green-600 mr-2" />
        <h3 className="text-lg font-medium">Store</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Order Revenue" 
          value={shopifyMetrics.orderRevenue} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
        />
        <MetricCard 
          title="True AOV" 
          value={shopifyMetrics.aov} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
          highlight={true}
        />
        <MetricCard 
          title="Average Order Value" 
          value={shopifyMetrics.averageOrderValue} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
        />
        
        <MetricCard 
          title="Total Sales" 
          value={shopifyMetrics.totalSales} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
        />
        <MetricCard 
          title="Orders" 
          value={shopifyMetrics.orders} 
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
        />
      </div>
    </div>
  );
};

// Component for custom/Triple Whale metrics section
const TripleWhaleMetricsSection: React.FC = () => {
  return (
    <div className="mt-6">
      <div className="flex items-center mb-2">
        <BarChart2 className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium">Triple Whale Metrics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Net Profit" 
          value={tripleWhaleMetrics.netProfit} 
          type="currency"
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50"
        />
        <MetricCard 
          title="ROAS" 
          value={tripleWhaleMetrics.roas} 
          type="decimal"
          icon={<PieChart className="w-4 h-4 text-blue-600" />}
          highlight={true}
        />
        <MetricCard 
          title="MER" 
          value={tripleWhaleMetrics.mer} 
          type="percentage"
          icon={<BarChart2 className="w-4 h-4 text-blue-600" />}
          highlight={true}
        />
        
        <MetricCard 
          title="Ad Spend" 
          value={tripleWhaleMetrics.adSpend} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          highlight={true}
        />
        <MetricCard 
          title="NC-ROAS" 
          value={tripleWhaleMetrics.ncRoas} 
          type="decimal"
          icon={<PieChart className="w-4 h-4 text-blue-600" />}
          highlight={true}
        />
      </div>
    </div>
  );
};

// Main component that combines all sections
export default function MetricsGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Sales" 
          value={shopifyMetrics.totalSales} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
        />
        <MetricCard 
          title="Ad Spend" 
          value={tripleWhaleMetrics.adSpend} 
          type="currency"
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          highlight={true}
        />
        <MetricCard 
          title="ROAS" 
          value={tripleWhaleMetrics.roas} 
          type="decimal"
          icon={<PieChart className="w-4 h-4 text-blue-600" />}
        />
      </div>
      
      <ShopifyMetricsSection />
      <TripleWhaleMetricsSection />
    </div>
  );
}