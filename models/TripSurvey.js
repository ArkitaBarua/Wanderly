const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    answers: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const tripSurveySchema = new mongoose.Schema({
    place: {
        type: String,
        required: true
    },
    isSolo: {
        type: Boolean,
        default: false
    },
    groupSize: {
        type: Number,
        required: function() {
            return !this.isSolo;
        }
    },
    emails: [{
        type: String,
        required: function() {
            return !this.isSolo;
        }
    }],
    survey: {
        type: Object,
        required: true
    },
    responses: [responseSchema],
    itinerary: {
        type: Object
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TripSurvey', tripSurveySchema); 