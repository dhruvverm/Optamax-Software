"use client";

import { useRef, useState } from "react";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  findCustomerByPhone,
  getCustomer,
  importCustomers,
  type ImportRow,
} from "@/lib/actions/customers";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Trash2, X, Users, Phone, Eye, Pencil, Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address?: string | null;
  state?: string | null;
  city?: string | null;
  pincode?: string | null;
  dob?: string | Date | null;
  createdAt: string | Date;
  _count?: { sales: number };
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address?: string | null;
  state?: string | null;
  city?: string | null;
  pincode?: string | null;
  dob?: string | Date | null;
  rightSph?: number | null;
  rightCyl?: number | null;
  rightAxis?: number | null;
  leftSph?: number | null;
  leftCyl?: number | null;
  leftAxis?: number | null;
  addPower?: number | null;
  sales: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    createdAt: string | Date;
    items: Array<{
      quantity: number;
      total: number;
      product: { name: string };
    }>;
  }>;
}

export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneLookup, setPhoneLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<CustomerDetail | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [showLookup, setShowLookup] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<CustomerDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  function parseNum(val: FormDataEntryValue | null): number | undefined {
    if (val == null || val === "") return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const customer = await createCustomer({
        name: fd.get("name") as string,
        phone: fd.get("phone") as string,
        email: (fd.get("email") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        state: (fd.get("state") as string) || undefined,
        city: (fd.get("city") as string) || undefined,
        pincode: (fd.get("pincode") as string) || undefined,
        dob: (fd.get("dob") as string) || undefined,
        rightSph: parseNum(fd.get("rightSph")),
        rightCyl: parseNum(fd.get("rightCyl")),
        rightAxis: parseNum(fd.get("rightAxis")),
        leftSph: parseNum(fd.get("leftSph")),
        leftCyl: parseNum(fd.get("leftCyl")),
        leftAxis: parseNum(fd.get("leftAxis")),
        addPower: parseNum(fd.get("addPower")),
      });
      setCustomers((prev) => [{ ...customer, _count: { sales: 0 } }, ...prev]);
      setShowForm(false);
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    await deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  async function handlePhoneLookup() {
    if (!phoneLookup.trim()) return;
    setLoading(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const result = await findCustomerByPhone(phoneLookup.trim());
      if (result) {
        setLookupResult(result as unknown as CustomerDetail);
      } else {
        setLookupError("No customer found with this phone number");
      }
    } catch {
      setLookupError("Error looking up customer");
    }
    setLoading(false);
  }

  const totalSpent = lookupResult?.sales.reduce((s, sale) => s + sale.totalAmount, 0) || 0;
  const detailTotalSpent = detailCustomer?.sales.reduce((s, sale) => s + sale.totalAmount, 0) || 0;

  function hasPrescription(c: CustomerDetail) {
    return [c.rightSph, c.rightCyl, c.rightAxis, c.leftSph, c.leftCyl, c.leftAxis, c.addPower].some(
      (v) => v != null && Number.isFinite(v)
    );
  }

  function PrescriptionBlock({ c }: { c: CustomerDetail }) {
    if (!hasPrescription(c)) return null;
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-fg mb-2">Prescription</p>
        <div className="border border-border rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-8 py-1.5 text-left pl-2 text-muted-fg"></th>
                <th className="py-1.5 text-center text-muted-fg">SPH</th>
                <th className="py-1.5 text-center text-muted-fg">CYL</th>
                <th className="py-1.5 text-center text-muted-fg">AXIS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 pl-2 font-medium text-muted-fg">R</td>
                <td className="py-1 text-center">{c.rightSph ?? "—"}</td>
                <td className="py-1 text-center">{c.rightCyl ?? "—"}</td>
                <td className="py-1 text-center">{c.rightAxis ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-1 pl-2 font-medium text-muted-fg">L</td>
                <td className="py-1 text-center">{c.leftSph ?? "—"}</td>
                <td className="py-1 text-center">{c.leftCyl ?? "—"}</td>
                <td className="py-1 text-center">{c.leftAxis ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-1 pl-2 font-medium text-muted-fg">Add</td>
                <td className="py-1 text-center" colSpan={3}>{c.addPower ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  async function handleShowHistory(customerId: string) {
    setLoading(true);
    setDetailCustomer(null);
    setShowDetail(true);
    setEditing(false);
    try {
      const result = await getCustomer(customerId);
      if (result) setDetailCustomer(result as unknown as CustomerDetail);
    } catch {
      setDetailCustomer(null);
    }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detailCustomer) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateCustomer(detailCustomer.id, {
        name: fd.get("name") as string,
        phone: fd.get("phone") as string,
        email: (fd.get("email") as string) || "",
        address: (fd.get("address") as string) || "",
        state: (fd.get("state") as string) || "",
        city: (fd.get("city") as string) || "",
        pincode: (fd.get("pincode") as string) || "",
        dob: (fd.get("dob") as string) || "",
        rightSph: parseNum(fd.get("rightSph")),
        rightCyl: parseNum(fd.get("rightCyl")),
        rightAxis: parseNum(fd.get("rightAxis")),
        leftSph: parseNum(fd.get("leftSph")),
        leftCyl: parseNum(fd.get("leftCyl")),
        leftAxis: parseNum(fd.get("leftAxis")),
        addPower: parseNum(fd.get("addPower")),
      });
      const updated = await getCustomer(detailCustomer.id);
      if (updated) setDetailCustomer(updated as unknown as CustomerDetail);
      setEditing(false);
      router.refresh();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setLoading(false);
  }

  function dobToInputValue(dob: string | Date | null | undefined): string {
    if (!dob) return "";
    const s = typeof dob === "string" ? dob : dob.toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return "";
  }

  const COL_MAP: Record<string, keyof ImportRow> = {
    name: "name", "customer name": "name", "full name": "name",
    phone: "phone", "phone number": "phone", mobile: "phone", "mobile number": "phone", "contact": "phone",
    email: "email", "email address": "email", "e-mail": "email",
    address: "address", "street": "address", "locality": "address",
    state: "state", city: "city", pincode: "pincode", "pin code": "pincode", "zip": "pincode", "zip code": "pincode",
    dob: "dob", "date of birth": "dob", "birth date": "dob", birthday: "dob",
    "right sph": "rightSph", "r sph": "rightSph", rightsph: "rightSph",
    "right cyl": "rightCyl", "r cyl": "rightCyl", rightcyl: "rightCyl",
    "right axis": "rightAxis", "r axis": "rightAxis", rightaxis: "rightAxis",
    "left sph": "leftSph", "l sph": "leftSph", leftsph: "leftSph",
    "left cyl": "leftCyl", "l cyl": "leftCyl", leftcyl: "leftCyl",
    "left axis": "leftAxis", "l axis": "leftAxis", leftaxis: "leftAxis",
    "add power": "addPower", add: "addPower", addpower: "addPower", "near addition": "addPower",
  };

  function handleFileSelect(file: File) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const rows: ImportRow[] = raw.map((row) => {
        const mapped: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
          const normalized = key.trim().toLowerCase();
          const field = COL_MAP[normalized];
          if (field) mapped[field] = val;
        }
        const numFields: (keyof ImportRow)[] = ["rightSph", "rightCyl", "rightAxis", "leftSph", "leftCyl", "leftAxis", "addPower"];
        for (const f of numFields) {
          if (mapped[f] !== undefined && mapped[f] !== "") {
            mapped[f] = Number(mapped[f]);
            if (!Number.isFinite(mapped[f] as number)) delete mapped[f];
          } else {
            delete mapped[f];
          }
        }
        return {
          name: String(mapped.name || "").trim(),
          phone: String(mapped.phone || "").trim(),
          email: String(mapped.email || "").trim() || undefined,
          address: String(mapped.address || "").trim() || undefined,
          state: String(mapped.state || "").trim() || undefined,
          city: String(mapped.city || "").trim() || undefined,
          pincode: String(mapped.pincode || "").trim() || undefined,
          dob: String(mapped.dob || "").trim() || undefined,
          ...Object.fromEntries(numFields.filter((f) => mapped[f] !== undefined).map((f) => [f, mapped[f]])),
        } as ImportRow;
      }).filter((r) => r.name && r.phone);

      setImportRows(rows);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (importRows.length === 0) return;
    setLoading(true);
    try {
      const result = await importCustomers(importRows);
      setImportResult(result);
      if (result.imported > 0) {
        router.refresh();
        const fresh = await import("@/lib/actions/customers").then((m) => m.getCustomers());
        setCustomers(fresh as unknown as Customer[]);
      }
    } catch (err) {
      alert("Import failed: " + (err as Error).message);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-fg mt-0.5">{customers.length} customers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowLookup(true)}
            className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Phone size={16} /> Lookup
          </button>
          <button
            onClick={() => { setShowImport(true); setImportRows([]); setImportResult(null); }}
            className="flex items-center gap-2 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Upload size={16} /> Import Data
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-accent text-accent-fg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-card"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-muted-fg mb-3" />
          <p className="text-sm text-muted-fg">No customers found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden -mx-4 sm:mx-0">
          <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-muted-fg border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium text-right">Orders</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleShowHistory(c.id)}
                      disabled={loading}
                      className="font-medium text-left hover:underline focus:underline focus:outline-none disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {c.name}
                      <Eye size={14} className="text-muted-fg shrink-0" />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-fg">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-right">{c._count?.sales || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded hover:bg-muted text-muted-fg hover:text-danger transition-colors"
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

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-xl sm:rounded-xl border border-border w-full max-h-[90vh] overflow-y-auto max-w-md p-4 sm:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Add Customer</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-fg hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-fg mb-1">Name</label>
                <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs text-muted-fg mb-1">Phone</label>
                <input name="phone" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs text-muted-fg mb-1">Email</label>
                <input name="email" type="email" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs text-muted-fg mb-1">Date of Birth</label>
                <input name="dob" type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="block text-xs text-muted-fg mb-1">Address</label>
                <input name="address" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Street / Locality" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">State</label>
                  <input name="state" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">City</label>
                  <input name="city" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Pincode</label>
                  <input name="pincode" type="text" inputMode="numeric" maxLength={6} placeholder="e.g. 110001" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-fg mb-2">Prescription</label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="w-12 py-2 font-medium text-muted-fg text-left pl-3"></th>
                        <th className="py-2 font-medium text-muted-fg text-center">SPH</th>
                        <th className="py-2 font-medium text-muted-fg text-center">CYL</th>
                        <th className="py-2 font-medium text-muted-fg text-center">AXIS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-2 pl-3 font-medium text-muted-fg">R</td>
                        <td className="p-1">
                          <input name="rightSph" type="number" step="0.25" placeholder="—" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                        <td className="p-1">
                          <input name="rightCyl" type="number" step="0.25" placeholder="—" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                        <td className="p-1">
                          <input name="rightAxis" type="number" min="0" max="180" step="1" placeholder="—" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-2 pl-3 font-medium text-muted-fg">L</td>
                        <td className="p-1">
                          <input name="leftSph" type="number" step="0.25" placeholder="—" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                        <td className="p-1">
                          <input name="leftCyl" type="number" step="0.25" placeholder="—" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                        <td className="p-1">
                          <input name="leftAxis" type="number" min="0" max="180" step="1" placeholder="—" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pl-3 font-medium text-muted-fg">Add</td>
                        <td className="p-1" colSpan={3}>
                          <input name="addPower" type="number" step="0.25" placeholder="Near addition" className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-fg py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Customer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLookup && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-xl sm:rounded-xl border border-border w-full max-w-lg p-4 sm:p-6 animate-fade-in max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Customer Phone Lookup</h2>
              <button
                onClick={() => {
                  setShowLookup(false);
                  setLookupResult(null);
                  setLookupError("");
                  setPhoneLookup("");
                }}
                className="text-muted-fg hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter phone number..."
                value={phoneLookup}
                onChange={(e) => setPhoneLookup(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneLookup()}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
              />
              <button
                onClick={handlePhoneLookup}
                disabled={loading}
                className="bg-accent text-accent-fg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "..." : "Search"}
              </button>
            </div>

            {lookupError && <p className="text-sm text-danger mb-3">{lookupError}</p>}

            {lookupResult && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium text-sm">{lookupResult.name}</p>
                  <p className="text-xs text-muted-fg mt-1">{lookupResult.phone}</p>
                  {lookupResult.email && (
                    <p className="text-xs text-muted-fg">{lookupResult.email}</p>
                  )}
                  {lookupResult.dob && (
                    <p className="text-xs text-muted-fg">DOB: {format(new Date(lookupResult.dob), "dd MMM yyyy")}</p>
                  )}
                  {lookupResult.address && (
                    <p className="text-xs text-muted-fg">{lookupResult.address}</p>
                  )}
                  {(lookupResult.city || lookupResult.state || lookupResult.pincode) && (
                    <p className="text-xs text-muted-fg">
                      {[lookupResult.city, lookupResult.state, lookupResult.pincode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="mt-3 flex gap-4">
                    <div>
                      <p className="text-xs text-muted-fg">Total Orders</p>
                      <p className="text-sm font-semibold">{lookupResult.sales.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-fg">Total Spent</p>
                      <p className="text-sm font-semibold">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                  <PrescriptionBlock c={lookupResult} />
                </div>

                {lookupResult.sales.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Purchase History</h3>
                    <div className="space-y-2">
                      {lookupResult.sales.map((sale) => (
                        <div key={sale.id} className="border border-border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-xs">{sale.invoiceNumber}</span>
                            <span className="text-sm font-medium">{formatCurrency(sale.totalAmount)}</span>
                          </div>
                          <p className="text-xs text-muted-fg mb-2">
                            {format(new Date(sale.createdAt), "dd MMM yyyy, hh:mm a")}
                          </p>
                          <div className="text-xs space-y-0.5 text-muted-fg">
                            {sale.items.map((item, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{item.product.name} x {item.quantity}</span>
                                <span>{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-xl sm:rounded-xl border border-border w-full max-w-2xl p-4 sm:p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Import Customers from Excel</h2>
              <button
                onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}
                className="text-muted-fg hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {importResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{importResult.imported} customer{importResult.imported !== 1 ? "s" : ""} imported successfully</p>
                    {importResult.skipped > 0 && (
                      <p className="text-xs text-green-700 mt-0.5">{importResult.skipped} skipped (duplicate phone or missing data)</p>
                    )}
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-800 mb-1">Skipped details:</p>
                    <div className="text-xs text-amber-700 space-y-0.5 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}
                  className="w-full bg-accent text-accent-fg py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Done
                </button>
              </div>
            ) : importRows.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-fg">
                  <FileSpreadsheet size={16} />
                  <span>{importRows.length} customer{importRows.length !== 1 ? "s" : ""} found in file</span>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead className="sticky top-0">
                        <tr className="bg-muted/50 border-b border-border text-left">
                          <th className="px-3 py-2 font-medium text-muted-fg">#</th>
                          <th className="px-3 py-2 font-medium text-muted-fg">Name</th>
                          <th className="px-3 py-2 font-medium text-muted-fg">Phone</th>
                          <th className="px-3 py-2 font-medium text-muted-fg">Email</th>
                          <th className="px-3 py-2 font-medium text-muted-fg">City</th>
                          <th className="px-3 py-2 font-medium text-muted-fg">State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((r, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-muted-fg">{i + 1}</td>
                            <td className="px-3 py-2">{r.name}</td>
                            <td className="px-3 py-2 font-mono">{r.phone}</td>
                            <td className="px-3 py-2 text-muted-fg">{r.email || "—"}</td>
                            <td className="px-3 py-2 text-muted-fg">{r.city || "—"}</td>
                            <td className="px-3 py-2 text-muted-fg">{r.state || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setImportRows([]); if (fileRef.current) fileRef.current.value = ""; }}
                    className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="flex-1 bg-accent text-accent-fg py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Importing..." : `Import ${importRows.length} Customers`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-muted/30 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                >
                  <FileSpreadsheet size={36} className="mx-auto text-muted-fg mb-3" />
                  <p className="text-sm font-medium mb-1">Click to select or drag & drop</p>
                  <p className="text-xs text-muted-fg">Supports .xlsx, .xls, .csv files</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium mb-2">Required columns</p>
                  <p className="text-xs text-muted-fg">Your Excel file should have at least <strong>Name</strong> and <strong>Phone</strong> columns.</p>
                  <p className="text-xs text-muted-fg mt-1.5">Optional: Email, Address, State, City, Pincode, DOB, Right SPH, Right CYL, Right AXIS, Left SPH, Left CYL, Left AXIS, Add Power</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-xl sm:rounded-xl border border-border w-full max-w-lg p-4 sm:p-6 animate-fade-in max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">{editing ? "Edit Customer" : "Purchase History"}</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setDetailCustomer(null);
                  setEditing(false);
                }}
                className="text-muted-fg hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {loading && !detailCustomer ? (
              <p className="text-sm text-muted-fg">Loading...</p>
            ) : detailCustomer && editing ? (
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Name</label>
                  <input name="name" required defaultValue={detailCustomer.name} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Phone</label>
                  <input name="phone" required defaultValue={detailCustomer.phone} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Email</label>
                  <input name="email" type="email" defaultValue={detailCustomer.email || ""} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Date of Birth</label>
                  <input name="dob" type="date" defaultValue={dobToInputValue(detailCustomer.dob)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Address</label>
                  <input name="address" defaultValue={detailCustomer.address || ""} placeholder="Street / Locality" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-fg mb-1">State</label>
                    <input name="state" defaultValue={detailCustomer.state || ""} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-fg mb-1">City</label>
                    <input name="city" defaultValue={detailCustomer.city || ""} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-fg mb-1">Pincode</label>
                    <input name="pincode" type="text" inputMode="numeric" maxLength={6} defaultValue={detailCustomer.pincode || ""} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-2">Prescription</label>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="w-12 py-2 font-medium text-muted-fg text-left pl-3"></th>
                          <th className="py-2 font-medium text-muted-fg text-center">SPH</th>
                          <th className="py-2 font-medium text-muted-fg text-center">CYL</th>
                          <th className="py-2 font-medium text-muted-fg text-center">AXIS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-3 font-medium text-muted-fg">R</td>
                          <td className="p-1"><input name="rightSph" type="number" step="0.25" defaultValue={detailCustomer.rightSph ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                          <td className="p-1"><input name="rightCyl" type="number" step="0.25" defaultValue={detailCustomer.rightCyl ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                          <td className="p-1"><input name="rightAxis" type="number" min="0" max="180" step="1" defaultValue={detailCustomer.rightAxis ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pl-3 font-medium text-muted-fg">L</td>
                          <td className="p-1"><input name="leftSph" type="number" step="0.25" defaultValue={detailCustomer.leftSph ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                          <td className="p-1"><input name="leftCyl" type="number" step="0.25" defaultValue={detailCustomer.leftCyl ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                          <td className="p-1"><input name="leftAxis" type="number" min="0" max="180" step="1" defaultValue={detailCustomer.leftAxis ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                        </tr>
                        <tr>
                          <td className="py-2 pl-3 font-medium text-muted-fg">Add</td>
                          <td className="p-1" colSpan={3}><input name="addPower" type="number" step="0.25" defaultValue={detailCustomer.addPower ?? ""} className="w-full border border-border rounded px-2 py-1.5 text-sm bg-background text-center" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 bg-accent text-accent-fg py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : detailCustomer ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{detailCustomer.name}</p>
                      <p className="text-xs text-muted-fg mt-1">{detailCustomer.phone}</p>
                      {detailCustomer.email && (
                        <p className="text-xs text-muted-fg">{detailCustomer.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80 transition-opacity border border-border rounded-lg px-3 py-1.5"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                  {detailCustomer.dob && (
                    <p className="text-xs text-muted-fg mt-2">DOB: {format(new Date(detailCustomer.dob), "dd MMM yyyy")}</p>
                  )}
                  {detailCustomer.address && (
                    <p className="text-xs text-muted-fg mt-1">{detailCustomer.address}</p>
                  )}
                  {(detailCustomer.city || detailCustomer.state || detailCustomer.pincode) && (
                    <p className="text-xs text-muted-fg mt-0.5">
                      {[detailCustomer.city, detailCustomer.state, detailCustomer.pincode].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="mt-3 flex gap-4">
                    <div>
                      <p className="text-xs text-muted-fg">Total Orders</p>
                      <p className="text-sm font-semibold">{detailCustomer.sales.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-fg">Total Spent</p>
                      <p className="text-sm font-semibold">{formatCurrency(detailTotalSpent)}</p>
                    </div>
                  </div>
                  <PrescriptionBlock c={detailCustomer} />
                </div>

                {detailCustomer.sales.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium mb-2">All purchases</h3>
                    <div className="space-y-2">
                      {detailCustomer.sales.map((sale) => (
                        <div key={sale.id} className="border border-border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-xs">{sale.invoiceNumber}</span>
                            <span className="text-sm font-medium">{formatCurrency(sale.totalAmount)}</span>
                          </div>
                          <p className="text-xs text-muted-fg mb-2">
                            {format(new Date(sale.createdAt), "dd MMM yyyy, hh:mm a")}
                          </p>
                          <div className="text-xs space-y-0.5 text-muted-fg">
                            {sale.items.map((item, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{item.product.name} x {item.quantity}</span>
                                <span>{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-fg">No purchases yet.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-fg">Could not load customer.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
