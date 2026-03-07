import fs from "fs";

async function testNotes() {
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

        console.log("Logged in. Testing notes API...");
        const notesRes = await fetch("http://localhost:3000/api/v1/notes/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                conceptId: "60d5ecb8b392d7001f3e3a4b",
                highlightedText: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct."
            })
        });

        const notesJson = await notesRes.json();
        console.log("Notes Response status:", notesRes.status);
        console.log("Notes Response body:", JSON.stringify(notesJson, null, 2));
    } catch (err) {
        console.error("Test failed", err);
    }
}
testNotes();
