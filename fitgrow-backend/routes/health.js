```javascript
const express = require('express');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// Log activity
router.post('/activity', auth, async (req, res) => {
  try {
    const activity = new Activity({
      ...req.body,
      userId: req.userId
    });
    await activity.save();
    
    res.status(201).json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user activities
router.get('/activities', auth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (type) {
      query.type = type;
    }
    
    const activities = await Activity.find(query).sort({ date: -1 }).limit(100);
    
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get daily stats
router.get('/stats/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activities = await Activity.find({
      userId: req.userId,
      date: { $gte: today }
    });
    
    const stats = {
      calories: 0,
      steps: 0,
      water: 0,
      sleep: 0
    };
    
    activities.forEach(activity => {
      if (stats.hasOwnProperty(activity.type)) {
        stats[activity.type] += activity.value;
      }
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get weekly stats
router.get('/stats/weekly', auth, async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const activities = await Activity.find({
      userId: req.userId,
      date: { $gte: weekAgo }
    });
    
    const weeklyData = Array(7).fill(0);
    
    activities.forEach(activity => {
      if (activity.type === 'calories') {
        const dayIndex = new Date(activity.date).getDay();
        weeklyData[dayIndex] += activity.value;
      }
    });
    
    res.json({ success: true, weeklyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```