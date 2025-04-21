import type { PrismaClient } from "@prisma/client";
import type { Notification } from "@prisma/client";

interface ServiceConsumer {
  userId: string;
}

async function notifyAllServiceConsumers(
  db: PrismaClient,
  userId: string,
  serviceId: string,
  content: string,
): Promise<{ success: boolean; notificationsSent: number }> {
  // Get all active consumers
  const consumers = (await db.serviceConsumer.findMany({
    where: {
      subscriptionTier: {
        serviceId: serviceId,
      },
      subscriptionStatus: "ACTIVE",
    },
  })) as ServiceConsumer[];

  // Create notifications for all consumers
  const notifications = await db.notification.createMany({
    data: consumers.map((consumer: ServiceConsumer) => ({
      content: content,
      recipientId: consumer.userId,
      senderId: userId,
    })),
  });

  return { success: true, notificationsSent: notifications.count };
}

async function notifyServiceConsumer(
  db: PrismaClient,
  userId: string,
  consumerId: string,
  content: string,
): Promise<Notification> {
  // Create notification
  const notification = await db.notification.create({
    data: {
      content: content,
      recipientId: consumerId,
      senderId: userId,
    },
  });

  return notification;
}

export { notifyAllServiceConsumers, notifyServiceConsumer };
