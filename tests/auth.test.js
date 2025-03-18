const request = require("supertest");
const app = require("../server");
const User = require("../models/user");

describe("🔒 Authentication API Tests", () => {
    // Use a unique username to avoid conflicts with other tests
    const uniqueUsername = `authtest_${Math.floor(Math.random() * 100000)}`;
    let token = "";

    // ✅ Ensure clean state before tests
    beforeAll(async () => {
        // Clean up any previous test users
        await User.deleteMany({ username: { $regex: /^authtest_/ } });
    });

    it("✅ Should register a new user", async () => {
        const response = await request(app).post("/register").send({
            username: uniqueUsername,
            password: "password123"
        });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ User registered successfully!");
    });

    it("✅ Should login and return JWT token", async () => {
        const loginData = { username: uniqueUsername, password: "password123" };
        const response = await request(app).post("/login").send(loginData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        token = response.body.token;
    });

    // ✅ Clean up after tests
    afterAll(async () => {
        await User.deleteMany({ username: { $regex: /^authtest_/ } });
        console.log("🧹 Cleaned up auth test users");
    });
});
