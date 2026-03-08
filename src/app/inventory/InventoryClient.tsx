"use client";

import { useState } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/products";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, X, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

const CATEGORIES = ["Electronics", "Clothing", "Food", "Beverages", "Hardware", "Stationery", "Other"];

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      sku: fd.get("sku") as string,
      category: fd.get("category") as string,
      costPrice: parseFloat(fd.get("costPrice") as string),
      sellingPrice: parseFloat(fd.get("sellingPrice") as string),
      stock: parseInt(fd.get("stock") as string),
      minStock: parseInt(fd.get("minStock") as string),
      unit: fd.get("unit") as string,
    };

    try {
      if (editing) {
        const updated = await updateProduct(editing.id, data);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...data } : p)));
      } else {
        const created = await createProduct(data);
        setProducts((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-fg mt-0.5">{products.length} products</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-accent text-accent-fg px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-card"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-muted-fg mb-3" />
          <p className="text-sm text-muted-fg">No products found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-muted-fg border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-fg">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-xs">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-medium",
                        p.stock <= p.minStock ? "text-danger" : "text-foreground"
                      )}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(p); setShowForm(true); }}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-fg hover:text-foreground"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-fg hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-xl sm:rounded-xl border border-border w-full max-h-[90vh] overflow-y-auto max-w-lg p-4 sm:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-muted-fg hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Name</label>
                  <input name="name" required defaultValue={editing?.name} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">SKU</label>
                  <input name="sku" required defaultValue={editing?.sku} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Category</label>
                  <select name="category" required defaultValue={editing?.category || ""} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
                    <option value="">Select...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Unit</label>
                  <input name="unit" required defaultValue={editing?.unit || "pcs"} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Cost Price</label>
                  <input name="costPrice" type="number" step="0.01" required defaultValue={editing?.costPrice} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Selling Price</label>
                  <input name="sellingPrice" type="number" step="0.01" required defaultValue={editing?.sellingPrice} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Stock</label>
                  <input name="stock" type="number" required defaultValue={editing?.stock ?? 0} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Min Stock Alert</label>
                  <input name="minStock" type="number" required defaultValue={editing?.minStock ?? 5} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-fg py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Saving..." : editing ? "Update Product" : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
