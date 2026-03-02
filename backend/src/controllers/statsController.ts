import { Request, Response, NextFunction } from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import pool from '@config/database';

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: 'credentials.json',
});

export const getVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/511775063`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
    });

    let visits = null;

    if (response.rows && response.rows.length > 0) {
      visits = response.rows?.[0]?.metricValues?.[0]?.value;
    }

    console.log(`Total de visitas reales: ${visits}`);
    res.status(200).json(Number(visits) || 0);
  } catch (error) {
    console.error('Error in getVisits:', error);
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const furnitureQuery = pool.query(`SELECT COUNT(*) FROM furniture`);
    const usersQuery = pool.query(`SELECT COUNT(*) FROM "User"`);
    const providersQuery = pool.query(`SELECT COUNT(*) FROM "User" WHERE role = 'provider' AND registration_status = 'approved'`);

    const [furnitureResult, usersResult, providersResult] = await Promise.all([
      furnitureQuery,
      usersQuery,
      providersQuery
    ]);

    const totalFurniture = parseInt(furnitureResult.rows[0].count, 10) || 0;
    const totalUsers = parseInt(usersResult.rows[0].count, 10) || 0;
    const totalProviders = parseInt(providersResult.rows[0].count, 10) || 0;

    res.status(200).json({
      furniture: totalFurniture,
      users: totalUsers,
      providers: totalProviders
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    next(error);
  }
};