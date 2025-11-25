import type Stream from "node:stream";
import nodemailer from "nodemailer";
import type { SendMailOptions, SentMessageInfo, Transporter } from "nodemailer";
import type SESTransport from "nodemailer/lib/ses-transport";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import build from "pino-abstract-transport";
import { prettyFactory } from "pino-pretty";

export interface PinoEmailTransportOptions {
	smtpFrom: SendMailOptions["from"];
	smtpHost: string;
	smtpPort: number;
	smtpUser: string;
	smtpPass: string;
	debug: boolean;
	logger: boolean;
	sendTo: SendMailOptions["to"];
	emailTransporter: Transporter<
		SESTransport.SentMessageInfo,
		SESTransport.Options
	>;
	toText: (source: Stream.Transform & build.OnUnknown, obj: unknown) => string;
	toSubject: (
		source: Stream.Transform & build.OnUnknown,
		obj: unknown,
	) => string;
	transportOptions: SMTPTransport | SMTPTransport.Options | string;
	/**
	 * Flush interval in milliseconds. If set, pending email tasks will be flushed periodically.
	 * Set to 0 or undefined to disable periodic flushing.
	 * @default undefined (disabled)
	 */
	flushInterval?: number;
	/**
	 * Maximum number of pending email tasks before triggering an automatic flush.
	 * Set to 0 or undefined to disable threshold-based flushing.
	 * @default undefined (disabled)
	 */
	flushThreshold?: number;
}

export default async function emailTransport(
	options: PinoEmailTransportOptions,
) {
	const {
		smtpHost,
		smtpPort,
		smtpUser,
		smtpPass,
		debug,
		logger,
		smtpFrom,
		sendTo,
		flushInterval,
		flushThreshold,
	} = options;

	const emailTransporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		auth: {
			user: smtpUser,
			pass: smtpPass,
		},
		debug,
		logger,
	});
	// const emailTransporter = nodemailer.createTransport(transportOptions);

	const pendingSendTasks: Array<Promise<SentMessageInfo>> = [];
	let flushIntervalId: NodeJS.Timeout | null = null;
	let isClosing = false;
	let isFlushing = false;

	// Function to flush pending tasks
	// Note: splice(0) takes a snapshot of current tasks. New tasks arriving during
	// the flush will be included in the next flush cycle, which is the intended behavior
	// to avoid waiting indefinitely and allow progressive flushing.
	const flush = async (force = false) => {
		if (pendingSendTasks.length === 0) {
			return;
		}

		// Prevent concurrent flushes (except when forced during close)
		if (!force && isFlushing) {
			return;
		}

		isFlushing = true;
		try {
			// Take a snapshot of current tasks and flush them
			// New tasks added during this flush will be handled in the next flush
			const tasksToFlush = pendingSendTasks.splice(0);
			await Promise.allSettled(tasksToFlush);
		} finally {
			isFlushing = false;
		}
	};

	return build(
		async (source) => {
			const pretty = prettyFactory({ colorize: false });

			// Set up periodic flush if interval is configured
			// Note: This is done before the loop starts to begin flushing immediately
			if (flushInterval && flushInterval > 0) {
				flushIntervalId = setInterval(() => {
					if (!isClosing) {
						flush().catch((err) => {
							// Handle flush errors silently to avoid breaking the transport
							// In production, you might want to log this to a different destination
							console.error("Error flushing email tasks:", err);
						});
					}
				}, flushInterval);
			}

			for await (const obj of source) {
				// @ts-ignore: Unreachable code error
				const levelLabel = source.levels.labels[obj.level];
				const task = emailTransporter.sendMail({
					from: smtpFrom,
					to: sendTo,
					subject: `[${levelLabel.toUpperCase()}] log`,
					text: pretty(obj),
				});

				pendingSendTasks.push(task);

				// Flush if threshold is reached
				if (
					flushThreshold &&
					flushThreshold > 0 &&
					pendingSendTasks.length >= flushThreshold
				) {
					await flush();
				}
			}
		},
		{
			expectPinoConfig: true,
			async close() {
				isClosing = true;

				// Clear the interval if it was set
				if (flushIntervalId) {
					clearInterval(flushIntervalId);
					flushIntervalId = null;
				}

				// Flush any remaining tasks (force flush even if one is in progress)
				await flush(true);
			},
		},
	);
}
