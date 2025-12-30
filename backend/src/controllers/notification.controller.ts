import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response.util';

class NotificationController {
    /**
     * Get user notifications
     * GET /api/v1/notifications
     */
    async getUserNotifications(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { status } = req.query;

            if (!userId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const notifications = await notificationService.getUserNotifications(userId, status as string);

            return sendSuccess(res, 200, 'Notifications retrieved successfully', { notifications });
        } catch (error) {
            console.error('Get notifications error:', error);
            return sendError(res, 500, 'Failed to retrieve notifications');
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/v1/notifications/:id/read
     */
    async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const notification = await notificationService.markAsRead(id);

            return sendSuccess(res, 200, 'Notification marked as read', { notification });
        } catch (error) {
            console.error('Mark as read error:', error);
            return sendError(res, 400, 'Failed to mark as read');
        }
    }

    /**
     * Mark all notifications as read
     * PATCH /api/v1/notifications/read-all
     */
    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return sendError(res, 401, 'Not authenticated');
            }

            await notificationService.markAllAsRead(userId);

            return sendSuccess(res, 200, 'All notifications marked as read');
        } catch (error) {
            console.error('Mark all as read error:', error);
            return sendError(res, 400, 'Failed to mark all as read');
        }
    }

    /**
     * Delete notification
     * DELETE /api/v1/notifications/:id
     */
    async deleteNotification(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await notificationService.deleteNotification(id);

            return sendSuccess(res, 200, 'Notification deleted successfully');
        } catch (error) {
            console.error('Delete notification error:', error);
            return sendError(res, 400, 'Failed to delete notification');
        }
    }

    /**
     * Get unread count
     * GET /api/v1/notifications/unread-count
     */
    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const count = await notificationService.getUnreadCount(userId);

            return sendSuccess(res, 200, 'Unread count retrieved', { count });
        } catch (error) {
            console.error('Get unread count error:', error);
            return sendError(res, 500, 'Failed to get unread count');
        }
    }

    /**
     * Create announcement
     * POST /api/v1/announcements
     */
    async createAnnouncement(req: Request, res: Response) {
        try {
            const {
                title,
                content,
                schoolId,
                classId,
                targetRoles,
                isPublic,
                priority,
                publishAt,
                expiresAt,
                attachments,
            } = req.body;

            const createdById = req.user?.userId;

            if (!title || !content || !createdById) {
                return sendError(res, 400, 'Title, content, and creator are required');
            }

            const announcement = await notificationService.createAnnouncement({
                title,
                content,
                schoolId,
                classId,
                targetRoles,
                isPublic,
                priority,
                createdById,
                publishAt: publishAt ? new Date(publishAt) : undefined,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                attachments,
            });

            return sendSuccess(res, 201, 'Announcement created successfully', { announcement });
        } catch (error) {
            console.error('Create announcement error:', error);
            return sendError(res, 400, 'Failed to create announcement');
        }
    }

    /**
     * Get announcements
     * GET /api/v1/announcements
     */
    async getAnnouncements(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { schoolId, classId } = req.query;

            if (!userId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const announcements = await notificationService.getAnnouncements(
                userId,
                schoolId as string,
                classId as string
            );

            return sendSuccess(res, 200, 'Announcements retrieved successfully', { announcements });
        } catch (error) {
            console.error('Get announcements error:', error);
            return sendError(res, 500, 'Failed to retrieve announcements');
        }
    }

    /**
     * Update announcement
     * PUT /api/v1/announcements/:id
     */
    async updateAnnouncement(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            const announcement = await notificationService.updateAnnouncement(id, data);

            return sendSuccess(res, 200, 'Announcement updated successfully', { announcement });
        } catch (error) {
            console.error('Update announcement error:', error);
            return sendError(res, 400, 'Failed to update announcement');
        }
    }

    /**
     * Delete announcement
     * DELETE /api/v1/announcements/:id
     */
    async deleteAnnouncement(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await notificationService.deleteAnnouncement(id);

            return sendSuccess(res, 200, 'Announcement deleted successfully');
        } catch (error) {
            console.error('Delete announcement error:', error);
            return sendError(res, 400, 'Failed to delete announcement');
        }
    }

    /**
     * Send message
     * POST /api/v1/messages
     */
    async sendMessage(req: Request, res: Response) {
        try {
            const { subject, content, recipientId, threadId, attachments } = req.body;
            const senderId = req.user?.userId;

            if (!senderId || !recipientId || !content) {
                return sendError(res, 400, 'Sender, recipient, and content are required');
            }

            const message = await notificationService.sendMessage({
                subject,
                content,
                senderId,
                recipientId,
                threadId,
                attachments,
            });

            return sendSuccess(res, 201, 'Message sent successfully', { message });
        } catch (error) {
            console.error('Send message error:', error);
            return sendError(res, 400, 'Failed to send message');
        }
    }

    /**
     * Get user messages
     * GET /api/v1/messages
     */
    async getUserMessages(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { type } = req.query;

            if (!userId) {
                return sendError(res, 401, 'Not authenticated');
            }

            const messages = await notificationService.getUserMessages(userId, type as 'inbox' | 'sent');

            return sendSuccess(res, 200, 'Messages retrieved successfully', { messages });
        } catch (error) {
            console.error('Get messages error:', error);
            return sendError(res, 500, 'Failed to retrieve messages');
        }
    }

    /**
     * Get message thread
     * GET /api/v1/messages/:id/thread
     */
    async getMessageThread(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const thread = await notificationService.getMessageThread(id);

            return sendSuccess(res, 200, 'Thread retrieved successfully', { thread });
        } catch (error) {
            console.error('Get thread error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve thread';
            return sendError(res, 404, message);
        }
    }

    /**
     * Mark message as read
     * PATCH /api/v1/messages/:id/read
     */
    async markMessageAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const message = await notificationService.markMessageAsRead(id);

            return sendSuccess(res, 200, 'Message marked as read', { message });
        } catch (error) {
            console.error('Mark message as read error:', error);
            return sendError(res, 400, 'Failed to mark message as read');
        }
    }

    /**
     * Delete message
     * DELETE /api/v1/messages/:id
     */
    async deleteMessage(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await notificationService.deleteMessage(id);

            return sendSuccess(res, 200, 'Message deleted successfully');
        } catch (error) {
            console.error('Delete message error:', error);
            return sendError(res, 400, 'Failed to delete message');
        }
    }
}

export default new NotificationController();