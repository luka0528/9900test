import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
export const notificationRouter = createTRPCRouter({
  // Get all notifications for the current user
  getMyNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
        includeRead: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          recipientId: ctx.session.user.id,
          ...(input.includeRead ? {} : { read: false }),
        },
        include: {
          sender: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  // Mark a notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.recipientId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot mark someone else's notification as read",
        });
      }

      await ctx.db.notification.update({
        where: { id: input.notificationId },
        data: { read: true },
      });

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        recipientId: ctx.session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  }),

  // Send a notification
  sendNotification: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        content: z.string(),
        // TODO: Add notification type for easier filtering
        // type: z.enum(NotificationType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify recipient exists
      const recipient = await ctx.db.user.findUnique({
        where: { id: input.recipientId },
      });

      if (!recipient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipient not found",
        });
      }

      const notification = await ctx.db.notification.create({
        data: {
          content: input.content,
          recipientId: input.recipientId,
          senderId: ctx.session.user.id,
        },
      });

      return notification;
    }),

  // Send notification to all service consumers
  notifyAllServiceConsumers: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify service exists and user is owner
      const serviceOwnership = await ctx.db.serviceOwner.findFirst({
        where: {
          serviceId: input.serviceId,
          userId: ctx.session.user.id,
        },
      });

      if (!serviceOwnership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a service owner to send notifications",
        });
      }

      // Get all active consumers
      const consumers = await ctx.db.serviceConsumer.findMany({
        where: {
          subscriptionTier: {
            serviceId: input.serviceId,
          },
          subscriptionStatus: "ACTIVE",
        },
      });

      // Create notifications for all consumers
      const notifications = await ctx.db.notification.createMany({
        data: consumers.map((consumer) => ({
          content: input.content,
          recipientId: consumer.userId,
          senderId: ctx.session.user.id,
        })),
      });

      return { success: true, notificationsSent: notifications.count };
    }),

  // Send notification to specific service consumer
  notifyServiceConsumer: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        consumerId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify service exists and user is owner
      const serviceOwnership = await ctx.db.serviceOwner.findFirst({
        where: {
          serviceId: input.serviceId,
          userId: ctx.session.user.id,
        },
      });

      if (!serviceOwnership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a service owner to send notifications",
        });
      }

      // Verify consumer exists and is subscribed to the service
      const consumer = await ctx.db.serviceConsumer.findFirst({
        where: {
          userId: input.consumerId,
          subscriptionTier: {
            serviceId: input.serviceId,
          },
          subscriptionStatus: "ACTIVE",
        },
      });

      if (!consumer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Consumer not found or not subscribed to this service",
        });
      }

      // Create notification
      const notification = await ctx.db.notification.create({
        data: {
          content: input.content,
          recipientId: input.consumerId,
          senderId: ctx.session.user.id,
        },
      });

      return notification;
    }),

  // Delete a notification
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.recipientId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete someone else's notification",
        });
      }

      await ctx.db.notification.delete({
        where: { id: input.notificationId },
      });

      return { success: true };
    }),
});