const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
// --- THIS IS THE FIX ---
const Scan = require('../models/Scan');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  try {
    const formData = new FormData();
    formData.append('image', req.file.buffer, { filename: req.file.originalname });

    const apiResponse = await axios.post(
      'https://api.calorieninjas.com/v1/imagetextnutrition', 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': process.env.NINJA_API_KEY,
        },
      }
    );
    
    const items = apiResponse.data.items || [];
    let totals = { calories: 0, protein: 0, carb: 0, fat: 0 };
    items.forEach(item => {
      totals.calories += item.calories;
      totals.protein += item.protein_g;
      totals.carb += item.carbohydrates_total_g;
      totals.fat += item.fat_total_g;
    });
    
    const advice = items.length > 0 
      ? `We identified ${items.length} item(s). This meal is approximately ${Math.round(totals.calories)} calories.`
      : 'Could not identify food items in this image. Please try a clearer photo.';

    const responseData = { totals, advice, items };

    if (items.length > 0) {
      await Scan.create({
        user: req.user._id,
        items: items,
        totals: totals,
        advice: advice
      });
    }
    
    res.json(responseData);
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('API call failed:', error.response.data);
    } else {
      console.error('Scan route failed:', error.message);
    }
    const apiErrorMessage = error.response?.data?.message || 'Failed to analyze image.';
    res.status(5Code(500).json({ error: apiErrorMessage });
  }
});

module.exports = router;