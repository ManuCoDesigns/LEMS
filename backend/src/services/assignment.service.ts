import { Assignment, AssignmentStatus, Submission, SubmissionStatus } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateAssignmentInput {
    title: string;
    description?: string;
    instructions?: string;
    totalPoints?: number;
    passingPoints?: number;
    dueDate: Date;
    allowLateSubmission?: boolean;
    latePenalty?: number;
    classId: string;
    subjectId: string;
    createdById: string;
    attachments?: string[];
}

export interface UpdateAssignmentInput {
    title?: string;
    description?: string;
    instructions?: string;
    totalPoints?: number;
    passingPoints?: number;
    dueDate?: Date;
    allowLateSubmission?: boolean;
    latePenalty?: number;
    attachments?: string[];
}

export interface SubmitAssignmentInput {
    assignmentId: string;
    studentId: string;
    content?: string;
    attachments?: string[];
}

export interface GradeSubmissionInput {
    submissionId: string;
    points: number;
    feedback?: string;
    gradedById: string;
}

class AssignmentService {
    /**
     * Create new assignment
     */
    async createAssignment(data: CreateAssignmentInput) {
        // Validate class exists
        const classData = await prisma.class.findUnique({
            where: { id: data.classId },
        });

        if (!classData) {
            throw new Error('Class not found');
        }

        // Validate subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: data.subjectId },
        });

        if (!subject) {
            throw new Error('Subject not found');
        }

        // Create assignment
        const assignment = await prisma.assignment.create({
            data: {
                title: data.title,
                description: data.description,
                instructions: data.instructions,
                totalPoints: data.totalPoints || 100,
                passingPoints: data.passingPoints,
                dueDate: data.dueDate,
                allowLateSubmission: data.allowLateSubmission ?? true,
                latePenalty: data.latePenalty,
                classId: data.classId,
                subjectId: data.subjectId,
                createdById: data.createdById,
                attachments: data.attachments || [],
            },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
        });

        // Create submission records for all students in the class
        await this.createSubmissionsForStudents(assignment.id, data.classId);

        return assignment;
    }

    /**
     * Create submission records for all students in a class
     */
    private async createSubmissionsForStudents(assignmentId: string, classId: string) {
        // Get all students in the class
        const students = await prisma.user.findMany({
            where: {
                classId,
                role: 'STUDENT',
            },
            select: {
                id: true,
            },
        });

        // Create submission records
        const submissions = students.map((student) => ({
            assignmentId,
            studentId: student.id,
            status: SubmissionStatus.NOT_SUBMITTED,
            attachments: [],
        }));

        if (submissions.length > 0) {
            await prisma.submission.createMany({
                data: submissions,
            });
        }
    }

    /**
     * Get all assignments for a class
     */
    async getAssignmentsByClass(classId: string, subjectId?: string) {
        const where: any = { classId };

        if (subjectId) {
            where.subjectId = subjectId;
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
            orderBy: {
                dueDate: 'desc',
            },
        });

        return assignments;
    }

    /**
     * Get assignment by ID
     */
    async getAssignmentById(assignmentId: string) {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                submissions: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        submittedAt: 'desc',
                    },
                },
            },
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        return assignment;
    }

    /**
     * Update assignment
     */
    async updateAssignment(assignmentId: string, data: UpdateAssignmentInput) {
        const existing = await prisma.assignment.findUnique({
            where: { id: assignmentId },
        });

        if (!existing) {
            throw new Error('Assignment not found');
        }

        const assignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data,
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
        });

        return assignment;
    }

    /**
     * Update assignment status
     */
    async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
        const assignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data: { status },
        });

        return assignment;
    }

    /**
     * Delete assignment
     */
    async deleteAssignment(assignmentId: string) {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        await prisma.assignment.delete({
            where: { id: assignmentId },
        });
    }

    /**
     * Submit assignment
     */
    async submitAssignment(data: SubmitAssignmentInput) {
        // Get assignment
        const assignment = await prisma.assignment.findUnique({
            where: { id: data.assignmentId },
        });

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        // Check if late
        const now = new Date();
        const isLate = now > assignment.dueDate;

        if (isLate && !assignment.allowLateSubmission) {
            throw new Error('Late submissions are not allowed for this assignment');
        }

        // Find or create submission
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId: data.assignmentId,
                    studentId: data.studentId,
                },
            },
        });

        let submission;

        if (existingSubmission) {
            // Update existing submission
            submission = await prisma.submission.update({
                where: { id: existingSubmission.id },
                data: {
                    content: data.content,
                    attachments: data.attachments || [],
                    status: SubmissionStatus.SUBMITTED,
                    submittedAt: now,
                    isLate,
                },
                include: {
                    assignment: {
                        select: {
                            id: true,
                            title: true,
                            totalPoints: true,
                            dueDate: true,
                        },
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
        } else {
            // Create new submission
            submission = await prisma.submission.create({
                data: {
                    assignmentId: data.assignmentId,
                    studentId: data.studentId,
                    content: data.content,
                    attachments: data.attachments || [],
                    status: SubmissionStatus.SUBMITTED,
                    submittedAt: now,
                    isLate,
                },
                include: {
                    assignment: {
                        select: {
                            id: true,
                            title: true,
                            totalPoints: true,
                            dueDate: true,
                        },
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
        }

        return submission;
    }

    /**
     * Grade submission
     */
    async gradeSubmission(data: GradeSubmissionInput) {
        const submission = await prisma.submission.findUnique({
            where: { id: data.submissionId },
            include: {
                assignment: true,
            },
        });

        if (!submission) {
            throw new Error('Submission not found');
        }

        // Validate points
        if (data.points < 0 || data.points > submission.assignment.totalPoints) {
            throw new Error(`Points must be between 0 and ${submission.assignment.totalPoints}`);
        }

        // Apply late penalty if applicable
        let finalPoints = data.points;
        if (submission.isLate && submission.assignment.latePenalty) {
            const penalty = (data.points * submission.assignment.latePenalty) / 100;
            finalPoints = Math.max(0, data.points - penalty);
        }

        const graded = await prisma.submission.update({
            where: { id: data.submissionId },
            data: {
                points: Math.round(finalPoints),
                feedback: data.feedback,
                status: SubmissionStatus.GRADED,
                gradedAt: new Date(),
                gradedById: data.gradedById,
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                    },
                },
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                gradedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return graded;
    }

    /**
     * Get student submissions
     */
    async getStudentSubmissions(studentId: string, classId?: string) {
        const where: any = { studentId };

        if (classId) {
            where.assignment = {
                classId,
            };
        }

        const submissions = await prisma.submission.findMany({
            where,
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        dueDate: true,
                        status: true,
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        class: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return submissions;
    }

    /**
     * Get assignment statistics
     */
    async getAssignmentStats(assignmentId: string) {
        const submissions = await prisma.submission.findMany({
            where: { assignmentId },
        });

        const total = submissions.length;
        const submitted = submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED || s.status === SubmissionStatus.GRADED).length;
        const graded = submissions.filter((s) => s.status === SubmissionStatus.GRADED).length;
        const late = submissions.filter((s) => s.isLate).length;

        const gradedSubmissions = submissions.filter((s) => s.points !== null);
        const avgScore = gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, s) => sum + (s.points || 0), 0) / gradedSubmissions.length
            : 0;

        return {
            total,
            submitted,
            graded,
            late,
            notSubmitted: total - submitted,
            submissionRate: total > 0 ? (submitted / total) * 100 : 0,
            averageScore: Math.round(avgScore * 10) / 10,
        };
    }

    /**
     * Get class assignment statistics
     */
    async getClassAssignmentStats(classId: string) {
        const assignments = await prisma.assignment.count({
            where: { classId },
        });

        const submissions = await prisma.submission.findMany({
            where: {
                assignment: {
                    classId,
                },
            },
        });

        const total = submissions.length;
        const submitted = submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED || s.status === SubmissionStatus.GRADED).length;

        return {
            totalAssignments: assignments,
            totalSubmissions: total,
            submitted,
            pending: total - submitted,
            submissionRate: total > 0 ? (submitted / total) * 100 : 0,
        };
    }
}

export default new AssignmentService();