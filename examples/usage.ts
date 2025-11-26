/**
 * Exemples d'utilisation de pino-email-transport
 *
 * Ces exemples montrent différentes configurations pour différents cas d'usage.
 */

import pino from "pino";
import emailTransport from "../src/index";

// ============================================================================
// Exemple 1 : Configuration basique (comportement par défaut)
// ============================================================================
// Par défaut, flushThreshold est à 50 : les emails sont automatiquement
// envoyés dès que 50 logs sont accumulés. Pour un processus de longue durée,
// vous pouvez aussi configurer flushInterval pour un flush périodique.

async function example1_Basic() {
	const logger = pino({
		transport: {
			target: "pino-email-transport",
			level: "error", // Seulement les erreurs et au-dessus
			options: {
				smtpFrom: { name: "My App", address: "noreply@myapp.com" },
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: false,
				sendTo: "admin@myapp.com",
				// flushThreshold: 50 par défaut (automatique)
				// Pour désactiver : flushThreshold: 0
			},
		},
	});

	logger.error("An error occurred!");
	logger.fatal("Critical system failure!");

	// Les emails sont envoyés automatiquement à 50 logs, ou à la fermeture
	await logger.flush();
}

// ============================================================================
// Exemple 2 : Serveur web avec flush périodique
// ============================================================================
// Idéal pour un serveur web qui tourne 24/7

async function example2_WebServer() {
	const logger = pino({
		transport: {
			target: "pino-email-transport",
			level: "error",
			options: {
				smtpFrom: "webserver@myapp.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: false,
				sendTo: ["admin@myapp.com", "devops@myapp.com"],

				// Flush toutes les 5 minutes
				flushInterval: 300000, // 5 minutes = 300000 ms

				// ET flush si 20 erreurs accumulées
				flushThreshold: 20,
			},
		},
	});

	// Le serveur tourne...
	logger.error({ userId: "123", route: "/api/users" }, "API error");
	logger.error({ service: "database" }, "Connection timeout");

	// Les emails seront envoyés soit :
	// - Après 5 minutes
	// - OU dès que 20 erreurs sont accumulées
}

// ============================================================================
// Exemple 3 : Worker avec logs critiques
// ============================================================================
// Pour un worker qui traite des tâches importantes : flush rapide

async function example3_CriticalWorker() {
	const logger = pino({
		transport: {
			target: "pino-email-transport",
			level: "warn", // Warnings et au-dessus
			options: {
				smtpFrom: "worker@myapp.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: false,
				sendTo: "oncall@myapp.com",

				// Flush très fréquent pour les alertes critiques
				flushInterval: 30000, // 30 secondes
				flushThreshold: 5, // Ou dès 5 messages
			},
		},
	});

	logger.warn({ jobId: "job-123" }, "Job taking longer than expected");
	logger.error({ jobId: "job-456" }, "Job failed");
	logger.fatal({ jobId: "job-789" }, "Worker crashed");

	// Emails envoyés rapidement (30s max ou dès 5 logs)
}

// ============================================================================
// Exemple 4 : Batch processing avec seuil uniquement
// ============================================================================
// Pour un script batch : pas besoin de flush périodique

async function example4_BatchProcessing() {
	const logger = pino({
		transport: {
			target: "pino-email-transport",
			level: "error",
			options: {
				smtpFrom: "batch@myapp.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "pass",
				debug: false,
				logger: false,
				sendTo: "admin@myapp.com",

				// Pas de flushInterval (le script se termine rapidement)
				// Seulement un seuil pour éviter d'accumuler trop
				flushThreshold: 100,
			},
		},
	});

	// Traiter 10000 items
	for (let i = 0; i < 10000; i++) {
		try {
			// Process item...
		} catch (error) {
			logger.error({ itemId: i, error }, "Failed to process item");
		}
	}

	// À la fin, les erreurs restantes sont envoyées
	await logger.flush();
}

// ============================================================================
// Exemple 5 : Application avec multi-transports
// ============================================================================
// Combiner fichier local + emails pour les erreurs

async function example5_MultiTransport() {
	const logger = pino({
		transport: {
			targets: [
				// Tous les logs dans un fichier
				{
					target: "pino/file",
					level: "info",
					options: {
						destination: "./logs/app.log",
					},
				},
				// Seulement les erreurs par email
				{
					target: "pino-email-transport",
					level: "error",
					options: {
						smtpFrom: "app@myapp.com",
						smtpHost: "smtp.example.com",
						smtpPort: 587,
						smtpUser: "user",
						smtpPass: "pass",
						debug: false,
						logger: false,
						sendTo: "admin@myapp.com",
						flushInterval: 60000, // 1 minute
						flushThreshold: 10,
					},
				},
				// Console pour le développement
				{
					target: "pino-pretty",
					level: "debug",
					options: {
						colorize: true,
					},
				},
			],
		},
	});

	logger.info("Application started"); // → fichier + console
	logger.debug("Debug information"); // → console uniquement
	logger.error("Something went wrong"); // → fichier + email + console
}

// ============================================================================
// Exemple 6 : Configuration avec variables d'environnement
// ============================================================================

async function example6_EnvironmentConfig() {
	const isProduction = process.env.NODE_ENV === "production";

	const logger = pino({
		transport: {
			target: "pino-email-transport",
			level: isProduction ? "error" : "warn",
			options: {
				smtpFrom: process.env.SMTP_FROM || "noreply@myapp.com",
				smtpHost: process.env.SMTP_HOST || "smtp.example.com",
				smtpPort: Number.parseInt(process.env.SMTP_PORT || "587"),
				smtpUser: process.env.SMTP_USER || "",
				smtpPass: process.env.SMTP_PASS || "",
				debug: !isProduction,
				logger: !isProduction,
				sendTo: process.env.ALERT_EMAIL || "admin@myapp.com",

				// Configuration adaptée à l'environnement
				flushInterval: isProduction ? 300000 : 10000, // 5 min en prod, 10s en dev
				flushThreshold: isProduction ? 50 : 5, // Plus élevé en prod
			},
		},
	});

	return logger;
}

// ============================================================================
// Exemple 7 : Utilisation directe du transport (sans Pino)
// ============================================================================

async function example7_DirectTransportUsage() {
	const transport = await emailTransport({
		smtpFrom: "app@myapp.com",
		smtpHost: "smtp.example.com",
		smtpPort: 587,
		smtpUser: "user",
		smtpPass: "pass",
		debug: false,
		logger: false,
		sendTo: "admin@myapp.com",
		flushInterval: 60000,
		flushThreshold: 10,
	} as any);

	// Utiliser le transport directement
	const logger = pino(transport);

	logger.error("Direct transport usage");

	// Fermer proprement
	transport.end();
}

// ============================================================================
// Exemple 8 : Gestion des erreurs SMTP
// ============================================================================

async function example8_ErrorHandling() {
	const logger = pino({
		transport: {
			target: "pino-email-transport",
			level: "error",
			options: {
				smtpFrom: "app@myapp.com",
				smtpHost: "smtp.example.com",
				smtpPort: 587,
				smtpUser: "user",
				smtpPass: "wrongpassword", // ⚠️ Mauvais mot de passe
				debug: true, // Activer le debug pour voir les erreurs
				logger: true,
				sendTo: "admin@myapp.com",
				flushInterval: 5000,
			},
		},
	});

	logger.error("This error will try to be sent via email");

	// Les erreurs SMTP sont loggées dans la console avec console.error
	// mais n'arrêtent pas l'application grâce à Promise.allSettled

	await new Promise((resolve) => setTimeout(resolve, 6000));
}

// ============================================================================
// Recommandations par type d'application
// ============================================================================

/**
 * API REST / GraphQL Server
 * - flushInterval: 300000 (5 min)
 * - flushThreshold: 20-50
 * - level: "error"
 */

/**
 * Microservice
 * - flushInterval: 120000 (2 min)
 * - flushThreshold: 30
 * - level: "error"
 */

/**
 * Worker / Queue Processor
 * - flushInterval: 60000 (1 min)
 * - flushThreshold: 10
 * - level: "warn"
 */

/**
 * Batch / Cron Job
 * - flushInterval: désactivé (undefined)
 * - flushThreshold: 100
 * - level: "error"
 */

/**
 * Serveur temps réel (WebSocket, etc.)
 * - flushInterval: 30000 (30s)
 * - flushThreshold: 10
 * - level: "error"
 */

/**
 * Application CLI
 * - flushInterval: désactivé (undefined)
 * - flushThreshold: désactivé (undefined)
 * - level: "error"
 * Note: Penser à appeler logger.flush() avant de quitter
 */

// Export des exemples
export {
	example1_Basic,
	example2_WebServer,
	example3_CriticalWorker,
	example4_BatchProcessing,
	example5_MultiTransport,
	example6_EnvironmentConfig,
	example7_DirectTransportUsage,
	example8_ErrorHandling,
};
