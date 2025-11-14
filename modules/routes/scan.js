const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Import the new Scan model and auth middleware
const Scan = require('../models/Scan'); // Correct path
const authMiddleware = require('../middleware/authMiddleware'); // Correct path

const router = express.Router();

// Create an 'uploads' directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Set up multer to temporarily save uploaded files in the 'uploads' folder
const upload = multer({ dest: uploadDir });

// Protect this route with our new middleware
// We also save the scan to the database
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  const tempFilePath = req.file.path;

  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(tempFilePath));

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

    fs.unlinkSync(tempFilePath);

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

    const responseData = {
      totals: totals,
      advice: advice,
      items: items
    };

    // --- NEW DATABASE LOGIC ---
    // Save the scan to the database, linking it to the logged-in user
    if (items.length > 0) {
      await Scan.create({
        user: req.user._id, // req.user comes from the authMiddleware
        items: items,
        totals: totals,
        advice: advice
      });
    }
    // --- END NEW DATABASE LOGIC ---

    // Send the real data back to your React app
    res.json(responseData);

  } catch (error) {
    console.error('API call failed:', error.response ? error.response.data : error.message);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath); 
    }
    res.status(500).json({ error: 'Failed to analyze image.' });
  }
});

module.exports = router;