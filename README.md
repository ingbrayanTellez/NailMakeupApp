<<<<<<< HEAD
# Proyecto: NailMakeupApp - Tienda de Nail Art

## Descripción
NailMakeupApp es una aplicación web de pila completa (full-stack) diseñada con una arquitectura RESTful, utilizando Node.js y Express.js para el backend y JavaScript para un frontend dinámico de una sola página (SPA). La solución implementa un modelo de datos robusto con MongoDB y Mongoose, facilitando operaciones CRUD (Crear, Leer, Actualizar, Eliminar) eficientes para la gestión de un catálogo de productos y perfiles de usuario. Incorpora un sistema de autenticación basado en JSON Web Tokens (JWT) con control de acceso basado en roles (RBAC), asegurando que las funcionalidades críticas de administración de inventario y datos de usuario estén protegidas y accesibles solo por usuarios autorizados. La gestión de activos multimedia, como imágenes de productos y avatares de usuario, se realiza mediante Multer para la subida segura y Express.js para el servicio eficiente de archivos estáticos. El diseño modular y el uso de tecnologías estándar garantizan la escalabilidad, mantenibilidad y una experiencia de usuario fluida a través de interacciones asíncronas y actualizaciones dinámicas del DOM.

=======

** Tecnologías Utilizadas ** Backend:

Node.js con Express.js: Framework para el servidor web y la API RESTful.

MongoDB: Base de datos NoSQL para el almacenamiento de productos y usuarios.

Mongoose: ODM (Object Data Modeling) para interactuar con MongoDB, definiendo esquemas para productos (con campos como name, description, price, imageUrl, category, stock) y usuarios.

Multer: Middleware para el manejo de subida de archivos (imágenes de productos y avatares) al servidor.

Dotenv: Para la gestión de variables de entorno sensibles (ej. MONGO_URI, JWT_SECRET).

bcrypt.js: Para el hashing seguro y comparación de contraseñas de usuario.

jsonwebtoken: Para la creación y verificación de JSON Web Tokens (JWT) para la autenticación de usuarios.

express-async-handler: Utilidad para envolver funciones asíncronas en rutas Express y manejar automáticamente errores.

Frontend:

HTML5: Estructura de la aplicación, incluyendo secciones dinámicas para Home, Productos, Añadir Producto, Login, Registro, Mi Cuenta, Carrito y Checkout.

CSS3: Estilos y diseño responsivo para una experiencia de usuario agradable.

JavaScript (Vanilla JS): Lógica del lado del cliente, manejo de formularios (login, registro, añadir/editar producto, edición de perfil, cambio de contraseña), peticiones a la API (fetch) y actualización dinámica del DOM. Incluye funciones globales como showSection (para la navegación) y fetchProducts (para la carga de productos).

Control de Versiones:

Git: Para el seguimiento de cambios en el código.

Funcionalidades Actuales

Visualización y Gestión Avanzada de Productos:

Muestra dinámicamente la lista de productos disponibles en una cuadrícula (products-grid) en la sección de productos.

Permite buscar productos por nombre o descripción.

Facilita el filtrado por categoría de producto.

Posibilita el filtrado por rango de precios (mínimo y máximo).

Implementa paginación para navegar por grandes conjuntos de productos, mostrando un número definido de productos por página.

Adición de Nuevos Productos (Solo Administradores): Formulario dedicado que permite subir una imagen y los detalles del producto, con validación en frontend. La lista se actualiza automáticamente.

Edición de Productos (Solo Administradores): Permite precargar y modificar los datos de un producto existente, incluyendo la imagen. La lista se actualiza dinámicamente.

Eliminación de Productos (Solo Administradores): Funcionalidad completa para eliminar productos y su imagen asociada del servidor, con confirmación previa.

-->Autenticación de Usuarios:**

Registro: Permite a nuevos usuarios crear una cuenta.

Login: Permite a usuarios existentes iniciar sesión, obteniendo un token JWT.

Obtención de Perfil de Usuario Logueado (/api/users/me): El backend ahora maneja correctamente la obtención de la información del perfil del usuario autenticado sin errores de tipo de dato (CastError), utilizando el ID del usuario del token JWT.

--> Navegación Dinámica y Control de Acceso (Frontend):

Los enlaces de la barra de navegación (Login, Registro, Añadir Producto, Mi Cuenta, Cerrar Sesión) se muestran u ocultan automáticamente dependiendo del estado de autenticación y el rol del usuario (logueado/no logueado, administrador/usuario regular).

La sección activa también cambia dinámicamente sin recargar la página.

Sincronización de la UI en Tiempo Real: La interfaz de usuario (navegación, botones de administración en productos, lista de productos) se actualiza instantáneamente después de acciones como login, registro, logout, añadir, editar o eliminar productos, sin requerir una recarga manual de la página.

-->Gestión de Imágenes:

Las imágenes subidas a través de los formularios (productos y avatares) se almacenan localmente en la carpeta public/img/avatars o public/uploads del servidor, y son servidas correctamente al frontend.

Actualización de Avatar: Los usuarios pueden subir y cambiar su imagen de perfil (avatar). Las imágenes antiguas son eliminadas del servidor al subir una nueva.

Feedback al Usuario Mejorado: Los formularios y operaciones ahora proporcionan mensajes de validación y de éxito/error más claros y visualmente integrados en la interfaz, reemplazando los alert()s.

Sección "Mi Cuenta" Mejorada:

La estructura de la sección está presente en el HTML y es accesible a través de la navegación.

Edición de Perfil: Permite a los usuarios logueados actualizar su nombre de usuario y correo electrónico.

Cambio de Contraseña: Permite a los usuarios logueados cambiar su contraseña de forma segura.

Diseño de Formularios de Perfil: Los formularios de "Editar Perfil" y "Cambiar Contraseña" ahora aparecen visualmente debajo de la tarjeta de información del perfil (user-info-card), mejorando la organización del layout en la sección "Mi Cuenta".

Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local:
--> Requisitos Previos Asegúrate de tener instalado lo siguiente:

Node.js (se recomienda la versión LTS)

MongoDB (MongoDB Community Server o una instancia en la nube como MongoDB Atlas)

Git (opcional, pero recomendado para clonar el repositorio)

Pasos de Configuración

Clonar el Repositorio (si usas Git):

git clone https://github.com/ingbrayanTellez/NailMakeupApp.git cd tu_tienda_nail_art

-->Instalar Dependencias:

Navega a la raíz del proyecto e instala todas las dependencias (asegúrate de estar en el directorio donde está package.json):
npm install
-------->NOTA IMPORTANTE: Si recibes un error como Cannot find module 'express-async-handler' al iniciar el servidor, es porque este paquete es una nueva dependencia. Ejecuta npm install express-async-handler o simplemente npm install de nuevo para asegurar que todas las dependencias estén instaladas.

-->Configurar las Variables de Entorno:

Crea un archivo llamado .env en la raíz del proyecto (./.env) y añade las siguientes variables. Sustituye los valores de ejemplo por los tuyos:
PORT=3000 MONGO_URI=mongodb://localhost:27017/nail_makeup_db JWT_SECRET=tu_secreto_jwt_muy_seguro_y_largo_aqui JWT_EXPIRES_IN=1h # Ejemplo: el token expira en 1 hora

PORT: El puerto en el que se ejecutará el servidor (por defecto 3000).
MONGO_URI: Tu cadena de conexión a tu base de datos MongoDB (ej. mongodb://localhost:27017/nail_makeup_db para local, o una URL de MongoDB Atlas).
JWT_SECRET: Una cadena de texto larga y compleja que se utilizará para firmar y verificar tus JSON Web Tokens. ¡Cámbiala por una cadena aleatoria y segura!
JWT_EXPIRES_IN: Define el tiempo de vida de tus tokens JWT (ej. 1h, 7d).
Verificar la Carpeta de Subidas de Imágenes: La aplicación está configurada para crear automáticamente las carpetas public/img/avatars y public/uploads si no existen. No obstante, puedes verificar su existencia.

-->Iniciar el Servidor Backend: Desde la raíz del proyecto, ejecuta: node backend/app.js Verás un mensaje en la consola indicando que el servidor está escuchando en el puerto configurado y que MongoDB está conectado.

-->Acceder a la Aplicación Frontend: Abre tu navegador web y navega a: http://localhost:3000 ¡Ya deberías ver la aplicación de tu tienda de Nail Art funcionando con todas las funcionalidades!

🐛 ** Notas de Depuración y Consideraciones Importantes**

HTML de Navegación (index.html):

Asegúrate de que los IDs para los contenedores

(nav-add-product-container, nav-login-container, etc.) sean correctos.
Es CRÍTICO que la clase class="hidden" NO ESTÉ en el HTML inicial para los elementos o sus contenedores

si se espera que JavaScript controle su visibilidad. Esta clase debe ser gestionada exclusivamente por JavaScript en auth.js sobre los
contenedores para la visibilidad (estableciendo display: none o display: block a los contenedores
).
El logo en el header ahora incluye un span para el texto NailMakeupApp junto a la imagen.

Lógica de Autenticación (public/js/auth.js):

Verifica que la función updateNavVisibility() se esté llamando después de que el token JWT sea guardado en localStorage tras un login o registro exitoso.

Asegúrate de que localStorage.setItem('token', data.token); se esté ejecutando correctamente. Puedes usar console.log("Token guardado:", localStorage.getItem('token')); justo después de esa línea para verificar.

La función updateNavVisibility() usa localStorage.getItem('token') para determinar si el usuario está logueado y ajustar la visibilidad de los elementos de navegación.

Los console.log añadidos con %c[AUTH DEBUG] en auth.js son muy útiles. Revisa la pestaña "Console" de las Herramientas de Desarrollador del navegador para ver si el token se detecta y si la visibilidad se intenta actualizar.

La función global window.showSection es esencial para la navegación entre secciones, y window.fetchProducts se utiliza para recargar la lista de productos.

Pestaña "Application" (DevTools):

Usa la pestaña "Application" -> "Local Storage" -> http://localhost:3000 (o el puerto de tu aplicación) para verificar manualmente si el token JWT se guarda correctamente después de un login/registro. Si no aparece la clave token allí, el problema está en la escritura a localStorage.

Manejo de Imágenes (addProduct.js, productRoutes.js, app.js):

addProduct.js utiliza FormData para enviar datos de productos y el archivo de imagen al backend.

productRoutes.js utiliza multer como middleware (upload.single('imageUrl')) para procesar la imagen antes de que el controlador la reciba.

app.js debe tener app.use(express.static(path.join(__dirname, 'public'))); configurado correctamente para servir las imágenes desde public/uploads y public/img/avatars.

Las imágenes subidas se almacenan localmente en el directorio /public/uploads y /public/img/avatars. Asegúrate de que el servidor tenga permisos de escritura en estos directorios. Si las imágenes no se muestran, verifica las rutas en el frontend (main.js al renderizar productos) y la configuración de express.static en app.js para servir correctamente los archivos estáticos.

Importancia de Vaciar la Caché del Navegador:

Después de realizar cambios en los archivos CSS o JavaScript del frontend, es CRÍTICO realizar un "Hard Refresh" o vaciar la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R). Esto asegura que el navegador cargue las últimas versiones de los archivos y no versiones antiguas en caché, lo que puede causar comportamientos inesperados o que las nuevas funcionalidades no se vean reflejadas.

Depuración de Red (F12 -> Network):

Siempre revisa la pestaña Network al enviar formularios (login, registro, añadir/editar producto, editar perfil, cambiar contraseña).

Verifica que las solicitudes POST, PUT, DELETE al backend (/api/auth/login, /api/products, etc.) tengan un código de estado 200 OK (éxito) y que la respuesta contenga los datos esperados (ej. el token en el caso del login). Errores como 401 Unauthorized, 403 Forbidden, 404 Not Found o 500 Internal Server Error indican problemas en el backend o en la solicitud.

Posibles Mejoras Futuras

Aquí se detallan las áreas donde el proyecto puede expandirse para mejorar la funcionalidad y la experiencia del usuario.

Funcionalidades para el Usuario (Frontend)

Página de Detalles del Producto: Al hacer clic en un producto, redirigir a una página dedicada con más imágenes, descripciones detalladas, opiniones de usuarios, productos relacionados y un botón para añadir al carrito.

Carrito de Compras Persistente: Implementar un carrito que guarde los ítems incluso después de cerrar el navegador (usando localStorage o base de datos para usuarios logueados).

Proceso de Checkout Avanzado:

Formulario de dirección de envío y facturación.

Integración con pasarelas de pago (Stripe, PayPal).

Confirmación de pedido y resumen.

Gestión de Pedidos del Usuario: Una sección en "Mi Cuenta" donde el usuario pueda ver el estado de sus pedidos, historial de compras detallado, facturas, etc.

Sistema de Valoraciones y Reseñas: Permitir a los usuarios calificar y escribir reseñas sobre los productos.

Favoritos/Lista de Deseos: Opción para guardar productos en una lista de deseos para futuras compras.

Notificaciones: Alertas para el usuario sobre el estado de su pedido, nuevas ofertas, etc.

Página de Contacto/Soporte: Un formulario o información de contacto para que los usuarios puedan comunicarse con la tienda.

Funcionalidades para el Administrador (Backend y Frontend) Gestión de Pedidos:

Panel para ver todos los pedidos, filtrar por estado (pendiente, enviado, entregado, cancelado).

Opción para actualizar el estado de un pedido.

Detalles de cada pedido (productos, usuario, dirección, total).

Gestión de Categorías: Interfaz para crear, editar y eliminar categorías de productos dinámicamente.

Gestión de Usuarios Avanzada: Además de lo actual, poder:

Bloquear/desbloquear usuarios.

Ver historial de actividad detallado de un usuario específico.

Estadísticas y Reportes: Dashboard con métricas clave (ventas totales, productos más vendidos, usuarios activos).

Gestión de Ofertas/Descuentos: Crear y aplicar códigos de descuento o promociones.

Copia de Seguridad de la Base de Datos: Implementar un sistema de copia de seguridad automático o manual.

Mejoras Técnicas y de Rendimiento

Paginación Avanzada: Implementar paginación en el backend y frontend para productos y usuarios, mejorando el rendimiento con grandes volúmenes de datos.

Optimización de Imágenes: Comprimir imágenes al subirlas y servirlas en tamaños adecuados para diferentes dispositivos.

Caché del Servidor: Implementar caché en el servidor para respuestas de API frecuentes y archivos estáticos.

Pruebas Automatizadas: Implementar pruebas unitarias y de integración (Jest, Supertest) para el backend y frontend.

Controles de Entrada (Validación): Asegurar una validación robusta tanto en el frontend como en el backend para todos los datos de entrada del usuario.

Manejo de Errores Mejorado: Implementar un sistema más sofisticado de logueo y reporte de errores.

Internacionalización (i18n): Soporte para múltiples idiomas si se planea expandir el mercado.

--> Seguridad:

Implementar HSTS.

Mejorar la protección CSRF y XSS.

Rate limiting para prevenir ataques de fuerza bruta.

Despliegue Continuo (CI/CD): Configurar un pipeline de CI/CD (GitHub Actions, GitLab CI) para automatizar el despliegue de la aplicación.

Experiencia de Usuario (UX) y Diseño

Diseño Responsivo Completo: Asegurar que la aplicación se vea y funcione perfectamente en cualquier dispositivo (móvil, tablet, escritorio).

Mejoras Visuales: Refinar la UI/UX con animaciones sutiles, transiciones y una paleta de colores coherente.

Cargas Asíncronas: Usar esqueletos de carga o spinners para indicar que el contenido se está cargando, mejorando la percepción de rendimiento.

Mensajes al Usuario: Mensajes más claros y contextuales para el usuario (confirmaciones, errores, etc.).

Además de las funcionalidades del software, la entrega completa del proyecto incluye la siguiente documentación:

--> Manual de Usuario:

Propósito: Proporcionar una guía clara y sencilla para los usuarios finales sobre cómo utilizar todas las funcionalidades de la aplicación.

Contenido: Instrucciones paso a paso para registro, inicio de sesión, visualización de productos, y para administradores: añadir, editar y eliminar productos. Incluirá capturas de pantalla y una sección de preguntas frecuentes básicas.

--> Documentación Técnica del Software:

Propósito: Servir como referencia detallada para desarrolladores que necesiten mantener, depurar o extender el proyecto.

Contenido: Descripción de la arquitectura (MERN), estructura de carpetas, diseño de la base de datos (modelos y relaciones), especificación de los endpoints de la API (con ejemplos de request/response), explicación de middlewares de autenticación y autorización, configuración de Multer para la gestión de imágenes, y guía de instalación/configuración del entorno de desarrollo.

--> Documentación de Plan de Migración y Respaldo de Datos:

Propósito: Ofrecer un plan estratégico para el despliegue del software a diferentes entornos (producción) y asegurar la integridad de los datos.

Contenido: Procedimientos para la migración de código y base de datos (usando mongodump/mongorestore), estrategias para la migración y gestión de archivos subidos (imágenes), así como un plan detallado de respaldo (frecuencia, métodos, ubicación, retención) y procedimientos de restauración en caso de desastre.

--> Plan de Capacitación y Realización de Pruebas de Aceptación del Cliente (UAT):

Propósito: Asegurar que los usuarios finales están capacitados para usar el software y que este cumple con sus expectativas y requisitos de negocio.
Contenido:

--> Plan de Capacitación:

Audiencia: Quiénes serán capacitados (administradores, personal de ventas).

Objetivos: Qué deberían poder hacer los usuarios después de la capacitación.

Metodología: Sesiones presenciales/virtuales, tutoriales, videos, material de apoyo.

Contenido: Temas a cubrir (repaso del manual de usuario, funcionalidades específicas de su rol, resolución de dudas).

Cronograma: Fechas y duración de las sesiones.

-->Plan de Pruebas de Aceptación (UAT):

Objetivo de la UAT: Validar que la aplicación satisface los requisitos funcionales y no funcionales desde la perspectiva del usuario final.

Participantes: Quiénes realizarán las pruebas (usuarios clave del cliente).

Casos de Prueba: Escenarios de uso real (ej. "Registrar un nuevo usuario", "Añadir un producto con imagen", "Editar precio de producto", "Eliminar un producto").

Procedimiento: Cómo se ejecutarán las pruebas, cómo se reportarán los errores/feedback, herramientas a utilizar (hoja de cálculo, sistema de tickets).

Criterios de Aceptación: Qué condiciones deben cumplirse para que el cliente "acepte" el software (ej. 95% de casos de prueba pasados, errores críticos resueltos).

--> Cronograma: Duración de la fase UAT.

--> Plan de Comunicación: Cómo se comunicarán los resultados y el progreso.

# NailMakeupApp
es una aplicación web full-stack diseñada para una tienda en línea especializada en productos de Nail Art

>>>>>>> origin/main