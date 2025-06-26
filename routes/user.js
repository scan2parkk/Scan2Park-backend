const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getUserBookings,
  getUserBookingHistory,
  getLocationsAndSlots,
  bookSlot,
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// User routes (protected, accessible to 'user' and 'admin' roles)
router.get('/profile', auth(['user', 'admin']), getUserProfile);
router.get('/bookings', auth(['user', 'admin']), getUserBookings);
router.get('/booking-history', auth(['user', 'admin']), getUserBookingHistory);
router.get('/locations-slots', auth(['user', 'admin']), getLocationsAndSlots);
router.post('/book', auth(['user', 'admin']), bookSlot);

module.exports = router;