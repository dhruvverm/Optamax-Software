import { getProducts } from "@/lib/actions/products";
import { getCustomers } from "@/lib/actions/customers";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [products, customers] = await Promise.all([getProducts(), getCustomers()]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in">
      <BillingClient products={products} customers={customers} />
    </div>
  );
}
