'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Create a notification
 */
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  assessmentId?: string;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        assessmentId: data.assessmentId || null,
        link: data.link || null,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, id: notification.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string, includeRead: boolean = false) {
  try {
    const where: any = { userId };
    if (!includeRead) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    return {
      success: true,
      data: notifications.map(n => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        assessmentId: n.assessmentId,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications', data: [] };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId: string) {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    return { success: false, error: 'Failed to delete notifications' };
  }
}
