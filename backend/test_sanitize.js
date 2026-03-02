import { sanitize } from './server/src/middleware/sanitize.middleware.js';

const req = {
    body: { key: "$bad" },
    query: {}, // simulate read-only if we could, but here we just check it doesn't throw
    params: {}
};
const res = {};
const next = () => console.log("Sanitize passed!");

try {
    sanitize(req, res, next);
    console.log("Sanitized body:", req.body);
} catch (error) {
    console.error("Sanitize failed:", error);
    process.exit(1);
}
