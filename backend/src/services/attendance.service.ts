import { Attendance, AttendanceStatus, AttendanceSummary } from '@prisma/client';
import prisma from '../config/database.config';

export interface MarkAttendanceInput {
    studentId: string;
    classId: string;
    date: Date;
    status: AttendanceStatus;
    remarks?: string;
    checkInTime?: Date;
    checkOutTime?: Date;
    subjectId?: string;
    markedById: string;
}

export interface BulkAttendanceInput {
    classId: string;
    date: Date;
    subjectId?: string;
    markedById: string;
    records: {
        studentId: string;
        status: AttendanceStatus;
        remarks?: string;
    }[];
}

class AttendanceService {
    /**
     * Mark attendance for a single student
     */
    async markAttendance(data: MarkAttendanceInput) {
        // Check if student exists
        const student = await prisma.user.findUnique({
            where: { id: data.studentId },
        });

        if (!student || student.role !== 'STUDENT') {
            throw new Error('Student not found');
        }

        // Check if class exists
        const classData = await prisma.class.findUnique({
            where: { id: data.classId },
        });

        if (!classData) {
            throw new Error('Class not found');
        }

        // Check if attendance already exists
        const existing = await prisma.attendance.findFirst({
            where: {
                studentId: data.studentId,
                classId: data.classId,
                date: data.date,
                subjectId: data.subjectId || null,
            },
        });

        let attendance;

        if (existing) {
            // Update existing attendance
            attendance = await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    status: data.status,
                    remarks: data.remarks,
                    checkInTime: data.checkInTime,
                    checkOutTime: data.checkOutTime,
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
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
        } else {
            // Create new attendance record
            attendance = await prisma.attendance.create({
                data,
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
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
        }

        // Update summary
        await this.updateAttendanceSummary(
            data.studentId,
            data.classId,
            data.date.getMonth() + 1,
            data.date.getFullYear()
        );

        return attendance;
    }

    /**
     * Mark attendance for multiple students (bulk)
     */
    async markBulkAttendance(data: BulkAttendanceInput) {
        const results = [];

        for (const record of data.records) {
            const attendance = await this.markAttendance({
                studentId: record.studentId,
                classId: data.classId,
                date: data.date,
                status: record.status,
                remarks: record.remarks,
                subjectId: data.subjectId,
                markedById: data.markedById,
            });

            results.push(attendance);
        }

        return results;
    }

    /**
     * Get attendance for a class on a specific date
     */
    async getClassAttendance(classId: string, date: Date, subjectId?: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await prisma.attendance.findMany({
            where: {
                classId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                ...(subjectId && { subjectId }),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                markedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                student: {
                    firstName: 'asc',
                },
            },
        });

        return attendance;
    }

    /**
     * Get attendance for a student
     */
    async getStudentAttendance(
        studentId: string,
        startDate?: Date,
        endDate?: Date,
        classId?: string
    ) {
        const where: any = { studentId };

        if (startDate && endDate) {
            where.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        if (classId) {
            where.classId = classId;
        }

        const attendance = await prisma.attendance.findMany({
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
            },
            orderBy: {
                date: 'desc',
            },
        });

        return attendance;
    }

    /**
     * Get attendance summary for a student
     */
    async getStudentAttendanceSummary(
        studentId: string,
        classId: string,
        month?: number,
        year?: number
    ) {
        const currentDate = new Date();
        const targetMonth = month || currentDate.getMonth() + 1;
        const targetYear = year || currentDate.getFullYear();

        let summary = await prisma.attendanceSummary.findUnique({
            where: {
                studentId_classId_month_year: {
                    studentId,
                    classId,
                    month: targetMonth,
                    year: targetYear,
                },
            },
        });

        if (!summary) {
            // Calculate and create summary if it doesn't exist
            summary = await this.calculateAndCreateSummary(
                studentId,
                classId,
                targetMonth,
                targetYear
            );
        }

        return summary;
    }

    /**
     * Update attendance summary
     */
    async updateAttendanceSummary(
        studentId: string,
        classId: string,
        month: number,
        year: number
    ) {
        // Get all attendance records for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await prisma.attendance.findMany({
            where: {
                studentId,
                classId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // Calculate counts
        const totalDays = records.length;
        const presentDays = records.filter((r) => r.status === 'PRESENT').length;
        const absentDays = records.filter((r) => r.status === 'ABSENT').length;
        const lateDays = records.filter((r) => r.status === 'LATE').length;
        const excusedDays = records.filter(
            (r) => r.status === 'EXCUSED' || r.status === 'SICK'
        ).length;

        const attendanceRate =
            totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0;

        // Upsert summary
        const summary = await prisma.attendanceSummary.upsert({
            where: {
                studentId_classId_month_year: {
                    studentId,
                    classId,
                    month,
                    year,
                },
            },
            create: {
                studentId,
                classId,
                month,
                year,
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                excusedDays,
                attendanceRate,
            },
            update: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                excusedDays,
                attendanceRate,
            },
        });

        return summary;
    }

    /**
     * Calculate and create summary
     */
    private async calculateAndCreateSummary(
        studentId: string,
        classId: string,
        month: number,
        year: number
    ) {
        return await this.updateAttendanceSummary(studentId, classId, month, year);
    }

    /**
     * Get attendance statistics for a class
     */
    async getClassAttendanceStats(classId: string, month?: number, year?: number) {
        const currentDate = new Date();
        const targetMonth = month || currentDate.getMonth() + 1;
        const targetYear = year || currentDate.getFullYear();

        const summaries = await prisma.attendanceSummary.findMany({
            where: {
                classId,
                month: targetMonth,
                year: targetYear,
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
            },
            orderBy: {
                attendanceRate: 'desc',
            },
        });

        // Calculate class averages
        const totalStudents = summaries.length;
        const avgAttendanceRate =
            totalStudents > 0
                ? summaries.reduce((sum, s) => sum + s.attendanceRate, 0) / totalStudents
                : 0;

        return {
            summaries,
            statistics: {
                totalStudents,
                averageAttendanceRate: avgAttendanceRate,
                highestAttendance: summaries[0]?.attendanceRate || 0,
                lowestAttendance: summaries[summaries.length - 1]?.attendanceRate || 0,
            },
        };
    }

    /**
     * Get attendance report for date range
     */
    async getAttendanceReport(
        classId: string,
        startDate: Date,
        endDate: Date,
        subjectId?: string
    ) {
        const attendance = await prisma.attendance.findMany({
            where: {
                classId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(subjectId && { subjectId }),
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
            },
            orderBy: [
                { date: 'asc' },
                { student: { firstName: 'asc' } },
            ],
        });

        // Group by student
        const studentMap = new Map();

        attendance.forEach((record) => {
            const studentId = record.studentId;
            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    student: record.student,
                    records: [],
                    summary: {
                        total: 0,
                        present: 0,
                        absent: 0,
                        late: 0,
                        excused: 0,
                    },
                });
            }

            const studentData = studentMap.get(studentId);
            studentData.records.push(record);
            studentData.summary.total++;

            switch (record.status) {
                case 'PRESENT':
                    studentData.summary.present++;
                    break;
                case 'ABSENT':
                    studentData.summary.absent++;
                    break;
                case 'LATE':
                    studentData.summary.late++;
                    break;
                case 'EXCUSED':
                case 'SICK':
                    studentData.summary.excused++;
                    break;
            }
        });

        return Array.from(studentMap.values());
    }

    /**
     * Delete attendance record
     */
    async deleteAttendance(attendanceId: string) {
        const attendance = await prisma.attendance.findUnique({
            where: { id: attendanceId },
        });

        if (!attendance) {
            throw new Error('Attendance record not found');
        }

        await prisma.attendance.delete({
            where: { id: attendanceId },
        });

        // Update summary
        await this.updateAttendanceSummary(
            attendance.studentId,
            attendance.classId,
            attendance.date.getMonth() + 1,
            attendance.date.getFullYear()
        );
    }
}

export default new AttendanceService();