const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Task = require("../models/task");

describe("Task API Tests", () => {
    let taskId;

    beforeAll(async () => {
        await Task.deleteMany({});
    });

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

        taskId = response.body.task._id;
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

        const checkResponse = await request(app).get(`/tasks/${taskId}`);
        expect(checkResponse.status).toBe(404);
    });

    afterAll(async () => {
        await Task.deleteMany({});
        await mongoose.connection.close();
    });
});
