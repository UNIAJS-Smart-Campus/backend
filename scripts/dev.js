const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'gateway', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'gateway') },
    { name: 'auth-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'auth-service') },
    { name: 'users-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'users-service') },
    { name: 'events-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'events-service') },
    { name: 'reservations-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'reservations-service') },
    { name: 'notifications-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'notifications-service') },
    { name: 'requests-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'requests-service') },
    { name: 'resources-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'resources-service') },
    { name: 'feedback-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'feedback-service') },
    { name: 'academic-info-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'academic-info-service') },
    { name: 'configuration-service', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, '..', 'services', 'configuration-service') }
];

services.forEach(service => {
    const child = spawn(service.command, service.args, { cwd: service.cwd, shell: true, stdio: 'inherit' });
    child.on('error', (err) => console.error(`Error en ${service.name}:`, err));
});
