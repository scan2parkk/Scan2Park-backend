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

exports.addMultipleSlots = async (req, res) => {
  const { locationId, slots } = req.body; // slots is an array of { slotNumber: string }
  try {
    // Validate location
    const location = await ParkingLocation.findById(locationId);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    // Check for duplicate slot numbers in the request and existing slots
    const slotNumbers = slots.map(slot => slot.slotNumber);
    const duplicatesInRequest = slotNumbers.filter((item, index) => slotNumbers.indexOf(item) !== index);
    if (duplicatesInRequest.length > 0) {
      return res.status(400).json({ message: `Duplicate slot numbers in request: ${duplicatesInRequest.join(', ')}` });
    }

    const existingSlots = await ParkingSlot.find({ locationId, slotNumber: { $in: slotNumbers } });
    if (existingSlots.length > 0) {
      const existingSlotNumbers = existingSlots.map(slot => slot.slotNumber);
      return res.status(400).json({ message: `Slot numbers already exist: ${existingSlotNumbers.join(', ')}` });
    }

    // Create multiple slots
    const newSlots = slots.map(slot => ({
      locationId,
      slotNumber: slot.slotNumber,
      isAvailable: true,
      createdAt: new Date(),
    }));

    const insertedSlots = await ParkingSlot.insertMany(newSlots);
    res.status(201).json({ message: 'Slots added successfully', slots: insertedSlots });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.deleteMultipleSlots = async (req, res) => {
  const { slotIds } = req.body; // slotIds is an array of slot IDs
  try {
    // Validate slot IDs
    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({ message: 'Slot IDs must be a non-empty array' });
    }

    // Check if slots exist
    const slots = await ParkingSlot.find({ _id: { $in: slotIds } });
    if (slots.length !== slotIds.length) {
      const foundIds = slots.map(slot => slot._id.toString());
      const missingIds = slotIds.filter(id => !foundIds.includes(id));
      return res.status(404).json({ message: `Slots not found: ${missingIds.join(', ')}` });
    }

    // Check for active bookings
    const now = new Date();
    const activeBookings = await Booking.find({
      slotId: { $in: slotIds },
      endTime: { $gte: now },
    });
    if (activeBookings.length > 0) {
      const bookedSlotIds = activeBookings.map(booking => booking.slotId.toString());
      return res.status(400).json({ message: `Cannot delete slots with active bookings: ${bookedSlotIds.join(', ')}` });
    }

    // Delete slots
    await ParkingSlot.deleteMany({ _id: { $in: slotIds } });
    res.status(200).json({ message: 'Slots deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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