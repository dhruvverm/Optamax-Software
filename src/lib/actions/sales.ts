"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateInvoiceNumber } from "@/lib/utils";

export async function getSales() {
  return prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
}

export async function getSale(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
}

export async function createSale(data: {
  customerId?: string;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  note?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}) {
  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let totalProfit = 0;
  const saleItems = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const total = product.sellingPrice * item.quantity;
    const profit = (product.sellingPrice - product.costPrice) * item.quantity;
    subtotal += total;
    totalProfit += profit;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      costPrice: product.costPrice,
      total,
    };
  });

  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const totalAmount = subtotal - discount + tax;

  const sale = await prisma.sale.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      customerId: data.customerId || null,
      subtotal,
      discount,
      tax,
      totalAmount,
      profit: totalProfit - discount,
      paymentMethod: data.paymentMethod || "cash",
      note: data.note,
      items: { create: saleItems },
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  for (const item of data.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  revalidatePath("/sales");
  revalidatePath("/billing");
  revalidatePath("/inventory");
  revalidatePath("/");
  return sale;
}

export async function getTopProducts(limit = 10) {
  const items = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => ({
    product: productMap.get(item.productId)!,
    totalQuantity: item._sum.quantity || 0,
    totalRevenue: item._sum.total || 0,
  }));
}

export async function getSalesStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonth, lastMonth, allTime, todaySales] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
  ]);

  return {
    today: {
      revenue: todaySales._sum.totalAmount || 0,
      profit: todaySales._sum.profit || 0,
      count: todaySales._count,
    },
    thisMonth: {
      revenue: thisMonth._sum.totalAmount || 0,
      profit: thisMonth._sum.profit || 0,
      count: thisMonth._count,
    },
    lastMonth: {
      revenue: lastMonth._sum.totalAmount || 0,
      profit: lastMonth._sum.profit || 0,
      count: lastMonth._count,
    },
    allTime: {
      revenue: allTime._sum.totalAmount || 0,
      profit: allTime._sum.profit || 0,
      count: allTime._count,
    },
  };
}

export async function getMonthlySalesData() {
  const now = new Date();
  const months = [];

  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    months.push({ start, end, label: start.toLocaleString("default", { month: "short" }) });
  }

  const data = await Promise.all(
    months.map(async (m) => {
      const agg = await prisma.sale.aggregate({
        where: { createdAt: { gte: m.start, lte: m.end } },
        _sum: { totalAmount: true, profit: true },
        _count: true,
      });
      return {
        month: m.label,
        revenue: agg._sum.totalAmount || 0,
        profit: agg._sum.profit || 0,
        orders: agg._count,
      };
    })
  );

  return data;
}
