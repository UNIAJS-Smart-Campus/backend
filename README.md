# Backend — UAJS Smart Campus

Microservicios Node.js + Express + MySQL para la plataforma UAJS Smart Campus.

## Estructura

```
backend/
├── gateway/                      # API Gateway (puerto 3000)
├── services/
│   ├── auth-service/             # Autenticación JWT (3001)
│   ├── users-service/            # Gestión de usuarios (3002)
│   ├── events-service/           # Eventos y actividades (3003)
│   ├── reservations-service/     # Reservas (3004)
│   ├── notifications-service/    # Notificaciones (3005)
│   ├── requests-service/         # Solicitudes (3006)
│   ├── resources-service/        # Recursos (3007)
│   ├── feedback-service/         # PQRS / retroalimentación (3008)
│   ├── academic-info-service/    # Información académica (3009)
│   ├── configuration-service/    # Configuración (3010)
│   └── search-service/           # Búsqueda con Elasticsearch (3011)
├── shared/                       # Utilidades y middlewares comunes
├── database/
│   ├── migrations/
│   └── seeds/
├── scripts/dev.js                # Arranca todos los servicios en modo dev
├── mock-server/                  # Servidor de datos de prueba
└── uajs_smart_campus.sql         # Dump inicial de la base de datos
```

> Las carpetas `pqrs-service`, `info-academica-service` y `configuracion-service` son versiones legacy que el gateway ya no usa; se mantienen solo como referencia histórica.

## Configuración

1. Copiar `.env.example` a `.env` en la **raíz del proyecto** (no dentro de `backend/`).
2. Con Docker (recomendado), desde la raíz:

   ```bash
   docker compose up -d --build
   ```

3. Sin Docker: importar `backend/uajs_smart_campus.sql` en MySQL, ejecutar `npm install` en cada servicio y lanzar `node backend/scripts/dev.js`.

## Documentación

- [Arquitectura general](../docs/ARQUITECTURA.md)
- [Docker en Linux: instalación y errores comunes](../docs/DOCKER-SETUP-LINUX.md)
- [Registro de cambios — Iteración 4](../docs/CAMBIOS-ITERACION4.md)
- [Documentación funcional](../docs/DOCUMENTACION.md)
