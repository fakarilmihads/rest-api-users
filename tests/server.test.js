const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/user");
const Task = require("../models/task");

let token; // Simpan token JWT untuk testing
let taskId; // Simpan ID task yang dibuat untuk pengujian update & delete

// Use a unique username to avoid conflicts with other tests
const uniqueUsername = `servertest_${Math.floor(Math.random() * 100000)}`;

// ✅ Sebelum semua tes dijalankan, set up clean test environment
beforeAll(async () => {
    // Clear any existing test users to avoid duplicates
    await User.deleteMany({ username: { $regex: /^servertest_/ } });
    // Clean up any test tasks
    await Task.deleteMany({ title: "Test Task" });
});

describe("Task API Tests", () => {
    
    it("should fetch all tasks", async () => {
        const response = await request(app).get("/tasks");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("tasks");
    });

    it("should create a new task", async () => {
        const taskData = { title: "Test Task", completed: false };
        const response = await request(app).post("/tasks").send(taskData);
        expect(response.status).toBe(201);
        expect(response.body.task).toHaveProperty("title", "Test Task");

        taskId = response.body.task._id; // ✅ Simpan ID task untuk update & delete
    });

    it("should update a task", async () => {
        const updatedData = { title: "Updated Task", completed: true };
        const response = await request(app).put(`/tasks/${taskId}`).send(updatedData);
        expect(response.status).toBe(200);
        expect(response.body.task).toHaveProperty("title", "Updated Task");
    });

    it("should partially update a task", async () => {
        const partialUpdate = { completed: false };
        const response = await request(app).patch(`/tasks/${taskId}`).send(partialUpdate);
        expect(response.status).toBe(200);
        expect(response.body.task).toHaveProperty("completed", false);
    });

    it("should delete a task", async () => {
        const response = await request(app).delete(`/tasks/${taskId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ Task deleted successfully!");

        // ✅ Verifikasi bahwa task sudah tidak ada
        const checkResponse = await request(app).get(`/tasks/${taskId}`);
        expect(checkResponse.status).toBe(404);
    });

    it("should return 401 if API Key is missing", async () => {
        const response = await request(app).get("/tasks-secure");
        expect(response.status).toBe(401);
    });

    it("should return tasks when valid API Key is provided", async () => {
        // Get the API key from the environment variables
        // Default is "mysecureapikey456" based on middleware/auth.js
        const apiKey = process.env.API_KEY || "mysecureapikey456";
        
        const response = await request(app)
            .get("/tasks-secure")
            .set("x-api-key", apiKey);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("tasks");
    });

    it("should register a new user", async () => {
        const userData = { username: uniqueUsername, password: "password123" };
        const response = await request(app).post("/register").send(userData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ User registered successfully!");
    });

    it("should login and return JWT token", async () => {
        const loginData = { username: uniqueUsername, password: "password123" };
        const response = await request(app).post("/login").send(loginData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");

        // ✅ Simpan token untuk tes berikutnya
        token = response.body.token;
    });

    it("should return 403 if token is missing", async () => {
        const response = await request(app).get("/protected-tasks");
        expect(response.status).toBe(403);
    });

    it("should return tasks when valid token is provided", async () => {
        // We need a valid JWT token for this test
        // First make sure we have a valid token
        if (!token) {
            const loginData = { username: uniqueUsername, password: "password123" };
            const loginResponse = await request(app).post("/login").send(loginData);
            token = loginResponse.body.token;
            expect(token).toBeDefined();
        }

        // Ensure token is properly set
        console.log("Using token for test:", token);
        
        const response = await request(app)
            .get("/protected-tasks")
            .set("Authorization", `Bearer ${token}`);

        // Log response for debugging
        if (response.status !== 200) {
            console.log("Response body:", response.body);
        }
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("tasks");
    });

});

// ✅ Clean up after tests
afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ username: { $regex: /^servertest_/ } });
    await Task.deleteMany({ title: { $in: ["Test Task", "Updated Task"] } });
    console.log("🧹 Cleaned up server test data");
    
    // Don't close the connection as jest.setup.js handles it
});
