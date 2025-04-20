import { PrismaClient } from "@prisma/client";

async function notifyAllServiceConsumers(
  db: any, 
  userId: string, 
  serviceId: string, 
  content: string
) {
  // Get all active consumers
  const consumers = await db.serviceConsumer.findMany({
    where: {
      subscriptionTier: {
        serviceId: serviceId,
      },
      subscriptionStatus: "ACTIVE",
    },
  });

  // Create notifications for all consumers
  const notifications = await db.notification.createMany({
    data: consumers.map((consumer: { userId: any; }) => ({
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
  serviceId: string,
  consumerId: string,
  content: string
) {
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

// Export both functions
export { notifyAllServiceConsumers, notifyServiceConsumer };