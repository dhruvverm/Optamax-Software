"use server";

import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalProducts,
    totalCustomers,
    todayStats,
    monthStats,
    recentSales,
    allProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfToday } },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: { include: { product: true } } },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, stock: true, minStock: true },
      orderBy: { stock: "asc" },
    }),
  ]);

  const lowStockItems = allProducts
    .filter((p) => p.stock <= p.minStock)
    .slice(0, 10);

  return {
    totalProducts,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    totalCustomers,
    today: {
      revenue: todayStats._sum.totalAmount || 0,
      profit: todayStats._sum.profit || 0,
      orders: todayStats._count,
    },
    thisMonth: {
      revenue: monthStats._sum.totalAmount || 0,
      profit: monthStats._sum.profit || 0,
      orders: monthStats._count,
    },
    recentSales,
  };
}
