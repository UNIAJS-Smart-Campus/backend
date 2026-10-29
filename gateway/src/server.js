const app = require('./app');

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
	console.log(`Gateway corriendo en http://localhost:${PORT}`);
});
