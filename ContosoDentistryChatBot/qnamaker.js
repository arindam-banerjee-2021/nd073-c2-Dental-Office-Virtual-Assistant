// Custom Question Answering (CQA) connector — modern replacement for classic QnA Maker.
// Talks to the Language service's :query-knowledgebases endpoint via REST.
//
// Env vars (unchanged names for backwards compat):
//   QnAEndpointHostName -> e.g. https://<lang>.cognitiveservices.azure.com/
//   QnAAuthKey          -> Ocp-Apim-Subscription-Key (Language resource KEY 1)
//   QnAKnowledgebaseId  -> the CQA project name (e.g. ContosoDentistryKB)

const fetch = require('node-fetch');

class QnAMakerConnector {
    constructor(config) {
        if (!config || !config.knowledgeBaseId || !config.endpointKey || !config.host) {
            console.warn('[QnAMakerConnector] Missing configuration - QnA will be disabled.');
            this.enabled = false;
            return;
        }
        this.enabled = true;
        this.projectName = config.knowledgeBaseId;   // CQA "project name"
        this.deploymentName = 'production';
        this.key = config.endpointKey;
        // Ensure host ends with exactly one slash for URL building
        this.host = config.host.replace(/\/+$/, '') + '/';
        this.SCORE_THRESHOLD = 0.5;                  // 0..1
    }

    /**
     * @param {string} question
     * @returns {Promise<string|null>}
     */
    async getAnswer(question) {
        if (!this.enabled || !question) return null;

        const url = `${ this.host }language/:query-knowledgebases`
            + `?projectName=${ encodeURIComponent(this.projectName) }`
            + `&api-version=2021-10-01`
            + `&deploymentName=${ encodeURIComponent(this.deploymentName) }`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    top: 3,
                    question,
                    includeUnstructuredSources: true,
                    confidenceScoreThreshold: this.SCORE_THRESHOLD,
                    answerSpanRequest: { enable: true }
                })
            });

            if (!res.ok) {
                const text = await res.text();
                console.error(`[QnAMakerConnector] HTTP ${ res.status }: ${ text }`);
                return null;
            }

            const data = await res.json();
            const answers = data && data.answers ? data.answers : [];
            if (answers.length > 0 && answers[0].confidenceScore >= this.SCORE_THRESHOLD) {
                return answers[0].answer;
            }
            return null;
        } catch (err) {
            console.error('[QnAMakerConnector] getAnswer failed:', err.message);
            return null;
        }
    }
}

module.exports = QnAMakerConnector;
