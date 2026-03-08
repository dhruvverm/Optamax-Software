import { getSales, getSalesStats, getTopProducts } from "@/lib/actions/sales";
import { formatCurrency } from "@/lib/utils";
import SalesClient from "./SalesClient";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, stats, topProducts] = await Promise.all([
    getSales(),
    getSalesStats(),
    getTopProducts(10),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in">
      <SalesClient sales={sales} stats={stats} topProducts={topProducts} />
    </div>
  );
}
