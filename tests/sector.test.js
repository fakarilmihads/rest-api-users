const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Sector = require("../models/sector");
const User = require("../models/user");

let sectorId = "";
let token = "";
let testUser = {
    username: `testuser_${Math.floor(Math.random() * 100000)}`, // Generate unique username
    password: "password123"
};

describe("📌 Sectors API Tests", () => {

    // ✅ Setup sebelum semua tes berjalan
    beforeAll(async () => {
        // Delete any existing data to start clean
        await Sector.deleteMany({});
        
        // Create a unique test user for this test suite
        await User.deleteOne({ username: testUser.username });

        // Register test user
        const registerResponse = await request(app)
            .post("/register")
            .send(testUser);
        expect(registerResponse.status).toBe(200);
        
        // Login to get token
        const loginResponse = await request(app)
            .post("/login")
            .send(testUser);
        expect(loginResponse.status).toBe(200);
        
        token = loginResponse.body.token;
        if (!token) throw new Error("❌ No token received! Check authentication.");
    });

    it("✅ Should create a new sector", async () => {
        const newSector = {
            site_id: "TEST123",
            sector_id: 1,
            sector_id_new: 1,
            ci: 31,
            type: "LTE",
            prb_dl_cell: 50,
            prb_ul_cell: 30,
            delta_prb_dl: 5,
            delta_prb_ul: 3
        };

        const response = await request(app)
            .post("/sectors")
            .set("Authorization", `Bearer ${token}`)
            .send(newSector);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("sector");

        sectorId = response.body.sector._id;
    });

    it("✅ Should fetch all sectors", async () => {
        const response = await request(app)
            .get("/sectors")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("sectors");
    });

    it("✅ Should fetch a sector by site_id", async () => {
        const response = await request(app)
            .get(`/sectors/site-id/TEST123`)  
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("sector");
    });

    it("✅ Should update a sector", async () => {
        const sector = await Sector.findOne({ site_id: "TEST123" });
        if (!sector) throw new Error("❌ No sector found to update!");

        const response = await request(app)
            .put(`/sectors/${sector._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ prb_dl_cell: 60 });

        expect(response.status).toBe(200);
        expect(response.body.sector).toHaveProperty("prb_dl_cell", 60);
    });

    it("✅ Should delete a sector", async () => {
        const sector = await Sector.findOne({ site_id: "TEST123" });
        if (!sector) throw new Error("❌ No sector found to delete!");

        const response = await request(app)
            .delete(`/sectors/${sector._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ Data deleted successfully!");
    });

    // ✅ Cleanup setelah selesai
    afterAll(async () => {
        if (mongoose.connection.readyState === 1) {
            await Sector.deleteMany({});
            await User.deleteOne({ username: testUser.username });
            
            // Note: Don't close the connection here, as jest.setup.js handles it
            // This allows parallel test execution without connection conflicts
        }
    });
});
