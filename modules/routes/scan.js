const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
// We no longer need 'fs' or 'path'
// const fs = require('fs');
// const path = require('path');

const Scan = require('../models/Scan');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --- THIS IS THE FIX ---
// Use memoryStorage to handle the file as a buffer in memory
// instead of saving it to disk.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// --- END OF FIX ---

// We still use authMiddleware and upload.single('image')
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  try {
    // 1. Create a form to send to the CalorieNinjas API
    const formData = new FormData();
    // 2. Append the file *buffer* from memory
    // We also must provide a filename for the API
    formData.append('image', req.file.buffer, { filename: req.file.originalname });

    // 3. Call the external API with your secret key
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

    // 4. We no longer need to delete a temporary file
    
    // 5. Format their response
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

    // 6. Save the scan to the database
    if (items.length > 0) {
      await Scan.create({
        user: req.user._id,
        items: items,
        totals: totals,
        advice: advice
      });
    }

    // 7. Send the real data back to your React app
    res.json(responseData);

  } catch (error) {
    // Check for a more specific error from CalorieNinjas
    if (error.response && error.response.data) {
      console.error('API call failed:', error.response.data);
    } else {
      console.error('Scan route failed:', error.message);
    }
    
    // Send a clearer error message to the frontend if possible
    const apiErrorMessage = error.response?.data?.message || 'Failed to analyze image.';
    res.status(500).json({ error: apiErrorMessage });
  }
});

module.exports = router;