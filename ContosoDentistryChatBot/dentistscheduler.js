// DentistScheduler is a thin client for the ContosoDentistryScheduler REST API.
// It exposes two operations that the bot uses:
//   - getAvailability()  GET  /availability
//   - scheduleAppointment(time)  POST /schedule?time=<time>

const fetch = require('node-fetch');

class DentistScheduler {
    constructor(config) {
        if (!config || !config.SchedulerEndpoint) {
            console.warn('[DentistScheduler] Missing SchedulerEndpoint - scheduler will be disabled.');
            this.enabled = false;
            return;
        }
        this.enabled = true;
        this.endpoint = config.SchedulerEndpoint.replace(/\/+$/, '');
    }

    async getAvailability() {
        if (!this.enabled) return 'The scheduling service is not configured yet.';
        try {
            const res = await fetch(`${ this.endpoint }/availability`);
            if (!res.ok) {
                return `Sorry, I couldn't reach the scheduler (HTTP ${ res.status }). Please try again in a moment.`;
            }
            const data = await res.json();
            if (data && data.message) return data.message;
            if (data && Array.isArray(data.availableTimes)) {
                return `Here are the times we currently have open: ${ data.availableTimes.join(', ') }.`;
            }
            return 'I checked the calendar but got an unexpected response. Please try again.';
        } catch (err) {
            console.error('[DentistScheduler] getAvailability failed:', err.message);
            return 'Sorry, the scheduling service is unavailable right now. Please try again shortly.';
        }
    }

    async scheduleAppointment(time) {
        if (!this.enabled) return 'The scheduling service is not configured yet.';
        try {
            const res = await fetch(
                `${ this.endpoint }/schedule?time=${ encodeURIComponent(time) }`,
                { method: 'POST' }
            );
            if (!res.ok) {
                return `Sorry, I couldn't book that time (HTTP ${ res.status }). Please try a different time.`;
            }
            const data = await res.json();
            if (data && data.message) return data.message;
            return `You're booked for ${ time }. We'll see you then! 🦷`;
        } catch (err) {
            console.error('[DentistScheduler] scheduleAppointment failed:', err.message);
            return 'Sorry, I couldn\'t book that appointment right now. Please try again shortly.';
        }
    }
}

module.exports = DentistScheduler;
