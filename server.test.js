const request = require("supertest");
const app = require("./server");
const mongoose = require("mongoose");
const User = require("./models/user");

let token; // Simpan token JWT untuk testing
let taskId; // Simpan ID task yang dibuat untuk pengujian update & delete

// ✅ Sebelum semua tes dijalankan, hapus user "testuser" agar tidak duplikat
beforeAll(async () => {
    await User.deleteOne({ username: "testuser" });
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
        const response = await request(app)
            .get("/tasks-secure")
            .set("x-api-key", process.env.API_KEY || "my-secret-key");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("tasks");
    });

    it("should register a new user", async () => {
        const userData = { username: "testuser", password: "password123" };
        const response = await request(app).post("/register").send(userData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ User registered successfully!");
    });

    it("should login and return JWT token", async () => {
        const loginData = { username: "testuser", password: "password123" };
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
        const response = await request(app)
            .get("/protected-tasks")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("tasks");
    });

});

// ✅ Tutup koneksi MongoDB setelah semua tes selesai
afterAll(async () => {
    await mongoose.connection.close();
});
