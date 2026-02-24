// ─── paginate.util.js ────────────────────────────────────────────────────────
// Cursor-based pagination helper.
// Why cursor-based? Page numbers break when new data is added mid-session.
// Cursor = last document's _id, so "next page" always starts after the correct item.
//
// Usage:
//   const { data, nextCursor, hasMore } = await paginate(MyModel, filter, cursor, limit);

import mongoose from "mongoose";

/**
 * Cursor-based paginator for any Mongoose model.
 *
 * @param {mongoose.Model} Model - The Mongoose model to query
 * @param {Object}         filter - MongoDB filter object (e.g. { userId: req.user._id })
 * @param {string|null}    cursor - Last document _id from previous page (null for first page)
 * @param {number}         limit  - Number of documents per page (default: 20)
 * @param {Object}         sort   - Sort order (default: newest first)
 * @returns {{ data: Array, nextCursor: string|null, hasMore: boolean }}
 */
export async function paginate(Model, filter = {}, cursor = null, limit = 20, sort = { _id: -1 }) {
    // If a cursor is provided, only fetch documents AFTER (older than) that cursor
    const query = cursor
        ? { ...filter, _id: { $lt: new mongoose.Types.ObjectId(cursor) } }
        : filter;

    // Fetch one extra document to know if there is a "next page"
    const docs = await Model.find(query).sort(sort).limit(limit + 1).lean();

    const hasMore = docs.length > limit;
    const data = hasMore ? docs.slice(0, limit) : docs;

    // The cursor for the next page is the _id of the last document in this batch
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;

    return { data, nextCursor, hasMore };
}
