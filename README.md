<<<<<<< HEAD
# Proyecto: NailMakeupApp - Tienda de Nail Art

## Descripción
**NailMakeupApp** es una aplicación web full-stack diseñada para una tienda en línea especializada en productos de Nail Art. Permite la gestión completa de productos (visualización, adición, edición y eliminación dinámica), así como la carga de imágenes, facilitando una experiencia de usuario interactiva y una administración de inventario eficiente. La aplicación cuenta con un sistema de autenticación de usuarios y roles, asegurando que las operaciones críticas de gestión de productos estén restringidas a administradores.

=======

## Tecnologías Utilizadas
* **Backend:**
    * **Node.js con Express.js:** Framework para el servidor web y la API RESTful.
    * **MongoDB:** Base de datos NoSQL para el almacenamiento de productos y usuarios.
    * **Mongoose:** ODM (Object Data Modeling) para interactuar con MongoDB, definiendo esquemas para productos (con campos como `name`, `description`, `price`, `imageUrl`, `category`, `stock`) y usuarios.
    * **Multer:** Middleware para el manejo de subida de archivos (imágenes de productos) al servidor.
    * **Dotenv:** Para la gestión de variables de entorno sensibles (ej. `MONGO_URI`, `JWT_SECRET`).
    * **bcrypt.js:** Para el hashing seguro y comparación de contraseñas de usuario.
    * **jsonwebtoken:** Para la creación y verificación de JSON Web Tokens (JWT) para la autenticación de usuarios.
    * **express-async-handler:** Utilidad para envolver funciones asíncronas en rutas Express y manejar automáticamente errores.
* **Frontend:**
    * **HTML5:** Estructura de la aplicación, incluyendo secciones dinámicas para Home, Productos, Añadir Producto, Login, Registro y Mi Cuenta.
    * **CSS3:** Estilos y diseño responsivo para una experiencia de usuario agradable.
    * **JavaScript (Vanilla JS):** Lógica del lado del cliente, manejo de formularios (login, registro, añadir/editar producto), peticiones a la API (`fetch`) y actualización dinámica del DOM. Incluye funciones globales como `showSection` (para la navegación) y `fetchProducts` (para la carga de productos).
* **Control de Versiones:**
    * **Git:** Para el seguimiento de cambios en el código.

## Funcionalidades Actuales
* **Visualización y Gestión Avanzada de Productos:**
    * Muestra dinámicamente la lista de productos disponibles en una cuadrícula (`products-grid`) en la sección de productos.
    * Permite **buscar productos por nombre o descripción**.
    * Facilita el **filtrado por categoría** de producto.
    * Posibilita el **filtrado por rango de precios** (mínimo y máximo).
    * Implementa **paginación** para navegar por grandes conjuntos de productos, mostrando un número definido de productos por página.
    * **Adición de Nuevos Productos (Solo Administradores):** Formulario dedicado que permite subir una imagen y los detalles del producto, con validación en frontend. La lista se actualiza automáticamente.
    * **Edición de Productos (Solo Administradores):** Permite precargar y modificar los datos de un producto existente, incluyendo la imagen. La lista se actualiza dinámicamente.
    * **Eliminación de Productos (Solo Administradores):** Funcionalidad completa para eliminar productos y su imagen asociada del servidor, con confirmación previa.
* **Autenticación de Usuarios:**
    * **Registro:** Permite a nuevos usuarios crear una cuenta.
    * **Login:** Permite a usuarios existentes iniciar sesión, obteniendo un token JWT.
* **Navegación Dinámica y Control de Acceso (Frontend):**
    * Los enlaces de la barra de navegación (`Login`, `Registro`, `Añadir Producto`, `Mi Cuenta`, `Cerrar Sesión`) se muestran u ocultan automáticamente dependiendo del estado de autenticación y el rol del usuario (logueado/no logueado, administrador/usuario regular).
    * La sección activa también cambia dinámicamente sin recargar la página.
    * **Sincronización de la UI en Tiempo Real:** La interfaz de usuario (navegación, botones de administración en productos, lista de productos) se actualiza instantáneamente después de acciones como login, registro, logout, añadir, editar o eliminar productos, sin requerir una recarga manual de la página.
* **Gestión de Imágenes:** Las imágenes subidas a través de los formularios se almacenan localmente en la carpeta `public/uploads` del servidor, y son servidas correctamente al frontend.
* **Feedback al Usuario Mejorado:** Los formularios y operaciones ahora proporcionan mensajes de validación y de éxito/error más claros y visualmente integrados en la interfaz, reemplazando los `alert()`s.
* **Sección "Mi Cuenta":** La estructura de la sección está presente en el HTML y es accesible a través de la navegación.

## Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local:

### Requisitos Previos
Asegúrate de tener instalado lo siguiente:
* [Node.js](https://nodejs.org/es/) (se recomienda la versión LTS)
* [MongoDB](https://www.mongodb.com/try/download/community) (MongoDB Community Server o una instancia en la nube como MongoDB Atlas)
* [Git](https://git-scm.com/downloads) (opcional, pero recomendado para clonar el repositorio)

### Pasos de Configuración

1.  **Clonar el Repositorio (si usas Git):**
    ```bash
    git clone <https://github.com/ingbrayanTellez/NailMakeupApp.git>
    cd tu_tienda_nail_art

2.  **Instalar Dependencias:**
    Navega a la raíz del proyecto e instala todas las dependencias (asegúrate de estar en el directorio donde está `package.json`):
    ```bash
    npm install
    ```
    **NOTA IMPORTANTE:** Si recibes un error como `Cannot find module 'express-async-handler'` al iniciar el servidor, es porque este paquete es una nueva dependencia. Ejecuta `npm install express-async-handler` o simplemente `npm install` de nuevo para asegurar que todas las dependencias estén instaladas.

3.  **Configurar las Variables de Entorno:**
    Crea un archivo llamado `.env` en la **raíz del proyecto** (`./.env`) y añade las siguientes variables. Sustituye los valores de ejemplo por los tuyos:
    ```dotenv
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/nail_makeup_db
    JWT_SECRET=tu_secreto_jwt_muy_seguro_y_largo_aqui
    JWT_EXPIRES_IN=1h # Ejemplo: el token expira en 1 hora
    ```
    * `PORT`: El puerto en el que se ejecutará el servidor (por defecto 3000).
    * `MONGO_URI`: Tu cadena de conexión a tu base de datos MongoDB (ej. `mongodb://localhost:27017/nail_makeup_db` para local, o una URL de MongoDB Atlas).
    * `JWT_SECRET`: Una cadena de texto **larga y compleja** que se utilizará para firmar y verificar tus JSON Web Tokens. **¡Cámbiala por una cadena aleatoria y segura!**
    * `JWT_EXPIRES_IN`: Define el tiempo de vida de tus tokens JWT (ej. `1h`, `7d`).

4.  **Verificar la Carpeta de Subidas de Imágenes:**
    La aplicación está configurada para crear automáticamente la carpeta `public/uploads` si no existe. No obstante, puedes verificar su existencia en `tu_tienda_nail_art/public/uploads/`.

5.  **Iniciar el Servidor Backend:**
    Desde la raíz del proyecto, ejecuta:
    ```bash
    node app.js
    ```
    Verás un mensaje en la consola indicando que el servidor está escuchando en el puerto configurado y que MongoDB está conectado.

6.  **Acceder a la Aplicación Frontend:**
    Abre tu navegador web y navega a:
    ```
    http://localhost:3000
    ```
    ¡Ya deberías ver la aplicación de tu tienda de Nail Art funcionando con todas las funcionalidades!

## 🐛 Notas de Depuración y Consideraciones Importantes

* **HTML de Navegación (`index.html`):**
    * Asegúrate de que los IDs para los contenedores `<li>` (`nav-add-product-container`, `nav-login-container`, etc.) sean correctos.
    * Es **CRÍTICO** que la clase `class="hidden-link"` **NO ESTÉ** en el HTML inicial para los elementos `<a>` dentro de los `<li>`. Esta clase debe ser gestionada **exclusivamente por JavaScript** en `auth.js` sobre los `<li>` contenedores para la visibilidad (estableciendo `display: none` o `display: block` a los contenedores `<li>`).
    * El logo en el `header` ahora incluye un `span` para el texto `NailMakeupApp` junto a la imagen.

* **Lógica de Autenticación (`public/js/auth.js`):**
    * Verifica que la función `updateNavVisibility()` se esté llamando **después** de que el token JWT sea guardado en `localStorage` tras un login o registro exitoso.
    * Asegúrate de que `localStorage.setItem('token', data.token);` se esté ejecutando correctamente. Puedes usar `console.log("Token guardado:", localStorage.getItem('token'));` justo después de esa línea para verificar.
    * La función `updateNavVisibility()` usa `localStorage.getItem('token')` para determinar si el usuario está logueado y ajustar la visibilidad de los elementos de navegación.
    * Los `console.log` añadidos con `%c[AUTH DEBUG]` en `auth.js` son muy útiles. Revisa la pestaña "Console" de las Herramientas de Desarrollador del navegador para ver si el token se detecta y si la visibilidad se intenta actualizar.
    * La función global `window.showSection` es esencial para la navegación entre secciones, y `window.fetchProducts` se utiliza para recargar la lista de productos.

* **Pestaña "Application" (DevTools):**
    * Usa la pestaña "Application" -> "Local Storage" -> `http://localhost:3000` (o el puerto de tu aplicación) para verificar manualmente si el token JWT se guarda correctamente después de un login/registro. Si no aparece la clave `token` allí, el problema está en la escritura a `localStorage`.

* **Manejo de Imágenes (`addProduct.js`, `productRoutes.js`, `app.js`):**
    * `addProduct.js` utiliza `FormData` para enviar datos de productos y el archivo de imagen al backend.
    * `productRoutes.js` utiliza `multer` como middleware (`upload.single('imageUrl')`) para procesar la imagen antes de que el controlador la reciba.
    * `app.js` debe tener `app.use(express.static(path.join(__dirname, 'public')));` configurado correctamente para servir las imágenes desde `public/uploads`.
    * Las imágenes subidas se almacenan localmente en el directorio `/public/uploads`. Asegúrate de que el servidor tenga permisos de escritura en este directorio. Si las imágenes no se muestran, verifica las rutas en el frontend (`main.js` al renderizar productos) y la configuración de `express.static` en `app.js` para servir correctamente los archivos estáticos.

* **Depuración de Red (`F12` -> `Network`):**
    * Siempre revisa la pestaña `Network` al enviar formularios (login, registro, añadir/editar producto).
    * Verifica que las solicitudes `POST`, `PUT`, `DELETE` al backend (`/api/auth/login`, `/api/products`, etc.) tengan un código de estado `200 OK` (éxito) y que la respuesta contenga los datos esperados (ej. el `token` en el caso del login). Errores como `401 Unauthorized`, `403 Forbidden`, `404 Not Found` o `500 Internal Server Error` indican problemas en el backend o en la solicitud.

* **Error `GET /api/auth/me 404 (Not Found)`:**
    * Este error indica que el frontend (`auth.js` o `main.js`) está intentando obtener la información del usuario autenticado de la ruta `/api/auth/me`, pero el backend no tiene un controlador configurado para esta solicitud.
    * **Solución:** Necesitas definir la ruta `router.get('/me', protect, authController.getMe);` en `backend/routes/authRoutes.js` y crear la función `getMe` en `backend/controllers/authController.js` que decodifique el token y devuelva la información del usuario logueado.

## 💡 Posibles Mejoras Futuras y Documentación del Proyecto

Con todas las funcionalidades principales ya implementadas, los próximos pasos se centrarán en la maduración del proyecto y la preparación para la entrega.

* **Funcionalidades de Usuario Adicionales:**
    * **Completar la Sección "Mi Cuenta":** Actualmente, la sección está presente en el HTML. El siguiente paso es implementar la lógica para **mostrar la información del usuario logueado** (nombre de usuario, email, rol) dentro de esta sección. Opcionalmente, se podría añadir la funcionalidad para que el usuario pueda **actualizar su perfil o cambiar su contraseña**.
    * **Implementación de un Carrito de Compras y Proceso de Pedidos Completo:** Permitir a los usuarios añadir productos a un carrito, gestionarlo y proceder a un flujo de compra (este es un módulo grande y complejo).
    * **Integración de un Chatbot de soporte al cliente:** Proporcionar asistencia automatizada a los usuarios para preguntas frecuentes o ayuda con el proceso de compra.

* **Mejoras en la Interfaz de Usuario (UI/UX) y Rendimiento:**
    * **Mejoras continuas en el diseño y la responsividad** de la interfaz de usuario para una experiencia óptima en todos los dispositivos.
    * **Indicadores de Carga:** Implementar elementos visuales (spinners, esqueletos) que indiquen al usuario que una operación está en curso (ej. al cargar productos, al enviar un formulario).

* **Preparación para Despliegue y Mantenimiento:**
    * **Despliegue de la aplicación a un entorno de producción:**
        * Considerar un servicio de almacenamiento de imágenes en la nube (ej. Cloudinary, AWS S3) en lugar de `public/uploads` para escalabilidad, fiabilidad y mejor rendimiento en entornos distribuidos.
    * **Optimización del Código:** Revisar el código para posibles mejoras de rendimiento y limpieza.

---

**Además de las funcionalidades del software, la entrega completa del proyecto incluye la siguiente documentación:**

1.  **Manual de Usuario:**
    * **Propósito:** Proporcionar una guía clara y sencilla para los usuarios finales sobre cómo utilizar todas las funcionalidades de la aplicación.
    * **Contenido:** Instrucciones paso a paso para registro, inicio de sesión, visualización de productos, y para administradores: añadir, editar y eliminar productos. Incluirá capturas de pantalla y una sección de preguntas frecuentes básicas.
2.  **Documentación Técnica del Software:**
    * **Propósito:** Servir como referencia detallada para desarrolladores que necesiten mantener, depurar o extender el proyecto.
    * **Contenido:** Descripción de la arquitectura (MERN), estructura de carpetas, diseño de la base de datos (modelos y relaciones), especificación de los endpoints de la API (con ejemplos de request/response), explicación de middlewares de autenticación y autorización, configuración de Multer para la gestión de imágenes, y guía de instalación/configuración del entorno de desarrollo.
3.  **Documentación de Plan de Migración y Respaldo de Datos:**
    * **Propósito:** Ofrecer un plan estratégico para el despliegue del software a diferentes entornos (producción) y asegurar la integridad de los datos.
    * **Contenido:** Procedimientos para la migración de código y base de datos (usando `mongodump`/`mongorestore`), estrategias para la migración y gestión de archivos subidos (imágenes), así como un plan detallado de respaldo (frecuencia, métodos, ubicación, retención) y procedimientos de restauración en caso de desastre.
4.  **Plan de Capacitación y Realización de Pruebas de Aceptación del Cliente (UAT):**
    * **Propósito:** Asegurar que los usuarios finales están capacitados para usar el software y que este cumple con sus expectativas y requisitos de negocio.
    * **Contenido:**
        * **Plan de Capacitación:**
            * **Audiencia:** Quiénes serán capacitados (administradores, personal de ventas).
            * **Objetivos:** Qué deberían poder hacer los usuarios después de la capacitación.
            * **Metodología:** Sesiones presenciales/virtuales, tutoriales, videos, material de apoyo.
            * **Contenido:** Temas a cubrir (repaso del manual de usuario, funcionalidades específicas de su rol, resolución de dudas).
            * **Cronograma:** Fechas y duración de las sesiones.
        * **Plan de Pruebas de Aceptación (UAT):**
            * **Objetivo de la UAT:** Validar que la aplicación satisface los requisitos funcionales y no funcionales desde la perspectiva del usuario final.
            * **Participantes:** Quiénes realizarán las pruebas (usuarios clave del cliente).
            * **Casos de Prueba:** Escenarios de uso real (ej. "Registrar un nuevo usuario", "Añadir un producto con imagen", "Editar precio de producto", "Eliminar un producto").
            * **Procedimiento:** Cómo se ejecutarán las pruebas, cómo se reportarán los errores/feedback, herramientas a utilizar (hoja de cálculo, sistema de tickets).
            * **Criterios de Aceptación:** Qué condiciones deben cumplirse para que el cliente "acepte" el software (ej. 95% de casos de prueba pasados, errores críticos resueltos).
            * **Cronograma:** Duración de la fase UAT.
            * **Plan de Comunicación:** Cómo se comunicarán los resultados y el progreso al cliente.

---

© 2025 Mi Tienda NailMakeupApp. Todos los derechos reservados @bgtellezg
=======
# NailMakeupApp
es una aplicación web full-stack diseñada para una tienda en línea especializada en productos de Nail Art
>>>>>>> origin/main