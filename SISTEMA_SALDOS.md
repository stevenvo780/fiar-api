# Sistema de Créditos y Transacciones

## Descripción

El sistema funciona como un administrador de créditos donde cada cliente tiene un límite de crédito y un balance actual que se actualiza con cada transacción. Las transacciones pueden ser de entrada (agregan créditos) o salida (consumen créditos).

## Nuevos Campos

### Cliente (`Client`)
- `current_balance`: Balance de créditos disponibles actual del cliente
- `credit_limit`: Límite máximo de créditos (no cambia)

### Transacción (`Transaction`)
- `operation`: Tipo de operación (`income` | `expense`)

## Funcionalidades

### 1. Tipos de Operaciones

#### Salida (`expense`)
- Consume créditos del balance disponible del cliente
- Se valida que haya créditos suficientes antes de procesar
- Si no hay créditos suficientes, se rechaza la transacción con mensaje informativo

#### Entrada (`income`)
- Agrega créditos al balance disponible del cliente
- No puede exceder el límite de crédito establecido

### 2. Estados de Transacciones

Las transacciones solo afectan el balance cuando están en estado:
- `approved`: Transacción aprobada
- `completed`: Transacción completada

Las transacciones en estado `pending` o `rejected` NO afectan el balance.

### 3. Validaciones de Créditos

#### Al crear una transacción de expense:
```typescript
// Si los créditos son insuficientes
{
  "error": "Créditos insuficientes. Créditos disponibles: 50000, Monto solicitado: 75000"
}
```

#### Al aprobar una transacción:
- Se valida nuevamente los créditos disponibles
- Si no hay créditos suficientes, la transacción se revierte al estado anterior

### 4. Gestión Automática del Balance

#### Al crear transacciones:
- **Expense aprobado/completado**: Reduce los créditos inmediatamente
- **Income aprobado/completado**: Aumenta los créditos inmediatamente
- **Transacciones pendientes**: No afectan el balance

#### Al actualizar transacciones:
- **Cambio de pending → approved**: Aplica el efecto al balance
- **Cambio de approved → pending**: Revierte el efecto del balance
- **Cambio de approved → rejected**: Revierte el efecto del balance

#### Al eliminar transacciones:
- Si la transacción estaba aprobada/completada, se revierte su efecto en el balance

## Nuevos Endpoints

### Consultar Balance de Cliente
```
GET /clients/:id/balance
```

**Respuesta:**
```json
{
  "current_balance": 75000.0,
  "credit_limit": 100000.0
}
```

## Ejemplo de Flujo

### 1. Crear Cliente
```json
{
  "document": "12345678",
  "name": "Juan",
  "lastname": "Pérez",
  "credit_limit": 100000,
  "current_balance": 100000  // Opcional, por defecto toma credit_limit
}
```

### 2. Crear Transacción de Salida (Consumir Créditos)
```json
{
  "clientId": "1",
  "amount": 25000,
  "operation": "expense",
  "status": "approved"
}
```
**Resultado**: El balance del cliente se reduce a 75,000

### 3. Intentar Transacción Excesiva
```json
{
  "clientId": "1",
  "amount": 100000,
  "operation": "expense",
  "status": "approved"
}
```
**Error**: "Créditos insuficientes. Créditos disponibles: 75000, Monto solicitado: 100000"

### 4. Crear Transacción de Entrada (Agregar Créditos)
```json
{
  "clientId": "1",
  "amount": 15000,
  "operation": "income",
  "status": "approved"
}
```
**Resultado**: El balance del cliente aumenta a 90,000

## Migración de Base de Datos

Para aplicar los cambios a la base de datos existente:

```sql
-- Ejecutar el archivo de migración
-- migrations/add-balance-and-transaction-operation.sql
```

Este archivo:
1. Agrega el campo `current_balance` a la tabla `client`
2. Agrega el campo `operation` a la tabla `transaction`
3. Inicializa los valores por defecto
4. Agrega restricciones de validación

## Consideraciones Importantes

1. **Transacciones Atómicas**: Todas las operaciones de balance se manejan de forma atómica
2. **Validación Doble**: Se valida créditos tanto al crear como al aprobar transacciones
3. **Reversibilidad**: Todas las operaciones de balance son reversibles
4. **Consistencia**: El sistema mantiene la consistencia entre transacciones y balance automáticamente
5. **Rechazo Automático**: Las transacciones que exceden los créditos disponibles se rechazan automáticamente

## Errores Comunes

- **Créditos Insuficientes**: Cuando se intenta consumir más créditos de los disponibles
- **Exceso de Límite**: Cuando una entrada excedería el límite establecido
- **Cliente No Encontrado**: Cuando se intenta operar con un cliente inexistente
