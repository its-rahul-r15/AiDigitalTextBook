import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import connectDB from "./config/db.js";
import apiRouter from "./routes/index.js";
import { globalLimiter } from "./middleware/rateLimiter.middleware.js";
import { sanitize } from "./middleware/sanitize.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ──────────────────────────────────────────────────────

// 1. Helmet — sets secure HTTP headers (CSP, X-Frame, HSTS, nosniff, etc.)
app.use(helmet());

// 2. CORS — allow only whitelisted origins
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,               // Required for cookies to be sent cross-origin
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// 3. Custom sanitization — strips MongoDB $ operators and XSS from all inputs
app.use(sanitize);

// 4. Global rate limiter — 200 req / 15 min per IP
app.use(globalLimiter);

// ─── Body & Cookie Parsing ────────────────────────────────────────────────────

// 5. JSON body parser (10kb limit prevents large payload attacks)
app.use(express.json({ limit: "10kb" }));

// 6. URL-encoded body parser
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 7. Cookie parser
app.use(cookieParser());


app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Aronation Notes API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// All API routes under /api/v1
app.use("/api/v1", apiRouter);

// Catch-all for unknown routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler (must be LAST) ─────────────────────────────────────
app.use(errorHandler);

// ─── Connect to DB and Start Server ──────────────────────────────────────────
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📋 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
    });
});