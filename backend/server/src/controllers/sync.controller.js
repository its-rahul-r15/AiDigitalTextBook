// ─── sync.controller.js ──────────────────────────────────────────────────────
// Offline sync: students can study offline and push/pull changes when back online.
//
// HOW OFFLINE SYNC WORKS:
//   1. Student goes offline, the app stores their AttemptLogs locally (IndexedDB / AsyncStorage)
//   2. When back online, POST /sync/push sends all stored attempts to the server
//   3. The server saves them and queues adaptive scoring update
//   4. GET /sync/pull returns any server-side changes (new content, etc.)
//
// Currently this is a STUB — full sync logic with conflict resolution comes in Phase 3.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import AttemptLog from "../models/AttemptLog.model.js";

// ─── @desc   Push offline changes (attempt logs) to the server
// ─── @route  POST /api/v1/sync/push
// ─── @access Student
// ─── TO EXPAND (Phase 3):
//     1. Receive batched attempt logs from the device
//     2. Validate that each log has a valid exerciseId and conceptId
//     3. Deduplicate (device might push same log twice if network fails mid-push)
//     4. Save to AttemptLog collection
//     5. Queue adaptive scoring job for each saved attempt
//     6. Return { saved: N, skipped: M } to the device
export const pushSync = asyncHandler(async (req, res) => {
    const { attempts } = req.body; // Array of attempt log objects from the device

    if (!attempts?.length) {
        return res.status(200).json(new ApiResponse(200, { saved: 0 }, "Nothing to sync"));
    }

    // Add userId to all attempts (trust server-side user from JWT, not device)
    const withUser = attempts.map((a) => ({ ...a, userId: req.user._id }));

    // STUB: Basic save — no deduplication or conflict resolution yet
    // TO EXPAND: Add deduplication logic here before saving
    const saved = await AttemptLog.insertMany(withUser, { ordered: false });

    return res.status(200).json(
        new ApiResponse(200, { saved: saved.length }, `${saved.length} attempts synced successfully`)
    );
});

// ─── @desc   Pull pending server changes for this device
// ─── @route  GET /api/v1/sync/pull?lastSyncedAt=
// ─── @access Student
// ─── TO EXPAND (Phase 3):
//     1. Accept a lastSyncedAt timestamp from the device
//     2. Return all content updates (new chapters, concepts, etc.) since that timestamp
//     3. Return any new badges, reports, or XP changes since last sync
//     4. The device merges these into its local store
export const pullSync = asyncHandler(async (req, res) => {
    const { lastSyncedAt } = req.query;

    // STUB — returns empty for now
    // TO EXPAND: Query for new/updated content, badges, reports since lastSyncedAt
    return res.status(200).json(
        new ApiResponse(200, {
            newContent: [],
            newBadges: [],
            message: "[STUB] Full pull sync with content delta coming in Phase 3.",
            serverTime: new Date().toISOString(),
        }, "Sync pull complete")
    );
});

// ─── @desc   Check the sync queue status for this device
// ─── @route  GET /api/v1/sync/status
// ─── @access Student
export const getSyncStatus = asyncHandler(async (req, res) => {
    const pendingCount = await AttemptLog.countDocuments({ userId: req.user._id });

    return res.status(200).json(
        new ApiResponse(200, {
            totalAttempts: pendingCount,
            status: "synced",
            lastSyncedAt: new Date().toISOString(),
        }, "Sync status fetched")
    );
});
