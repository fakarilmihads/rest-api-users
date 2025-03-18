const express = require("express");
const Sector = require("../models/sector");
const router = express.Router();

// ✅ GET semua sektor
router.get("/", async (req, res) => {
    try {
        // Build query object for filtering
        const query = {};
        
        // Filter by prb_dl_cell_min if provided
        if (req.query.prb_dl_cell_min) {
            query.prb_dl_cell = { $gte: parseInt(req.query.prb_dl_cell_min) };
        }
        
        const sectors = await Sector.find(query);
        res.status(200).json({ sectors, count: sectors.length });
    } catch (err) {
        console.error("❌ Error GET /sectors:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ GET berdasarkan site-id (specific route for tests)
router.get("/site-id/:site_id", async (req, res) => {
    try {
        const sector = await Sector.findOne({ site_id: req.params.site_id });
        
        if (!sector) {
            return res.status(404).json({ message: "❌ Data not found" });
        }
        
        return res.status(200).json({ sector });
    } catch (error) {
        console.error("❌ Error pada GET /sectors/site-id/:site_id:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// ✅ GET berdasarkan site_id
router.get("/:site_id", async (req, res) => {
    try {
        // Check if the parameter is a valid MongoDB ObjectId
        if (req.params.site_id.match(/^[0-9a-fA-F]{24}$/)) {
            // If it looks like an ObjectId, use findById
            try {
                const sector = await Sector.findById(req.params.site_id);
                if (sector) {
                    return res.status(200).json({ sector });
                }
            } catch (err) {
                // If findById fails, continue to findOne by site_id
            }
        }
        
        // Otherwise, treat it as a site_id
        const sectors = await Sector.find({ site_id: req.params.site_id });
        
        if (!sectors || sectors.length === 0) {
            return res.status(404).json({ message: "❌ Data not found" });
        }
        
        return res.status(200).json({ sectors, count: sectors.length });
    } catch (error) {
        console.error("❌ Error pada GET /sectors/:site_id:", error.message);
        res.status(500).json({ message: error.message });
    }
});


// ✅ POST create sektor
router.post("/", async (req, res) => {
    try {
        console.log("Received POST data:", JSON.stringify(req.body, null, 2));

        // Validate required fields
        const requiredFields = ['site_id', 'ci', 'type', 'sector_id', 'sector_id_new', 
                               'prb_dl_cell', 'prb_ul_cell', 'delta_prb_dl', 'delta_prb_ul'];
        
        for (const field of requiredFields) {
            if (req.body[field] === undefined) {
                return res.status(400).json({ 
                    message: `❌ Invalid data provided: ${field} is required` 
                });
            }
        }

        // Check if sector with the same site_id already exists
        const existingSector = await Sector.findOne({ site_id: req.body.site_id });
        if (existingSector) {
            console.log("Duplicate data detected:", req.body.site_id);
            return res.status(400).json({ message: "❌ Duplicate data not allowed!" });
        }

        // Create and save new sector
        const newSector = new Sector(req.body);
        const savedSector = await newSector.save();
        console.log("New sector created:", savedSector);
        
        return res.status(201).json({ sector: savedSector });
    } catch (error) {
        console.error("❌ Error POST /sectors:", error);
        return res.status(400).json({ message: "Invalid data provided", error: error.message });
    }
});

// ✅ PUT update by id
router.put("/:id", async (req, res) => {
    try {
        // Strict validation for proper data types
        if (req.body.prb_dl_cell !== undefined && typeof req.body.prb_dl_cell !== 'number') {
            console.log("Invalid prb_dl_cell value:", req.body.prb_dl_cell);
            return res.status(400).json({ message: "❌ prb_dl_cell must be a number!" });
        }
        
        if (req.body.prb_ul_cell !== undefined && typeof req.body.prb_ul_cell !== 'number') {
            return res.status(400).json({ message: "❌ prb_ul_cell must be a number!" });
        }
        
        if (req.body.delta_prb_dl !== undefined && typeof req.body.delta_prb_dl !== 'number') {
            return res.status(400).json({ message: "❌ delta_prb_dl must be a number!" });
        }
        
        if (req.body.delta_prb_ul !== undefined && typeof req.body.delta_prb_ul !== 'number') {
            return res.status(400).json({ message: "❌ delta_prb_ul must be a number!" });
        }
        
        // Check if object ID is valid
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "❌ Invalid ID format" });
        }

        const sector = await Sector.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!sector) {
            return res.status(404).json({ message: "❌ Data not found" });
        }

        return res.status(200).json({ message: "✅ Data updated!", sector });
    } catch (error) {
        console.error("Error in PUT /sectors/:id:", error);
        return res.status(400).json({ message: "❌ Invalid data provided!", error: error.message });
    }
});

// ✅ PATCH partial update
router.patch("/:id", async (req, res) => {
    try {
        // Validate ID format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "❌ Invalid ID format" });
        }
        
        // Validate numeric fields if they are provided
        if (req.body.prb_dl_cell !== undefined && typeof req.body.prb_dl_cell !== 'number') {
            return res.status(400).json({ message: "❌ prb_dl_cell must be a number!" });
        }
        
        if (req.body.prb_ul_cell !== undefined && typeof req.body.prb_ul_cell !== 'number') {
            return res.status(400).json({ message: "❌ prb_ul_cell must be a number!" });
        }
        
        if (req.body.delta_prb_dl !== undefined && typeof req.body.delta_prb_dl !== 'number') {
            return res.status(400).json({ message: "❌ delta_prb_dl must be a number!" });
        }
        
        if (req.body.delta_prb_ul !== undefined && typeof req.body.delta_prb_ul !== 'number') {
            return res.status(400).json({ message: "❌ delta_prb_ul must be a number!" });
        }
        
        // Check if sector exists before updating
        const existingSector = await Sector.findById(req.params.id);
        if (!existingSector) {
            console.log("Attempted to patch non-existent sector:", req.params.id);
            return res.status(404).json({ message: "❌ Data not found" });
        }
        
        // Perform the update
        const sector = await Sector.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.log("Sector partially updated:", req.params.id);
        
        return res.status(200).json({ message: "✅ Data partially updated!", sector });
    } catch (error) {
        console.error("Error in PATCH /sectors/:id:", error);
        return res.status(400).json({ message: "❌ Invalid data provided!", error: error.message });
    }
});

// ✅ DELETE by id
router.delete("/:id", async (req, res) => {
    try {
        // Validate ID format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "❌ Invalid ID format" });
        }
        
        // Check if sector exists first
        const existingSector = await Sector.findById(req.params.id);
        if (!existingSector) {
            console.log("Attempted to delete non-existent sector:", req.params.id);
            return res.status(404).json({ message: "❌ Data not found" });
        }
        
        // Delete the sector
        await Sector.findByIdAndDelete(req.params.id);
        console.log("Sector deleted successfully:", req.params.id);
        return res.status(200).json({ message: "✅ Data deleted successfully!" });
    } catch (error) {
        console.error("Error in DELETE /sectors/:id:", error);
        return res.status(500).json({ message: "❌ Internal Server Error" });
    }
});

module.exports = router;
