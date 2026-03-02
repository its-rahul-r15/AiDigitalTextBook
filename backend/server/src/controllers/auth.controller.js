import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import User from "../models/User.model.js";


const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const accessCookieOptions = {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
};

const generateAndSetTokens = async (userId, res) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store hashed refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res
        .cookie("accessToken", accessToken, accessCookieOptions)
        .cookie("refreshToken", refreshToken, refreshCookieOptions);

    return { accessToken, refreshToken };
};

// Register a new user
// POST /api/v1/auth/register
// Public
export const registerUser = asyncHandler(async (req, res) => {
    const {
        fullName,
        schoolName,
        email,
        password,
        role,
        gradeLevel,
        boardName,
        region,
        languagePreference,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "An account with this email already exists");
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
        fullName,
        schoolName,
        email,
        password,
        role: role || "student",
        gradeLevel,
        boardName,
        region,
        languagePreference: languagePreference || "en",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the account");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "Account created successfully"));
});

// ─── @desc    Login user
// ─── @route   POST /api/v1/auth/login
// ─── @access  Public
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Your account has been deactivated. Please contact support.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateAndSetTokens(user._id, res);

    // Update last login time
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: loggedInUser, accessToken },
            "Logged in successfully"
        )
    );
});

// ─── @desc    Logout user
// ─── @route   POST /api/v1/auth/logout
// ─── @access  Protected
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },   // Properly remove field (not set to undefined)
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── @desc    Refresh access token
// ─── @route   POST /api/v1/auth/refresh
// ─── @access  Public (needs refreshToken cookie)
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    // Verify the token signature
    const decoded = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    // Find user and check stored token matches
    const user = await User.findById(decoded._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token — user not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token has been revoked or already used");
    }

    // Rotate both tokens
    const { accessToken, refreshToken: newRefreshToken } =
        await generateAndSetTokens(user._id, res);

    return res.status(200).json(
        new ApiResponse(
            200,
            { accessToken },
            "Access token refreshed successfully"
        )
    );
});

// ─── @desc    Get current user profile
// ─── @route   GET /api/v1/auth/me
// ─── @access  Protected
export const getMe = asyncHandler(async (req, res) => {
    // req.user is already set by verifyJWT middleware (no password/refreshToken)
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Profile fetched successfully"));
});

// ─── @desc    Update current user profile (language + region only)
// ─── @route   PATCH /api/v1/auth/me
// ─── @access  Protected
export const updateMe = asyncHandler(async (req, res) => {
    const { languagePreference, region } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                ...(languagePreference && { languagePreference }),
                ...(region && { region }),
            },
        },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});
