"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getExpenses() {
  return prisma.expense.findMany({ orderBy: { date: "desc" } });
}

export async function createExpense(data: {
  description: string;
  amount: number;
  category: string;
  date?: string;
}) {
  const expense = await prisma.expense.create({
    data: {
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
  revalidatePath("/reports");
  return expense;
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/reports");
}

export async function getPnLReport(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const [sales, expenses, costOfGoods] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _sum: { totalAmount: true, profit: true, discount: true, tax: true },
      _count: true,
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.saleItem.aggregate({
      where: {
        sale: { createdAt: { gte: start, lte: end } },
      },
      _sum: { total: true },
    }),
  ]);

  const totalRevenue = sales._sum.totalAmount || 0;
  const totalCostOfGoodsSold =
    (costOfGoods._sum.total || 0) - (sales._sum.profit || 0);
  const grossProfit = totalRevenue - totalCostOfGoodsSold;

  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;
  for (const exp of expenses) {
    expensesByCategory[exp.category] =
      (expensesByCategory[exp.category] || 0) + exp.amount;
    totalExpenses += exp.amount;
  }

  const netProfit = grossProfit - totalExpenses;

  return {
    period: { year, month },
    revenue: {
      totalSales: totalRevenue,
      totalOrders: sales._count,
      discounts: sales._sum.discount || 0,
      taxes: sales._sum.tax || 0,
    },
    costOfGoodsSold: totalCostOfGoodsSold,
    grossProfit,
    expenses: expensesByCategory,
    totalExpenses,
    netProfit,
  };
}
