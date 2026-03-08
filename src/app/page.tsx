import { getDashboardData } from "@/lib/actions/dashboard";
import { getTopProducts, getMonthlySalesData } from "@/lib/actions/sales";
import { formatCurrency } from "@/lib/utils";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [data, topProducts, monthlySales] = await Promise.all([
    getDashboardData(),
    getTopProducts(5),
    getMonthlySalesData(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-fg mt-0.5">Overview of your business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today&apos;s Revenue"
          value={formatCurrency(data.today.revenue)}
          sub={`${data.today.orders} orders`}
          icon={<IndianRupee size={18} />}
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(data.thisMonth.revenue)}
          sub={`${data.thisMonth.orders} orders`}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Products"
          value={String(data.totalProducts)}
          sub={data.lowStockCount > 0 ? `${data.lowStockCount} low stock` : "All stocked"}
          icon={<Package size={18} />}
          warn={data.lowStockCount > 0}
        />
        <StatCard
          label="Customers"
          value={String(data.totalCustomers)}
          sub="Total registered"
          icon={<Users size={18} />}
        />
      </div>

      <DashboardCharts monthlySales={monthlySales} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-fg">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((item, i) => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-fg w-5">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-fg">{item.totalQuantity} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">Low Stock Alerts</h2>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-fg">All products are well stocked</p>
          ) : (
            <div className="space-y-3">
              {data.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={14} className="text-warning" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-danger">
                    {item.stock} / {item.minStock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.recentSales.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium mb-4">Recent Sales</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="text-left text-muted-fg border-b border-border">
                  <th className="pb-2 font-medium">Invoice</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Items</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-mono text-xs">{sale.invoiceNumber}</td>
                    <td className="py-2.5">{sale.customer?.name || "Walk-in"}</td>
                    <td className="py-2.5 text-muted-fg">{sale.items.length} items</td>
                    <td className="py-2.5 text-right font-medium">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-fg uppercase tracking-wide">{label}</span>
        <span className="text-muted-fg">{icon}</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className={`text-xs mt-1 ${warn ? "text-warning" : "text-muted-fg"}`}>{sub}</p>
    </div>
  );
}
