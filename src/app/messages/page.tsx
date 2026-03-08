import { getMessages } from "@/lib/actions/messages";
import { getCustomers } from "@/lib/actions/customers";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [messages, customers] = await Promise.all([getMessages(), getCustomers()]);
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in">
      <MessagesClient initialMessages={messages} customers={customers} />
    </div>
  );
}
