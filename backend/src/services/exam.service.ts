import { Exam, ExamStatus, ExamType, QuestionType } from '@prisma/client';
import prisma from '../config/database.config';

export interface CreateExamInput {
    title: string;
    description?: string;
    instructions?: string;
    examType: ExamType;
    totalMarks?: number;
    passingMarks?: number;
    duration: number;
    startTime: Date;
    endTime: Date;
    shuffleQuestions?: boolean;
    showResults?: boolean;
    allowReview?: boolean;
    classId: string;
    subjectId: string;
    createdById: string;
}

export interface UpdateExamInput {
    title?: string;
    description?: string;
    instructions?: string;
    examType?: ExamType;
    totalMarks?: number;
    passingMarks?: number;
    duration?: number;
    startTime?: Date;
    endTime?: Date;
    shuffleQuestions?: boolean;
    showResults?: boolean;
    allowReview?: boolean;
}

export interface CreateQuestionInput {
    examId: string;
    questionType: QuestionType;
    questionText: string;
    marks: number;
    order: number;
    options?: string[];
    correctAnswer?: string;
    sampleAnswer?: string;
}

export interface SubmitExamInput {
    examId: string;
    studentId: string;
    answers: {
        questionId: string;
        answer: string;
    }[];
    duration: number;
}

class ExamService {
    /**
     * Create new exam
     */
    async createExam(data: CreateExamInput) {
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

        // Validate time range
        if (data.startTime >= data.endTime) {
            throw new Error('End time must be after start time');
        }

        // Create exam
        const exam = await prisma.exam.create({
            data: {
                title: data.title,
                description: data.description,
                instructions: data.instructions,
                examType: data.examType,
                totalMarks: data.totalMarks || 100,
                passingMarks: data.passingMarks,
                duration: data.duration,
                startTime: data.startTime,
                endTime: data.endTime,
                shuffleQuestions: data.shuffleQuestions ?? false,
                showResults: data.showResults ?? false,
                allowReview: data.allowReview ?? true,
                classId: data.classId,
                subjectId: data.subjectId,
                createdById: data.createdById,
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
                        questions: true,
                        results: true,
                    },
                },
            },
        });

        return exam;
    }

    /**
     * Get exam by ID
     */
    async getExamById(examId: string) {
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
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
                questions: {
                    orderBy: {
                        order: 'asc',
                    },
                },
                _count: {
                    select: {
                        results: true,
                    },
                },
            },
        });

        if (!exam) {
            throw new Error('Exam not found');
        }

        return exam;
    }

    /**
     * Get all exams for a class
     */
    async getClassExams(classId: string, subjectId?: string) {
        const where: any = { classId };

        if (subjectId) {
            where.subjectId = subjectId;
        }

        const exams = await prisma.exam.findMany({
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
                        questions: true,
                        results: true,
                    },
                },
            },
            orderBy: {
                startTime: 'desc',
            },
        });

        return exams;
    }

    /**
     * Update exam
     */
    async updateExam(examId: string, data: UpdateExamInput) {
        const existing = await prisma.exam.findUnique({
            where: { id: examId },
        });

        if (!existing) {
            throw new Error('Exam not found');
        }

        // Validate time range if both provided
        if (data.startTime && data.endTime && data.startTime >= data.endTime) {
            throw new Error('End time must be after start time');
        }

        const exam = await prisma.exam.update({
            where: { id: examId },
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
                        questions: true,
                        results: true,
                    },
                },
            },
        });

        return exam;
    }

    /**
     * Update exam status
     */
    async updateExamStatus(examId: string, status: ExamStatus) {
        const exam = await prisma.exam.update({
            where: { id: examId },
            data: { status },
        });

        return exam;
    }

    /**
     * Delete exam
     */
    async deleteExam(examId: string) {
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
        });

        if (!exam) {
            throw new Error('Exam not found');
        }

        await prisma.exam.delete({
            where: { id: examId },
        });
    }

    /**
     * Add question to exam
     */
    async addQuestion(data: CreateQuestionInput) {
        // Validate exam exists
        const exam = await prisma.exam.findUnique({
            where: { id: data.examId },
        });

        if (!exam) {
            throw new Error('Exam not found');
        }

        // Create question
        const question = await prisma.examQuestion.create({
            data: {
                examId: data.examId,
                questionType: data.questionType,
                questionText: data.questionText,
                marks: data.marks,
                order: data.order,
                options: data.options || [],
                correctAnswer: data.correctAnswer,
                sampleAnswer: data.sampleAnswer,
            },
        });

        // Update exam total marks
        const totalMarks = await this.calculateExamTotalMarks(data.examId);
        await prisma.exam.update({
            where: { id: data.examId },
            data: { totalMarks },
        });

        return question;
    }

    /**
     * Get exam questions
     */
    async getExamQuestions(examId: string) {
        const questions = await prisma.examQuestion.findMany({
            where: { examId },
            orderBy: {
                order: 'asc',
            },
        });

        return questions;
    }

    /**
     * Update question
     */
    async updateQuestion(questionId: string, data: Partial<CreateQuestionInput>) {
        const question = await prisma.examQuestion.update({
            where: { id: questionId },
            data,
        });

        // Recalculate exam total marks if marks changed
        if (data.marks !== undefined) {
            const totalMarks = await this.calculateExamTotalMarks(question.examId);
            await prisma.exam.update({
                where: { id: question.examId },
                data: { totalMarks },
            });
        }

        return question;
    }

    /**
     * Delete question
     */
    async deleteQuestion(questionId: string) {
        const question = await prisma.examQuestion.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new Error('Question not found');
        }

        await prisma.examQuestion.delete({
            where: { id: questionId },
        });

        // Recalculate exam total marks
        const totalMarks = await this.calculateExamTotalMarks(question.examId);
        await prisma.exam.update({
            where: { id: question.examId },
            data: { totalMarks },
        });
    }

    /**
     * Submit exam
     */
    async submitExam(data: SubmitExamInput) {
        // Get exam with questions
        const exam = await prisma.exam.findUnique({
            where: { id: data.examId },
            include: {
                questions: true,
            },
        });

        if (!exam) {
            throw new Error('Exam not found');
        }

        // Check if student already has a result
        const existingResult = await prisma.examResult.findUnique({
            where: {
                examId_studentId: {
                    examId: data.examId,
                    studentId: data.studentId,
                },
            },
        });

        if (existingResult) {
            throw new Error('Exam already submitted');
        }

        // Calculate score
        let score = 0;
        const answers = [];

        for (const answer of data.answers) {
            const question = exam.questions.find((q) => q.id === answer.questionId);

            if (question) {
                let isCorrect = false;
                let marksObtained = 0;

                // Auto-grade objective questions
                if (
                    question.questionType === QuestionType.MULTIPLE_CHOICE ||
                    question.questionType === QuestionType.TRUE_FALSE ||
                    question.questionType === QuestionType.FILL_IN_BLANK
                ) {
                    isCorrect = answer.answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
                    marksObtained = isCorrect ? question.marks : 0;
                    score += marksObtained;
                }

                answers.push({
                    questionId: answer.questionId,
                    answer: answer.answer,
                    isCorrect: isCorrect || null,
                    marksObtained,
                });
            }
        }

        // Calculate percentage
        const percentage = exam.totalMarks > 0 ? (score / exam.totalMarks) * 100 : 0;
        const passed = exam.passingMarks ? score >= exam.passingMarks : false;

        // Create exam result
        const result = await prisma.examResult.create({
            data: {
                examId: data.examId,
                studentId: data.studentId,
                submittedAt: new Date(),
                duration: data.duration,
                score,
                totalMarks: exam.totalMarks,
                percentage,
                passed,
                answers: {
                    create: answers,
                },
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalMarks: true,
                        passingMarks: true,
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
                answers: {
                    include: {
                        question: true,
                    },
                },
            },
        });

        return result;
    }

    /**
     * Get student exam result
     */
    async getStudentResult(examId: string, studentId: string) {
        const result = await prisma.examResult.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId,
                },
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalMarks: true,
                        passingMarks: true,
                        showResults: true,
                        allowReview: true,
                    },
                },
                answers: {
                    include: {
                        question: true,
                    },
                },
            },
        });

        return result;
    }

    /**
     * Get all results for an exam
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
                        email: true,
                    },
                },
            },
            orderBy: {
                score: 'desc',
            },
        });

        return results;
    }

    /**
     * Grade subjective answer
     */
    async gradeAnswer(answerId: string, marksObtained: number) {
        const answer = await prisma.examAnswer.findUnique({
            where: { id: answerId },
            include: {
                question: true,
                result: true,
            },
        });

        if (!answer) {
            throw new Error('Answer not found');
        }

        // Validate marks
        if (marksObtained < 0 || marksObtained > answer.question.marks) {
            throw new Error(`Marks must be between 0 and ${answer.question.marks}`);
        }

        // Update answer
        const updated = await prisma.examAnswer.update({
            where: { id: answerId },
            data: {
                marksObtained,
                isCorrect: marksObtained === answer.question.marks,
            },
        });

        // Recalculate result score
        await this.recalculateResultScore(answer.resultId);

        return updated;
    }

    /**
     * Get exam statistics
     */
    async getExamStats(examId: string) {
        const results = await prisma.examResult.findMany({
            where: { examId },
        });

        const total = results.length;
        const submitted = results.filter((r) => r.submittedAt !== null).length;
        const passed = results.filter((r) => r.passed).length;

        const scores = results.filter((r) => r.score > 0).map((r) => r.score);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        return {
            total,
            submitted,
            passed,
            failed: submitted - passed,
            notStarted: total - submitted,
            averageScore: Math.round(avgScore * 10) / 10,
            highestScore,
            lowestScore,
            passRate: submitted > 0 ? (passed / submitted) * 100 : 0,
        };
    }

    /**
     * Calculate exam total marks from questions
     */
    private async calculateExamTotalMarks(examId: string): Promise<number> {
        const questions = await prisma.examQuestion.findMany({
            where: { examId },
        });

        return questions.reduce((total, q) => total + q.marks, 0);
    }

    /**
     * Recalculate result score after grading
     */
    private async recalculateResultScore(resultId: string) {
        const answers = await prisma.examAnswer.findMany({
            where: { resultId },
        });

        const score = answers.reduce((total, a) => total + a.marksObtained, 0);

        const result = await prisma.examResult.findUnique({
            where: { id: resultId },
            include: {
                exam: {
                    select: {
                        passingMarks: true,
                    },
                },
            },
        });

        if (result) {
            const percentage = result.totalMarks > 0 ? (score / result.totalMarks) * 100 : 0;
            const passed = result.exam?.passingMarks ? score >= result.exam.passingMarks : false;

            await prisma.examResult.update({
                where: { id: resultId },
                data: {
                    score,
                    percentage,
                    passed,
                },
            });
        }
    }
}

export default new ExamService();