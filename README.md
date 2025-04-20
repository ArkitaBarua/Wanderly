# Wanderly - AI-Powered Travel Planning Platform

Wanderly is a modern web application that helps users plan their trips using AI-powered recommendations and personalized itineraries. The platform offers features for both solo and group travel planning, with integrated flight search capabilities and destination information.

## Features

- **AI-Powered Travel Planning**: Uses Google's Generative AI to create personalized travel recommendations
- **Destination Search**: Detailed information about places, including attractions and restaurants
- **Group & Solo Trip Planning**: Create surveys for both group and solo travelers
- **Flight Search**: Integrated flight search functionality
- **User Authentication**: Secure login and signup system
- **Personalized Itineraries**: AI-generated travel plans based on user preferences

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **AI Integration**: Google Generative AI, LangChain
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer
- **Animation**: GSAP

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google API Key for Generative AI
- Nodemailer configuration for email services

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_API_KEY=your_google_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

4. Start the server:
```bash
npm start
```

## Project Structure

```
project/
├── server.js              # Main server file
├── package.json          # Project dependencies
├── .env                  # Environment variables
├── public/              # Static files
│   ├── styles.css       # Global styles
│   └── images/          # Image assets
├── html/                # HTML pages
│   ├── main2.html       # Home page
│   ├── travel.html      # Travel planning page
│   ├── flights.html     # Flight search page
│   ├── signup.html      # Authentication page
│   └── contact.html     # Contact page
└── models/              # Database models
    ├── User.js         # User model
    ├── TripSurvey.js   # Survey model
    └── Itinerary.js    # Itinerary model
```

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/verify-token` - Token verification

### Travel Planning
- `POST /api/search-place` - Search for destination information
- `POST /api/create-group-survey` - Create group travel survey
- `POST /api/create-solo-survey` - Create solo travel survey
- `POST /api/submit-survey/:surveyId` - Submit survey responses
- `POST /api/generate-itinerary` - Generate travel itinerary

### Flight Search
- `POST /api/search-flights` - Search for flights
- `POST /api/book-flight` - Book a flight

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

For any queries or support, please contact the development team. 