import { beforeEach, describe, expect, it, vi } from "vitest";
import emailTransport from "../src/pino";

// Mock nodemailer - must be in vi.hoisted() to be accessible in vi.mock()
const { sendMailMock, createTransportMock } = vi.hoisted(() => {
	const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test-id" });

	const createTransportMock = vi.fn(() => ({
		sendMail: sendMailMock,
	}));

	return { sendMailMock, createTransportMock };
});

vi.mock("nodemailer", () => ({
	default: {
		createTransport: createTransportMock,
	},
}));

describe("pino-email-transport - Integration tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sendMailMock.mockClear();
		createTransportMock.mockClear();
	});

	describe("Basic configuration", () => {
		it("should create a transport with flushThreshold and verify SMTP config", async () => {
			const transport = await emailTransport({
				smtpFrom: "app@example.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: false,
				sendTo: "admin@example.com",
				flushThreshold: 3,
			} as any);

			expect(transport).toBeDefined();
			expect(transport).toHaveProperty("write");
			expect(createTransportMock).toHaveBeenCalledWith({
				host: "smtp.example.com",
				port: 587,
				auth: {
					user: "user",
					pass: "pass",
				},
				debug: false,
				logger: false,
			});
		});

		it("should create a transport without flush options", async () => {
			const transport = await emailTransport({
				smtpFrom: "app@example.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: false,
				sendTo: "admin@example.com",
			} as any);

			expect(transport).toBeDefined();
			expect(transport).toHaveProperty("write");
		});
	});

	describe("Complete SMTP configuration", () => {
		it("should create the transporter with all options including multiple recipients", async () => {
			const transport = await emailTransport({
				smtpFrom: { name: "Test App", address: "app@example.com" },
				smtpHost: "smtp.example.com",
				smtpPort: 465,
				smtpUser: "testuser",
				smtpPass: "testpass",
				debug: true,
				logger: true,
				sendTo: ["admin1@example.com", "admin2@example.com"],
				flushThreshold: 1,
			} as any);

			expect(transport).toBeDefined();
			expect(transport).toHaveProperty("write");
			expect(createTransportMock).toHaveBeenCalledWith({
				host: "smtp.example.com",
				port: 465,
				auth: {
					user: "testuser",
					pass: "testpass",
				},
				debug: true,
				logger: true,
			});
		});
	});

	describe("Debug and logger modes", () => {
		it("should create a transport with debug enabled", async () => {
			const transport = await emailTransport({
				smtpFrom: "app@example.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: true,
				logger: false,
				sendTo: "admin@example.com",
			} as any);

			expect(transport).toBeDefined();
			expect(createTransportMock).toHaveBeenCalledWith(
				expect.objectContaining({ debug: true }),
			);
		});

		it("should create a transport with logger enabled", async () => {
			const transport = await emailTransport({
				smtpFrom: "app@example.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: true,
				sendTo: "admin@example.com",
			} as any);

			expect(transport).toBeDefined();
			expect(createTransportMock).toHaveBeenCalledWith(
				expect.objectContaining({ logger: true }),
			);
		});
	});
});
