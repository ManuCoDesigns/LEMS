import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate, isTeacher } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// NOTIFICATION ROUTES
// ============================================

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', notificationController.getUserNotifications.bind(notificationController));

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/notifications/unread-count', notificationController.getUnreadCount.bind(notificationController));

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/notifications/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/notifications/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/notifications/:id', notificationController.deleteNotification.bind(notificationController));

// ============================================
// ANNOUNCEMENT ROUTES
// ============================================

/**
 * @route   POST /api/v1/announcements
 * @desc    Create announcement
 * @access  Private (Teacher/Admin only)
 */
router.post('/announcements', isTeacher, notificationController.createAnnouncement.bind(notificationController));

/**
 * @route   GET /api/v1/announcements
 * @desc    Get announcements
 * @access  Private
 */
router.get('/announcements', notificationController.getAnnouncements.bind(notificationController));

/**
 * @route   PUT /api/v1/announcements/:id
 * @desc    Update announcement
 * @access  Private (Teacher/Admin only)
 */
router.put('/announcements/:id', isTeacher, notificationController.updateAnnouncement.bind(notificationController));

/**
 * @route   DELETE /api/v1/announcements/:id
 * @desc    Delete announcement
 * @access  Private (Teacher/Admin only)
 */
router.delete('/announcements/:id', isTeacher, notificationController.deleteAnnouncement.bind(notificationController));

// ============================================
// MESSAGING ROUTES
// ============================================

/**
 * @route   POST /api/v1/messages
 * @desc    Send message
 * @access  Private
 */
router.post('/messages', notificationController.sendMessage.bind(notificationController));

/**
 * @route   GET /api/v1/messages
 * @desc    Get user messages (inbox/sent)
 * @access  Private
 */
router.get('/messages', notificationController.getUserMessages.bind(notificationController));

/**
 * @route   GET /api/v1/messages/:id/thread
 * @desc    Get message thread
 * @access  Private
 */
router.get('/messages/:id/thread', notificationController.getMessageThread.bind(notificationController));

/**
 * @route   PATCH /api/v1/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.patch('/messages/:id/read', notificationController.markMessageAsRead.bind(notificationController));

/**
 * @route   DELETE /api/v1/messages/:id
 * @desc    Delete message
 * @access  Private
 */
router.delete('/messages/:id', notificationController.deleteMessage.bind(notificationController));

export default router;