// ContosoDentistryScheduler
// A tiny Express API that simulates a third-party dental scheduling backend.
// It exposes:
//   GET  /                Health check.
//   GET  /availability    Returns a list of open appointment slots + a
//                         natural-language summary the bot can send verbatim.
//   POST /schedule?time=…  Books the requested time and returns a confirmation.
//
// The chatbot (ContosoDentistryChatBot) calls this API when LUIS classifies
// the user's utterance as a GetAvailability or ScheduleAppointment intent.

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

const PORT = process.env.PORT || 8080;

// ---------------------------------------------------------------------------
// In-memory "database" of available time slots.
// ---------------------------------------------------------------------------
const AVAILABLE_TIMES = [
    '10:00 AM tomorrow',
    '11:30 AM tomorrow',
    '2:00 PM tomorrow',
    '9:00 AM Monday',
    '3:30 PM Monday',
    '10:30 AM Wednesday'
];

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
    res.json({
        service: 'ContosoDentistryScheduler',
        status: 'ok',
        endpoints: ['/availability', '/schedule?time=<time>']
    });
});

app.get('/availability', (_req, res) => {
    res.json({
        availableTimes: AVAILABLE_TIMES,
        message: `We have the following open slots: ${ AVAILABLE_TIMES.join(', ') }. `
            + 'Which one would you like to book?'
    });
});

app.post('/schedule', (req, res) => {
    const time = req.query.time || (req.body && req.body.time);
    if (!time) {
        return res.status(400).json({
            error: 'Missing "time" query parameter.',
            message: 'Please tell me what date and time you would like to book.'
        });
    }
    res.json({
        booked: true,
        time,
        message: `Great — you're all set for ${ time }. `
            + 'We\'ll send a reminder the day before. See you soon! 🦷'
    });
});

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`ContosoDentistryScheduler listening on port ${ PORT }`);
});
