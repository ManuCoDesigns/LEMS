import { Subject, SubjectCategory } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string;
  category?: SubjectCategory;
  credits?: number;
  schoolId: string;
  departmentId?: string;
}

export interface UpdateSubjectInput {
  name?: string;
  description?: string;
  category?: SubjectCategory;
  credits?: number;
  departmentId?: string;
}

class SubjectService {
  /**
   * Get all subjects for a school
   */
  async getSubjectsBySchool(schoolId: string, departmentId?: string) {
    const where: any = { schoolId };
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            classes: true,
            teachers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return subjects;
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(subjectId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                grade: true,
                stream: true,
              },
            },
          },
        },
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    return subject;
  }

  /**
   * Create new subject
   */
  async createSubject(data: CreateSubjectInput) {
    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      throw new Error('School not found');
    }

    // Check if department exists (if provided)
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new Error('Department not found');
      }
    }

    // Check if subject code already exists in this school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        schoolId: data.schoolId,
        code: data.code.toUpperCase(),
      },
    });

    if (existingSubject) {
      throw new Error('Subject with this code already exists in this school');
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        category: data.category || SubjectCategory.CORE,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            classes: true,
            teachers: true,
          },
        },
      },
    });

    return subject;
  }

  /**
   * Update subject
   */
  async updateSubject(subjectId: string, data: UpdateSubjectInput) {
    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!existingSubject) {
      throw new Error('Subject not found');
    }

    // Check if department exists (if provided)
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new Error('Department not found');
      }
    }

    // Update subject
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            classes: true,
            teachers: true,
          },
        },
      },
    });

    return subject;
  }

  /**
   * Delete subject
   */
  async deleteSubject(subjectId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        _count: {
          select: {
            classes: true,
            teachers: true,
          },
        },
      },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    // Check if subject is assigned to classes
    if (subject._count.classes > 0) {
      throw new Error('Cannot delete subject assigned to classes. Please remove assignments first.');
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id: subjectId },
    });
  }

  /**
   * Assign teacher to subject
   */
  async assignTeacherToSubject(subjectId: string, teacherId: string, isPrimary: boolean = false) {
    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    // Check if teacher exists
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    if (teacher.role !== 'TEACHER' && teacher.role !== 'SCHOOL_ADMIN' && teacher.role !== 'SUPER_ADMIN') {
      throw new Error('User is not a teacher');
    }

    // Check if already assigned
    const existing = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId,
        },
      },
    });

    if (existing) {
      throw new Error('Teacher already assigned to this subject');
    }

    // Assign teacher
    const assignment = await prisma.teacherSubject.create({
      data: {
        teacherId,
        subjectId,
        isPrimary,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return assignment;
  }

  /**
   * Remove teacher from subject
   */
  async removeTeacherFromSubject(subjectId: string, teacherId: string) {
    const assignment = await prisma.teacherSubject.findUnique({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId,
        },
      },
    });

    if (!assignment) {
      throw new Error('Teacher not assigned to this subject');
    }

    await prisma.teacherSubject.delete({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId,
        },
      },
    });
  }

  /**
   * Get subjects by teacher
   */
  async getSubjectsByTeacher(teacherId: string) {
    const assignments = await prisma.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return assignments.map(a => ({
      ...a.subject,
      isPrimary: a.isPrimary,
    }));
  }

  /**
   * Get subject statistics
   */
  async getSubjectStats(schoolId?: string) {
    const where: any = {};
    
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const [total, byCategory] = await Promise.all([
      prisma.subject.count({ where }),
      prisma.subject.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default new SubjectService();