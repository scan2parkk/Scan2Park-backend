const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Add CORS package
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const Stripe = require('stripe');

dotenv.config();
const app = express();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000','https://scan2-park-frontend.vercel.app'], // Allow requests from Next.js frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));


app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes); // Mount user routes

app.post('/create-checkout-session', async (req, res) => {
  try {
    // items = [{ name, amount, quantity }]
    const { items } = req.body;
    const line_items = items.map(it => ({
      price_data: {
        currency: 'usd',            // change to your currency (amount is in cents)
        product_data: { name: it.name },
        unit_amount: it.amount,    // e.g. 5000 = $50.00 for USD
      },
      quantity: it.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  res.json(session);
});

app.get("/checkout-session", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id" });
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