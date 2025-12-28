import { Request, Response } from 'express';
import departmentService from '../services/department.service';
import { sendSuccess, sendError } from '../utils/response.util';

class DepartmentController {
    /**
     * Get all departments for a school
     * GET /api/v1/schools/:schoolId/departments
     */
    async getDepartmentsBySchool(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;

            const departments = await departmentService.getDepartmentsBySchool(schoolId);

            return sendSuccess(res, 200, 'Departments retrieved successfully', { departments });
        } catch (error) {
            console.error('Get departments error:', error);
            return sendError(res, 500, 'Failed to retrieve departments');
        }
    }

    /**
     * Get department by ID
     * GET /api/v1/departments/:id
     */
    async getDepartmentById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const department = await departmentService.getDepartmentById(id);

            return sendSuccess(res, 200, 'Department retrieved successfully', { department });
        } catch (error) {
            console.error('Get department error:', error);
            const message = error instanceof Error ? error.message : 'Failed to retrieve department';
            return sendError(res, 404, message);
        }
    }

    /**
     * Create new department
     * POST /api/v1/schools/:schoolId/departments
     */
    async createDepartment(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { name, code, description, hodName, hodEmail, hodPhone } = req.body;

            // Validate required fields
            if (!name || !code) {
                return sendError(res, 400, 'Missing required fields', 'Name and code are required');
            }

            const department = await departmentService.createDepartment({
                name,
                code,
                description,
                schoolId,
                hodName,
                hodEmail,
                hodPhone,
            });

            return sendSuccess(res, 201, 'Department created successfully', { department });
        } catch (error) {
            console.error('Create department error:', error);
            const message = error instanceof Error ? error.message : 'Failed to create department';
            return sendError(res, 400, message);
        }
    }

    /**
     * Update department
     * PUT /api/v1/departments/:id
     */
    async updateDepartment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, hodName, hodEmail, hodPhone } = req.body;

            const department = await departmentService.updateDepartment(id, {
                name,
                description,
                hodName,
                hodEmail,
                hodPhone,
            });

            return sendSuccess(res, 200, 'Department updated successfully', { department });
        } catch (error) {
            console.error('Update department error:', error);
            const message = error instanceof Error ? error.message : 'Failed to update department';
            return sendError(res, 400, message);
        }
    }

    /**
     * Delete department
     * DELETE /api/v1/departments/:id
     */
    async deleteDepartment(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await departmentService.deleteDepartment(id);

            return sendSuccess(res, 200, 'Department deleted successfully');
        } catch (error) {
            console.error('Delete department error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete department';
            return sendError(res, 400, message);
        }
    }
}

export default new DepartmentController();