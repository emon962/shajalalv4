import { useState, useEffect } from "react";
import { DashboardLayout } from "../dashboard/layout/DashboardLayout";
import { UnifiedSellProductForm } from "../dashboard/sales/UnifiedSellProductForm";
import { supabase } from "../../../supabase/supabase";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { CustomerSelection } from "../dashboard/sales/CustomerSelection";
import { Card, CardContent } from "@/components/ui/card";

export default function SellProduct() {
  const [shopId, setShopId] = useState<string>("");
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    fetchShops();
  }, []);

  async function fetchShops() {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setShops(data || []);

      if (data && data.length > 0) {
        setShopId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast({
        variant: "destructive",
        title: "Error fetching shops",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const handleCustomerSelected = (name: string, phone: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sell Product</h1>
          <p className="text-gray-500">
            Create a new sale and generate invoice
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3">
            {/* This space is intentionally left empty to align with the right sidebar */}
          </div>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="shop">Shop *</Label>
                  <Select value={shopId} onValueChange={setShopId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {shops.length === 0 && (
                    <p className="text-xs text-red-500">
                      No shops available. Please add a shop first.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CustomerSelection
                  onCustomerSelected={handleCustomerSelected}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <UnifiedSellProductForm
            shopId={shopId}
            customerName={customerName}
            customerPhone={customerPhone}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
