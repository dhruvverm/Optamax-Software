import { getProducts } from "@/lib/actions/products";
import { formatCurrency } from "@/lib/utils";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await getProducts();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in">
      <InventoryClient initialProducts={products} />
    </div>
  );
}
