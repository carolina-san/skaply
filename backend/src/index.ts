import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from '@middleware/errorHandler';
import { notFound } from '@middleware/notFound';
import apiRoutes from '@/routes';
import chatbotRoutes from './routes/chatbot';
import { connectDB } from '@/config/database';
import corsMiddleware from './config/cors';
import './config/passport'; // Initialize passport configuration


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});


// Log inicial del api
const syslog =  require('syslog-client');
// const client = syslog.createClient('localhost');

const client = syslog.createClient('127.0.0.1', {
  transport: syslog.Transport.Udp, 
  port: 514                         // puerto estándar de syslog
});


client.log('Api is inicialized 2',{
  facility: syslog.Facility.Local0,
  severity: syslog.Severity.Informational,
  tag: 'skaply_api'
});
export default app;
