const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const parkingController = require('../controllers/parkingController');

router.get('/locations', parkingController.getLocations);
router.get('/slots/:locationId', parkingController.getSlots);
router.get('/slots', parkingController.getAllSlots);
router.post('/book', auth(['user']), parkingController.bookSlot);

module.exports = router;