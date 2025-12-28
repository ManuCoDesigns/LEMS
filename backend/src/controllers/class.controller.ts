import { Request, Response } from 'express';
import classService from '../services/class.service';
import { sendSuccess, sendError } from '../utils/response.util';

class ClassController {
  /**
   * Get all classes for a school
   * GET /api/v1/schools/:schoolId/classes
   */
  async getClassesBySchool(req: Request, res: Response) {
    try {
      const { schoolId } = req.params;
      const { academicYearId } = req.query;

      const classes = await classService.getClassesBySchool(schoolId, academicYearId as string);

      return sendSuccess(res, 200, 'Classes retrieved successfully', { classes });
    } catch (error) {
      console.error('Get classes error:', error);
      return sendError(res, 500, 'Failed to retrieve classes');
    }
  }

  /**
   * Get class by ID
   * GET /api/v1/classes/:id
   */
  async getClassById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const classData = await classService.getClassById(id);

      return sendSuccess(res, 200, 'Class retrieved successfully', { class: classData });
    } catch (error) {
      console.error('Get class error:', error);
      const message = error instanceof Error ? error.message : 'Failed to retrieve class';
      return sendError(res, 404, message);
    }
  }

  /**
   * Create new class
   * POST /api/v1/schools/:schoolId/classes
   */
  async createClass(req: Request, res: Response) {
    try {
      const { schoolId } = req.params;
      const { name, code, grade, stream, capacity, roomNumber, academicYearId } = req.body;

      if (!name || !code || !grade || !academicYearId) {
        return sendError(res, 400, 'Missing required fields', 'Name, code, grade, and academic year are required');
      }

      const classData = await classService.createClass({
        name,
        code,
        grade,
        stream,
        capacity: capacity ? parseInt(capacity) : undefined,
        roomNumber,
        schoolId,
        academicYearId,
      });

      return sendSuccess(res, 201, 'Class created successfully', { class: classData });
    } catch (error) {
      console.error('Create class error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create class';
      return sendError(res, 400, message);
    }
  }

  /**
   * Update class
   * PUT /api/v1/classes/:id
   */
  async updateClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, grade, stream, capacity, roomNumber } = req.body;

      const classData = await classService.updateClass(id, {
        name,
        grade,
        stream,
        capacity: capacity ? parseInt(capacity) : undefined,
        roomNumber,
      });

      return sendSuccess(res, 200, 'Class updated successfully', { class: classData });
    } catch (error) {
      console.error('Update class error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update class';
      return sendError(res, 400, message);
    }
  }

  /**
   * Delete class
   * DELETE /api/v1/classes/:id
   */
  async deleteClass(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await classService.deleteClass(id);

      return sendSuccess(res, 200, 'Class deleted successfully');
    } catch (error) {
      console.error('Delete class error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete class';
      return sendError(res, 400, message);
    }
  }

  /**
   * Assign subject to class
   * POST /api/v1/classes/:id/subjects
   */
  async assignSubject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { subjectId, lessonsPerWeek } = req.body;

      if (!subjectId) {
        return sendError(res, 400, 'Subject ID is required');
      }

      const assignment = await classService.assignSubjectToClass(
        id,
        subjectId,
        lessonsPerWeek ? parseInt(lessonsPerWeek) : undefined
      );

      return sendSuccess(res, 201, 'Subject assigned successfully', { assignment });
    } catch (error) {
      console.error('Assign subject error:', error);
      const message = error instanceof Error ? error.message : 'Failed to assign subject';
      return sendError(res, 400, message);
    }
  }

  /**
   * Remove subject from class
   * DELETE /api/v1/classes/:id/subjects/:subjectId
   */
  async removeSubject(req: Request, res: Response) {
    try {
      const { id, subjectId } = req.params;

      await classService.removeSubjectFromClass(id, subjectId);

      return sendSuccess(res, 200, 'Subject removed successfully');
    } catch (error) {
      console.error('Remove subject error:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove subject';
      return sendError(res, 400, message);
    }
  }

  /**
   * Assign teacher to class
   * POST /api/v1/classes/:id/teachers
   */
  async assignTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { teacherId, isClassTeacher } = req.body;

      if (!teacherId) {
        return sendError(res, 400, 'Teacher ID is required');
      }

      const assignment = await classService.assignTeacherToClass(id, teacherId, isClassTeacher || false);

      return sendSuccess(res, 201, 'Teacher assigned successfully', { assignment });
    } catch (error) {
      console.error('Assign teacher error:', error);
      const message = error instanceof Error ? error.message : 'Failed to assign teacher';
      return sendError(res, 400, message);
    }
  }

  /**
   * Remove teacher from class
   * DELETE /api/v1/classes/:id/teachers/:teacherId
   */
  async removeTeacher(req: Request, res: Response) {
    try {
      const { id, teacherId } = req.params;

      await classService.removeTeacherFromClass(id, teacherId);

      return sendSuccess(res, 200, 'Teacher removed successfully');
    } catch (error) {
      console.error('Remove teacher error:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove teacher';
      return sendError(res, 400, message);
    }
  }

  /**
   * Enroll student in class
   * POST /api/v1/classes/:id/students
   */
  async enrollStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return sendError(res, 400, 'Student ID is required');
      }

      const student = await classService.enrollStudent(id, studentId);

      return sendSuccess(res, 201, 'Student enrolled successfully', { student });
    } catch (error) {
      console.error('Enroll student error:', error);
      const message = error instanceof Error ? error.message : 'Failed to enroll student';
      return sendError(res, 400, message);
    }
  }

  /**
   * Remove student from class
   * DELETE /api/v1/students/:studentId/class
   */
  async removeStudent(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      await classService.removeStudent(studentId);

      return sendSuccess(res, 200, 'Student removed from class successfully');
    } catch (error) {
      console.error('Remove student error:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove student';
      return sendError(res, 400, message);
    }
  }
}

export default new ClassController();