const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const TripSurvey = require('./models/TripSurvey');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

console.log('TripSurvey model:', TripSurvey);

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

// Gemini integration
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage } = require("@langchain/core/messages");

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
    apiKey: process.env.GOOGLE_API_KEY,
});

// Place search endpoint
app.post('/api/search-place', async (req, res) => {
    try {
        const { place } = req.body;

        const prompt = `Provide detailed information about ${place} including:
        1. Top 5 places to visit with their descriptions and entry fees
        2. Top 5 famous restaurants with their specialties and average price per person
        Format the response as a JSON object with the following structure:
        {
            "name": "Delhi",
            "placesToVisit": [
                {
                    "name": "Red Fort",
                    "description": "A historic fort in the city of Delhi, built by Mughal Emperor Shah Jahan",
                    "entryFee": "₹35 for Indians, ₹500 for foreigners",
                    "timings": "9:30 AM - 4:30 PM (Closed on Mondays)"
                }
            ],
            "restaurants": [
                {
                    "name": "Karim's",
                    "specialty": "Mughlai cuisine, famous for their kebabs and biryanis",
                    "averagePrice": "₹800-₹1200 per person",
                    "cuisine": "Mughlai, North Indian"
                }
            ]
        }
        Return ONLY the JSON object, no additional text or explanation.`;

        const result = await geminiModel.invoke([new HumanMessage(prompt)]);
        let text = result.content;
        
        // Clean up the response
        text = text.replace(/```json\n?/, '');
        text = text.replace(/\n?```$/, '');
        text = text.replace(/```/g, '');
        text = text.trim();
        
        // Try to parse the JSON
        let placeInfo;
        try {
            placeInfo = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw Response:', text);
            throw new Error('Failed to parse response from AI');
        }

        // Validate the structure
        if (!placeInfo.name || !Array.isArray(placeInfo.placesToVisit) || !Array.isArray(placeInfo.restaurants)) {
            throw new Error('Invalid response structure from AI');
        }

        res.json(placeInfo);
    } catch (error) {
        console.error('Error searching place:', error);
        res.status(500).json({ 
            error: 'Failed to search place',
            details: error.message 
        });
    }
});

// Create group survey endpoint
app.post('/api/create-group-survey', async (req, res) => {
    const TripSurvey = require('./models/TripSurvey');
    try {
      const { place, emails, groupSize } = req.body;
  
      const prompt = `Create a survey for a group trip to ${place} with ${groupSize} people.
      The survey should include:
      1. Preferred dates for the trip
      2. Preferred accommodation type
      3. Must-visit places from the list
      4. Preferred restaurants
      5. Budget range
      Format the response as a JSON object with 'questions' array.`;
  
      const result = await geminiModel.invoke([new HumanMessage(prompt)]);
      result.content = result.content.replace(/```json\n/, '').replace(/\n```/, '');
      const survey = JSON.parse(result.content);
  
      const tripSurvey = new TripSurvey({
        place,
        emails,
        groupSize,
        survey,
        responses: []
      });
  
      await tripSurvey.save();
  
      for (const email of emails) {
        await sendSurveyEmail(email, tripSurvey._id);
      }
  
      res.json({ message: 'Survey created and sent successfully' });
    } catch (error) {
      console.error('Error creating group survey:', error);
      res.status(500).json({ error: 'Failed to create survey' });
    }
  });
  

// Create solo survey endpoint
app.post('/api/create-solo-survey', async (req, res) => {
    try {
        const { place } = req.body;

        const prompt = `Create a personalized survey for a solo trip to ${place}.
        The survey should include:
        1. Preferred dates
        2. Accommodation preferences
        3. Must-visit places
        4. Food preferences
        5. Budget range
        Format the response as a JSON object with the following structure:
        {
            "questions": [
                {
                    "id": "dates",
                    "question": "What are your preferred dates for the trip?",
                    "type": "date-range"
                },
                {
                    "id": "accommodation",
                    "question": "What type of accommodation do you prefer?",
                    "type": "multiple-choice",
                    "options": ["Hotel", "Hostel", "Airbnb", "Resort"]
                },
                {
                    "id": "places",
                    "question": "Which places would you like to visit?",
                    "type": "multiple-select",
                    "options": []
                },
                {
                    "id": "food",
                    "question": "What type of food do you prefer?",
                    "type": "multiple-choice",
                    "options": ["Local Cuisine", "International", "Vegetarian", "Vegan"]
                },
                {
                    "id": "budget",
                    "question": "What is your budget range?",
                    "type": "range",
                    "min": 10000,
                    "max": 100000
                }
            ]
        }
        Return ONLY the JSON object, no additional text or explanation.`;

        const result = await geminiModel.invoke([new HumanMessage(prompt)]);
        let text = result.content;
        
        // Clean up the response
        text = text.replace(/```json\n?/, '');
        text = text.replace(/\n?```$/, '');
        text = text.replace(/```/g, '');
        text = text.trim();
        
        // Try to parse the JSON
        let survey;
        try {
            survey = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw Response:', text);
            throw new Error('Failed to parse response from AI');
        }

        // Validate the structure
        if (!survey.questions || !Array.isArray(survey.questions)) {
            throw new Error('Invalid survey structure from AI');
        }

        const tripSurvey = new TripSurvey({
            place,
            isSolo: true,
            survey,
            responses: []
        });

        await tripSurvey.save();

        res.json({ 
            message: 'Survey created successfully', 
            surveyId: tripSurvey._id,
            survey: survey
        });
    } catch (error) {
        console.error('Error creating solo survey:', error);
        res.status(500).json({ 
            error: 'Failed to create survey',
            details: error.message 
        });
    }
});
  

// Submit survey response endpoint
app.post('/api/submit-survey', async (req, res) => {
    try {
        const { surveyId, responses } = req.body;
        
        // Validate input
        if (!surveyId || !responses) {
            return res.status(400).json({ error: 'Survey ID and responses are required' });
        }

        // Find the survey
        const survey = await TripSurvey.findById(surveyId);
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Add the response to the survey
        survey.responses.push({
            answers: responses,
            submittedAt: new Date()
        });

        // Generate itinerary for both solo and group surveys
        const itinerary = await generateItinerary(survey);
        survey.itinerary = itinerary;
        console.log('Itinerary:', itinerary);

        // Save the updated survey
        await survey.save();

        res.json({ 
            message: 'Survey response submitted successfully',
            survey: {
                _id: survey._id,
                place: survey.place,
                isSolo: survey.isSolo,
                itinerary: survey.itinerary
            }
        });
    } catch (error) {
        console.error('Error submitting survey:', error);
        res.status(500).json({ 
            error: 'Failed to submit survey',
            details: error.message 
        });
    }
});

// Generate itinerary using Gemini
async function generateItinerary(survey) {
    const prompt = `Create a detailed itinerary for a trip to ${survey.place} based on the following survey responses:
    ${JSON.stringify(survey.responses[0].answers)}
    
    The itinerary should include:
    1. Day-by-day schedule with:
       - Morning activities
       - Afternoon activities
       - Evening activities
    2. For each activity:
       - Name and description
       - Entry fees (if any)
       - Duration
       - Transportation details
    3. Restaurant recommendations for each day:
       - Name and cuisine type
       - Average price per person
    4. Accommodation suggestions:
       - Type (based on user preference)
       - Average price per night
    5. Total estimated cost breakdown:
       - Activities total
       - Food total
       - Accommodation total
       - Transportation total
       - Grand total
    
    Format the response as a JSON object with the following structure:
    {
        "days": [
            {
                "day": 1,
                "morning": {
                    "activity": "Activity name",
                    "description": "Activity description",
                    "entryFee": "₹XXX",
                    "duration": "X hours",
                    "transportation": "Transport details"
                },
                "afternoon": {
                    "activity": "Activity name",
                    "description": "Activity description",
                    "entryFee": "₹XXX",
                    "duration": "X hours",
                    "transportation": "Transport details"
                },
                "evening": {
                    "activity": "Activity name",
                    "description": "Activity description",
                    "entryFee": "₹XXX",
                    "duration": "X hours",
                    "transportation": "Transport details"
                },
                "restaurant": {
                    "name": "Restaurant name",
                    "cuisine": "Cuisine type",
                    "averagePrice": "₹XXX per person"
                }
            }
        ],
        "accommodation": {
            "type": "Accommodation type",
            "suggestions": [
                {
                    "name": "Place name",
                    "price": "₹XXX per night"
                }
            ]
        },
        "costBreakdown": {
            "activities": "₹XXX",
            "food": "₹XXX",
            "accommodation": "₹XXX",
            "transportation": "₹XXX",
            "total": "₹XXX"
        }
    }
    Return ONLY the JSON object, no additional text or explanation.`;

    const result = await geminiModel.invoke([new HumanMessage(prompt)]);
    let text = result.content;
    
    // Clean up the response
    text = text.replace(/```json\n?/, '');
    text = text.replace(/\n?```$/, '');
    text = text.replace(/```/g, '');
    text = text.trim();
    
    try {
        return JSON.parse(text);
    } catch (error) {
        console.error('Error parsing itinerary:', error);
        throw new Error('Failed to generate itinerary');
    }
}
  

// Email sending functions
async function sendSurveyEmail(email, surveyId) {
    // Implement email sending logic
    // This would typically use a service like SendGrid or Nodemailer
}

async function sendItineraryEmail(email, itinerary) {
    // Implement email sending logic
}

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main2.html'));
});

app.get('/travel', (req, res) => {
    res.sendFile(path.join(__dirname, 'travel.html'));
});

app.get('/flights', (req, res) => {
    res.sendFile(path.join(__dirname, 'flights.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
