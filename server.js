const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(express.static(__dirname));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    photo: { type: String, default: 'default-avatar.png' }
});

const User = mongoose.model('User', userSchema);

// Trip schema
const tripSchema = new mongoose.Schema({
    name: { type: String, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        name: { type: String, required: true },
        email: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Trip = mongoose.model('Trip', tripSchema);

// JWT middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('Authentication failed: No token provided');
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('Authentication failed: User not found');
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }
        req.user = {
            _id: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            photo: user.photo
        };
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
};

// Sign-up route
app.post('/api/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
        console.log('Sign-up request received:', { email });
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Sign-up failed: Email already registered');
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Sign-up successful:', { email });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                photo: user.photo
            }
        });
    } catch (error) {
        console.error('Sign-up error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Login request received:', { email });
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login failed: Incorrect password');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Login successful:', { email });
        res.status(200).json({
            token,
            user: {
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                photo: user.photo
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's trips
app.get('/api/trips/user', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        console.log('Fetching trips for user:', userEmail);
        const trips = await Trip.find({ 'members.email': userEmail });
        res.json(trips);
    } catch (error) {
        console.error('Error fetching user trips:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get group trips
app.get('/api/trips/group', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        console.log('Fetching group trips for user:', userEmail);
        const trips = await Trip.find({
            'members.email': userEmail,
            'members.1': { $exists: true }
        });
        res.json(trips);
    } catch (error) {
        console.error('Error fetching group trips:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new trip
app.post('/api/trips', authenticateToken, async (req, res) => {
    try {
        const { name, members } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Trip name is required' });
        }

        const creatorEmail = req.user.email;
        const creatorName = req.user.name;

        console.log('Creating trip:', { name, creatorEmail, members });

        const tripMembers = [
            { name: creatorName, email: creatorEmail },
            ...(Array.isArray(members) ? members : [])
        ];

        const trip = new Trip({
            name,
            creator: req.user._id,
            members: tripMembers
        });

        await trip.save();
        console.log('Trip created successfully:', { name });
        res.status(201).json(trip);
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Serve HTML files explicitly if needed
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
