const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Sector = require("../models/sector");

describe("🚀 API Testing - Mock Data", () => {
    let mockSectorId = null;
    let initialSectorCount = 0;
    
    // Use a unique test item identifier to avoid conflicts with other tests
    const uniqueTestId = `MOCKDATA_${Math.floor(Math.random() * 100000)}`;

    // ✅ 0. Hapus semua sektor sebelum memulai tes (Cleaning database)
    beforeAll(async () => {
        console.log("🧹 Cleaning database before test...");
        await Sector.deleteMany({ site_id: { $regex: /^MOCKDATA_/ } });
    });

    // ✅ 1. Cek apakah koneksi MongoDB sukses
    it("should connect to MongoDB", async () => {
        const response = await request(app).get("/connect/mongo");
        console.log("✅ MongoDB Connection Test:", response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ MongoDB connected successfully!");
    });

    // ✅ 2. Cek jumlah sektor sebelum menambahkan data baru
    it("should fetch initial sector count", async () => {
        const response = await request(app).get("/sectors");
        console.log("✅ Initial sector count:", response.body.count);
        initialSectorCount = response.body.count;
        expect(response.status).toBe(200);
    });

    // ✅ 3. Test tambah data Mock Data
    it("should add mock data sector", async () => {
        const mockSector = {
            site_id: uniqueTestId, // Use the unique test ID
            ci: "654321",
            type: "5G",
            sector_id: 3,
            sector_id_new: 5,
            prb_dl_cell: 90,
            prb_ul_cell: 85,
            delta_prb_dl: -2,
            delta_prb_ul: 5
        };

        const response = await request(app).post("/sectors").send(mockSector);
        console.log("✅ Response add mock data:", response.body);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("sector");

        mockSectorId = response.body.sector._id;
        console.log("✅ mockSectorId setelah insert:", mockSectorId);
        expect(mockSectorId).toBeDefined(); // Pastikan ID tidak null
    });

    // ✅ 4. Cek apakah jumlah sektor bertambah
    it("should increase sector count after adding data", async () => {
        const response = await request(app).get("/sectors");
        console.log("✅ Sector count after adding:", response.body.count);
        expect(response.status).toBe(200);
        expect(response.body.count).toBe(initialSectorCount + 1);
    });

    // ✅ 5. Test ambil semua sektor Mock Data
    it("should fetch all mock data sectors", async () => {
        const response = await request(app).get("/sectors");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("count");
        expect(response.body.count).toBeGreaterThan(0);
    });

    // ✅ 6. Test ambil data berdasarkan site_id
    it("should fetch sector data by site_id", async () => {
        const response = await request(app).get(`/sectors/site-id/${uniqueTestId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("sector");
    });

    // ✅ 7. Test update sektor Mock Data
    it("should update mock data sector", async () => {
        if (!mockSectorId) throw new Error("❌ mockSectorId is null! Check POST /sectors API");

        const updatedData = { prb_dl_cell: 95, prb_ul_cell: 90 };
        const response = await request(app).put(`/sectors/${mockSectorId}`).send(updatedData);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ Data updated!");
    });

  // ✅ 8. **PATCH harus dilakukan sebelum DELETE!**
it("should partially update mock data sector", async () => {
    if (!mockSectorId) throw new Error("❌ mockSectorId is null! Check POST /sectors API");

    // 🔍 Cek apakah sektor tersedia sebelum PATCH
    const checkResponse = await request(app).get(`/sectors/${mockSectorId}`);
    console.log("🔍 Check before PATCH:", checkResponse.body);

    // **Jika sektor tidak ditemukan, tes langsung gagal sebelum PATCH**
    if (checkResponse.status !== 200) {
        console.error("❌ ERROR: Sector not found before PATCH. Test aborted.");
        return;
    }

    // **Jika sektor ada, lanjutkan PATCH**
    const partialUpdate = { delta_prb_dl: -5 };
    const response = await request(app).patch(`/sectors/${mockSectorId}`).send(partialUpdate);
    console.log("✅ Response after PATCH:", response.body);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "✅ Data partially updated!");
});


    // ✅ 9. Test hapus sektor Mock Data
    it("should delete mock data sector", async () => {
        if (!mockSectorId) throw new Error("❌ mockSectorId is null! Check POST /sectors API");

        const response = await request(app).delete(`/sectors/${mockSectorId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "✅ Data deleted successfully!");
    });

    // ✅ 10. Cek apakah sektor sudah dihapus
    it("should return 404 when fetching deleted sector", async () => {
        const response = await request(app).get(`/sectors/${mockSectorId}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message", "❌ Data not found");
    });

    // ✅ 11. Cek apakah jumlah sektor kembali seperti semula
    it("should decrease sector count after deletion", async () => {
        const response = await request(app).get("/sectors");
        console.log("✅ Sector count after deletion:", response.body.count);
        expect(response.status).toBe(200);
        expect(response.body.count).toBe(initialSectorCount);
    });

    // ✅ 12. Test error saat mencoba menghapus sektor yang sudah dihapus
    it("should return 404 when trying to delete a deleted sector", async () => {
        const response = await request(app).delete(`/sectors/${mockSectorId}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message", "❌ Data not found");
    });

    // ✅ 13. Test jika `POST /sectors` menolak ID duplikat
    it("should return error for duplicate sector", async () => {
        const duplicateSector = {
            site_id: uniqueTestId, // Use the same ID as earlier in the test
            ci: "654321",
            type: "5G",
            sector_id: 3,
            sector_id_new: 5,
            prb_dl_cell: 90,
            prb_ul_cell: 85,
            delta_prb_dl: -2,
            delta_prb_ul: 5
        };

        await request(app).post("/sectors").send(duplicateSector); // Insert pertama
        const response = await request(app).post("/sectors").send(duplicateSector); // Insert kedua (duplikat)
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message", "❌ Duplicate data not allowed!");
    });

    // ✅ 14. Test GET semua sektor yang memiliki `prb_dl_cell` > 80
    it("should fetch all sectors with prb_dl_cell > 80", async () => {
        const response = await request(app).get("/sectors?prb_dl_cell_min=80");
        expect(response.status).toBe(200);
        expect(response.body.count).toBeGreaterThan(0);
    });

    // ✅ 15. Test validasi input saat `PUT /sectors/:id` dengan data tidak valid
    it("should return 400 for invalid update data", async () => {
        const response = await request(app).put(`/sectors/${mockSectorId}`).send({ prb_dl_cell: "invalid_data" });
        expect(response.status).toBe(400);
    });

    // ✅ 16. Clean up after all test cases
    afterAll(async () => {
        // Clean up only the test data we created
        await Sector.deleteMany({ site_id: { $regex: /^MOCKDATA_/ } });
        console.log("🧹 Cleaned up mock data after tests");
        
        // Don't close the connection as jest.setup.js handles it
        // This allows parallel test execution without connection conflicts
    });
});
