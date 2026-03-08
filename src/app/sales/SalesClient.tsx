"use client";

import { useState, Fragment } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, IndianRupee, ShoppingCart, Search } from "lucide-react";
import { format } from "date-fns";

interface Sale {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  profit: number;
  discount: number;
  tax: number;
  paymentMethod: string;
  createdAt: string | Date;
  customer: { name: string; phone: string } | null;
  items: Array<{
    quantity: number;
    unitPrice: number;
    total: number;
    product: { name: string };
  }>;
}

interface Stats {
  today: { revenue: number; profit: number; count: number };
  thisMonth: { revenue: number; profit: number; count: number };
  lastMonth: { revenue: number; profit: number; count: number };
  allTime: { revenue: number; profit: number; count: number };
}

interface TopProduct {
  product: { id: string; name: string };
  totalQuantity: number;
  totalRevenue: number;
}

export default function SalesClient({
  sales,
  stats,
  topProducts,
}: {
  sales: Sale[];
  stats: Stats;
  topProducts: TopProduct[];
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.phone.includes(search)
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Sales</h1>
        <p className="text-sm text-muted-fg mt-0.5">Track all your sales and revenue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-fg uppercase tracking-wide">Today</span>
            <IndianRupee size={16} className="text-muted-fg" />
          </div>
          <p className="text-xl font-semibold">{formatCurrency(stats.today.revenue)}</p>
          <p className="text-xs text-muted-fg mt-0.5">{stats.today.count} orders</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-fg uppercase tracking-wide">This Month</span>
            <TrendingUp size={16} className="text-muted-fg" />
          </div>
          <p className="text-xl font-semibold">{formatCurrency(stats.thisMonth.revenue)}</p>
          <p className="text-xs text-muted-fg mt-0.5">Profit: {formatCurrency(stats.thisMonth.profit)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-fg uppercase tracking-wide">All Time</span>
            <ShoppingCart size={16} className="text-muted-fg" />
          </div>
          <p className="text-xl font-semibold">{formatCurrency(stats.allTime.revenue)}</p>
          <p className="text-xs text-muted-fg mt-0.5">{stats.allTime.count} total orders</p>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium mb-4">Best Selling Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {topProducts.slice(0, 5).map((item, i) => (
              <div key={item.product.id} className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-fg mb-1">#{i + 1}</p>
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-fg">{item.totalQuantity} sold</p>
                <p className="text-sm font-medium mt-1">{formatCurrency(item.totalRevenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
        <input
          type="text"
          placeholder="Search by invoice, customer name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-card"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-fg">No sales found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-muted-fg border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <Fragment key={sale.id}>
                  <tr
                    onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{sale.invoiceNumber}</td>
                    <td className="px-4 py-3">{sale.customer?.name || "Walk-in"}</td>
                    <td className="px-4 py-3 text-muted-fg">
                      {format(new Date(sale.createdAt), "dd MMM yyyy, hh:mm a")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs capitalize">
                        {sale.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(sale.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-success font-medium">
                      {formatCurrency(sale.profit)}
                    </td>
                  </tr>
                  {expanded === sale.id && (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {sale.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>
                                {item.product.name} x {item.quantity}
                              </span>
                              <span>{formatCurrency(item.total)}</span>
                            </div>
                          ))}
                          {sale.discount > 0 && (
                            <div className="flex justify-between text-muted-fg">
                              <span>Discount</span>
                              <span>-{formatCurrency(sale.discount)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </>
  );
}
