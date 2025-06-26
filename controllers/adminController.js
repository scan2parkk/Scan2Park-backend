const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
const Booking = require('../models/Booking');

exports.addLocation = async (req, res) => {
  const { name, address } = req.body;
  try {
    const location = new ParkingLocation({ name, address });
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addSlot = async (req, res) => {
  const { locationId, slotNumber } = req.body;
  try {
    const location = await ParkingLocation.findById(locationId);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    const slot = new ParkingSlot({ locationId, slotNumber });
    await slot.save();
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId', 'name email').populate('locationId', 'name').populate('slotId', 'slotNumber');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await ParkingSlot.findByIdAndUpdate(booking.slotId, { isAvailable: true });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};