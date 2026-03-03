import { Request, Response, NextFunction } from 'express';
import { statsService } from '../services/statsService';

// Renombramos la función de getVisits a getAnalyticsData
export const getAnalyticsData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analyticsData = await statsService.getAnalyticsData();
    // Ya no hacemos un simple console.log del número porque ahora es un objeto complejo
    res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await statsService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    next(error);
  }
};