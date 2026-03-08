"use client";

import { useState } from "react";
import { sendBulkMessage } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import { Send, MessageSquare, CheckCircle, Users } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  subject: string;
  content: string;
  sentAt: string | Date;
  _count: { recipients: number };
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  _count?: { sales: number };
}

export default function MessagesClient({
  initialMessages,
  customers,
}: {
  initialMessages: Message[];
  customers: Customer[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map((c) => c.id)));
    }
    setSelectAll(!selectAll);
  }

  function toggleCustomer(id: string) {
    const next = new Set(selectedCustomers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCustomers(next);
    setSelectAll(next.size === customers.length);
  }

  async function handleSend() {
    if (!subject.trim() || !content.trim() || selectedCustomers.size === 0) return;
    setLoading(true);
    try {
      const msg = await sendBulkMessage({
        subject,
        content,
        customerIds: Array.from(selectedCustomers),
      });
      setMessages((prev) => [msg, ...prev]);
      setSubject("");
      setContent("");
      setSelectedCustomers(new Set());
      setSelectAll(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Bulk Messages</h1>
        <p className="text-sm text-muted-fg mt-0.5">Send messages to your customers</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success rounded-lg px-4 py-3 mb-4 text-sm animate-fade-in">
          <CheckCircle size={16} />
          Message sent successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium mb-4">Compose Message</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-fg mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Special Offer This Week"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-fg mb-1">Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Type your message here..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Select Recipients</h2>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-muted-fg hover:text-foreground"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </button>
            </div>
            {customers.length === 0 ? (
              <p className="text-sm text-muted-fg">No customers yet</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {customers.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(c.id)}
                      onChange={() => toggleCustomer(c.id)}
                      className="rounded accent-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-fg">{c.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-fg mt-3">
              {selectedCustomers.size} of {customers.length} selected
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !subject.trim() || !content.trim() || selectedCustomers.size === 0}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-fg py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <Send size={16} />
            {loading ? "Sending..." : `Send to ${selectedCustomers.size} customers`}
          </button>
        </div>

        <div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium mb-4">Message History</h2>
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare size={32} className="mx-auto text-muted-fg mb-2" />
                <p className="text-sm text-muted-fg">No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium">{msg.subject}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-fg">
                        <Users size={12} />
                        {msg._count.recipients}
                      </div>
                    </div>
                    <p className="text-xs text-muted-fg mb-2 line-clamp-2">{msg.content}</p>
                    <p className="text-xs text-muted-fg">
                      {format(new Date(msg.sentAt), "dd MMM yyyy, hh:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
