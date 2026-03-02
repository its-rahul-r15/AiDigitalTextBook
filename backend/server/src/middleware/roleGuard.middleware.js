import { ApiError } from "../utils/apiError.js";

// Usage: protect, allow('teacher', 'admin')
export const allow = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized — please login first");
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Forbidden — requires role: ${roles.join(" or ")}`
            );
        }

        next();
    };
};
