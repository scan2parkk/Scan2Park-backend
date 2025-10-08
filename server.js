const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const Stripe = require('stripe');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));