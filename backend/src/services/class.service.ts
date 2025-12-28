import { Class } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateClassInput {
  name: string;
  code: string;
  grade: string;
  stream?: string;
  capacity?: number;
  roomNumber?: string;
  schoolId: string;
  academicYearId: string;
}

export interface UpdateClassInput {
  name?: string;
  grade?: string;
  stream?: string;
  capacity?: number;
  roomNumber?: string;
}

class ClassService {
  /**
   * Get all classes for a school
   */
  async getClassesBySchool(schoolId: string, academicYearId?: string) {
    const where: any = { schoolId };
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
          },
        },
      },
      orderBy: [
        { grade: 'asc' },
        { stream: 'asc' },
      ],
    });

    return classes;
  }

  /**
   * Get class by ID
   */
  async getClassById(classId: string) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
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
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    return classData;
  }

  /**
   * Create new class
   */
  async createClass(data: CreateClassInput) {
    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      throw new Error('School not found');
    }

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: data.academicYearId },
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    // Check if class code already exists in this school and academic year
    const existingClass = await prisma.class.findFirst({
      where: {
        schoolId: data.schoolId,
        code: data.code.toUpperCase(),
        academicYearId: data.academicYearId,
      },
    });

    if (existingClass) {
      throw new Error('Class with this code already exists for this academic year');
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        capacity: data.capacity || 40,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
          },
        },
      },
    });

    return newClass;
  }

  /**
   * Update class
   */
  async updateClass(classId: string, data: UpdateClassInput) {
    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      throw new Error('Class not found');
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
          },
        },
      },
    });

    return updatedClass;
  }

  /**
   * Delete class
   */
  async deleteClass(classId: string) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Check if class has students
    if (classData._count.students > 0) {
      throw new Error('Cannot delete class with enrolled students. Please reassign students first.');
    }

    // Delete class
    await prisma.class.delete({
      where: { id: classId },
    });
  }

  /**
   * Assign subject to class
   */
  async assignSubjectToClass(classId: string, subjectId: string, lessonsPerWeek?: number) {
    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    // Check if already assigned
    const existing = await prisma.classSubject.findUnique({
      where: {
        classId_subjectId: {
          classId,
          subjectId,
        },
      },
    });

    if (existing) {
      throw new Error('Subject already assigned to this class');
    }

    // Assign subject
    const assignment = await prisma.classSubject.create({
      data: {
        classId,
        subjectId,
        lessonsPerWeek,
      },
      include: {
        subject: true,
      },
    });

    return assignment;
  }

  /**
   * Remove subject from class
   */
  async removeSubjectFromClass(classId: string, subjectId: string) {
    const assignment = await prisma.classSubject.findUnique({
      where: {
        classId_subjectId: {
          classId,
          subjectId,
        },
      },
    });

    if (!assignment) {
      throw new Error('Subject not assigned to this class');
    }

    await prisma.classSubject.delete({
      where: {
        classId_subjectId: {
          classId,
          subjectId,
        },
      },
    });
  }

  /**
   * Assign teacher to class
   */
  async assignTeacherToClass(classId: string, teacherId: string, isClassTeacher: boolean = false) {
    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Check if teacher exists and is actually a teacher
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
    const existing = await prisma.classTeacher.findUnique({
      where: {
        classId_teacherId: {
          classId,
          teacherId,
        },
      },
    });

    if (existing) {
      throw new Error('Teacher already assigned to this class');
    }

    // Assign teacher
    const assignment = await prisma.classTeacher.create({
      data: {
        classId,
        teacherId,
        isClassTeacher,
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
   * Remove teacher from class
   */
  async removeTeacherFromClass(classId: string, teacherId: string) {
    const assignment = await prisma.classTeacher.findUnique({
      where: {
        classId_teacherId: {
          classId,
          teacherId,
        },
      },
    });

    if (!assignment) {
      throw new Error('Teacher not assigned to this class');
    }

    await prisma.classTeacher.delete({
      where: {
        classId_teacherId: {
          classId,
          teacherId,
        },
      },
    });
  }

  /**
   * Enroll student in class
   */
  async enrollStudent(classId: string, studentId: string) {
    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: { select: { students: true } },
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Check capacity
    if (classData._count.students >= classData.capacity) {
      throw new Error('Class is at full capacity');
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.role !== 'STUDENT') {
      throw new Error('User is not a student');
    }

    // Check if already enrolled
    if (student.classId === classId) {
      throw new Error('Student already enrolled in this class');
    }

    // Enroll student
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { classId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        class: true,
      },
    });

    return updatedStudent;
  }

  /**
   * Remove student from class
   */
  async removeStudent(studentId: string) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.classId) {
      throw new Error('Student is not enrolled in any class');
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { classId: null },
    });
  }

  /**
   * Get class statistics
   */
  async getClassStats(schoolId?: string, academicYearId?: string) {
    const where: any = {};
    
    if (schoolId) {
      where.schoolId = schoolId;
    }
    
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const total = await prisma.class.count({ where });

    return { total };
  }
}

export default new ClassService();