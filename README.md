## pino-email-transport

Pino transport to send logs via email (SMTP) using `nodemailer`.

### Installation

```bash
npm install pino-email-transport
```

### Usage

```ts
import pino from "pino";
import emailTransport from "pino-email-transport";

const transport = await emailTransport({
  smtpFrom: { name: "My App", address: "no-reply@myapp.com" },
  smtpHost: "smtp.example.com",
  smtpPort: 587,
  smtpUser: "user",
  smtpPass: "pass",
  debug: false,
  logger: false,
  sendTo: "alerts@myapp.com",
});

const logger = pino({
  transport: {
    targets: [
      {
        target: "pino/file",
        level: "info",
      },
      {
        target: "pino-email-transport",
        level: "info",
        options: {
          smtpFrom: { name: "My App", address: "no-reply@myapp.com" },
          smtpHost: "smtp.example.com",
          smtpPort: 587,
          smtpUser: "user",
          smtpPass: "pass",
          debug: false,
          logger: false,
          sendTo: "alerts@myapp.com",
        },
      },
    ],
  },
});
```

### Options

- `smtpFrom`: string or `{ name?: string; address: string }`
- `smtpHost`: string
- `smtpPort`: number
- `smtpUser`: string
- `smtpPass`: string
- `debug`: boolean
- `logger`: boolean
- `sendTo`: string | string[]

### Notes

- This transport formats content with `pino-pretty` (no colors) and puts the level in the email subject.
- It waits for all send operations to complete on close (Promise.allSettled).
