// DentaBot is the main bot activity handler for the Contoso Dentistry chatbot.
// It orchestrates three services:
//   1. QnA Maker  -> answers FAQ style questions (insurance, hours, etc.)
//   2. LUIS       -> classifies intent (GetAvailability / ScheduleAppointment)
//                    and extracts date-time entities.
//   3. DentistScheduler -> a third-party REST API that returns availability
//                    and confirms appointments.

const { ActivityHandler } = require('botbuilder');

const QnAMakerConnector = require('../qnamaker');
const LuisConnector = require('../luis');
const DentistScheduler = require('../dentistscheduler');

class DentaBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();

        if (!conversationState) throw new Error('Missing parameter. conversationState is required');
        if (!userState) throw new Error('Missing parameter. userState is required');

        this.conversationState = conversationState;
        this.userState = userState;

        // Create the three service connectors
        this.qnaMaker = new QnAMakerConnector({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAAuthKey,
            host: process.env.QnAEndpointHostName
        });

        this.luisRecognizer = new LuisConnector({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }`
        });

        this.dentistScheduler = new DentistScheduler({
            SchedulerEndpoint: process.env.SchedulerEndpoint
        });

        // Register activity handlers
        this.onMessage(async (context, next) => {
            console.log('Processing message activity.');

            const userMessage = (context.activity.text || '').trim();

            // Handle simple client-side navigation commands first
            const lower = userMessage.toLowerCase();
            if (['reset', 'restart', 'start over', 'cancel', 'stop'].includes(lower)) {
                await this.conversationState.clear(context);
                await context.sendActivity('Okay, I\'ve reset our conversation. How can I help you now? '
                    + 'You can ask about our services, check availability, or schedule an appointment.');
                await next();
                return;
            }

            // 1) Ask LUIS for the intent + entities
            const luisResult = await this.luisRecognizer.recognize(userMessage);
            const topIntent = luisResult.topIntent;
            const intentScore = luisResult.intentScore;
            const dateTime = luisResult.datetime;

            console.log(`LUIS -> topIntent=${ topIntent }, score=${ intentScore }, dateTime=${ dateTime }`);

            // 2) Ask QnA Maker for a knowledge-base answer
            const qnaAnswer = await this.qnaMaker.getAnswer(userMessage);

            // 3) Decide what to do with the results
            const LUIS_INTENT_THRESHOLD = 0.6;

            if (topIntent === 'GetAvailability' && intentScore >= LUIS_INTENT_THRESHOLD) {
                const availability = await this.dentistScheduler.getAvailability();
                await context.sendActivity(availability);
            } else if (topIntent === 'ScheduleAppointment' && intentScore >= LUIS_INTENT_THRESHOLD) {
                if (!dateTime) {
                    await context.sendActivity('Sure — what date and time would you like to book? '
                        + 'For example, you can say "book me for tomorrow at 3pm".');
                } else {
                    const confirmation = await this.dentistScheduler.scheduleAppointment(dateTime);
                    await context.sendActivity(confirmation);
                }
            } else if (qnaAnswer) {
                await context.sendActivity(qnaAnswer);
            } else {
                await context.sendActivity('I\'m sorry, I didn\'t quite catch that. '
                    + 'You can ask me about our office hours, services, insurance, '
                    + 'check availability, or schedule an appointment.');
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Hello and welcome to **Contoso Dentistry**! 🦷\n\n'
                + 'I\'m your virtual dental assistant and I can help you with things like:\n'
                + '- **Office information** — hours, location, staff, insurance plans we accept\n'
                + '- **Services** — cleanings, whitening, orthodontics, emergency care\n'
                + '- **Check availability** — try *"what times are available?"*\n'
                + '- **Book an appointment** — try *"schedule me for tomorrow at 2pm"*\n\n'
                + 'You can also type **reset** at any point to start over. How can I help you today?';

            const membersAdded = context.activity.membersAdded || [];
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(welcomeText);
                }
            }

            await next();
        });
    }

    async run(context) {
        await super.run(context);
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.DentaBot = DentaBot;
