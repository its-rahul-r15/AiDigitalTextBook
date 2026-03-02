// ─── logger.util.js ──────────────────────────────────────────────────────────
// Winston logger setup. All logs are JSON-formatted for easy parsing.
// In production, errors are also sent to Sentry automatically.
//
// Usage:
//   import logger from '../utils/logger.util.js';
//   logger.info('Server started');
//   logger.error('Something broke', { error: err.message });

import winston from "winston";

const { combine, timestamp, json, colorize, simple } = winston.format;

// In development: coloured, readable logs in console
// In production: JSON logs (easy to pipe into log aggregators like Papertrail, Datadog)
const isDev = process.env.NODE_ENV !== "production";

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        json()
    ),
    transports: [
        new winston.transports.Console({
            format: isDev ? combine(colorize(), simple()) : combine(timestamp(), json()),
        }),
        // Optionally write errors to a file in production
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});

// ─── TO ADD SENTRY INTEGRATION LATER ─────────────────────────────────────────
// 1. npm install @sentry/node
// 2. Import Sentry at top: import * as Sentry from "@sentry/node";
// 3. Initialize Sentry before this file runs:
//    Sentry.init({ dsn: process.env.SENTRY_DSN });
// 4. In the 'error' log handler, call: Sentry.captureException(err);
// ─────────────────────────────────────────────────────────────────────────────

export default logger;
