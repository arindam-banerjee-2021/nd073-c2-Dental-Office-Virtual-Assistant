# Contoso Dentistry — Virtual Dental Office Assistant

> Udacity Azure AI Nanodegree — Course 2 Project
> Author: **Arindam Banerjee**

A conversational virtual assistant for a dental practice. The assistant lives on
the Contoso Dentistry website and can answer FAQ-style questions (hours,
insurance, services), check appointment availability, and book new appointments.

It is built on top of five Azure services stitched together through a
Node.js Bot Framework v4 application.

---

## Architecture

```
                +---------------------+
                |  Dentist Website    |
                | (Static Web App)    |
                |  index.html + Web   |
                |  Chat control       |
                +----------+----------+
                           | Direct Line
                           v
                +---------------------+
                |  Azure Bot Service  |
                |  + App Service      |
                |  ContosoDentistry   |
                |  ChatBot (Node.js)  |
                +-+-------+---------+-+
                  |       |         |
        QnA answer|       |LUIS     |Scheduler REST
                  v       v         v
        +-----------+ +---------+ +----------------------+
        | QnA Maker | |  LUIS   | | ContosoDentistry     |
        | (FAQs)    | | (intent | | Scheduler (Web App)  |
        |           | | + date) | | Express REST API     |
        +-----------+ +---------+ +----------------------+
```

**Message flow for a single user turn:**

1. The user types a message in the Web Chat control on the website.
2. Direct Line delivers it to the bot's `/api/messages` endpoint (App Service).
3. The bot's `onMessage` handler asks:
   - **LUIS** for the top intent + any `datetimeV2` entity, and
   - **QnA Maker** for a possible knowledge-base answer.
4. If LUIS confidently classified the message as
   - `GetAvailability` → bot calls `GET /availability` on the Scheduler API.
   - `ScheduleAppointment` (with a datetime) → bot calls `POST /schedule?time=…`.
5. Otherwise the QnA Maker answer is returned (or a fallback message if none).

---

## Repository layout

```
nd073-c2-Dental-Office-Virtual-Assistant/
├── ContosoDentistryChatBot/     Node.js Bot Framework app (the "hub")
│   ├── bots/dentaBot.js         Main ActivityHandler
│   ├── qnamaker.js              QnA Maker connector
│   ├── luis.js                  LUIS connector (intent + datetime)
│   ├── dentistscheduler.js      Client for the Scheduler REST API
│   ├── index.js                 Restify server + CloudAdapter wiring
│   ├── .env / .env.example      Configuration
│   └── package.json
│
├── ContosoDentistryScheduler/   Express REST API (third-party stand-in)
│   ├── index.js                 GET /availability, POST /schedule
│   └── package.json
│
├── ContosoDentistryWebsite/     Static marketing site + Web Chat
│   ├── index.html
│   ├── css/styles.css
│   ├── js/main.js
│   └── staticwebapp.config.json
│
├── ContosoDentistryFAQs/
│   └── FAQ.tsv                  QnA Maker source
│
├── CognitiveModels/
│   └── dentist.json             Exported LUIS model (importable JSON)
│
├── screenshots/                 portal_bot_test.* / website_bot_test.*
│
└── .github/workflows/           GitHub Actions CI/CD (bot + scheduler + website)
```

See `SUBMISSION.md` for the full click-by-click Azure setup guide.

---

## Stand-out features

- **Rich FAQ knowledge base** (28+ Q/A pairs) covering hours, location,
  services, insurance, staff bios, emergencies, sedation, accessibility,
  languages spoken, first-visit prep and cost.
- **Navigation commands** — `reset`, `restart`, `start over`, `cancel`,
  `stop` all clear conversation state.
- **Polished responsive website** with hero, services grid, staff bios,
  patient testimonials, contact info, social media, hours and Web Chat
  embed. Mobile-friendly, accessible, and clearly branded.
- **Graceful degradation** — every connector logs warnings and returns a
  safe fallback if its config is missing, so the bot never crashes on
  first run.

## License

MIT
