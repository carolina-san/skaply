import pool from "@/config/database";

import { Issue } from "@/types";

export class IssueService {
    async getAllIssues(status?: string, providerId?: number) {
        try {
            let query = `
                SELECT i.*, f.name as furniture_name, f.reference_number as furniture_reference, 
                       f.image_url as furniture_image, 
                       u.company_name as provider_name, u.id as provider_id
                FROM issue i
                LEFT JOIN furniture f ON i.furniture_id = f.id
                LEFT JOIN "User" u ON f.provider_id = u.id
                WHERE 1=1
            `;
            const params: any[] = [];
            let paramCount = 1;

            if (status) {
                query += ` AND i.status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }

            if (providerId) {
                query += ` AND u.id = $${paramCount}`;
                params.push(providerId);
                paramCount++;
            }

            query += ' ORDER BY i.date DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching all issues');
        }
    }

    async getProviderIssues(providerId: number, status?: string) {
        try {
            let query = `
                SELECT i.*, f.name as furniture_name, f.reference_number as furniture_reference, 
                       f.image_url as furniture_image
                FROM issue i
                JOIN furniture f ON i.furniture_id = f.id
                WHERE f.provider_id = $1
            `;
            const params: any[] = [providerId];

            if (status) {
                query += ' AND i.status = $2';
                params.push(status);
            }

            query += ' ORDER BY i.date DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching provider issues');
        }
    }

    async getFurnitureIssues(idFurniture: number) {
        try {
            const result = await pool.query('SELECT * FROM issue WHERE furniture_id = $1', [idFurniture]);
            return result.rows;
        } catch (error) {
            throw new Error('Error fetching furniture issues')
        }
    }

    async postIssue(issue: Issue): Promise<Issue> {
        try {
            const result = await pool.query(
                `INSERT INTO issue (description, date, user_email, furniture_id, status) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [issue.description, issue.date || new Date(), issue.user_email, issue.furniture_id, 'pending']
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error posting an issue');
        }
    }

    async resolveIssue(issueId: number, resolvedBy: string): Promise<Issue> {
        try {
            const result = await pool.query(
                `UPDATE issue 
                 SET status = 'resolved', resolved_at = NOW(), resolved_by = $2
                 WHERE id = $1 
                 RETURNING *`,
                [issueId, resolvedBy]
            );
            if (result.rows.length === 0) {
                throw new Error('Issue not found');
            }
            return result.rows[0];
        } catch (error) {
            throw new Error('Error resolving issue');
        }
    }

    async escalateIssue(issueId: number): Promise<Issue> {
        try {
            const result = await pool.query(
                `UPDATE issue 
                 SET status = 'escalated', escalated_to_admin = true
                 WHERE id = $1 
                 RETURNING *`,
                [issueId]
            );
            if (result.rows.length === 0) {
                throw new Error('Issue not found');
            }
            return result.rows[0];
        } catch (error) {
            throw new Error('Error escalating issue');
        }
    }

}