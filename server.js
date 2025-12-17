const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const Stripe = require('stripe');

const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');



dotenv.config();
const app = express();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: ['http://localhost:3000', 'https://scan2-park-frontend.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Connect to MongoDB
connectDB();



// app.use(cors());
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" }
// });

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://scan2-park-frontend.vercel.app"],
    methods: ["GET", "POST"]
  }
});



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;
    const line_items = items.map((it) => ({
      price_data: {
        currency: 'inr',
        product_data: { name: it.name },
        unit_amount: it.amount,
      },
      quantity: it.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/parking-locations/${req.body.locationId}?session_id={CHECKOUT_SESSION_ID}`, // Include locationId in success URL
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/checkout-session', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// ----------------------------- //
// IOT BACKEND MERGED HERE


// Your IoT device status URL
const DEVICE_URL = "http://192.168.4.1/status";

// Poll every 1 second
const POLL_INTERVAL_MS = 1000;

let latestStatus = null;


function convertDeviceData(data) {
  // Device returns: { slot1: "EMPTY", slot2: "EMPTY" ... }

  return [
    { id: 1, state: data.slot1 === "EMPTY" ? 0 : 1 },
    { id: 2, state: data.slot2 === "EMPTY" ? 0 : 1 },
    { id: 3, state: data.slot3 === "EMPTY" ? 0 : 1 },
    { id: 4, state: data.slot4 === "EMPTY" ? 0 : 1 }
  ];
}


io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  if (latestStatus) {
    socket.emit("parking:update", latestStatus);
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});


async function pollDevice() {
  try {
    const response = await axios.get(DEVICE_URL, { timeout: 2000 });

    const deviceData = response.data;
    const normalized = convertDeviceData(deviceData);

    const payload = {
      timestamp: Date.now(),
      slots: normalized
    };

    const changed =
      JSON.stringify(payload.slots) !== JSON.stringify(latestStatus?.slots);

    latestStatus = payload;

    if (changed) {
      io.emit("parking:update", payload);
      console.log("Updated:", payload);
    }
  } catch (err) {
    console.log("Polling error:", err.message);
  }
}

setInterval(pollDevice, POLL_INTERVAL_MS);
pollDevice();



const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`);
});