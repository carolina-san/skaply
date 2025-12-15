# Documentación de la API de Skäply

Este documento describe los endpoints disponibles en la API del proyecto Skäply.

Base URL: `/api`

## Tabla de Contenidos
- [Autenticación](#autenticación)
- [Muebles (Furniture)](#muebles-furniture)
- [Proveedores (Providers)](#proveedores-providers)
- [Chatbot](#chatbot)
- [Categorías y Colores](#categorías-y-colores)
- [Salud del Sistema](#salud-del-sistema)

---

## Autenticación
Rutas relacionadas con el registro, inicio de sesión y gestión de sesiones de usuario.

### Login
- **Endpoint:** `POST /auth/login`
- **Descripción:** Inicia sesión con credenciales de email y contraseña.
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Registro
- **Endpoint:** `POST /auth/register`
- **Descripción:** Registra un nuevo usuario en la plataforma.
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "role": "user" 
  }
  ```

### Logout
- **Endpoint:** `POST /auth/logout`
- **Descripción:** Cierra la sesión actual invalidadando el token.

### Refrescar Token
- **Endpoint:** `POST /auth/refresh`
- **Descripción:** Renueva el token de acceso.

### Google OAuth
- **Endpoint:** `GET /auth/google`
- **Descripción:** Inicia el flujo de autenticación con Google.
- **Callback:** `GET /auth/google/callback`

---

## Muebles (Furniture)
Endpoints para consultar el catálogo de muebles y sus detalles.

### Listar Muebles
- **Endpoint:** `GET /furniture`
- **Descripción:** Obtiene una lista de todos los muebles disponibles.

### Filtrar Muebles
- **Endpoint:** `POST /furniture/filter`
- **Descripción:** Obtiene una lista de muebles basada en criterios de filtro.
- **Body:** (Ejemplo de objeto `FilterOptions`)
  ```json
  {
    "category_id": 1,
    "color": "rojo",
    "min_price": 100,
    "max_price": 500
  }
  ```

### Obtener Mueble por ID
- **Endpoint:** `GET /furniture/:id`
- **Descripción:** Obtiene los detalles completos de un mueble específico.

### Obtener Piezas del Mueble
- **Endpoint:** `GET /furniture/:id/parts`
- **Descripción:** Obtiene todas las piezas asociadas a un mueble.

### Obtener Pasos de Montaje
- **Endpoint:** `GET /furniture/:id/assembly`
- **Descripción:** Obtiene la secuencia completa de montaje para el mueble.

### Obtener Piezas por Paso
- **Endpoint:** `GET /furniture/:id/step/:stepId/parts`
- **Descripción:** Obtiene las piezas específicas necesarias para un paso de montaje.

### Incidencias (Issues)
- **Endpoint:** `GET /furniture/:id/issues`
    - Obtiene las incidencias reportadas para un mueble.
- **Endpoint:** `POST /furniture/:id/issues`
    - Reporta una nueva incidencia.
    - **Body:**
      ```json
      {
        "description": "Falta un tornillo",
        "date": "2023-10-27T10:00:00Z",
        "user_email": "user@example.com"
      }
      ```

### Reseñas (Reviews)
- **Endpoint:** `GET /furniture/:id/reviews`
- **Descripción:** Obtiene las reseñas de un mueble.

---

## Proveedores (Providers)
Gestión de proveedores.

### Listar Proveedores
- **Endpoint:** `GET /providers`
- **Descripción:** Obtiene la lista de todos los proveedores.

### Obtener Proveedor por ID
- **Endpoint:** `GET /providers/:id`
- **Descripción:** Obtiene los detalles de un proveedor específico.

### Eliminar Proveedor
- **Endpoint:** `DELETE /providers/:id`
- **Descripción:** Elimina un proveedor (requiere permisos de administrador).

> **Nota:** La creación de proveedores no tiene un endpoint `POST /providers` explícito en la configuración de rutas actual, aunque el frontend intente usarlo. Se recomienda usar el registro de usuarios con rol de proveedor o implementar la ruta faltante.

---

## Chatbot
Interacción con el asistente virtual de montaje.

### Enviar Mensaje
- **Endpoint:** `POST /chatbot`
- **Descripción:** Envía un mensaje de texto al chatbot.
- **Body:**
  ```json
  {
    "text": "Hola, necesito ayuda con el paso 1",
    "sessionId": "..."
  }
  ```

### Webhook
- **Endpoint:** `POST /chatbot/webhook`
- **Descripción:** Endpoint para recibir eventos desde Dialogflow o servicios externos.

### Control de Montaje
- **Endpoint:** `POST /chatbot/start`
    - Inicia una sesión de montaje para un mueble específico.
    - **Body:** `{ "furniture_ref": "REF123", "sessionId": "..." }`
- **Endpoint:** `POST /chatbot/reset`
    - Reinicia la sesión de montaje actual.
    - **Body:** `{ "sessionId": "..." }`

### Evento de Bienvenida
- **Endpoint:** `POST /chatbot/welcome`
- **Descripción:** Trigger manual del evento de bienvenida del chatbot.

---

## Categorías y Colores
Recursos auxiliares para filtros y búsquedas.

### Categorías
- **Endpoint:** `GET /categories`
- **Descripción:** Lista todas las categorías de muebles disponibles.

### Colores
- **Endpoint:** `GET /colors`
- **Descripción:** Lista los colores disponibles para los muebles.

---

## Salud del Sistema
- **Endpoint:** `GET /health`
- **Descripción:** Verifica que la API esté funcionando correctamente. Retorna estado 200 si todo está OK.
