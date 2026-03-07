import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        conceptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Concept",
            // Optional because free-form chat doesn't require a concept
        },
        prompt: {
            type: String,
            required: true,
        },
        response: {
            type: String,
            required: true,
        },
        interactionType: {
            type: String,
            enum: ["chat", "ask", "explain", "simplify", "translate", "relevance"],
            required: true,
            default: "chat",
        },
    },
    {
        timestamps: true,
        // Immutable log
    }
);

// Indexes for fast analytics queries
chatHistorySchema.index({ userId: 1, interactionType: 1 });
chatHistorySchema.index({ createdAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;
