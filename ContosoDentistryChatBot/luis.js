// LuisConnector wraps the LuisRecognizer so the bot can send a user utterance
// to LUIS and get back the top intent, its confidence score, and any
// datetime entity that was extracted (used for scheduling appointments).

const { LuisRecognizer } = require('botbuilder-ai');

class LuisConnector {
    constructor(config) {
        if (!config || !config.applicationId || !config.endpointKey || !config.endpoint) {
            console.warn('[LuisConnector] Missing configuration - LUIS will be disabled.');
            this.enabled = false;
            return;
        }

        this.enabled = true;
        this.recognizer = new LuisRecognizer(
            {
                applicationId: config.applicationId,
                endpointKey: config.endpointKey,
                endpoint: config.endpoint
            },
            {
                includeAllIntents: true,
                includeInstanceData: true
            },
            true
        );
    }

    async recognize(utterance) {
        const empty = { topIntent: 'None', intentScore: 0, datetime: null, raw: null };
        if (!this.enabled || !utterance) return empty;

        try {
            const fauxContext = {
                activity: {
                    text: utterance,
                    type: 'message',
                    channelId: 'emulator',
                    from: { id: 'user' },
                    recipient: { id: 'bot' },
                    conversation: { id: 'conv' }
                }
            };

            const recognized = await this.recognizer.recognize(fauxContext);
            const topIntent = LuisRecognizer.topIntent(recognized, 'None', 0.0);
            const intentScore = recognized.intents && recognized.intents[topIntent]
                ? recognized.intents[topIntent].score
                : 0;

            // Extract a datetime entity if present.
            let datetime = null;
            const dt = recognized.entities && recognized.entities.datetime;
            if (Array.isArray(dt) && dt.length > 0) {
                const first = dt[0];
                if (first && Array.isArray(first.timex) && first.timex.length > 0) {
                    datetime = first.timex[0];
                }
            }

            if (!datetime && recognized.entities && recognized.entities.datetimeV2) {
                const dtv2 = recognized.entities.datetimeV2;
                if (Array.isArray(dtv2) && dtv2.length > 0 && Array.isArray(dtv2[0].timex)) {
                    datetime = dtv2[0].timex[0];
                }
            }

            return { topIntent, intentScore, datetime, raw: recognized };
        } catch (err) {
            console.error('[LuisConnector] recognize failed:', err.message);
            return empty;
        }
    }
}

module.exports = LuisConnector;
