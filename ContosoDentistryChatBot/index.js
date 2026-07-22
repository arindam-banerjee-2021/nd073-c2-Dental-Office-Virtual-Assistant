// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
//
// index.js is the entry point for the ContosoDentistryChatBot.
// It sets up the restify web server, the BotFrameworkAdapter (auth + turn processing),
// and wires the /api/messages HTTP endpoint that Azure Bot Service will call.

const path = require('path');
const restify = require('restify');

// Load environment variables from .env
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Bot Framework SDK
const {
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConversationState,
    MemoryStorage,
    UserState
} = require('botbuilder');

// Bot logic
const { DentaBot } = require('./bots/dentaBot');

// ----------------------------------------------------------------------------
// Create HTTP server
// ----------------------------------------------------------------------------
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator and select "Open Bot"');
});

// ----------------------------------------------------------------------------
// Bot Framework Authentication
// ----------------------------------------------------------------------------
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(process.env);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all error handler
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// ----------------------------------------------------------------------------
// State
// ----------------------------------------------------------------------------
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// ----------------------------------------------------------------------------
// Bot
// ----------------------------------------------------------------------------
const bot = new DentaBot(conversationState, userState);

// ----------------------------------------------------------------------------
// HTTP endpoint that receives incoming messages from the Bot Framework Service
// ----------------------------------------------------------------------------
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => bot.run(context));
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);
    streamingAdapter.onTurnError = adapter.onTurnError;
    await streamingAdapter.process(req, socket, head, (context) => bot.run(context));
});
