import { BetaAnalyticsDataClient } from '@google-analytics/data';
import pool from '@config/database';

const analyticsDataClient = new BetaAnalyticsDataClient({
    keyFilename: 'credentials.json',
});

export class StatsService {
    async getAnalyticsData(): Promise<any> {
        const propertyId = 'properties/511775063';

        const overviewQuery = analyticsDataClient.runReport({
            property: propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'engagementRate' }
            ],
        });

        const topPagesQuery = analyticsDataClient.runReport({
            property: propertyId,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }],
            dimensionFilter: {
                filter: {
                    fieldName: 'pageTitle',
                    stringFilter: {
                        matchType: 'CONTAINS',
                        value: 'Montaje 3D',
                        caseSensitive: false
                    }
                }
            },
            limit: 5,
        });

        const [[overviewResponse], [topPagesResponse]] = await Promise.all([
            overviewQuery,
            topPagesQuery
        ]);

        const overview = {
            activeUsers: 0,
            newUsers: 0,
            engagementRate: '0%'
        };

        if (overviewResponse.rows && overviewResponse.rows.length > 0) {
            const metrics = overviewResponse.rows?.[0]?.metricValues;
            overview.activeUsers = Number(metrics?.[0]?.value) || 0;
            overview.newUsers = Number(metrics?.[1]?.value) || 0;

            const rawEngagement = Number(metrics?.[2]?.value) || 0;
            overview.engagementRate = `${(rawEngagement * 100).toFixed(1)}%`;
        }

        const topPages = (topPagesResponse.rows || []).map(row => ({
            title: row.dimensionValues?.[0]?.value || 'Desconocido',
            views: Number(row.metricValues?.[0]?.value) || 0
        }));
        console.log(overview);
        return {
            overview,
            topPages
        };
    }

    async getDashboardStats(): Promise<{ furniture: number, admins: number, providers: number }> {
        const furnitureQuery = pool.query(`SELECT COUNT(*) FROM furniture`);
        const adminsQuery = pool.query(`SELECT COUNT(*) FROM "User" WHERE role = 'admin'`);
        const providersQuery = pool.query(`SELECT COUNT(*) FROM "User" WHERE role = 'provider' AND registration_status = 'approved'`);

        const [furnitureResult, adminsResult, providersResult] = await Promise.all([
            furnitureQuery,
            adminsQuery,
            providersQuery
        ]);

        return {
            furniture: parseInt(furnitureResult.rows[0].count, 10) || 0,
            admins: parseInt(adminsResult.rows[0].count, 10) || 0,
            providers: parseInt(providersResult.rows[0].count, 10) || 0
        };
    }

    async getProviderStats(providerId: number): Promise<{ furniture: number, pendingIssues: number, resolvedIssues: number }> {
        const furnitureQuery = pool.query(`SELECT COUNT(*) FROM furniture WHERE provider_id = $1`, [providerId]);
        const pendingIssuesQuery = pool.query(`
            SELECT COUNT(*) FROM issue i
            JOIN furniture f ON i.furniture_id = f.id
            WHERE f.provider_id = $1 AND i.status = 'pending'
        `, [providerId]);
        const resolvedIssuesQuery = pool.query(`
            SELECT COUNT(*) FROM issue i
            JOIN furniture f ON i.furniture_id = f.id
            WHERE f.provider_id = $1 AND i.status = 'resolved'
        `, [providerId]);

        const [furnitureResult, pendingIssuesResult, resolvedIssuesResult] = await Promise.all([
            furnitureQuery,
            pendingIssuesQuery,
            resolvedIssuesQuery
        ]);

        return {
            furniture: parseInt(furnitureResult.rows[0].count, 10) || 0,
            pendingIssues: parseInt(pendingIssuesResult.rows[0].count, 10) || 0,
            resolvedIssues: parseInt(resolvedIssuesResult.rows[0].count, 10) || 0
        };
    }
}

export const statsService = new StatsService();