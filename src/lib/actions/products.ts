"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(data: {
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}) {
  const product = await prisma.product.create({ data });
  revalidatePath("/inventory");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    category?: string;
    costPrice?: number;
    sellingPrice?: number;
    stock?: number;
    minStock?: number;
    unit?: string;
  }
) {
  const product = await prisma.product.update({ where: { id }, data });
  revalidatePath("/inventory");
  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/inventory");
}

export async function searchProducts(query: string) {
  return prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } },
        { category: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
  });
}
