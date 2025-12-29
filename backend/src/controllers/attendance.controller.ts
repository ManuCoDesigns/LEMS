import { Request, Response } from 'express';
import attendanceService from '../services/attendance.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { AttendanceStatus } from '@prisma/client';

class AttendanceController {
  /**
   * Mark attendance for a single student
   * POST /api/v1/attendance
   */
  async markAttendance(req: Request, res: Response) {
    try {
      const { studentId, classId, date, status, remarks, checkInTime, checkOutTime, subjectId } = req.body;
      const markedById = req.user?.userId;

      if (!studentId || !classId || !date || !status) {
        return sendError(res, 400, 'Missing required fields', 'Student ID, class ID, date, and status are required');
      }

      if (!markedById) {
        return sendError(res, 401, 'Not authenticated');
      }

      const attendance = await attendanceService.markAttendance({
        studentId,
        classId,
        date: new Date(date),
        status: status as AttendanceStatus,
        remarks,
        checkInTime: checkInTime ? new Date(checkInTime) : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        subjectId,
        markedById,
      });

      return sendSuccess(res, 201, 'Attendance marked successfully', { attendance });
    } catch (error) {
      console.error('Mark attendance error:', error);
      const message = error instanceof Error ? error.message : 'Failed to mark attendance';
      return sendError(res, 400, message);
    }
  }

  /**
   * Mark bulk attendance for a class
   * POST /api/v1/attendance/bulk
   */
  async markBulkAttendance(req: Request, res: Response) {
    try {
      const { classId, date, subjectId, records } = req.body;
      const markedById = req.user?.userId;

      if (!classId || !date || !records || !Array.isArray(records)) {
        return sendError(res, 400, 'Missing required fields', 'Class ID, date, and records array are required');
      }

      if (!markedById) {
        return sendError(res, 401, 'Not authenticated');
      }

      const attendance = await attendanceService.markBulkAttendance({
        classId,
        date: new Date(date),
        subjectId,
        markedById,
        records,
      });

      return sendSuccess(res, 201, 'Bulk attendance marked successfully', { 
        attendance,
        count: attendance.length 
      });
    } catch (error) {
      console.error('Mark bulk attendance error:', error);
      const message = error instanceof Error ? error.message : 'Failed to mark bulk attendance';
      return sendError(res, 400, message);
    }
  }

  /**
   * Get attendance for a class on a specific date
   * GET /api/v1/classes/:classId/attendance
   */
  async getClassAttendance(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { date, subjectId } = req.query;

      if (!date) {
        return sendError(res, 400, 'Date is required');
      }

      const attendance = await attendanceService.getClassAttendance(
        classId,
        new Date(date as string),
        subjectId as string
      );

      return sendSuccess(res, 200, 'Class attendance retrieved successfully', { attendance });
    } catch (error) {
      console.error('Get class attendance error:', error);
      return sendError(res, 500, 'Failed to retrieve class attendance');
    }
  }

  /**
   * Get attendance for a student
   * GET /api/v1/students/:studentId/attendance
   */
  async getStudentAttendance(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, classId } = req.query;

      const attendance = await attendanceService.getStudentAttendance(
        studentId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        classId as string
      );

      return sendSuccess(res, 200, 'Student attendance retrieved successfully', { attendance });
    } catch (error) {
      console.error('Get student attendance error:', error);
      return sendError(res, 500, 'Failed to retrieve student attendance');
    }
  }

  /**
   * Get attendance summary for a student
   * GET /api/v1/students/:studentId/attendance/summary
   */
  async getStudentAttendanceSummary(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { classId, month, year } = req.query;

      if (!classId) {
        return sendError(res, 400, 'Class ID is required');
      }

      const summary = await attendanceService.getStudentAttendanceSummary(
        studentId,
        classId as string,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );

      return sendSuccess(res, 200, 'Attendance summary retrieved successfully', { summary });
    } catch (error) {
      console.error('Get attendance summary error:', error);
      return sendError(res, 500, 'Failed to retrieve attendance summary');
    }
  }

  /**
   * Get class attendance statistics
   * GET /api/v1/classes/:classId/attendance/stats
   */
  async getClassAttendanceStats(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { month, year } = req.query;

      const stats = await attendanceService.getClassAttendanceStats(
        classId,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );

      return sendSuccess(res, 200, 'Class attendance statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get class stats error:', error);
      return sendError(res, 500, 'Failed to retrieve class statistics');
    }
  }

  /**
   * Get attendance report for date range
   * GET /api/v1/classes/:classId/attendance/report
   */
  async getAttendanceReport(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const { startDate, endDate, subjectId } = req.query;

      if (!startDate || !endDate) {
        return sendError(res, 400, 'Start date and end date are required');
      }

      const report = await attendanceService.getAttendanceReport(
        classId,
        new Date(startDate as string),
        new Date(endDate as string),
        subjectId as string
      );

      return sendSuccess(res, 200, 'Attendance report generated successfully', { report });
    } catch (error) {
      console.error('Get attendance report error:', error);
      return sendError(res, 500, 'Failed to generate attendance report');
    }
  }

  /**
   * Delete attendance record
   * DELETE /api/v1/attendance/:id
   */
  async deleteAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await attendanceService.deleteAttendance(id);

      return sendSuccess(res, 200, 'Attendance record deleted successfully');
    } catch (error) {
      console.error('Delete attendance error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete attendance';
      return sendError(res, 400, message);
    }
  }
}

export default new AttendanceController();