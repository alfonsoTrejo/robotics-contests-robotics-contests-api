# Testing RBAC y Ownership con curl

Scripts automatizados para probar los endpoints de la API con curl.

## Prerequisitos

- API corriendo (puerto 8080 por defecto)
- PostgreSQL con base de datos configurada
- Variables de entorno configuradas

## Scripts disponibles

### 1. `test-rbac.sh` - Tests básicos de RBAC

Prueba los permisos de admin vs usuarios no autenticados.

**Qué prueba:**
- ✓ Admin puede registrarse
- ✓ Admin puede crear/editar/eliminar contests y modalities
- ✓ Usuarios sin auth son bloqueados (401)
- ✓ Rutas públicas son accesibles
- ℹ️ Documenta cómo probar student role (requiere Google OAuth)

**Uso:**
```bash
chmod +x test-rbac.sh
./test-rbac.sh
```

**Opciones:**
```bash
# Usar URL diferente
API_URL=https://localhost:8080/api ./test-rbac.sh
```

### 2. `test-student.sh` - Tests de Student y Ownership

Prueba los permisos de student y validación de ownership en equipos.

**Qué prueba:**
- ✓ Students bloqueados de endpoints admin (403)
- ✓ Student puede crear equipo incluyéndose a sí mismo
- ✓ Student NO puede crear equipo sin incluirse (403)
- ✓ Student puede crear equipo con 2 miembros
- ✓ Student puede ver sus propios equipos

**Prerequisitos adicionales:**
- `psql` command disponible
- `node` y `jsonwebtoken` instalado
- Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `COOKIE_NAME` (opcional)

**Uso:**
```bash
# Configurar variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/rcms"
export JWT_SECRET="tu-secret"
export COOKIE_NAME="rcms_token"  # opcional

# Ejecutar
chmod +x test-student.sh
./test-student.sh
```

## Estructura de los tests

### test-rbac.sh
```
1. Admin: Register → 201
2. Admin: Create Contest → 201
3. Admin: Create Modality → 201
4. No Auth: Create Contest → 401
5. Public: Get Contests → 200
6. Admin: Update Contest → 200
7. Admin: Delete Modality → 200
```

### test-student.sh
```
Setup:
- Crea 2 students en DB
- Genera JWT tokens
- Crea contest + modality

Tests:
1. Student: Try create Contest → 403
2. Student: Create team with self → 201
3. Student: Create team without self → 403
4. Student: Create team with 2 members → 201
5. Student: Get my teams → 200
```

## Output

Los scripts usan colores para indicar resultados:
- 🟢 Verde: Test pasó
- 🔴 Rojo: Test falló
- 🟡 Amarillo: Información o advertencia

## Ejemplo de output

```bash
$ ./test-rbac.sh
======================================
  RBAC & Ownership Tests with curl
======================================

[TEST 1] Admin: Register
✓ PASS: Admin registered (201)
  Admin ID: 123e4567-e89b-12d3-a456-426614174000

[TEST 2] Admin: Create Contest (should pass)
✓ PASS: Contest created (201)
  Contest ID: 234e5678-e89b-12d3-a456-426614174000

...
```

## Troubleshooting

### Error: "Unauthorized"
- Verifica que el servidor esté corriendo
- Revisa que las cookies se estén guardando correctamente

### Error: "Cannot create students in DB"
- Verifica `DATABASE_URL`
- Asegúrate de que `psql` esté instalado
- Ejecuta las migraciones: `npx prisma migrate deploy`

### Error: "JWT_SECRET not set"
```bash
export JWT_SECRET="el-secret-de-tu-env"
```

### Error: "Module 'jsonwebtoken' not found"
```bash
npm install
```

## Alternativas manuales

Si prefieres probar manualmente con curl:

### 1. Registrar admin y guardar cookie
```bash
curl -i --cacert ../certs/localhost-cert.pem -c cookies.txt -X POST https://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"123456"}'
```

### 2. Crear contest (protegido)
```bash
curl -i --cacert ../certs/localhost-cert.pem -b cookies.txt -X POST https://localhost:8080/api/contests \
  -H "Content-Type: application/json" \
  -d '{"title":"Contest","date":"2026-03-01T10:00:00.000Z","location":"Lab"}'
```

### 3. Intentar sin auth (debe fallar)
```bash
curl -i --cacert ../certs/localhost-cert.pem -X POST https://localhost:8080/api/contests \
  -H "Content-Type: application/json" \
  -d '{"title":"Fail","date":"2026-03-01T10:00:00.000Z"}'
```

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `API_URL` | URL base de la API | `https://localhost:8080/api` |
| `DATABASE_URL` | Connection string de PostgreSQL | - |
| `JWT_SECRET` | Secret para firmar tokens | - |
| `COOKIE_NAME` | Nombre de la cookie de auth | `rcms_token` |

## Notas

- Los scripts limpian las cookies al finalizar
- `test-student.sh` crea usuarios temporales en DB (limpia después si quieres)
- Para producción, usa Google OAuth real en lugar de generar tokens manualmente
- Los IDs en los ejemplos son UUIDs reales generados por la DB
