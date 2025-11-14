const mongoose = require("mongoose");

const ScanSchema = new mongoose.Schema({
  // Link this scan to a specific user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Store the full list of items from the API
  items: {
    type: Array,
    required: true
  },
  // Store the calculated totals
  totals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carb: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  // Store the advice
  advice: {
    type: String
  }
}, {
  // Add createdAt/updatedAt timestamps automatically
  timestamps: true 
});

module.exports = mongoose.model("Scan", ScanSchema);