# Migración manual: permisos por rol

Ejecutar este contenido en TiDB Cloud SQL Editor.

> Si el editor ya muestra `uajs_smart_campus` como base seleccionada, también puedes omitir la primera línea.

```sql
USE uajs_smart_campus;

CREATE TABLE IF NOT EXISTS rol_capacidades (
    id_capacidad BIGINT NOT NULL AUTO_INCREMENT,
    id_rol INT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    clave VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_capacidad),
    UNIQUE KEY uq_rol_capacidad (id_rol, tipo, clave),
    KEY idx_rol_capacidades_rol (id_rol),
    CONSTRAINT chk_rol_capacidades_tipo
        CHECK (tipo IN ('permiso', 'accion')),
    CONSTRAINT fk_rol_capacidades_rol
        FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS rol_programas (
    id_programa BIGINT NOT NULL AUTO_INCREMENT,
    id_rol INT NOT NULL,
    programa VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_programa),
    UNIQUE KEY uq_rol_programa (id_rol, programa),
    KEY idx_rol_programas_rol (id_rol),
    CONSTRAINT fk_rol_programas_rol
        FOREIGN KEY (id_rol) REFERENCES roles (id_rol)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO rol_capacidades (id_rol, tipo, clave) VALUES
(1,'permiso','dashboard'),(1,'permiso','usuarios'),
(1,'permiso','solicitudes'),(1,'permiso','reservas'),
(1,'permiso','recursos'),(1,'permiso','eventos'),
(1,'permiso','notificaciones'),(1,'permiso','pqrs'),
(1,'permiso','reportes'),(1,'permiso','perfil'),
(1,'permiso','configuracion'),(1,'permiso','info_academica'),
(1,'permiso','gestion_pqrs'),(1,'permiso','auditoria'),
(1,'accion','registrar_solicitudes'),(1,'accion','consultar_solicitudes'),
(1,'accion','gestionar_solicitudes'),(1,'accion','actualizar_estados'),
(1,'accion','realizar_reservas'),(1,'accion','gestionar_reservas'),
(1,'accion','solicitar_recursos'),(1,'accion','administrar_recursos'),
(1,'accion','publicar_eventos'),(1,'accion','consultar_estadisticas'),
(1,'accion','administrar_usuarios'),(1,'accion','administrar_roles'),
(1,'accion','gestionar_servicios'),(1,'accion','gestionar_configuracion'),
(1,'accion','supervisar'),(1,'accion','publicar_info_academica'),
(2,'permiso','dashboard'),(2,'permiso','solicitudes'),
(2,'permiso','reservas'),(2,'permiso','recursos'),
(2,'permiso','eventos'),(2,'permiso','notificaciones'),
(2,'permiso','pqrs'),(2,'permiso','perfil'),
(2,'permiso','info_academica'),(2,'permiso','configuracion'),
(2,'accion','registrar_solicitudes'),(2,'accion','consultar_solicitudes'),
(2,'accion','realizar_reservas'),(2,'accion','solicitar_recursos'),
(2,'accion','consultar_info_academica'),
(3,'permiso','dashboard'),(3,'permiso','solicitudes'),
(3,'permiso','reservas'),(3,'permiso','recursos'),
(3,'permiso','eventos'),(3,'permiso','notificaciones'),
(3,'permiso','pqrs'),(3,'permiso','perfil'),
(3,'permiso','info_academica'),(3,'permiso','configuracion'),
(3,'accion','consultar_solicitudes'),(3,'accion','realizar_reservas'),
(3,'accion','gestionar_reservas'),(3,'accion','solicitar_recursos'),
(3,'accion','publicar_info_academica'),
(3,'accion','consultar_info_academica'),
(4,'permiso','dashboard'),(4,'permiso','solicitudes'),
(4,'permiso','reservas'),(4,'permiso','recursos'),
(4,'permiso','eventos'),(4,'permiso','notificaciones'),
(4,'permiso','pqrs'),(4,'permiso','perfil'),
(4,'permiso','reportes'),(4,'permiso','configuracion'),
(4,'permiso','info_academica'),(4,'permiso','gestion_pqrs'),
(4,'accion','consultar_solicitudes'),(4,'accion','gestionar_solicitudes'),
(4,'accion','actualizar_estados'),(4,'accion','gestionar_reservas'),
(4,'accion','administrar_recursos'),(4,'accion','atender_requerimientos'),
(4,'accion','generar_reportes'),
(5,'permiso','dashboard'),(5,'permiso','usuarios'),
(5,'permiso','solicitudes'),(5,'permiso','reservas'),
(5,'permiso','recursos'),(5,'permiso','eventos'),
(5,'permiso','notificaciones'),(5,'permiso','pqrs'),
(5,'permiso','reportes'),(5,'permiso','perfil'),
(5,'permiso','info_academica'),(5,'permiso','configuracion'),
(5,'accion','consultar_solicitudes'),(5,'accion','gestionar_solicitudes'),
(5,'accion','actualizar_estados'),(5,'accion','gestionar_reservas'),
(5,'accion','administrar_recursos'),(5,'accion','publicar_eventos'),
(5,'accion','consultar_estadisticas'),(5,'accion','publicar_info_academica'),
(6,'permiso','dashboard'),(6,'permiso','eventos'),
(6,'permiso','notificaciones'),(6,'permiso','perfil'),
(6,'permiso','info_academica'),(6,'accion','consultar_info_academica'),
(6,'accion','consultar_eventos');

INSERT IGNORE INTO rol_programas (id_rol, programa) VALUES
(5, 'Ingeniería de Sistemas'),
(5, 'Matemáticas'),
(6, 'Egresados'),
(6, 'Bienestar Universitario');

SHOW TABLES LIKE 'rol_%';
SELECT COUNT(*) AS capacidades FROM rol_capacidades;
SELECT COUNT(*) AS programas FROM rol_programas;
```

## Resultado esperado

Las consultas finales deben mostrar las tablas `rol_capacidades` y `rol_programas`, además del total de registros insertados.
