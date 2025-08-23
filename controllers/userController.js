const User = require('../models/User');
const Booking = require('../models/Booking');
const Location = require('../models/ParkingLocation');
const Slot = require('../models/ParkingSlot');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get user bookings (current and active)
exports.getUserBookings = async (req, res) => {
  try {
    const now = new Date();
    console.log(req.user.id);
    
    const bookings = await Booking.find({
      userId: req.user.id,
      // endTime: { $gte: now }, // Only active bookings
    })
      .populate('locationId', 'name address')
      .populate('slotId', 'slotNumber');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get user booking history (all bookings, including past)
exports.getUserBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('locationId', 'name address')
      .populate('slotId', 'slotNumber')
      .sort({ startTime: -1 }); // Sort by start time descending
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all locations and their slots
exports.getLocationsAndSlots = async (req, res) => {
  try {
    const locations = await Location.find();
    const slotsData = {};
    for (const location of locations) {
      const slots = await Slot.find({ locationId: location._id });
      slotsData[location._id] = slots;
    }
    res.json({ locations, slots: slotsData });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Book a slot
exports.bookSlot = async (req, res) => {
  const { locationId, slotId, startTime, endTime } = req.body;
  try {
    const slot = await Slot.findById(slotId);
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: 'Slot not available' });
    }
    if (slot.locationId.toString() !== locationId) {
      return res.status(400).json({ message: 'Slot does not belong to this location' });
    }
    const booking = new Booking({
      userId: req.user._id,
      locationId,
      slotId,
      startTime,
      endTime,
    });
    await booking.save();
    slot.isAvailable = false;
    await slot.save();
    await booking.populate('locationId', 'name address').populate('slotId', 'slotNumber');
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};