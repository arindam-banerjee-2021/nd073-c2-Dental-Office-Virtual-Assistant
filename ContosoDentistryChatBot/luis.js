// CLU (Conversational Language Understanding) connector — replaces the classic LUIS SDK.
// Talks to the Language service's :analyze-conversations endpoint via REST.
// Also does simple local datetime extraction (since CLU doesn't ship prebuilt datetimeV2).
//
// Env vars (unchanged names):
//   LuisAppId       -> CLU project name (e.g. ContosoDentistryLU)
//   LuisAPIKey      -> Ocp-Apim-Subscription-Key (same Language resource KEY 1)
//   LuisAPIHostName -> e.g. contoso-language-ab2026.cognitiveservices.azure.com (no scheme)

const fetch = require('node-fetch');

class LuisConnector {
    constructor(config) {
        if (!config || !config.applicationId || !config.endpointKey || !config.endpoint) {
            console.warn('[LuisConnector] Missing configuration - LUIS/CLU will be disabled.');
            this.enabled = false;
            return;
        }
        this.enabled = true;
        this.projectName = config.applicationId;      // CLU project name
        this.deploymentName = 'production';
        this.key = config.endpointKey;
        // config.endpoint arrives like "https://<host>" - keep as-is
        this.endpoint = config.endpoint.replace(/\/+$/, '');
    }

    /**
     * @param {string} utterance
     * @returns {Promise<{topIntent:string,intentScore:number,datetime:string|null,raw:Object}>}
     */
    async recognize(utterance) {
        const empty = { topIntent: 'None', intentScore: 0, datetime: null, raw: null };
        if (!this.enabled || !utterance) return empty;

        const url = `${ this.endpoint }/language/:analyze-conversations?api-version=2022-10-01-preview`;

        const body = {
            kind: 'Conversation',
            analysisInput: {
                conversationItem: {
                    id: '1',
                    participantId: 'user',
                    text: utterance
                }
            },
            parameters: {
                projectName: this.projectName,
                deploymentName: this.deploymentName,
                stringIndexType: 'TextElement_V8'
            }
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const text = await res.text();
                console.error(`[LuisConnector] HTTP ${ res.status }: ${ text }`);
                return empty;
            }

            const data = await res.json();
            const prediction = data && data.result && data.result.prediction;
            if (!prediction) return empty;

            const topIntent = prediction.topIntent || 'None';
            let intentScore = 0;
            if (Array.isArray(prediction.intents)) {
                const match = prediction.intents.find((i) => i.category === topIntent);
                if (match) intentScore = match.confidenceScore || 0;
            }

            // CLU doesn't provide datetimeV2 prebuilt. Fall back to a lightweight
            // local regex so ScheduleAppointment can still extract a time hint.
            const datetime = extractDatetimeString(utterance);

            return { topIntent, intentScore, datetime, raw: data };
        } catch (err) {
            console.error('[LuisConnector] recognize failed:', err.message);
            return empty;
        }
    }
}

/**
 * Very small heuristic to pull a "when" phrase out of the utterance.
 * Handles common patterns like: "tomorrow at 3pm", "friday at 10am",
 * "next monday", "9am", "noon", etc.
 * Returns null if nothing plausible was found.
 */
function extractDatetimeString(text) {
    if (!text) return null;
    const t = text.toLowerCase();

    // Look for day + time patterns first
    const dayWords = '(today|tomorrow|tonight|tonite|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\\s+\\w+|this\\s+\\w+)';
    const timeWords = '(\\d{1,2}(:\\d{2})?\\s*(am|pm)|noon|midnight|morning|afternoon|evening|night)';

    const combined = new RegExp(`${ dayWords }[^a-z0-9]*(at\\s+)?${ timeWords }`, 'i');
    const m1 = t.match(combined);
    if (m1) return m1[0].trim();

    const dayOnly = new RegExp(dayWords, 'i').exec(t);
    const timeOnly = new RegExp(timeWords, 'i').exec(t);
    if (dayOnly && timeOnly) return `${ dayOnly[0] } ${ timeOnly[0] }`.trim();
    if (dayOnly) return dayOnly[0].trim();
    if (timeOnly) return timeOnly[0].trim();

    return null;
}

module.exports = LuisConnector;
