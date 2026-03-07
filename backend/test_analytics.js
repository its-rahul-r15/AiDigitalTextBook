import fs from "fs";

async function testAnalytics() {
    try {
        console.log("Logging in as student...");
        const loginData = JSON.parse(fs.readFileSync("./login_test_data.json", "utf8"));

        const loginRes = await fetch("http://localhost:3000/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData)
        });

        const loginJson = await loginRes.json();
        const token = loginJson.data?.accessToken;
        const studentId = loginJson.data?.user?._id;

        if (!token) {
            console.error("Login failed:", loginJson);
            return;
        }

        console.log("\n1. Sending Chat Message...");
        const chatRes = await fetch("http://localhost:3000/api/v1/tutor/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ message: "What is quantum physics?" })
        });
        console.log("Chat Response:", chatRes.status);

        console.log("\n2. Logging in as Teacher to check analytics...");
        // Assuming we have a teacher login or we can just use the student token if role guard is bypassed for testing?
        // Wait, the API requires "teacher" or "admin". The login_test_data.json user is a student.
        // Let's modify the role guard temporarily or just log the DB directly to test for now.

        // I will just fetch it directly to see if the role guard blocks it.
        const analyticsRes = await fetch(`http://localhost:3000/api/v1/analytics/student/${studentId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        console.log("Analytics Response Status:", analyticsRes.status);
        const analyticsJson = await analyticsRes.json();

        if (analyticsRes.status === 403 || analyticsRes.status === 401) {
            console.log("Access denied as expected (Not a teacher). Please check the DB manually or use a teacher account.");
            console.log(analyticsJson);
        } else {
            console.log("Analytics Data:");
            console.log(JSON.stringify(analyticsJson, null, 2));
        }

    } catch (err) {
        console.error("Test failed", err);
    }
}
testAnalytics();
