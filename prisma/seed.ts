import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: dbPath }),
});

async function main() {
  console.log("Seeding database...");

  const products = await Promise.all([
    prisma.product.create({
      data: { name: "iPhone 15 Pro", sku: "IP15P-128", category: "Electronics", costPrice: 95000, sellingPrice: 134900, stock: 25, minStock: 5, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "Samsung Galaxy S24", sku: "SGS24-256", category: "Electronics", costPrice: 55000, sellingPrice: 79999, stock: 30, minStock: 5, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "MacBook Air M3", sku: "MBA-M3-256", category: "Electronics", costPrice: 89000, sellingPrice: 114900, stock: 15, minStock: 3, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "AirPods Pro 2", sku: "APP2-USB", category: "Electronics", costPrice: 15000, sellingPrice: 24900, stock: 50, minStock: 10, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "Sony WH-1000XM5", sku: "SONY-XM5", category: "Electronics", costPrice: 18000, sellingPrice: 29990, stock: 20, minStock: 5, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "USB-C Cable 1m", sku: "USBC-1M", category: "Electronics", costPrice: 150, sellingPrice: 499, stock: 200, minStock: 50, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "Tempered Glass iPhone 15", sku: "TG-IP15", category: "Electronics", costPrice: 50, sellingPrice: 299, stock: 3, minStock: 20, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "Notebook A5 Ruled", sku: "NB-A5-R", category: "Stationery", costPrice: 30, sellingPrice: 80, stock: 150, minStock: 30, unit: "pcs" },
    }),
    prisma.product.create({
      data: { name: "Ballpoint Pen Pack (10)", sku: "BP-10PK", category: "Stationery", costPrice: 60, sellingPrice: 150, stock: 100, minStock: 25, unit: "packs" },
    }),
    prisma.product.create({
      data: { name: "Wireless Mouse", sku: "WM-LOGI", category: "Electronics", costPrice: 800, sellingPrice: 1499, stock: 40, minStock: 10, unit: "pcs" },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: { name: "Rahul Sharma", phone: "9876543210", email: "rahul@gmail.com", address: "12 MG Road, Mumbai" },
    }),
    prisma.customer.create({
      data: { name: "Priya Patel", phone: "9898765432", email: "priya.patel@yahoo.com", address: "45 Ring Road, Ahmedabad" },
    }),
    prisma.customer.create({
      data: { name: "Amit Kumar", phone: "9765432100", email: "amit.k@gmail.com", address: "78 Connaught Place, Delhi" },
    }),
    prisma.customer.create({
      data: { name: "Sneha Reddy", phone: "9654321098", email: "sneha.r@outlook.com", address: "23 Banjara Hills, Hyderabad" },
    }),
    prisma.customer.create({
      data: { name: "Vikram Singh", phone: "9543210987", address: "56 Civil Lines, Jaipur" },
    }),
  ]);

  function generateInv() {
    const r = Math.floor(1000 + Math.random() * 9000);
    return `INV-${r}`;
  }

  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  const sales = [
    { customer: customers[0], items: [{ p: products[0], q: 1 }, { p: products[3], q: 1 }], date: daysAgo(0) },
    { customer: customers[1], items: [{ p: products[1], q: 1 }, { p: products[5], q: 2 }], date: daysAgo(1) },
    { customer: customers[2], items: [{ p: products[2], q: 1 }], date: daysAgo(2) },
    { customer: customers[3], items: [{ p: products[4], q: 1 }, { p: products[9], q: 1 }], date: daysAgo(3) },
    { customer: customers[0], items: [{ p: products[5], q: 5 }, { p: products[7], q: 10 }], date: daysAgo(5) },
    { customer: customers[4], items: [{ p: products[0], q: 1 }], date: daysAgo(7) },
    { customer: customers[1], items: [{ p: products[3], q: 2 }, { p: products[8], q: 3 }], date: daysAgo(10) },
    { customer: customers[2], items: [{ p: products[9], q: 2 }, { p: products[5], q: 3 }], date: daysAgo(15) },
    { customer: customers[3], items: [{ p: products[1], q: 1 }], date: daysAgo(20) },
    { customer: customers[4], items: [{ p: products[2], q: 1 }, { p: products[4], q: 1 }], date: daysAgo(25) },
  ];

  for (const sale of sales) {
    let subtotal = 0;
    let profit = 0;
    const items = sale.items.map((i) => {
      const total = i.p.sellingPrice * i.q;
      const itemProfit = (i.p.sellingPrice - i.p.costPrice) * i.q;
      subtotal += total;
      profit += itemProfit;
      return {
        productId: i.p.id,
        quantity: i.q,
        unitPrice: i.p.sellingPrice,
        costPrice: i.p.costPrice,
        total,
      };
    });

    await prisma.sale.create({
      data: {
        invoiceNumber: generateInv(),
        customerId: sale.customer.id,
        subtotal,
        totalAmount: subtotal,
        profit,
        createdAt: sale.date,
        items: { create: items },
      },
    });

    for (const i of sale.items) {
      await prisma.product.update({
        where: { id: i.p.id },
        data: { stock: { decrement: i.q } },
      });
    }
  }

  await Promise.all([
    prisma.expense.create({ data: { description: "Office Rent - March", amount: 25000, category: "Rent", date: daysAgo(5) } }),
    prisma.expense.create({ data: { description: "Electricity Bill", amount: 3500, category: "Utilities", date: daysAgo(10) } }),
    prisma.expense.create({ data: { description: "Staff Salary - Raj", amount: 18000, category: "Salaries", date: daysAgo(1) } }),
    prisma.expense.create({ data: { description: "Google Ads Campaign", amount: 5000, category: "Marketing", date: daysAgo(8) } }),
    prisma.expense.create({ data: { description: "Packaging Supplies", amount: 2000, category: "Supplies", date: daysAgo(12) } }),
  ]);

  await prisma.message.create({
    data: {
      subject: "New Year Sale — Flat 20% Off!",
      content: "Dear Customer, we are excited to announce our New Year Sale! Get flat 20% off on all electronics. Visit us today!",
      sentAt: daysAgo(15),
      recipients: {
        create: customers.map((c) => ({ customerId: c.id })),
      },
    },
  });

  console.log("Seed complete!");
  console.log(`  ${products.length} products`);
  console.log(`  ${customers.length} customers`);
  console.log(`  ${sales.length} sales`);
  console.log(`  5 expenses`);
  console.log(`  1 bulk message`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
