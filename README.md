# Backend — UAJS Smart Campus

Microservicios Node.js + Express + MySQL para la plataforma UAJS Smart Campus.

## Estructura

```
backend/
├── gateway/                    # API Gateway (puerto 3000)
├── services/
│   ├── auth-service/           # Autenticación JWT (puerto 3001)
│   ├── users-service/          # Gestión de usuarios (puerto 3002)
│   ├── events-service/         # Eventos y actividades (puerto 3003)
│   ├── reservations-service/   # Reservas (puerto 3004)
│   ├── notifications-service/  # Notificaciones (puerto 3005)
│   ├── requests-service/       # Solicitudes (puerto 3006)
│   └── resources-service/      # Recursos (puerto 3007)
├── database/
│   ├── migrations/
│   └── seeds/
└── uajs_smart_campus.sql       # Schema inicial
```

## Configuración

1. Crear `backend/.env` (ver `docs/IMPLEMENTACION_BACKEND.md` para las variables requeridas).
2. Importar `database/uajs_smart_campus.sql` en MySQL.
3. Instalar dependencias en cada servicio y en el gateway.
4. Ejecutar `node src/server.js` en cada servicio, y luego en el gateway.

## Documentación

Ver `docs/IMPLEMENTACION_BACKEND.md` para la guía paso a paso.
