"use client";

import { useState, useMemo } from "react";
import { createSale } from "@/lib/actions/sales";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, Search, Receipt, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  unit: string;
  category: string;
  costPrice: number;
  minStock: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  _count?: { sales: number };
}

interface LineItem {
  productId: string;
  product: Product;
  quantity: number;
}

export default function BillingClient({
  products,
  customers,
}: {
  products: Product[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredProducts = useMemo(
    () =>
      productSearch.length > 0
        ? products.filter(
            (p) =>
              p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
              p.sku.toLowerCase().includes(productSearch.toLowerCase())
          )
        : [],
    [productSearch, products]
  );

  const filteredCustomers = useMemo(
    () =>
      customerSearch.length > 0
        ? customers.filter(
            (c) =>
              c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
              c.phone.includes(customerSearch)
          )
        : [],
    [customerSearch, customers]
  );

  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const total = subtotal - discount + tax;

  function addItem(product: Product) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems((prev) => [...prev, { productId: product.id, product, quantity: 1 }]);
    }
    setProductSearch("");
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
  }

  async function handleSubmit() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const sale = await createSale({
        customerId: selectedCustomer || undefined,
        discount,
        tax,
        paymentMethod,
        note: note || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setSuccess(sale.invoiceNumber);
      setItems([]);
      setDiscount(0);
      setTax(0);
      setNote("");
      setSelectedCustomer("");
      router.refresh();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-20">
        <CheckCircle size={48} className="mx-auto text-success mb-4" />
        <h2 className="text-lg font-semibold mb-1">Invoice Created</h2>
        <p className="text-sm text-muted-fg mb-1">Invoice #{success}</p>
        <p className="text-xs text-muted-fg mb-6">Stock has been updated in Inventory.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setSuccess(null)}
            className="bg-accent text-accent-fg px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
          >
            New Invoice
          </button>
          <button
            onClick={() => router.push("/inventory")}
            className="border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
          >
            View Inventory
          </button>
          <button
            onClick={() => router.push("/sales")}
            className="border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
          >
            View Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">New Invoice</h1>
        <p className="text-sm text-muted-fg mt-0.5">Create a new bill</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="block text-xs text-muted-fg mb-2">Add Products</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background"
              />
              {filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-center justify-between text-sm"
                    >
                      <span>
                        {p.name} <span className="text-muted-fg text-xs">({p.sku})</span>
                      </span>
                      <span className="font-medium">{formatCurrency(p.sellingPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <Receipt size={32} className="mx-auto text-muted-fg mb-2" />
              <p className="text-sm text-muted-fg">Add products to create an invoice</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-left text-muted-fg border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.productId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-fg">
                          Stock: {item.product.stock} {item.product.unit}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted text-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted text-sm"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.product.sellingPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.product.sellingPrice * item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => updateQuantity(item.productId, 0)}
                          className="p-1 text-muted-fg hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <label className="block text-xs text-muted-fg">Customer (optional)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer("");
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              />
              {filteredCustomers.length > 0 && !selectedCustomer && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-36 overflow-y-auto z-10">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c.id);
                        setCustomerSearch(c.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    >
                      {c.name} <span className="text-muted-fg">({c.phone})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-fg">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div>
              <label className="block text-xs text-muted-fg mb-1">Discount</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-fg mb-1">Tax</label>
              <input
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs text-muted-fg mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-fg mb-1">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || loading}
            className="w-full bg-accent text-accent-fg py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Creating..." : `Generate Invoice — ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </>
  );
}
