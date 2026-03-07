import fs from "fs";

async function testPractice() {
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

        console.log("Logged in. Testing practice API without conceptId...");
        const practiceRes = await fetch("http://localhost:3000/api/v1/exercises/generate?difficulty=easy&type=mcq", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const practiceJson = await practiceRes.json();
        console.log("Practice Response status:", practiceRes.status);
        console.log("Practice Response body:", JSON.stringify(practiceJson, null, 2));
    } catch (err) {
        console.error("Test failed", err);
    }
}
testPractice();
