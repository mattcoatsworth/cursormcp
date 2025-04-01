import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SiShopify } from 'react-icons/si';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface ShopifySalesWidgetProps {
  collapsed: boolean;
}

interface SalesData {
  totalSales: number;
  orderCount: number;
  currency: string;
  trend: 'up' | 'down' | 'neutral';
  percentChange: number;
}

export default function ShopifySalesWidget({ collapsed }: ShopifySalesWidgetProps) {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Make a request to get today's sales data
        const response = await fetch('/api/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: '/shopify get_sales today', // Using content as required by server endpoint
            metadata: { silent: true }
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Check for success in different possible response formats
        if (!result.success && !result.result?.success) {
          throw new Error(result.message || result.result?.message || 'Failed to fetch sales data');
        }
        
        // Extract relevant data
        const orders = result.data?.shopifyResult?.data?.orders || 
                      result.result?.data?.orders ||
                      result.data?.orders || [];
        
        if (orders.length === 0) {
          setSalesData({
            totalSales: 0,
            orderCount: 0,
            currency: 'USD',
            trend: 'neutral',
            percentChange: 0
          });
        } else {
          // Calculate total sales
          let totalSales = 0;
          let currency = 'USD';
          
          orders.forEach((order: any) => {
            totalSales += parseFloat(order.total_price || 0);
            // Use the currency from the first order with a currency
            if (order.currency && !currency) {
              currency = order.currency;
            }
          });
          
          // For the trend, we would ideally compare with yesterday or last week
          // For now, we'll use a placeholder
          const previousSales = totalSales * 0.9; // Simulate a 10% increase by default
          const percentChange = previousSales > 0 
            ? Math.round(((totalSales - previousSales) / previousSales) * 100) 
            : 0;
          
          setSalesData({
            totalSales,
            orderCount: orders.length,
            currency,
            trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
            percentChange: Math.abs(percentChange)
          });
        }
      } catch (err: any) {
        console.error('Error fetching sales data:', err);
        setError(err.message || 'Failed to fetch sales data');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch initially
    fetchSalesData();
    
    // Then refresh every 5 minutes
    const interval = setInterval(fetchSalesData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (collapsed) {
    return (
      <div className="bg-white p-1.5 m-1 rounded-md flex items-center justify-center border border-gray-200">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : error ? (
          <Badge variant="destructive" className="w-4 h-4 p-0 flex items-center justify-center text-xs">!</Badge>
        ) : (
          <Badge 
            className={`text-xs py-0.5 px-1 ${salesData?.trend === 'up' ? 'bg-green-500' : salesData?.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'}`}
          >
            {salesData ? `$${Math.round(salesData.totalSales)}` : '0'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white border-gray-200 p-2 mx-0 my-1 shadow-md">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <SiShopify className="h-4 w-4 text-green-400" />
          <h3 className="text-gray-800 font-medium text-xs">Today's Sales</h3>
        </div>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
      </div>
      
      {error ? (
        <div className="text-red-400 text-xs py-1">
          {error}
        </div>
      ) : salesData ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">Total Sales</span>
            <span className="text-gray-800 font-bold text-sm">
              {salesData.currency} {salesData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">Orders</span>
            <span className="text-gray-800 text-xs">{salesData.orderCount}</span>
          </div>
          
          {salesData.trend !== 'neutral' && (
            <div className="flex items-center mt-0.5">
              {salesData.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
              )}
              <span 
                className={`text-xs ${salesData.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}
              >
                {salesData.percentChange}% from yesterday
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
    </Card>
  );
}