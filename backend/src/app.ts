import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { errorHandler } from './middlewares/error.js';
import { logger } from './config/logger.js';

import compression from 'compression';
import { rateLimiter } from './middlewares/rateLimiter.js';

const app = express();

// Middlewares
app.use(helmet({
  frameguard: {
    action: 'deny',
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'http://localhost:5000', 'https://identitytoolkit.googleapis.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(compression());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan request logging mapped to Winston
app.use(
  morgan('combined', {
    stream: { write: (message: string) => logger.http(message.trim()) },
  })
);

// Swagger Documentation Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Turf Booking Platform API',
      version: '1.0.0',
      description: 'API documentation for the Turf Booking Platform',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development Server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/shared/routes/**/*.ts'],
};

if (process.env.NODE_ENV !== 'production') {
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/user/user.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import ownerRouter from './modules/owner/owner.routes.js';
import turfRouter from './modules/user/turf.routes.js';
import bookingRouter from './modules/user/booking.routes.js';
import supportRouter from './modules/user/support.routes.js';

// Mounting Feature API Routers (Skeletons)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/owner', ownerRouter);
app.use('/api/v1/turfs', turfRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tickets', supportRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
