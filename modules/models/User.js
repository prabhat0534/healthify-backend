const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dailyCalorieGoal: { type: Number, default: 2000 }
});

module.exports = mongoose.model("User", UserSchema);