import { AnalyticsType } from '@prisma/client';
import prisma from '../config/database.config';

class AnalyticsService {
    /**
     * Get student performance analytics
     */
    async getStudentPerformance(studentId: string, academicYearId?: string) {
        const where: any = { studentId };
        if (academicYearId) where.academicYearId = academicYearId;

        const grades = await prisma.grade.findMany({
            where,
            include: {
                subject: true,
                academicYear: true,
                term: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const assignments = await prisma.submission.findMany({
            where: {
                studentId,
                status: 'GRADED',
            },
            include: {
                assignment: {
                    include: {
                        subject: true,
                    },
                },
            },
        });

        const exams = await prisma.examResult.findMany({
            where: { studentId },
            include: {
                exam: {
                    include: {
                        subject: true,
                    },
                },
            },
        });

        const avgGrade = grades.length > 0
            ? grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length
            : 0;

        const avgAssignment = assignments.length > 0
            ? assignments.reduce((sum, a) => sum + ((a.points || 0) / a.assignment.totalPoints) * 100, 0) / assignments.length
            : 0;

        const avgExam = exams.length > 0
            ? exams.reduce((sum, e) => sum + e.percentage, 0) / exams.length
            : 0;

        return {
            overview: {
                totalGrades: grades.length,
                averageGrade: Math.round(avgGrade * 10) / 10,
                averageAssignment: Math.round(avgAssignment * 10) / 10,
                averageExam: Math.round(avgExam * 10) / 10,
            },
            grades,
            assignments: assignments.slice(0, 10),
            exams: exams.slice(0, 10),
            subjectBreakdown: this.calculateSubjectBreakdown(grades),
            trends: this.calculateTrends(grades),
        };
    }

    /**
     * Get class performance analytics
     */
    async getClassPerformance(classId: string, academicYearId: string, termType?: string) {
        const where: any = { classId, academicYearId };
        if (termType) where.termType = termType;

        const grades = await prisma.grade.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                subject: true,
            },
        });

        const students = await prisma.user.count({
            where: { classId, role: 'STUDENT' },
        });

        const avgScore = grades.length > 0
            ? grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length
            : 0;

        const passed = grades.filter(g => g.isPassed).length;
        const failed = grades.filter(g => !g.isPassed).length;

        return {
            overview: {
                totalStudents: students,
                totalGrades: grades.length,
                averageScore: Math.round(avgScore * 10) / 10,
                passRate: grades.length > 0 ? (passed / grades.length) * 100 : 0,
                passed,
                failed,
            },
            topPerformers: this.getTopPerformers(grades),
            subjectPerformance: this.getSubjectPerformanceBreakdown(grades),
            gradeDistribution: this.getGradeDistribution(grades),
        };
    }

    /**
     * Get subject performance analytics
     */
    async getSubjectPerformance(subjectId: string, academicYearId: string) {
        const grades = await prisma.grade.findMany({
            where: { subjectId, academicYearId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                class: true,
            },
        });

        const avgScore = grades.length > 0
            ? grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length
            : 0;

        return {
            overview: {
                totalStudents: grades.length,
                averageScore: Math.round(avgScore * 10) / 10,
                highestScore: grades.length > 0 ? Math.max(...grades.map(g => g.totalScore)) : 0,
                lowestScore: grades.length > 0 ? Math.min(...grades.map(g => g.totalScore)) : 0,
            },
            classwisePerformance: this.getClasswisePerformance(grades),
            gradeDistribution: this.getGradeDistribution(grades),
        };
    }

    /**
     * Get attendance trends
     */
    async getAttendanceTrends(classId: string, startDate: Date, endDate: Date) {
        const attendance = await prisma.attendance.findMany({
            where: {
                classId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const byDate = new Map<string, any>();

        attendance.forEach(a => {
            const dateKey = a.date.toISOString().split('T')[0];
            if (!byDate.has(dateKey)) {
                byDate.set(dateKey, {
                    date: dateKey,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0,
                });
            }
            const day = byDate.get(dateKey);
            day.total++;
            if (a.status === 'PRESENT') day.present++;
            else if (a.status === 'ABSENT') day.absent++;
            else if (a.status === 'LATE') day.late++;
            else if (a.status === 'EXCUSED') day.excused++;
        });

        return {
            daily: Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
            summary: {
                totalRecords: attendance.length,
                avgAttendanceRate: this.calculateAvgAttendanceRate(Array.from(byDate.values())),
            },
        };
    }

    /**
     * Get assignment completion analytics
     */
    async getAssignmentCompletion(classId: string) {
        const assignments = await prisma.assignment.findMany({
            where: { classId },
            include: {
                submissions: true,
                _count: {
                    select: { submissions: true },
                },
            },
        });

        return assignments.map(a => ({
            assignmentId: a.id,
            title: a.title,
            dueDate: a.dueDate,
            totalSubmissions: a._count.submissions,
            submitted: a.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED').length,
            graded: a.submissions.filter(s => s.status === 'GRADED').length,
            avgScore: this.calculateAvgSubmissionScore(a.submissions),
        }));
    }

    /**
     * Get exam results analytics
     */
    async getExamResults(examId: string) {
        const results = await prisma.examResult.findMany({
            where: { examId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { score: 'desc' },
        });

        const scores = results.map(r => r.score);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        return {
            overview: {
                totalStudents: results.length,
                averageScore: Math.round(avgScore * 10) / 10,
                highestScore: scores.length > 0 ? Math.max(...scores) : 0,
                lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
                passRate: results.length > 0 ? (results.filter(r => r.passed).length / results.length) * 100 : 0,
            },
            results: results.slice(0, 10),
            scoreDistribution: this.getScoreDistribution(scores),
        };
    }

    /**
     * Save analytics record
     */
    async saveAnalytics(data: {
        type: AnalyticsType;
        title: string;
        description?: string;
        schoolId?: string;
        classId?: string;
        subjectId?: string;
        studentId?: string;
        data: any;
        startDate: Date;
        endDate: Date;
    }) {
        return await prisma.analytics.create({
            data: {
                type: data.type,
                title: data.title,
                description: data.description,
                schoolId: data.schoolId,
                classId: data.classId,
                subjectId: data.subjectId,
                studentId: data.studentId,
                data: data.data,
                startDate: data.startDate,
                endDate: data.endDate,
            },
        });
    }

    // Helper methods
    private calculateSubjectBreakdown(grades: any[]) {
        const breakdown = new Map<string, { subject: string; avg: number; count: number }>();

        grades.forEach(g => {
            const key = g.subjectId;
            if (!breakdown.has(key)) {
                breakdown.set(key, {
                    subject: g.subject.name,
                    avg: 0,
                    count: 0,
                });
            }
            const item = breakdown.get(key)!;
            item.avg = (item.avg * item.count + g.totalScore) / (item.count + 1);
            item.count++;
        });

        return Array.from(breakdown.values()).map(item => ({
            ...item,
            avg: Math.round(item.avg * 10) / 10,
        }));
    }

    private calculateTrends(grades: any[]) {
        const sorted = [...grades].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return sorted.map(g => ({
            date: g.createdAt,
            score: g.totalScore,
            subject: g.subject.name,
        }));
    }

    private getTopPerformers(grades: any[]) {
        const studentScores = new Map<string, { student: any; total: number; count: number }>();

        grades.forEach(g => {
            const key = g.studentId;
            if (!studentScores.has(key)) {
                studentScores.set(key, {
                    student: g.student,
                    total: 0,
                    count: 0,
                });
            }
            const item = studentScores.get(key)!;
            item.total += g.totalScore;
            item.count++;
        });

        return Array.from(studentScores.values())
            .map(item => ({
                student: item.student,
                average: Math.round((item.total / item.count) * 10) / 10,
            }))
            .sort((a, b) => b.average - a.average)
            .slice(0, 5);
    }

    private getSubjectPerformanceBreakdown(grades: any[]) {
        const subjects = new Map<string, { subject: any; total: number; count: number }>();

        grades.forEach(g => {
            const key = g.subjectId;
            if (!subjects.has(key)) {
                subjects.set(key, {
                    subject: g.subject,
                    total: 0,
                    count: 0,
                });
            }
            const item = subjects.get(key)!;
            item.total += g.totalScore;
            item.count++;
        });

        return Array.from(subjects.values()).map(item => ({
            subject: item.subject.name,
            average: Math.round((item.total / item.count) * 10) / 10,
        }));
    }

    private getGradeDistribution(grades: any[]) {
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

        grades.forEach(g => {
            if (g.letterGrade && g.letterGrade in distribution) {
                distribution[g.letterGrade as keyof typeof distribution]++;
            }
        });

        return distribution;
    }

    private getClasswisePerformance(grades: any[]) {
        const classes = new Map<string, { class: any; total: number; count: number }>();

        grades.forEach(g => {
            const key = g.classId;
            if (!classes.has(key)) {
                classes.set(key, {
                    class: g.class,
                    total: 0,
                    count: 0,
                });
            }
            const item = classes.get(key)!;
            item.total += g.totalScore;
            item.count++;
        });

        return Array.from(classes.values()).map(item => ({
            class: item.class.name,
            average: Math.round((item.total / item.count) * 10) / 10,
        }));
    }

    private getScoreDistribution(scores: number[]) {
        const ranges = {
            '90-100': 0,
            '80-89': 0,
            '70-79': 0,
            '60-69': 0,
            '0-59': 0,
        };

        scores.forEach(s => {
            if (s >= 90) ranges['90-100']++;
            else if (s >= 80) ranges['80-89']++;
            else if (s >= 70) ranges['70-79']++;
            else if (s >= 60) ranges['60-69']++;
            else ranges['0-59']++;
        });

        return ranges;
    }

    private calculateAvgAttendanceRate(days: any[]) {
        if (days.length === 0) return 0;
        const totalRate = days.reduce((sum, day) => {
            const rate = day.total > 0 ? (day.present / day.total) * 100 : 0;
            return sum + rate;
        }, 0);
        return Math.round((totalRate / days.length) * 10) / 10;
    }

    private calculateAvgSubmissionScore(submissions: any[]) {
        const graded = submissions.filter(s => s.status === 'GRADED' && s.points !== null);
        if (graded.length === 0) return 0;
        const total = graded.reduce((sum, s) => sum + (s.points || 0), 0);
        return Math.round((total / graded.length) * 10) / 10;
    }
}

export default new AnalyticsService();