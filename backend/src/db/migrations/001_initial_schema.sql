-- 001_initial_schema.sql
-- Description: Create all initial tables for FinanzasApp
-- Date: 2026-03-12

------------------------------------------------------------
-- Entidad Financiera (Aggregate Root)
------------------------------------------------------------
CREATE TABLE entidad_financiera (
    id                TEXT PRIMARY KEY,
    nombre            TEXT NOT NULL UNIQUE,
    tipo              TEXT NOT NULL CHECK (tipo IN ('BANCO', 'FINTECH', 'FINANCIERA')),
    clave_descifrado  TEXT NOT NULL DEFAULT '',
    patron_clave      TEXT NOT NULL DEFAULT 'DNI',
    creado_en         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    actualizado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

------------------------------------------------------------
-- Cuenta de Depósito
------------------------------------------------------------
CREATE TABLE cuenta_deposito (
    id                    TEXT PRIMARY KEY,
    entidad_financiera_id TEXT NOT NULL REFERENCES entidad_financiera(id) ON DELETE RESTRICT,
    tipo                  TEXT NOT NULL CHECK (tipo IN ('AHORRO', 'PLAZO_FIJO', 'CTS', 'CORRIENTE')),
    moneda                TEXT NOT NULL CHECK (moneda IN ('PEN', 'USD')),
    proposito             TEXT,
    saldo                 INTEGER NOT NULL DEFAULT 0,
    tasa_interes          INTEGER,
    saldo_actualizado_en  TEXT,
    creado_en             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    actualizado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_cuenta_deposito_entidad ON cuenta_deposito(entidad_financiera_id);

------------------------------------------------------------
-- Producto de Crédito (Tarjeta)
------------------------------------------------------------
CREATE TABLE producto_credito (
    id                        TEXT PRIMARY KEY,
    entidad_financiera_id     TEXT NOT NULL REFERENCES entidad_financiera(id) ON DELETE RESTRICT,
    tipo                      TEXT NOT NULL CHECK (tipo IN ('VISA', 'MASTERCARD', 'AMEX', 'DINERS')),
    categoria_tarjeta         TEXT NOT NULL CHECK (categoria_tarjeta IN (
                                'CLASICA', 'GOLD', 'PLATINUM', 'SIGNATURE', 'INFINITE'
                              )),
    linea_credito             INTEGER NOT NULL,
    moneda                    TEXT NOT NULL CHECK (moneda IN ('PEN', 'USD')),
    fecha_corte               INTEGER NOT NULL CHECK (fecha_corte BETWEEN 1 AND 31),
    fecha_pago                INTEGER NOT NULL CHECK (fecha_pago BETWEEN 1 AND 31),
    tasa_interes              INTEGER NOT NULL,
    cuota_mantenimiento       INTEGER,
    frecuencia_mantenimiento  TEXT CHECK (frecuencia_mantenimiento IN ('MENSUAL', 'ANUAL')),
    fecha_apertura            TEXT NOT NULL,
    fecha_renovacion          TEXT,
    periodo_contrato_meses    INTEGER,
    programa_beneficios       TEXT,
    tipo_beneficio            TEXT NOT NULL CHECK (tipo_beneficio IN (
                                'CASHBACK', 'PUNTOS', 'MILLAS', 'NINGUNO'
                              )),
    tasa_beneficio            TEXT,
    activo                    INTEGER NOT NULL DEFAULT 1,
    creado_en                 TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    actualizado_en            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_producto_credito_entidad ON producto_credito(entidad_financiera_id);
CREATE INDEX idx_producto_credito_activo ON producto_credito(activo) WHERE activo = 1;

------------------------------------------------------------
-- Categoría (Aggregate Root)
------------------------------------------------------------
CREATE TABLE categoria (
    id                 TEXT PRIMARY KEY,
    nombre             TEXT NOT NULL,
    descripcion        TEXT,
    origen             TEXT NOT NULL CHECK (origen IN ('LLM_SUGERIDA', 'USUARIO_CREADA')),
    es_deducible_sunat INTEGER NOT NULL DEFAULT 0,
    categoria_sunat    TEXT,
    activa             INTEGER NOT NULL DEFAULT 1,
    mergeada_en_id     TEXT REFERENCES categoria(id),
    creado_en          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX idx_categoria_nombre_unico
    ON categoria(nombre COLLATE NOCASE)
    WHERE activa = 1 AND mergeada_en_id IS NULL;

CREATE INDEX idx_categoria_deducible ON categoria(es_deducible_sunat) WHERE es_deducible_sunat = 1;

------------------------------------------------------------
-- Lote (Batch)
------------------------------------------------------------
CREATE TABLE lote (
    id                    TEXT PRIMARY KEY,
    canal                 TEXT NOT NULL CHECK (canal IN ('DRIVE', 'TELEGRAM')),
    cantidad_documentos   INTEGER NOT NULL DEFAULT 0,
    estado                TEXT NOT NULL DEFAULT 'EN_PROCESO' CHECK (estado IN (
                            'EN_PROCESO', 'COMPLETADO', 'COMPLETADO_CON_ERRORES'
                          )),
    creado_en             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    completado_en         TEXT
);

------------------------------------------------------------
-- Documento Fuente (Aggregate Root)
------------------------------------------------------------
CREATE TABLE documento_fuente (
    id                    TEXT PRIMARY KEY,
    hash                  TEXT NOT NULL UNIQUE,
    canal                 TEXT NOT NULL CHECK (canal IN ('TELEGRAM', 'EMAIL', 'DRIVE')),
    tipo                  TEXT NOT NULL CHECK (tipo IN (
                            'ESTADO_CUENTA', 'VOUCHER', 'FACTURA',
                            'NOTIFICACION_CONSUMO', 'OTRO'
                          )),
    nombre_archivo        TEXT,
    formato               TEXT NOT NULL CHECK (formato IN ('PDF', 'IMAGEN', 'EMAIL_HTML')),
    cifrado               INTEGER NOT NULL DEFAULT 0,
    entidad_financiera_id TEXT REFERENCES entidad_financiera(id),
    producto_credito_id   TEXT REFERENCES producto_credito(id),
    estado                TEXT NOT NULL DEFAULT 'RECIBIDO' CHECK (estado IN (
                            'RECIBIDO', 'PROCESANDO', 'NORMALIZADO', 'ERROR'
                          )),
    error_detalle         TEXT,
    r2_key                TEXT,
    drive_file_id         TEXT,
    storage_tier          TEXT NOT NULL DEFAULT 'HOT' CHECK (storage_tier IN ('HOT', 'ARCHIVE')),
    recibido_en           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    procesado_en          TEXT,
    lote_id               TEXT REFERENCES lote(id)
);

CREATE INDEX idx_documento_estado ON documento_fuente(estado);
CREATE INDEX idx_documento_entidad ON documento_fuente(entidad_financiera_id);
CREATE INDEX idx_documento_producto ON documento_fuente(producto_credito_id);
CREATE INDEX idx_documento_lote ON documento_fuente(lote_id) WHERE lote_id IS NOT NULL;
CREATE INDEX idx_documento_storage ON documento_fuente(storage_tier, recibido_en);
CREATE INDEX idx_documento_recibido ON documento_fuente(recibido_en);

------------------------------------------------------------
-- Transacción
------------------------------------------------------------
CREATE TABLE transaccion (
    id                  TEXT PRIMARY KEY,
    documento_fuente_id TEXT NOT NULL REFERENCES documento_fuente(id) ON DELETE RESTRICT,
    cuenta_deposito_id  TEXT REFERENCES cuenta_deposito(id),
    producto_credito_id TEXT REFERENCES producto_credito(id),
    fecha               TEXT NOT NULL,
    monto               INTEGER NOT NULL CHECK (monto != 0),
    moneda              TEXT NOT NULL CHECK (moneda IN ('PEN', 'USD')),
    comercio            TEXT NOT NULL,
    comercio_ruc        TEXT,
    categoria_id        TEXT NOT NULL REFERENCES categoria(id),
    origen_categoria    TEXT NOT NULL CHECK (origen_categoria IN (
                          'LLM_SUGERIDA', 'USUARIO_CORREGIDA', 'REGLA'
                        )),
    tipo_pago           TEXT NOT NULL CHECK (tipo_pago IN (
                          'TARJETA', 'EFECTIVO', 'TRANSFERENCIA', 'YAPE_PLIN'
                        )),
    cuotas              INTEGER DEFAULT 1,
    es_deducible_ir     INTEGER NOT NULL DEFAULT 0,
    raw_data            TEXT,
    creado_en           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_transaccion_documento ON transaccion(documento_fuente_id);
CREATE INDEX idx_transaccion_fecha ON transaccion(fecha);
CREATE INDEX idx_transaccion_categoria ON transaccion(categoria_id);
CREATE INDEX idx_transaccion_cuenta ON transaccion(cuenta_deposito_id) WHERE cuenta_deposito_id IS NOT NULL;
CREATE INDEX idx_transaccion_producto ON transaccion(producto_credito_id) WHERE producto_credito_id IS NOT NULL;
CREATE INDEX idx_transaccion_deducible ON transaccion(es_deducible_ir) WHERE es_deducible_ir = 1;
CREATE INDEX idx_transaccion_fecha_categoria ON transaccion(fecha, categoria_id);
CREATE INDEX idx_transaccion_comercio ON transaccion(comercio);

------------------------------------------------------------
-- Resumen Estado de Cuenta
------------------------------------------------------------
CREATE TABLE resumen_estado_cuenta (
    id                    TEXT PRIMARY KEY,
    documento_fuente_id   TEXT NOT NULL REFERENCES documento_fuente(id) ON DELETE RESTRICT,
    producto_credito_id   TEXT NOT NULL REFERENCES producto_credito(id),
    periodo_inicio        TEXT NOT NULL,
    periodo_fin           TEXT NOT NULL,
    fecha_pago            TEXT NOT NULL,
    deuda_total           INTEGER NOT NULL,
    pago_minimo           INTEGER NOT NULL,
    linea_disponible      INTEGER,
    moneda                TEXT NOT NULL CHECK (moneda IN ('PEN', 'USD')),
    cantidad_transacciones INTEGER NOT NULL DEFAULT 0,
    creado_en             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(producto_credito_id, periodo_inicio, periodo_fin)
);

CREATE INDEX idx_resumen_producto ON resumen_estado_cuenta(producto_credito_id);
CREATE INDEX idx_resumen_periodo ON resumen_estado_cuenta(periodo_fin);

------------------------------------------------------------
-- Conciliación (Aggregate Root)
------------------------------------------------------------
CREATE TABLE conciliacion (
    id                       TEXT PRIMARY KEY,
    tipo                     TEXT NOT NULL CHECK (tipo IN ('BANCARIA', 'TRIBUTARIA')),
    periodo                  TEXT NOT NULL,
    estado                   TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN (
                               'PENDIENTE', 'EN_PROCESO', 'COMPLETADA'
                             )),
    total_registros_fuente_a INTEGER NOT NULL DEFAULT 0,
    total_registros_fuente_b INTEGER NOT NULL DEFAULT 0,
    total_matches            INTEGER NOT NULL DEFAULT 0,
    total_discrepancias      INTEGER NOT NULL DEFAULT 0,
    ejecutada_en             TEXT,
    creado_en                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_conciliacion_tipo_periodo ON conciliacion(tipo, periodo);

------------------------------------------------------------
-- Match
------------------------------------------------------------
CREATE TABLE match_conciliacion (
    id                    TEXT PRIMARY KEY,
    conciliacion_id       TEXT NOT NULL REFERENCES conciliacion(id) ON DELETE RESTRICT,
    registro_fuente_a_id  TEXT NOT NULL,
    registro_fuente_a_tipo TEXT NOT NULL,
    registro_fuente_b_id  TEXT NOT NULL,
    registro_fuente_b_tipo TEXT NOT NULL,
    confianza             INTEGER NOT NULL CHECK (confianza BETWEEN 0 AND 100),
    confirmado            INTEGER NOT NULL DEFAULT 0,
    creado_en             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_match_conciliacion ON match_conciliacion(conciliacion_id);
CREATE UNIQUE INDEX idx_match_fuente_a_unico
    ON match_conciliacion(conciliacion_id, registro_fuente_a_id);
CREATE UNIQUE INDEX idx_match_fuente_b_unico
    ON match_conciliacion(conciliacion_id, registro_fuente_b_id);

------------------------------------------------------------
-- Discrepancia
------------------------------------------------------------
CREATE TABLE discrepancia (
    id                TEXT PRIMARY KEY,
    conciliacion_id   TEXT NOT NULL REFERENCES conciliacion(id) ON DELETE RESTRICT,
    registro_id       TEXT NOT NULL,
    registro_tipo     TEXT NOT NULL,
    fuente            TEXT NOT NULL CHECK (fuente IN ('FUENTE_A', 'FUENTE_B')),
    tipo              TEXT NOT NULL CHECK (tipo IN (
                        'SIN_MATCH', 'MONTO_DIFERENTE', 'FECHA_DIFERENTE'
                      )),
    estado            TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN (
                        'PENDIENTE', 'RESUELTA', 'IGNORADA'
                      )),
    resolucion        TEXT,
    creado_en         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    resuelta_en       TEXT
);

CREATE INDEX idx_discrepancia_conciliacion ON discrepancia(conciliacion_id);
CREATE INDEX idx_discrepancia_estado ON discrepancia(estado) WHERE estado = 'PENDIENTE';
