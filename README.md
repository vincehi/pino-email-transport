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
  // Optional: Flush every 30 seconds
  flushInterval: 30000,
  // Optional: Flush when 10 emails are pending
  flushThreshold: 10,
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
          // Optional: Flush every 30 seconds
          flushInterval: 30000,
          // Optional: Flush when 10 emails are pending
          flushThreshold: 10,
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
- `flushInterval` (optional): number - Flush interval in milliseconds. If set, pending email tasks will be flushed periodically. Set to `0` or `undefined` to disable periodic flushing. Default: `undefined` (disabled)
- `flushThreshold` (optional): number - Maximum number of pending email tasks before triggering an automatic flush. Set to `0` to disable threshold-based flushing. Default: `50`

### Notes

- This transport formats content with `pino-pretty` (no colors) and puts the level in the email subject.
- It waits for all send operations to complete on close (Promise.allSettled).
- **Memory leak prevention**: By default, `flushThreshold` is set to `50` to automatically flush when 50 email tasks are pending. For long-running processes, you can also configure `flushInterval` for periodic flushing. Set `flushThreshold` to `0` to disable automatic flushing (not recommended for long-running processes).
