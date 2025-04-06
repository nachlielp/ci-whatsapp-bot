import * as Sentry from "@sentry/node";

class Sentry {
  constructor() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
    });
  }
}

export const sentry = new Sentry();
