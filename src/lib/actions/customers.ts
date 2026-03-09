"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sales: true } },
    },
  });
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
    },
  });
}

export async function findCustomerByPhone(phone: string) {
  return prisma.customer.findUnique({
    where: { phone },
    include: {
      sales: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: { include: { product: true } } },
      },
    },
  });
}

function parseDob(dob: string | undefined): string | undefined {
  if (!dob || typeof dob !== "string" || dob.trim() === "") return undefined;
  const trimmed = dob.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? trimmed
    : trimmed.includes("/")
      ? trimmed.split("/").reverse().join("-")
      : undefined;
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? iso : undefined;
}

function str(val: string | undefined): string | undefined {
  const s = typeof val === "string" ? val.trim() : "";
  return s === "" ? undefined : s;
}
function num(val: number | undefined): number | undefined {
  return val != null && Number.isFinite(val) ? val : undefined;
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  state?: string;
  city?: string;
  pincode?: string;
  dob?: string;
  rightSph?: number;
  rightCyl?: number;
  rightAxis?: number;
  leftSph?: number;
  leftCyl?: number;
  leftAxis?: number;
  addPower?: number;
}) {
  const dobStr = parseDob(data.dob);
  const dataPayload = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    ...(str(data.email) !== undefined && { email: str(data.email) }),
    ...(str(data.address) !== undefined && { address: str(data.address) }),
    ...(str(data.state) !== undefined && { state: str(data.state) }),
    ...(str(data.city) !== undefined && { city: str(data.city) }),
    ...(str(data.pincode) !== undefined && { pincode: str(data.pincode) }),
    ...(dobStr !== undefined && { dob: dobStr }),
    ...(num(data.rightSph) !== undefined && { rightSph: num(data.rightSph) }),
    ...(num(data.rightCyl) !== undefined && { rightCyl: num(data.rightCyl) }),
    ...(num(data.rightAxis) !== undefined && { rightAxis: num(data.rightAxis) }),
    ...(num(data.leftSph) !== undefined && { leftSph: num(data.leftSph) }),
    ...(num(data.leftCyl) !== undefined && { leftCyl: num(data.leftCyl) }),
    ...(num(data.leftAxis) !== undefined && { leftAxis: num(data.leftAxis) }),
    ...(num(data.addPower) !== undefined && { addPower: num(data.addPower) }),
  };

  try {
    const customer = await prisma.customer.create({
      data: dataPayload,
    });
    revalidatePath("/customers");
    return customer;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "P2002") {
      throw new Error("This phone number is already registered.");
    }
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(message || "Failed to create customer.");
  }
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    state?: string;
    city?: string;
    pincode?: string;
    dob?: string;
    rightSph?: number;
    rightCyl?: number;
    rightAxis?: number;
    leftSph?: number;
    leftCyl?: number;
    leftAxis?: number;
    addPower?: number;
  }
) {
  const dobStr = data.dob !== undefined ? (data.dob ? parseDob(data.dob) : null) : undefined;
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.phone !== undefined) payload.phone = data.phone.trim();
  if (data.email !== undefined) payload.email = str(data.email) ?? null;
  if (data.address !== undefined) payload.address = str(data.address) ?? null;
  if (data.state !== undefined) payload.state = str(data.state) ?? null;
  if (data.city !== undefined) payload.city = str(data.city) ?? null;
  if (data.pincode !== undefined) payload.pincode = str(data.pincode) ?? null;
  if (dobStr !== undefined) payload.dob = dobStr;
  if (data.rightSph !== undefined) payload.rightSph = num(data.rightSph) ?? null;
  if (data.rightCyl !== undefined) payload.rightCyl = num(data.rightCyl) ?? null;
  if (data.rightAxis !== undefined) payload.rightAxis = num(data.rightAxis) ?? null;
  if (data.leftSph !== undefined) payload.leftSph = num(data.leftSph) ?? null;
  if (data.leftCyl !== undefined) payload.leftCyl = num(data.leftCyl) ?? null;
  if (data.leftAxis !== undefined) payload.leftAxis = num(data.leftAxis) ?? null;
  if (data.addPower !== undefined) payload.addPower = num(data.addPower) ?? null;

  const customer = await prisma.customer.update({
    where: { id },
    data: payload,
  });
  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
}

export type ImportRow = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  state?: string;
  city?: string;
  pincode?: string;
  dob?: string;
  rightSph?: number;
  rightCyl?: number;
  rightAxis?: number;
  leftSph?: number;
  leftCyl?: number;
  leftAxis?: number;
  addPower?: number;
};

export async function importCustomers(rows: ImportRow[]) {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.name?.trim() || !row.phone?.trim()) {
      skipped++;
      continue;
    }
    const phone = String(row.phone).trim();
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      skipped++;
      errors.push(`${phone} already exists`);
      continue;
    }
    const dobStr = parseDob(row.dob);
    const payload = {
      name: row.name.trim(),
      phone,
      ...(str(row.email) && { email: str(row.email) }),
      ...(str(row.address) && { address: str(row.address) }),
      ...(str(row.state) && { state: str(row.state) }),
      ...(str(row.city) && { city: str(row.city) }),
      ...(str(row.pincode) && { pincode: str(row.pincode) }),
      ...(dobStr && { dob: dobStr }),
      ...(num(row.rightSph) != null && { rightSph: num(row.rightSph) }),
      ...(num(row.rightCyl) != null && { rightCyl: num(row.rightCyl) }),
      ...(num(row.rightAxis) != null && { rightAxis: num(row.rightAxis) }),
      ...(num(row.leftSph) != null && { leftSph: num(row.leftSph) }),
      ...(num(row.leftCyl) != null && { leftCyl: num(row.leftCyl) }),
      ...(num(row.leftAxis) != null && { leftAxis: num(row.leftAxis) }),
      ...(num(row.addPower) != null && { addPower: num(row.addPower) }),
    };

    try {
      await prisma.customer.create({ data: payload });
      imported++;
    } catch {
      skipped++;
      errors.push(`Failed to import ${phone}`);
    }
  }

  revalidatePath("/customers");
  return { imported, skipped, errors };
}
