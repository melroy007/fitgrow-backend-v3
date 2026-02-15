const express = require('express');
const Nutrition = require('../models/Nutrition');
const auth = require('../middleware/auth');

const router = express.Router();

// Log meal
router.post('/meal', auth, async (req, res) => {
  try {
    const meal = new Nutrition({
      ...req.body,
      userId: req.userId
    });
    await meal.save();
    
    res.status(201).json({ success: true, meal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get daily nutrition
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meals = await Nutrition.find({
      userId: req.userId,
      date: { $gte: today }
    });
    
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };
    
    meals.forEach(meal => {
      totals.calories += meal.calories || 0;
      totals.protein += meal.protein || 0;
      totals.carbs += meal.carbs || 0;
      totals.fat += meal.fat || 0;
      totals.fiber += meal.fiber || 0;
      totals.sugar += meal.sugar || 0;
      totals.sodium += meal.sodium || 0;
    });
    
    res.json({ success: true, meals, totals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get meal history
router.get('/meals', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const meals = await Nutrition.find(query).sort({ date: -1 }).limit(100);
    
    res.json({ success: true, meals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
