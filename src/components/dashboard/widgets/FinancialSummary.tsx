import { useState, useEffect } from "react";
import { supabase } from "../../../../supabase/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
} from "lucide-react";

export function FinancialSummary() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    regularProducts: {
      revenue: 0,
      cost: 0,
      profit: 0,
      count: 0,
    },
    outerProducts: {
      revenue: 0,
      cost: 0,
      profit: 0,
      count: 0,
    },
    combined: {
      revenue: 0,
      cost: 0,
      profit: 0,
      count: 0,
    },
    timeRange: "all",
  });

  useEffect(() => {
    fetchFinancialSummary(summary.timeRange);
  }, [summary.timeRange]);

  const fetchFinancialSummary = async (timeRange: string) => {
    try {
      setLoading(true);

      // Define date range based on selected time range
      let dateFilter = {};
      const now = new Date();
      if (timeRange === "today") {
        const today = new Date().toISOString().split("T")[0];
        dateFilter = { gte: `${today}T00:00:00`, lte: `${today}T23:59:59` };
      } else if (timeRange === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
        dateFilter = { gte: weekAgo };
      } else if (timeRange === "month") {
        const monthAgo = new Date(
          now.setMonth(now.getMonth() - 1),
        ).toISOString();
        dateFilter = { gte: monthAgo };
      }

      // Fetch invoice items with product details
      let query = supabase.from("invoice_items").select(`
        id,
        invoice_id,
        product_id,
        quantity,
        unit_price,
        total_price,
        buying_price,
        is_outer_product,
        invoices:invoice_id(created_at, invoice_type)
      `);

      // Apply date filter if not "all"
      if (timeRange !== "all") {
        query = query.filter("invoices.created_at", dateFilter);
      }

      // Only include sales invoices
      query = query.filter("invoices.invoice_type", "eq", "sales");

      const { data: invoiceItems, error } = await query;

      if (error) throw error;

      // Calculate financial metrics
      let regularRevenue = 0;
      let regularCost = 0;
      let regularCount = 0;
      let outerRevenue = 0;
      let outerCost = 0;
      let outerCount = 0;

      invoiceItems?.forEach((item) => {
        if (item.is_outer_product) {
          outerRevenue += item.total_price || 0;
          outerCost += (item.buying_price || 0) * (item.quantity || 0);
          outerCount++;
        } else {
          regularRevenue += item.total_price || 0;
          regularCost += (item.buying_price || 0) * (item.quantity || 0);
          regularCount++;
        }
      });

      const regularProfit = regularRevenue - regularCost;
      const outerProfit = outerRevenue - outerCost;
      const combinedRevenue = regularRevenue + outerRevenue;
      const combinedCost = regularCost + outerCost;
      const combinedProfit = regularProfit + outerProfit;
      const combinedCount = regularCount + outerCount;

      setSummary({
        regularProducts: {
          revenue: regularRevenue,
          cost: regularCost,
          profit: regularProfit,
          count: regularCount,
        },
        outerProducts: {
          revenue: outerRevenue,
          cost: outerCost,
          profit: outerProfit,
          count: outerCount,
        },
        combined: {
          revenue: combinedRevenue,
          cost: combinedCost,
          profit: combinedProfit,
          count: combinedCount,
        },
        timeRange,
      });
    } catch (error) {
      console.error("Error fetching financial summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (value: string) => {
    setSummary({ ...summary, timeRange: value });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateProfitMargin = (revenue: number, cost: number) => {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
        <Tabs
          defaultValue={summary.timeRange}
          onValueChange={handleTimeRangeChange}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4 h-8">
            <TabsTrigger value="today" className="text-xs">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs">
              Month
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs defaultValue="combined" className="space-y-4">
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="combined" className="text-xs">
                Combined
              </TabsTrigger>
              <TabsTrigger value="regular" className="text-xs">
                Regular Products
              </TabsTrigger>
              <TabsTrigger value="outer" className="text-xs">
                Outer Products
              </TabsTrigger>
            </TabsList>

            <TabsContent value="combined" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-bold">
                        {formatCurrency(summary.combined.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <div className="flex items-center">
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm font-bold">
                        {formatCurrency(summary.combined.cost)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Profit</span>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(summary.combined.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <Badge
                      variant={
                        summary.combined.profit > 0 ? "default" : "destructive"
                      }
                    >
                      {calculateProfitMargin(
                        summary.combined.revenue,
                        summary.combined.cost,
                      ).toFixed(2)}
                      %
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Products Sold</span>
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm font-bold">
                    {summary.combined.count}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="regular" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Regular Revenue</span>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-bold">
                        {formatCurrency(summary.regularProducts.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Regular Cost</span>
                    <div className="flex items-center">
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm font-bold">
                        {formatCurrency(summary.regularProducts.cost)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Regular Profit</span>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(summary.regularProducts.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <Badge
                      variant={
                        summary.regularProducts.profit > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {calculateProfitMargin(
                        summary.regularProducts.revenue,
                        summary.regularProducts.cost,
                      ).toFixed(2)}
                      %
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">
                  Regular Products Sold
                </span>
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm font-bold">
                    {summary.regularProducts.count}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outer" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outer Revenue</span>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-bold">
                        {formatCurrency(summary.outerProducts.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outer Cost</span>
                    <div className="flex items-center">
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm font-bold">
                        {formatCurrency(summary.outerProducts.cost)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outer Profit</span>
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(summary.outerProducts.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <Badge
                      variant={
                        summary.outerProducts.profit > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {calculateProfitMargin(
                        summary.outerProducts.revenue,
                        summary.outerProducts.cost,
                      ).toFixed(2)}
                      %
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Outer Products Sold</span>
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm font-bold">
                    {summary.outerProducts.count}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
