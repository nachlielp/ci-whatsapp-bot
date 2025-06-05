# CI WhatsApp Bot

A Next.js-based WhatsApp bot that integrates with Twilio for messaging capabilities and Supabase for the db. This is an extension of the [CI Calendar](https://github.com/nachlielp/ci-calendar) project.

## Features

- WhatsApp messaging bot via Twilio
- Data storage with Supabase
- TypeScript for type safety
- Error tracking with Sentry

## Prerequisites

- Node.js
- npm or yarn
- Twilio account with WhatsApp capabilities
- Supabase project
- Sentry account (for error tracking)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
SUPABASE_SERVICE_ACCOUNT_KEY=supabase_service_account_key
SUPABASE_URL=supabase_url

TWILIO_ACCOUNT_SID=twilio_account_sid
TWILIO_AUTH_TOKEN=twilio_auth_token
TWILIO_FROM_NUMBER=twilio_from_number

TWILIO_TEMPLATE_FIRST_MESSAGE=twilio_template_first_message
TWILIO_TEMPLATE_SELECT_EVENT_TYPES=twilio_template_select_event_types
TWILIO_TEMPLATE_SELECT_REGION=twilio_template_select_region
TWILIO_TEMPLATE_CONFIRM_REMOVE=twilio_template_confirm_remove
TWILIO_TEMPLATE_WEEKEND_SCHEDULE=twilio_template_weekend_schedule
TWILIO_TEMPLATE_WEEKLY_SCHEDULE=twilio_template_weekly_schedule
TWILIO_TEMPLATE_SETUP_WEEKLY_REMINDER=twilio_template_setup_weekly_reminder
LOCAL_PHON_EXTENSION=local_phon_extension

ADMIN_PHONE=admin_phone

CI_EVENTS_DOMAIN=ci_

SENTRY_AUTH_TOKEN=sentry_auth_token
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ci-whatsapp-bot.git
cd ci-whatsapp-bot
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Available Scripts

- `npm run dev` - Starts the development server with Turbopack
- `npm run build` - Builds the application for production
- `npm run start` - Starts the production server
- `npm run lint` - Runs ESLint for code linting

## Deployment

The application is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration for deployment.
