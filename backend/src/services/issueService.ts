import pool from "@/config/database";

import { Issue } from "@/types";

export class IssueService {
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
                `INSERT INTO issue (description, date, user_email, furniture_id) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [issue.description, issue.date || new Date(), issue.user_email, issue.furniture_id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Error posting an issue');
        }
    }
}