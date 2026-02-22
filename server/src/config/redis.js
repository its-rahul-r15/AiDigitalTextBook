import Redis from "ioredis";

console.log(" Redis file loaded");
export const redis = new Redis({
    host: "127.0.0.1",   // local Redis
    port: 6379
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (err) => {
    console.error("Redis error", err);
});
