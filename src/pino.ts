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

	return build(
		async (source) => {
			const pretty = prettyFactory({ colorize: false });
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
			}
		},
		{
			expectPinoConfig: true,
			async close() {
				await Promise.allSettled(pendingSendTasks);
			},
		},
	);
}
