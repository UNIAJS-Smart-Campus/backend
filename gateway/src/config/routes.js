// Objetivos del proxy: en docker-compose cada servicio es un
// contenedor con su hostname interno; en modo ALL_IN_ONE (Render)
// todos corren en el mismo proceso y se llega por localhost.
// Cada URL también se puede forzar con su variable de entorno
// (p. ej. AUTH_SERVICE_URL) sin tocar este archivo.
const LOCAL = process.env.ALL_IN_ONE === '1';

function objetivo(variable, puerto, hostDocker) {
	return (
		process.env[variable] ||
		(LOCAL ? `http://localhost:${puerto}` : `http://${hostDocker}:${puerto}`)
	);
}

module.exports = {
	auth: objetivo('AUTH_SERVICE_URL', 3001, 'auth-service'),
	users: objetivo('USERS_SERVICE_URL', 3002, 'users-service'),
	events: objetivo('EVENTS_SERVICE_URL', 3003, 'events-service'),
	reservations: objetivo('RESERVATIONS_SERVICE_URL', 3004, 'reservations-service'),
	notifications: objetivo('NOTIFICATIONS_SERVICE_URL', 3005, 'notifications-service'),
	requests: objetivo('REQUESTS_SERVICE_URL', 3006, 'requests-service'),
	resources: objetivo('RESOURCES_SERVICE_URL', 3007, 'resources-service'),
	feedback: objetivo('FEEDBACK_SERVICE_URL', 3008, 'feedback-service'),
	'academic-info': objetivo('ACADEMIC_INFO_SERVICE_URL', 3009, 'academic-info-service'),
	configuration: objetivo('CONFIGURATION_SERVICE_URL', 3010, 'configuration-service'),
	search: objetivo('SEARCH_SERVICE_URL', 3011, 'search-service')
};
