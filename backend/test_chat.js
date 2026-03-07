import fs from "fs";

async function test() {
    try {
        console.log("Logging in...");
        const loginData = JSON.parse(fs.readFileSync("./login_test_data.json", "utf8"));

        const loginRes = await fetch("http://localhost:3000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const loginJson = await loginRes.json();
        const token = loginJson.data?.accessToken;

        if (!token) {
            console.error("Login failed:", loginJson);
            return;
        }

        console.log("Logged in. Testing chat API...");
        const chatRes = await fetch("http://localhost:3000/api/v1/tutor/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message: "Hello AI" })
        });

        const chatJson = await chatRes.json();
        console.log("Chat Response status:", chatRes.status);
        console.log("Chat Response body:", JSON.stringify(chatJson, null, 2));
    } catch (err) {
        console.error("Test failed", err);
    }
}
test();
