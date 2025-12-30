import { NotificationType, NotificationChannel, UserRole } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateNotificationInput {
    type: NotificationType;
    channel?: NotificationChannel;
    title: string;
    message: string;
    link?: string;
    recipientId: string;
    senderId?: string;
    schoolId?: string;
    classId?: string;
    metadata?: any;
}

export interface CreateAnnouncementInput {
    title: string;
    content: string;
    schoolId?: string;
    classId?: string;
    targetRoles?: UserRole[];
    isPublic?: boolean;
    priority?: string;
    createdById: string;
    publishAt?: Date;
    expiresAt?: Date;
    attachments?: string[];
}

export interface SendMessageInput {
    subject?: string;
    content: string;
    senderId: string;
    recipientId: string;
    threadId?: string;
    attachments?: string[];
}

class NotificationService {
    /**
     * Create notification
     */
    async createNotification(data: CreateNotificationInput) {
        return await prisma.notification.create({
            data: {
                type: data.type,
                channel: data.channel || 'IN_APP',
                title: data.title,
                message: data.message,
                link: data.link,
                recipientId: data.recipientId,
                senderId: data.senderId,
                schoolId: data.schoolId,
                classId: data.classId,
                metadata: data.metadata,
            },
            include: {
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Create bulk notifications
     */
    async createBulkNotifications(recipientIds: string[], data: Omit<CreateNotificationInput, 'recipientId'>) {
        const notifications = recipientIds.map(recipientId => ({
            type: data.type,
            channel: data.channel || 'IN_APP',
            title: data.title,
            message: data.message,
            link: data.link,
            recipientId,
            senderId: data.senderId,
            schoolId: data.schoolId,
            classId: data.classId,
            metadata: data.metadata,
        }));

        await prisma.notification.createMany({
            data: notifications,
        });

        return { count: notifications.length };
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId: string, status?: string) {
        const where: any = { recipientId: userId };
        if (status) where.status = status;

        return await prisma.notification.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        return await prisma.notification.update({
            where: { id: notificationId },
            data: {
                status: 'READ',
                readAt: new Date(),
            },
        });
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(userId: string) {
        return await prisma.notification.updateMany({
            where: {
                recipientId: userId,
                status: 'UNREAD',
            },
            data: {
                status: 'READ',
                readAt: new Date(),
            },
        });
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string) {
        await prisma.notification.delete({
            where: { id: notificationId },
        });
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string) {
        return await prisma.notification.count({
            where: {
                recipientId: userId,
                status: 'UNREAD',
            },
        });
    }

    /**
     * Create announcement
     */
    async createAnnouncement(data: CreateAnnouncementInput) {
        const announcement = await prisma.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                schoolId: data.schoolId,
                classId: data.classId,
                targetRoles: data.targetRoles || [],
                isPublic: data.isPublic ?? false,
                priority: data.priority || 'NORMAL',
                createdById: data.createdById,
                publishAt: data.publishAt,
                expiresAt: data.expiresAt,
                attachments: data.attachments || [],
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Create notifications for targeted users
        await this.notifyAnnouncementRecipients(announcement);

        return announcement;
    }

    /**
     * Get announcements
     */
    async getAnnouncements(userId: string, schoolId?: string, classId?: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, classId: true },
        });

        if (!user) throw new Error('User not found');

        const where: any = {
            isActive: true,
            OR: [
                { isPublic: true },
                { targetRoles: { has: user.role } },
            ],
        };

        if (schoolId) where.schoolId = schoolId;
        if (classId || user.classId) where.classId = classId || user.classId;

        return await prisma.announcement.findMany({
            where,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    /**
     * Update announcement
     */
    async updateAnnouncement(announcementId: string, data: Partial<CreateAnnouncementInput>) {
        return await prisma.announcement.update({
            where: { id: announcementId },
            data,
        });
    }

    /**
     * Delete announcement
     */
    async deleteAnnouncement(announcementId: string) {
        await prisma.announcement.delete({
            where: { id: announcementId },
        });
    }

    /**
     * Send message
     */
    async sendMessage(data: SendMessageInput) {
        return await prisma.message.create({
            data: {
                subject: data.subject,
                content: data.content,
                senderId: data.senderId,
                recipientId: data.recipientId,
                threadId: data.threadId,
                attachments: data.attachments || [],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    /**
     * Get user messages (inbox)
     */
    async getUserMessages(userId: string, type: 'inbox' | 'sent' = 'inbox') {
        const where = type === 'inbox'
            ? { recipientId: userId }
            : { senderId: userId };

        return await prisma.message.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                recipient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    /**
     * Get message thread
     */
    async getMessageThread(messageId: string) {
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                sender: true,
                recipient: true,
                replies: {
                    include: {
                        sender: true,
                        recipient: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!message) throw new Error('Message not found');

        return message;
    }

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId: string) {
        return await prisma.message.update({
            where: { id: messageId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    /**
     * Delete message
     */
    async deleteMessage(messageId: string) {
        await prisma.message.delete({
            where: { id: messageId },
        });
    }

    /**
     * Helper: Notify announcement recipients
     */
    private async notifyAnnouncementRecipients(announcement: any) {
        let recipients: string[] = [];

        if (announcement.classId) {
            // Get all students in the class
            const students = await prisma.user.findMany({
                where: { classId: announcement.classId },
                select: { id: true },
            });
            recipients = students.map(s => s.id);
        } else if (announcement.schoolId && announcement.targetRoles.length > 0) {
            // Get users by role in school
            const users = await prisma.user.findMany({
                where: {
                    schoolId: announcement.schoolId,
                    role: { in: announcement.targetRoles },
                },
                select: { id: true },
            });
            recipients = users.map(u => u.id);
        }

        if (recipients.length > 0) {
            await this.createBulkNotifications(recipients, {
                type: 'ANNOUNCEMENT',
                title: announcement.title,
                message: announcement.content.substring(0, 200),
                link: `/announcements/${announcement.id}`,
                senderId: announcement.createdById,
                schoolId: announcement.schoolId,
                classId: announcement.classId,
            });
        }
    }
}

export default new NotificationService();