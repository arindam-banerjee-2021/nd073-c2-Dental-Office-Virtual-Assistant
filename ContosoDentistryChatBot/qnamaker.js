// QnAMakerConnector wraps the botbuilder-ai QnAMaker client so the bot can
// ask the knowledge base a natural-language question and get back the top
// answer (or null if the KB doesn't have a confident match).

const { QnAMaker } = require('botbuilder-ai');

class QnAMakerConnector {
    constructor(config) {
        if (!config || !config.knowledgeBaseId || !config.endpointKey || !config.host) {
            console.warn('[QnAMakerConnector] Missing configuration - QnA Maker will be disabled.');
            this.enabled = false;
            return;
        }

        this.enabled = true;
        this.qnaMaker = new QnAMaker({
            knowledgeBaseId: config.knowledgeBaseId,
            endpointKey: config.endpointKey,
            host: config.host
        });

        this.SCORE_THRESHOLD = 0.5;
    }

    async getAnswer(question) {
        if (!this.enabled || !question) return null;

        try {
            const results = await this.qnaMaker.getAnswersRaw(
                { activity: { text: question } },
                { top: 1, scoreThreshold: this.SCORE_THRESHOLD * 100 }
            );

            const answers = results && results.answers ? results.answers : [];
            if (answers.length > 0 && answers[0].score >= this.SCORE_THRESHOLD * 100) {
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
