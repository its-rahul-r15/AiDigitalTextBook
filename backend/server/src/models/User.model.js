import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: [2, "Full name must be at least 2 characters"],
            maxlength: [100, "Full name cannot exceed 100 characters"],
        },
        schoolName: {
            type: String,
            required: [true, "School name is required"],
            trim: true,
            minlength: [2, "School name must be at least 2 characters"],
            maxlength: [200, "School name cannot exceed 200 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
        },
        role: {
            type: String,
            enum: ["student", "teacher", "admin"],
            default: "student",
            required: true,
        },
        gradeLevel: {
            type: Number,
            min: [6, "Grade level minimum is 6"],
            max: [12, "Grade level maximum is 12"],
        },
        boardName: {
            type: String,
            required: [true, "Board name is required"],
            trim: true,
            enum: ["CBSE", "ICSE", "STATE", "IB", "OTHER"],
        },
        region: {
            type: String,
            trim: true,
        },
        languagePreference: {
            type: String,
            enum: ["en", "hi"],
            default: "en",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        lastLogin: {
            type: Date,
        },
        // ─── Gamification fields ──────────────────────────────────────────────
        // XP (experience points) earned by answering questions correctly
        // Levels up every 100 XP (see gamification.service.js → calculateLevel())
        xp: {
            type: Number,
            default: 0,
        },
        // Number of consecutive days the student has logged in
        currentStreak: {
            type: Number,
            default: 0,
        },
        // Highest streak the student has ever achieved
        longestStreak: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);


userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);

});

userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
        }
    );
};

const User = mongoose.model("User", userSchema);

export default User;
