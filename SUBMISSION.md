# 🚀 Submission Checklist

> Follow SUBMISSION steps in order. Estimated total time: **~90 minutes**.

## Rubric mapping

| Rubric criterion | Deliverable | Status |
|---|---|---|
| Create bot application | `ContosoDentistryChatBot/` | ✅ done |
| Deploy Dentist Scheduler app | `ContosoDentistryScheduler/` | ✅ code done — deploy in Azure |
| Train QnA Maker on FAQs | `ContosoDentistryFAQs/FAQ.tsv` | ✅ file ready |
| Train LUIS on intents | `CognitiveModels/dentist.json` | ✅ file ready |
| Finish bot code (QnA + LUIS + Scheduler wiring) | `bots/dentaBot.js` | ✅ done |
| Custom welcome message | `bots/dentaBot.js` → `onMembersAdded` | ✅ done |
| Deploy bot code to Azure | Deployment Center → GitHub Actions | ⏳ user |
| Deploy static web app | Deployment Center → GitHub Actions | ⏳ user |
| Automate deployment through GitHub Actions | `.github/workflows/*.yml` | ✅ starter workflows |
| `portal_bot_test.png` | `screenshots/` | ⏳ user |
| `website_bot_test.png` | `screenshots/` | ⏳ user |

## Environment variables the bot needs

All keys used by the bot (`.env` **and** App Service Configuration):

| Variable | Example |
|---|---|
| `MicrosoftAppId` | *from Azure Bot → Configuration* |
| `MicrosoftAppPassword` | *from App Registration → client secret* |
| `MicrosoftAppType` | `MultiTenant` |
| `MicrosoftAppTenantId` | *(blank for multi-tenant)* |
| `QnAKnowledgebaseId` | *from QnA Maker publish page* |
| `QnAAuthKey` | *from QnA Maker publish page* |
| `QnAEndpointHostName` | `https://<name>.azurewebsites.net/qnamaker` |
| `LuisAppId` | *from LUIS MANAGE tab* |
| `LuisAPIKey` | *LUIS prediction primary key* |
| `LuisAPIHostName` | `centralindia.api.cognitive.microsoft.com` |
| `SchedulerEndpoint` | `https://<scheduler>.azurewebsites.net` |

## Test messages to use for screenshots

Send these three messages in Test in Web Chat AND on the deployed website:

1. `I don't have insurance. Can I still be seen?` → QnA answer
2. `What appointments are available?` → LUIS GetAvailability → Scheduler
3. `Book me for tomorrow at 3pm` → LUIS ScheduleAppointment → Scheduler
