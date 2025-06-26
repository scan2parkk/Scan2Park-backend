const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Add CORS package
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

dotenv.config();
const app = express();


// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from Next.js frontend
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));