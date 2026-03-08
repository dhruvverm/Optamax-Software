import { getCustomers } from "@/lib/actions/customers";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in">
      <CustomersClient initialCustomers={customers} />
    </div>
  );
}
