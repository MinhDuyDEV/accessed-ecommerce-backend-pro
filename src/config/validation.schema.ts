import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNC: Joi.boolean().default(false),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // AWS S3 (for file uploads)
  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),

  // Cloudfront
  CLOUDFRONT_URL: Joi.string().optional(),

  // Payment Gateway (e.g., Stripe, PayPal)
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // Redis (for caching, if needed)
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().optional(),

  // Email
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM: Joi.string().optional(),
});
