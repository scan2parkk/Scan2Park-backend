const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

exports.getLocations = async (req, res) => {
  try {
    const locations = await ParkingLocation.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ locationId: req.params.locationId, isAvailable: true });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.bookSlot = async (req, res) => {
  const { locationId, slotId, startTime, endTime } = req.body;
  try {
    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.locationId.toString() !== locationId || !slot.isAvailable) {
      return res.status(400).json({ message: 'Slot not available' });
    }

    const conflictingBooking = await Booking.findOne({
      slotId,
      $or: [
        { startTime: { $lte: endTime }, endTime: { $gte: startTime } },
      ],
    });
    if (conflictingBooking) return res.status(400).json({ message: 'Slot already booked for this time' });

    slot.isAvailable = false;
    await slot.save();

    const booking = new Booking({
      userId: req.user.id,
      locationId,
      slotId,
      startTime,
      endTime,
    });
    await booking.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};