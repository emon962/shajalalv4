import { useState, useEffect } from "react";
import { supabase } from "../../../../supabase/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowUpDown, Filter, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Product } from "@/types/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProductSearchProps {
  onAddToCart: (product: Product) => void;
  shopId: string;
}

type SortOption = {
  field: string;
  label: string;
  column: string;
};

const sortOptions: SortOption[] = [
  { field: "name", label: "Product Name", column: "name" },
  { field: "supplier", label: "Supplier", column: "supplier_id" },
  { field: "watt", label: "Wattage", column: "watt" },
];

export function ProductSearch({ onAddToCart, shopId }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [productSuppliers, setProductSuppliers] = useState<
    Record<string, string>
  >({});
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);

  // Filter states
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>(shopId || "all");
  const [wattFilter, setWattFilter] = useState<string>("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");

  useEffect(() => {
    if (shopId) {
      fetchProducts();
      fetchSuppliers();
      fetchShops();
    }
  }, [shopId, sortBy]);

  async function fetchSuppliers() {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({
        variant: "destructive",
        title: "Error fetching suppliers",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function fetchShops() {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("name");

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast({
        variant: "destructive",
        title: "Error fetching shops",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true);

      const sortOption =
        sortOptions.find((option) => option.field === sortBy) || sortOptions[0];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopId)
        .order(sortOption.column, { nullsFirst: false });

      if (error) throw error;

      const supplierIds =
        data?.filter((p) => p.supplier_id).map((p) => p.supplier_id) || [];
      const uniqueSupplierIds = [...new Set(supplierIds)];

      if (uniqueSupplierIds.length > 0) {
        const { data: suppliersData, error: suppliersError } = await supabase
          .from("suppliers")
          .select("id, name")
          .in("id", uniqueSupplierIds);

        if (!suppliersError && suppliersData) {
          const supplierMap: Record<string, string> = {};
          suppliersData.forEach((supplier) => {
            supplierMap[supplier.id] = supplier.name;
          });
          setProductSuppliers(supplierMap);
        }
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error fetching products",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true);

      const sortOption =
        sortOptions.find((option) => option.field === sortBy) || sortOptions[0];

      let query = supabase.from("products").select("*");

      if (shopFilter !== "all") {
        query = query.eq("shop_id", shopFilter);
      }

      if (supplierFilter !== "all") {
        query = query.eq("supplier_id", supplierFilter);
      }

      if (wattFilter) {
        query = query.ilike("watt::text", `%${wattFilter}%`);
      }

      if (sizeFilter) {
        query = query.ilike("size", `%${sizeFilter}%`);
      }

      if (colorFilter) {
        query = query.ilike("color", `%${colorFilter}%`);
      }

      if (modelFilter) {
        query = query.ilike("model", `%${modelFilter}%`);
      }

      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`,
        );
      }

      const { data, error } = await query.order(sortOption.column, {
        nullsFirst: false,
      });

      if (error) throw error;

      const supplierIds =
        data?.filter((p) => p.supplier_id).map((p) => p.supplier_id) || [];
      const uniqueSupplierIds = [...new Set(supplierIds)];

      if (uniqueSupplierIds.length > 0) {
        const { data: suppliersData, error: suppliersError } = await supabase
          .from("suppliers")
          .select("id, name")
          .in("id", uniqueSupplierIds);

        if (!suppliersError && suppliersData) {
          const supplierMap: Record<string, string> = {};
          suppliersData.forEach((supplier) => {
            supplierMap[supplier.id] = supplier.name;
          });
          setProductSuppliers(supplierMap);
        }
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error searching products:", error);
      toast({
        variant: "destructive",
        title: "Error searching products",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { status: "out-of-stock", label: "Out of Stock" };
    if (quantity <= 5) return { status: "low-stock", label: "Low Stock" };
    return { status: "in-stock", label: "In Stock" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "border-green-200 bg-green-50 text-green-600";
      case "low-stock":
        return "border-yellow-200 bg-yellow-50 text-yellow-600";
      case "out-of-stock":
        return "border-red-200 bg-red-50 text-red-600";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search products by name or barcode..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.field} value={option.field}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter Products</h4>
                  <p className="text-sm text-muted-foreground">
                    Narrow down products by specific criteria
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplierFilter">Supplier</Label>
                  <Select
                    value={supplierFilter}
                    onValueChange={setSupplierFilter}
                  >
                    <SelectTrigger id="supplierFilter">
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopFilter">Shop</Label>
                  <Select value={shopFilter} onValueChange={setShopFilter}>
                    <SelectTrigger id="shopFilter">
                      <SelectValue placeholder="All Shops" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shops</SelectItem>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wattFilter">Watt</Label>
                  <Input
                    id="wattFilter"
                    placeholder="Filter by watt"
                    value={wattFilter}
                    onChange={(e) => setWattFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sizeFilter">Size</Label>
                  <Input
                    id="sizeFilter"
                    placeholder="Filter by size"
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorFilter">Color</Label>
                  <Input
                    id="colorFilter"
                    placeholder="Filter by color"
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelFilter">Model</Label>
                  <Input
                    id="modelFilter"
                    placeholder="Filter by model"
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSupplierFilter("all");
                      setShopFilter(shopId || "all");
                      setWattFilter("");
                      setSizeFilter("");
                      setColorFilter("");
                      setModelFilter("");
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSearch();
                      setShowFilters(false);
                    }}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Filter Panel - Horizontal Layout */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-sm font-medium mb-3">Filter Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="supplierFilterInline">Supplier</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger id="supplierFilterInline" className="w-full">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wattFilterInline">Watt</Label>
            <Input
              id="wattFilterInline"
              placeholder="Filter by watt"
              value={wattFilter}
              onChange={(e) => setWattFilter(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="buyingPriceFilter">Buying Price</Label>
            <Input
              id="buyingPriceFilter"
              placeholder="Filter by buying price"
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => {
                // You'll need to add this filter logic
                handleSearch();
              }}
            />
          </div>

          <div>
            <Label htmlFor="sizeFilterInline">Size</Label>
            <Input
              id="sizeFilterInline"
              placeholder="Filter by size"
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="colorFilterInline">Color</Label>
            <Input
              id="colorFilterInline"
              placeholder="Filter by color"
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="modelFilterInline">Model</Label>
            <Input
              id="modelFilterInline"
              placeholder="Filter by model"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="shopFilterInline">Shop</Label>
            <Select value={shopFilter} onValueChange={setShopFilter}>
              <SelectTrigger id="shopFilterInline" className="w-full">
                <SelectValue placeholder="All Shops" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shops</SelectItem>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSupplierFilter("all");
              setShopFilter(shopId || "all");
              setWattFilter("");
              setSizeFilter("");
              setColorFilter("");
              setModelFilter("");
              handleSearch();
            }}
            className="mr-2"
          >
            <X className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
          <Button size="sm" onClick={handleSearch}>
            Apply Filters
          </Button>
        </div>
      </div>

      {(supplierFilter !== "all" ||
        shopFilter !== "all" ||
        wattFilter ||
        sizeFilter ||
        colorFilter ||
        modelFilter) && (
        <div className="flex flex-wrap gap-2 mt-2">
          <p className="text-sm text-gray-500 mr-2 mt-1">Active filters:</p>
          {supplierFilter !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Supplier:{" "}
              {suppliers.find((s) => s.id === supplierFilter)?.name || ""}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSupplierFilter("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {shopFilter !== "all" && shopFilter !== shopId && (
            <Badge variant="outline" className="flex items-center gap-1">
              Shop: {shops.find((s) => s.id === shopFilter)?.name || ""}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setShopFilter(shopId || "all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {wattFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Watt: {wattFilter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setWattFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {sizeFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Size: {sizeFilter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSizeFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {colorFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Color: {colorFilter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setColorFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {modelFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Model: {modelFilter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setModelFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => {
              setSupplierFilter("all");
              setShopFilter(shopId || "all");
              setWattFilter("");
              setSizeFilter("");
              setColorFilter("");
              setModelFilter("");
              handleSearch();
            }}
          >
            Clear All
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No products found. Try a different search term or add new products.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const { status, label } = getStockStatus(product.quantity);
            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg truncate">
                        {product.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getStatusColor(status)}
                      >
                        {label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-600 mb-3">
                      <div className="col-span-2 flex items-center gap-1 mb-1">
                        <span className="font-medium">Supplier:</span>
                        <span className="truncate">
                          {productSuppliers[product.supplier_id] || "Unknown"}
                        </span>
                      </div>

                      {product.barcode && (
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="font-medium">Barcode:</span>
                          <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                            {product.barcode}
                          </span>
                        </div>
                      )}

                      {product.watt && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Watt:</span>
                          <span>{product.watt}W</span>
                        </div>
                      )}

                      {product.size && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Size:</span>
                          <span>{product.size}</span>
                        </div>
                      )}

                      {product.color && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Color:</span>
                          <span>{product.color}</span>
                        </div>
                      )}

                      {product.model && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Model:</span>
                          <span>{product.model}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-3 border-t">
                      <div>
                        <p className="text-lg font-bold text-blue-700">
                          ${product.selling_price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Available:{" "}
                          <span className="font-medium">
                            {product.quantity}
                          </span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        disabled={product.quantity <= 0}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
