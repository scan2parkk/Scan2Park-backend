const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.post('/locations', auth(['admin']), adminController.addLocation);
router.post('/slots', auth(['admin']), adminController.addSlot);
router.get('/users', auth(['admin']), adminController.getUsers);
router.delete('/users/:id', auth(['admin']), adminController.deleteUser);
router.get('/bookings', auth(['admin']), adminController.getBookings);
router.delete('/bookings/:id', auth(['admin']), adminController.deleteBooking);

module.exports = router;