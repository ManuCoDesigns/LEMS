import { GradingScale, TermType } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateGradingSchemeInput {
    name: string;
    description?: string;
    scale: GradingScale;
    isDefault?: boolean;
    schoolId: string;
    boundaries: {
        grade: string;
        minScore: number;
        maxScore: number;
        gradePoint?: number;
        description?: string;
        passStatus?: boolean;
    }[];
}

export interface CalculateGradeInput {
    studentId: string;
    classId: string;
    subjectId: string;
    academicYearId: string;
    termId?: string;
    termType: TermType;
    schemeId?: string;
}

export interface GenerateReportCardInput {
    studentId: string;
    classId: string;
    academicYearId: string;
    termId?: string;
    termType: TermType;
    classTeacherComment?: string;
    principalComment?: string;
}

class GradeService {
    /**
     * Create grading scheme with boundaries
     */
    async createGradingScheme(data: CreateGradingSchemeInput) {
        // If setting as default, unset other defaults
        if (data.isDefault) {
            await prisma.gradingScheme.updateMany({
                where: { schoolId: data.schoolId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const scheme = await prisma.gradingScheme.create({
            data: {
                name: data.name,
                description: data.description,
                scale: data.scale,
                isDefault: data.isDefault ?? false,
                schoolId: data.schoolId,
                boundaries: {
                    create: data.boundaries,
                },
            },
            include: {
                boundaries: {
                    orderBy: { minScore: 'desc' },
                },
            },
        });

        return scheme;
    }

    /**
     * Get all grading schemes for a school
     */
    async getSchoolGradingSchemes(schoolId: string) {
        const schemes = await prisma.gradingScheme.findMany({
            where: { schoolId },
            include: {
                boundaries: {
                    orderBy: { minScore: 'desc' },
                },
                _count: {
                    select: { grades: true },
                },
            },
            orderBy: { isDefault: 'desc' },
        });

        return schemes;
    }

    /**
     * Get grading scheme by ID
     */
    async getGradingSchemeById(schemeId: string) {
        const scheme = await prisma.gradingScheme.findUnique({
            where: { id: schemeId },
            include: {
                boundaries: {
                    orderBy: { minScore: 'desc' },
                },
            },
        });

        if (!scheme) {
            throw new Error('Grading scheme not found');
        }

        return scheme;
    }

    /**
     * Update grading scheme
     */
    async updateGradingScheme(schemeId: string, data: Partial<CreateGradingSchemeInput>) {
        const scheme = await prisma.gradingScheme.update({
            where: { id: schemeId },
            data: {
                name: data.name,
                description: data.description,
                scale: data.scale,
                isDefault: data.isDefault,
            },
            include: {
                boundaries: {
                    orderBy: { minScore: 'desc' },
                },
            },
        });

        return scheme;
    }

    /**
     * Delete grading scheme
     */
    async deleteGradingScheme(schemeId: string) {
        await prisma.gradingScheme.delete({
            where: { id: schemeId },
        });
    }

    /**
     * Calculate and save grade for a student in a subject
     */
    async calculateGrade(data: CalculateGradeInput) {
        // Get assignment scores
        const assignments = await prisma.submission.findMany({
            where: {
                studentId: data.studentId,
                assignment: {
                    classId: data.classId,
                    subjectId: data.subjectId,
                },
                status: 'GRADED',
            },
            include: {
                assignment: true,
            },
        });

        const assignmentScore = assignments.reduce((sum, sub) => {
            if (sub.points !== null) {
                const percentage = (sub.points / sub.assignment.totalPoints) * 100;
                return sum + percentage;
            }
            return sum;
        }, 0);

        const avgAssignmentScore = assignments.length > 0 ? assignmentScore / assignments.length : 0;

        // Get exam scores
        const exams = await prisma.examResult.findMany({
            where: {
                studentId: data.studentId,
                exam: {
                    classId: data.classId,
                    subjectId: data.subjectId,
                },
            },
        });

        const examScore = exams.reduce((sum, result) => sum + result.percentage, 0);
        const avgExamScore = exams.length > 0 ? examScore / exams.length : 0;

        // Calculate total score (40% assignments, 60% exams)
        const totalScore = avgAssignmentScore * 0.4 + avgExamScore * 0.6;

        // Get grading scheme
        let schemeId = data.schemeId;
        if (!schemeId) {
            const defaultScheme = await prisma.gradingScheme.findFirst({
                where: { schoolId: data.classId, isDefault: true },
            });
            schemeId = defaultScheme?.id;
        }

        // Determine letter grade
        let letterGrade: string | undefined;
        let gradePoint: number | undefined;
        let isPassed = false;

        if (schemeId) {
            const boundaries = await prisma.gradeBoundary.findMany({
                where: { schemeId },
                orderBy: { minScore: 'desc' },
            });

            for (const boundary of boundaries) {
                if (totalScore >= boundary.minScore && totalScore <= boundary.maxScore) {
                    letterGrade = boundary.grade;
                    gradePoint = boundary.gradePoint ?? undefined;
                    isPassed = boundary.passStatus;
                    break;
                }
            }
        }

        // Create or update grade
        const grade = await prisma.grade.upsert({
            where: {
                studentId_subjectId_academicYearId_termType: {
                    studentId: data.studentId,
                    subjectId: data.subjectId,
                    academicYearId: data.academicYearId,
                    termType: data.termType,
                },
            },
            create: {
                studentId: data.studentId,
                classId: data.classId,
                subjectId: data.subjectId,
                academicYearId: data.academicYearId,
                termId: data.termId,
                termType: data.termType,
                schemeId,
                assignmentScore: avgAssignmentScore,
                examScore: avgExamScore,
                totalScore,
                percentage: totalScore,
                letterGrade,
                gradePoint,
                isPassed,
            },
            update: {
                assignmentScore: avgAssignmentScore,
                examScore: avgExamScore,
                totalScore,
                percentage: totalScore,
                letterGrade,
                gradePoint,
                isPassed,
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return grade;
    }

    /**
     * Calculate grades for all subjects for a student
     */
    async calculateAllGradesForStudent(
        studentId: string,
        classId: string,
        academicYearId: string,
        termType: TermType,
        termId?: string
    ) {
        // Get all subjects for the class
        const classSubjects = await prisma.classSubject.findMany({
            where: { classId },
            include: { subject: true },
        });

        const grades = [];

        for (const cs of classSubjects) {
            const grade = await this.calculateGrade({
                studentId,
                classId,
                subjectId: cs.subjectId,
                academicYearId,
                termId,
                termType,
            });
            grades.push(grade);
        }

        return grades;
    }

    /**
     * Get student grades
     */
    async getStudentGrades(studentId: string, academicYearId?: string, termType?: TermType) {
        const where: any = { studentId };
        if (academicYearId) where.academicYearId = academicYearId;
        if (termType) where.termType = termType;

        const grades = await prisma.grade.findMany({
            where,
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        category: true,
                    },
                },
                class: {
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
                    },
                },
                term: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ academicYearId: 'desc' }, { subject: { name: 'asc' } }],
        });

        return grades;
    }

    /**
     * Get class grades
     */
    async getClassGrades(classId: string, academicYearId: string, termType: TermType, subjectId?: string) {
        const where: any = { classId, academicYearId, termType };
        if (subjectId) where.subjectId = subjectId;

        const grades = await prisma.grade.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: [{ totalScore: 'desc' }],
        });

        return grades;
    }

    /**
     * Generate report card for a student
     */
    async generateReportCard(data: GenerateReportCardInput) {
        // Calculate all grades for the student
        await this.calculateAllGradesForStudent(
            data.studentId,
            data.classId,
            data.academicYearId,
            data.termType,
            data.termId
        );

        // Get all grades for this term
        const grades = await prisma.grade.findMany({
            where: {
                studentId: data.studentId,
                academicYearId: data.academicYearId,
                termType: data.termType,
            },
        });

        // Calculate overall performance
        const totalMarks = grades.reduce((sum, g) => sum + g.totalScore, 0);
        const maxMarks = grades.length * 100;
        const averageScore = grades.length > 0 ? totalMarks / grades.length : 0;

        // Calculate GPA if applicable
        const gradesWithPoints = grades.filter((g) => g.gradePoint !== null);
        const overallGPA =
            gradesWithPoints.length > 0
                ? gradesWithPoints.reduce((sum, g) => sum + (g.gradePoint || 0), 0) / gradesWithPoints.length
                : undefined;

        // Determine overall grade
        let overallGrade: string | undefined;
        if (averageScore >= 90) overallGrade = 'A';
        else if (averageScore >= 80) overallGrade = 'B';
        else if (averageScore >= 70) overallGrade = 'C';
        else if (averageScore >= 60) overallGrade = 'D';
        else overallGrade = 'F';

        // Get class ranking
        const allClassGrades = await prisma.grade.findMany({
            where: {
                classId: data.classId,
                academicYearId: data.academicYearId,
                termType: data.termType,
            },
        });

        const studentAverages = new Map<string, number>();
        for (const grade of allClassGrades) {
            const current = studentAverages.get(grade.studentId) || 0;
            studentAverages.set(grade.studentId, current + grade.totalScore);
        }

        const rankings = Array.from(studentAverages.entries())
            .map(([id, total]) => ({ id, avg: total / grades.length }))
            .sort((a, b) => b.avg - a.avg);

        const position = rankings.findIndex((r) => r.id === data.studentId) + 1;
        const outOf = rankings.length;

        // Get attendance summary
        const attendanceSummary = await prisma.attendanceSummary.findFirst({
            where: {
                studentId: data.studentId,
                classId: data.classId,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Create or update report card
        const reportCard = await prisma.reportCard.upsert({
            where: {
                studentId_academicYearId_termType: {
                    studentId: data.studentId,
                    academicYearId: data.academicYearId,
                    termType: data.termType,
                },
            },
            create: {
                studentId: data.studentId,
                classId: data.classId,
                academicYearId: data.academicYearId,
                termId: data.termId,
                termType: data.termType,
                totalMarks,
                maxMarks,
                averageScore,
                overallGrade,
                overallGPA,
                position,
                outOf,
                totalDays: attendanceSummary?.totalDays || 0,
                daysPresent: attendanceSummary?.presentDays || 0,
                daysAbsent: attendanceSummary?.absentDays || 0,
                attendanceRate: attendanceSummary?.attendanceRate || 0,
                classTeacherComment: data.classTeacherComment,
                principalComment: data.principalComment,
            },
            update: {
                totalMarks,
                maxMarks,
                averageScore,
                overallGrade,
                overallGPA,
                position,
                outOf,
                totalDays: attendanceSummary?.totalDays || 0,
                daysPresent: attendanceSummary?.presentDays || 0,
                daysAbsent: attendanceSummary?.absentDays || 0,
                attendanceRate: attendanceSummary?.attendanceRate || 0,
                classTeacherComment: data.classTeacherComment,
                principalComment: data.principalComment,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                class: {
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
                    },
                },
                term: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return { reportCard, grades };
    }

    /**
     * Get report card by ID
     */
    async getReportCard(reportCardId: string) {
        const reportCard = await prisma.reportCard.findUnique({
            where: { id: reportCardId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                class: {
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
                    },
                },
                term: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!reportCard) {
            throw new Error('Report card not found');
        }

        // Get grades for this report card
        const grades = await prisma.grade.findMany({
            where: {
                studentId: reportCard.studentId,
                academicYearId: reportCard.academicYearId,
                termType: reportCard.termType,
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { subject: { name: 'asc' } },
        });

        return { reportCard, grades };
    }

    /**
     * Publish report card
     */
    async publishReportCard(reportCardId: string, generatedBy: string) {
        const reportCard = await prisma.reportCard.update({
            where: { id: reportCardId },
            data: {
                isPublished: true,
                publishedAt: new Date(),
                generatedBy,
            },
        });

        return reportCard;
    }

    /**
     * Get student transcript
     */
    async getStudentTranscript(studentId: string) {
        let transcript = await prisma.transcript.findUnique({
            where: { studentId },
        });

        // If no transcript exists, create one
        if (!transcript) {
            transcript = await prisma.transcript.create({
                data: { studentId },
            });
        }

        // Get all grades for the student
        const grades = await prisma.grade.findMany({
            where: { studentId },
            include: {
                subject: true,
                academicYear: true,
                term: true,
            },
            orderBy: [{ academicYear: { startDate: 'asc' } }, { termType: 'asc' }],
        });

        return { transcript, grades };
    }

    /**
     * Update transcript
     */
    async updateTranscript(studentId: string) {
        const grades = await prisma.grade.findMany({
            where: { studentId },
        });

        const totalCredits = grades.length;
        const earnedCredits = grades.filter((g) => g.isPassed).length;

        const gradesWithPoints = grades.filter((g) => g.gradePoint !== null);
        const cumulativeGPA =
            gradesWithPoints.length > 0
                ? gradesWithPoints.reduce((sum, g) => sum + (g.gradePoint || 0), 0) / gradesWithPoints.length
                : 0;

        const transcript = await prisma.transcript.upsert({
            where: { studentId },
            create: {
                studentId,
                totalCredits,
                earnedCredits,
                cumulativeGPA,
            },
            update: {
                totalCredits,
                earnedCredits,
                cumulativeGPA,
            },
        });

        return transcript;
    }
}

export default new GradeService();