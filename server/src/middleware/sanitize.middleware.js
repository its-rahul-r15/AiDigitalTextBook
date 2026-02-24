// Basic sanitization middleware — strips MongoDB operator injection and XSS chars
// Runs on req.body recursively

const stripDangerousChars = (obj) => {
    if (typeof obj === "string") {
        // Remove MongoDB operators ($) and basic XSS chars
        return obj
            .replace(/\$/g, "")
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .trim();
    }
    if (Array.isArray(obj)) {
        return obj.map(stripDangerousChars);
    }
    if (obj !== null && typeof obj === "object") {
        const clean = {};
        for (const key of Object.keys(obj)) {
            // Remove keys that start with $ (MongoDB operators)
            if (!key.startsWith("$")) {
                clean[key] = stripDangerousChars(obj[key]);
            }
        }
        return clean;
    }
    return obj;
};

export const sanitize = (req, res, next) => {
    if (req.body) {
        req.body = stripDangerousChars(req.body);
    }
    // Note: req.query and req.params are often read-only in modern Express versions
    // We skip sanitizing them here to avoid "Cannot set property" errors.
    // Validation middleware should handle strict type checks for query/params.

    next();
};
