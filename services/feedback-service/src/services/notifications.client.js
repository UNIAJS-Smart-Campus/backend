const WEBHOOK_URL = process.env.NOTIFICATIONS_WEBHOOK_URL
    || 'http://notifications-service:3005/api/notifications/webhook';
const WEBHOOK_SECRET = process.env.NOTIFICATIONS_WEBHOOK_SECRET || '';

/**
 * Reporta un evento al servicio de notificaciones.
 * Es "fire and forget": nunca debe romper la operación principal.
 */
async function notificar(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(WEBHOOK_SECRET ? { 'x-webhook-secret': WEBHOOK_SECRET } : {})
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        if (!response.ok) {
            console.warn(`[notifications] Webhook respondió ${response.status}`);
        }
    } catch (error) {
        console.warn(`[notifications] No se pudo enviar el evento: ${error.message}`);
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { notificar };
