"use client";

import { useEffect, useState } from "react";
import { getPnLReport, getExpenses, createExpense, deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const EXPENSE_CATEGORIES = ["Rent", "Salaries", "Utilities", "Marketing", "Supplies", "Transport", "Maintenance", "Other"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface PnLData {
  period: { year: number; month: number };
  revenue: { totalSales: number; totalOrders: number; discounts: number; taxes: number };
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: Record<string, number>;
  totalExpenses: number;
  netProfit: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string | Date;
}

export default function ReportsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [report, setReport] = useState<PnLData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function loadData() {
    setLoading(true);
    const [pnl, exp] = await Promise.all([getPnLReport(year, month), getExpenses()]);
    setReport(pnl);
    setExpenses(exp);
    setLoading(false);
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setExpenseLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createExpense({
        description: fd.get("description") as string,
        amount: parseFloat(fd.get("amount") as string),
        category: fd.get("category") as string,
        date: fd.get("date") as string,
      });
      setShowExpenseForm(false);
      loadData();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
    setExpenseLoading(false);
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    await deleteExpense(id);
    loadData();
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Profit & Loss Report</h1>
          <p className="text-sm text-muted-fg mt-0.5">Monthly financial summary</p>
        </div>
        <button
          onClick={() => setShowExpenseForm(true)}
          className="flex items-center gap-2 bg-accent text-accent-fg px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium min-w-[160px] text-center">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-sm text-muted-fg">Loading report...</p>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <span className="text-xs text-muted-fg uppercase tracking-wide">Revenue</span>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(report.revenue.totalSales)}</p>
              <p className="text-xs text-muted-fg mt-0.5">{report.revenue.totalOrders} orders</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <span className="text-xs text-muted-fg uppercase tracking-wide">Gross Profit</span>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(report.grossProfit)}</p>
              <p className="text-xs text-muted-fg mt-0.5">
                COGS: {formatCurrency(report.costOfGoodsSold)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-fg uppercase tracking-wide">Net Profit</span>
                {report.netProfit >= 0 ? (
                  <TrendingUp size={14} className="text-success" />
                ) : (
                  <TrendingDown size={14} className="text-danger" />
                )}
              </div>
              <p className={`text-2xl font-semibold mt-1 ${report.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                {formatCurrency(report.netProfit)}
              </p>
              <p className="text-xs text-muted-fg mt-0.5">After all expenses</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium mb-4">P&L Statement — {MONTHS[month]} {year}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="font-medium">Revenue</span>
                <span className="font-medium">{formatCurrency(report.revenue.totalSales)}</span>
              </div>
              {report.revenue.discounts > 0 && (
                <div className="flex justify-between py-1 pl-4 text-muted-fg">
                  <span>Less: Discounts</span>
                  <span>-{formatCurrency(report.revenue.discounts)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 pl-4 text-muted-fg">
                <span>Cost of Goods Sold</span>
                <span>-{formatCurrency(report.costOfGoodsSold)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-border font-medium">
                <span>Gross Profit</span>
                <span>{formatCurrency(report.grossProfit)}</span>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-fg uppercase tracking-wide mb-2">Operating Expenses</p>
                {Object.keys(report.expenses).length === 0 ? (
                  <p className="text-xs text-muted-fg pl-4">No expenses recorded</p>
                ) : (
                  Object.entries(report.expenses).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between py-1 pl-4 text-muted-fg">
                      <span>{cat}</span>
                      <span>-{formatCurrency(amount)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between py-1 pl-4 text-muted-fg border-t border-border">
                <span>Total Expenses</span>
                <span>-{formatCurrency(report.totalExpenses)}</span>
              </div>

              <div className={`flex justify-between py-3 border-t-2 border-foreground font-semibold text-base ${report.netProfit >= 0 ? "" : "text-danger"}`}>
                <span>Net Profit / (Loss)</span>
                <span>{formatCurrency(report.netProfit)}</span>
              </div>
            </div>
          </div>

          {expenses.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-medium mb-4">All Expenses</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left text-muted-fg border-b border-border">
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-border last:border-0">
                        <td className="py-2.5">{exp.description}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-muted rounded-full text-xs">{exp.category}</span>
                        </td>
                        <td className="py-2.5 text-muted-fg text-xs">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-right font-medium">{formatCurrency(exp.amount)}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
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
      ) : null}

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card rounded-t-xl sm:rounded-xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Add Expense</h2>
              <button onClick={() => setShowExpenseForm(false)} className="text-muted-fg hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-fg mb-1">Description</label>
                <input name="description" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Amount</label>
                  <input name="amount" type="number" step="0.01" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-xs text-muted-fg mb-1">Category</label>
                  <select name="category" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background">
                    <option value="">Select...</option>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-fg mb-1">Date</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <button
                type="submit"
                disabled={expenseLoading}
                className="w-full bg-accent text-accent-fg py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {expenseLoading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
