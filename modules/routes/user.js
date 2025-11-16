const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan'); // Correct path
const User = require('../models/User'); // Correct path
const authMiddleware = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const scansToday = await Scan.find({
      user: user._id,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    let caloriesConsumed = 0;
    scansToday.forEach(scan => {
      caloriesConsumed += scan.totals.calories;
    });

    const caloriesRemaining = user.dailyCalorieGoal - caloriesConsumed;

    res.json({
      dailyCalorieGoal: user.dailyCalorieGoal,
      caloriesConsumed: Math.round(caloriesConsumed),
      caloriesRemaining: Math.round(caloriesRemaining)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;