const mongoose = require("mongoose");

const sectorSchema = new mongoose.Schema({
    site_id: { type: String, required: true },
    ci: { type: String, required: true },
    type: { type: String, required: true },
    sector_id: { type: Number, required: true },
    sector_id_new: { type: Number, required: true },
    prb_dl_cell: { type: Number, required: true },
    prb_ul_cell: { type: Number, required: true },
    delta_prb_dl: { type: Number, required: true },
    delta_prb_ul: { type: Number, required: true },
}, { timestamps: true });

// ✅ Index untuk meningkatkan performa query
sectorSchema.index({ site_id: 1, sector_id: 1 });

const Sector = mongoose.model("Sector", sectorSchema);
module.exports = Sector;
