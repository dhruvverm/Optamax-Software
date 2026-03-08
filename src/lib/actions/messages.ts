"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getMessages() {
  return prisma.message.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      _count: { select: { recipients: true } },
    },
  });
}

export async function sendBulkMessage(data: {
  subject: string;
  content: string;
  customerIds: string[];
}) {
  const message = await prisma.message.create({
    data: {
      subject: data.subject,
      content: data.content,
      recipients: {
        create: data.customerIds.map((customerId) => ({ customerId })),
      },
    },
    include: { _count: { select: { recipients: true } } },
  });
  revalidatePath("/messages");
  return message;
}
