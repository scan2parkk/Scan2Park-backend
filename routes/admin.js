const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const parkingController = require('../controllers/parkingController');

router.post('/locations', auth(['admin']), adminController.addLocation);
router.delete('/locations/:id', auth(['admin']), adminController.deleteLocation);
router.get('/slots', auth(['admin']), parkingController.getAllSlots);
router.post('/slots', auth(['admin']), adminController.addSlot);
router.post('/multiple-slots', auth(['admin']), adminController.addMultipleSlots);
router.delete('/multiple-slots', auth(['admin']), adminController.deleteMultipleSlots);
router.delete('/slots/:id', auth(['admin']), adminController.deleteSlot);
router.get('/users', auth(['admin']), adminController.getUsers);
router.delete('/users/:id', auth(['admin']), adminController.deleteUser);
router.get('/bookings', auth(['admin']), adminController.getBookings);
router.delete('/bookings/:id', auth(['admin']), adminController.deleteBooking);

module.exports = router;