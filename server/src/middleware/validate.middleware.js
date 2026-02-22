import { validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

// Runs after express-validator chains — throws 400 if any rule fails
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const messages = errors.array().map((e) => e.msg);
        throw new ApiError(400, "Validation failed", messages);
    }

    next();
};
