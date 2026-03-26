import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from '@middleware/errorHandler';
import apiRoutes from '@/routes';
import { connectDB } from '@/config/database';
import corsMiddleware from './config/cors';
import { apiReference } from '@scalar/express-api-reference';
import { swaggerSpec } from '@/config/openapi/swagger';
import './config/passport'; // Initialize passport configuration
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
      },
    },
  })
);
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', "microphone=(self), camera=(self)");
  next();
});
app.use(corsMiddleware);
app.use(morgan('combined'));
app.use(express.json());
// app.use(express.json({ limit: '32mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use(express.urlencoded({ limit: '32mb', extended: true }));

// Serve static files from storage directory
app.use('/storage', express.static(path.join(__dirname, '../../storage')));

// Documentation
app.use(
  '/api/docs',
  apiReference({
    spec: {
      content: swaggerSpec,
    },
  })
);

// Routes
app.use('/api', apiRoutes);


// Error handling
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});


// Log inicial del api
const syslog = require('syslog-client');
// const client = syslog.createClient('localhost');

const client = syslog.createClient('127.0.0.1', {
  transport: syslog.Transport.Udp,
  port: 514                         // puerto estándar de syslog
});


client.log('Api is inicialized 2', {
  facility: syslog.Facility.Local0,
  severity: syslog.Severity.Informational,
  tag: 'skaply_api'
});
export default app;
