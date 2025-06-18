// public/js/auth.js

// Definición global de showSection (fuera de DOMContentLoaded)
// Esto asegura que showSection esté disponible tan pronto como el script se carga
const showSection = (sectionToShow) => {
    const sections = document.querySelectorAll('section'); // Referencia las secciones dentro de la función para mayor robustez
    sections.forEach(section => {
        section.classList.add('hidden-section'); // Oculta todas las secciones
        section.classList.remove('current-section'); // Remueve la clase activa
    });
    if (sectionToShow) {
        sectionToShow.classList.remove('hidden-section'); // Muestra la sección deseada
        sectionToShow.classList.add('current-section'); // Añade la clase activa
    }
};
// Hacer showSection global para que otros scripts puedan llamarla
window.showSection = showSection;


document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');

    // Referencias a secciones
    const heroSection = document.getElementById('home'); // Asegúrate que el ID sea 'home' si así lo tienes en index.html
    const productsSection = document.getElementById('products');
    const addProductSection = document.getElementById('add-product');
    const loginSection = document.getElementById('login');
    const registerSection = document.getElementById('register');
    const myAccountSection = document.getElementById('my-account');

    // Referencias a elementos de navegación (contenedores y enlaces)
    const navHomeLink = document.getElementById('nav-home');
    const navProductsLink = document.getElementById('nav-products');
    const navAddProductContainer = document.getElementById('nav-add-product-container');
    const navAddProductLink = document.getElementById('nav-add-product');
    const navLoginContainer = document.getElementById('nav-login-container');
    const navLoginLink = document.getElementById('nav-login');
    const navRegisterContainer = document.getElementById('nav-register-container');
    const navRegisterLink = document.getElementById('nav-register');
    const navMyAccountContainer = document.getElementById('nav-my-account-container');
    const navMyAccountLink = document.getElementById('nav-my-account');
    const navLogoutContainer = document.getElementById('nav-logout-container');
    const navLogoutLink = document.getElementById('nav-logout');

    // --- Funciones de Utilidad ---

    /**
     * Actualiza la visibilidad de los elementos de navegación
     * basándose en si el usuario está logueado y su rol.
     * Hace una llamada a /api/auth/me para obtener el rol actual si hay token.
     */
    const updateNavVisibility = async () => {
        const token = localStorage.getItem('token');

        // Ocultar todos los elementos de navegación relacionados con el estado de autenticación
        if (navAddProductContainer) navAddProductContainer.style.display = 'none';
        if (navLoginContainer) navLoginContainer.style.display = 'none';
        if (navRegisterContainer) navRegisterContainer.style.display = 'none';
        if (navMyAccountContainer) navMyAccountContainer.style.display = 'none';
        if (navLogoutContainer) navLogoutContainer.style.display = 'none';

        if (token) {
            // Mostrar enlaces para usuario logueado
            if (navMyAccountContainer) navMyAccountContainer.style.display = 'block';
            if (navLogoutContainer) navLogoutContainer.style.display = 'block';

            // Para 'Añadir Producto', necesitamos el rol. Lo obtenemos de la API.
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const user = await response.json();
                    if (user && user.role === 'admin') {
                        if (navAddProductContainer) navAddProductContainer.style.display = 'block';
                    }
                } else {
                    // Token inválido o expirado. Limpiar y mostrar enlaces de no logueado.
                    console.warn('Token inválido o expirado al actualizar navegación. Limpiando token.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user'); // Asegurarse de limpiar también la info de usuario de main.js
                    if (navLoginContainer) navLoginContainer.style.display = 'block';
                    if (navRegisterContainer) navRegisterContainer.style.display = 'block';
                }
            } catch (error) {
                console.error('Error al verificar el rol para Añadir Producto:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (navLoginContainer) navLoginContainer.style.display = 'block';
                if (navRegisterContainer) navRegisterContainer.style.display = 'block';
            }
        } else {
            // No logueado: Mostrar Login y Registro
            if (navLoginContainer) navLoginContainer.style.display = 'block';
            if (navRegisterContainer) navRegisterContainer.style.display = 'block';
        }
    };

    /**
     * Realiza una solicitud de autenticación (login o registro) al backend.
     * @param {string} url - La URL de la API de autenticación.
     * @param {object} data - Los datos a enviar (email, password, username si aplica).
     * @returns {Promise<object>} La respuesta de la API.
     */
    const authRequest = async (url, data) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMessage = responseData.message || `Error HTTP: ${response.status}`;
                throw new Error(errorMessage);
            }

            return responseData;
        } catch (error) {
            console.error('Error en solicitud de autenticación:', error);
            throw error;
        }
    };

    /**
     * Maneja el proceso de inicio de sesión del usuario.
     */
    const loginUser = async (e) => {
        e.preventDefault();
        const email = loginEmailInput ? loginEmailInput.value : '';
        const password = loginPasswordInput ? loginPasswordInput.value : '';

        if (!email || !password) {
            alert('Por favor, ingresa email y contraseña.');
            return;
        }

        try {
            const data = await authRequest('/api/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            // Ya no almacenamos el objeto 'user' aquí. main.js lo obtendrá con fetchCurrentUser.
            alert(data.message || 'Inicio de sesión exitoso.');

            // Actualizar visibilidad de la navegación y refrescar productos
            await updateNavVisibility();
            if (window.refreshCurrentUserAndProducts) {
                await window.refreshCurrentUserAndProducts();
            }

            if (productsSection) showSection(productsSection);
            else if (heroSection) showSection(heroSection);
            if (loginForm) loginForm.reset();
        } catch (error) {
            alert(error.message || 'Error al iniciar sesión.');
        }
    };

    /**
     * Maneja el proceso de registro de un nuevo usuario.
     */
    const registerUser = async (e) => {
        e.preventDefault();
        const username = registerUsernameInput ? registerUsernameInput.value : '';
        const email = registerEmailInput ? registerEmailInput.value : '';
        const password = registerPasswordInput ? registerPasswordInput.value : '';

        if (!username || !email || !password) {
            alert('Por favor, ingresa todos los campos requeridos.');
            return;
        }

        try {
            const data = await authRequest('/api/auth/register', { username, email, password });
            localStorage.setItem('token', data.token);
            // Ya no almacenamos el objeto 'user' aquí. main.js lo obtendrá con fetchCurrentUser.
            alert(data.message || 'Registro exitoso.');

            // Actualizar visibilidad de la navegación y refrescar productos
            await updateNavVisibility();
            if (window.refreshCurrentUserAndProducts) {
                await window.refreshCurrentUserAndProducts();
            }

            if (productsSection) showSection(productsSection);
            else if (heroSection) showSection(heroSection);
            if (registerForm) registerForm.reset();
        } catch (error) {
            alert(error.message || 'Error al registrar usuario.');
        }
    };

    // --- Event Listeners ---

    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    } else {
        console.warn("Elemento con ID 'login-form' no encontrado.");
    }

    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    } else {
        console.warn("Elemento con ID 'register-form' no encontrado.");
    }

    if (navHomeLink) {
        navHomeLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = ''; // Vuelve al estado inicial sin hash
            if (heroSection) showSection(heroSection);
            // No es necesario refrescar productos aquí, ya que main.js maneja la hashchange
        });
    }

    if (navProductsLink) {
        navProductsLink.addEventListener('click', async (e) => {
            e.preventDefault();
            window.location.hash = 'products'; // Establece el hash para que main.js lo maneje
            if (productsSection) showSection(productsSection);
            // main.js debería manejar el fetchProducts() a través de su listener de hashchange
            // Pero como respaldo o para asegurar la consistencia, se llama aquí también.
            // La función refreshCurrentUserAndProducts es más completa
            if (window.refreshCurrentUserAndProducts) {
                await window.refreshCurrentUserAndProducts();
            }
        });
    }

    if (navAddProductLink) {
        navAddProductLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = 'add-product'; // Establece el hash
            if (addProductSection) showSection(addProductSection);
            // Resetea el formulario de producto al ir a añadir/editar
            const productForm = document.getElementById('product-form');
            if (productForm) {
                productForm.reset();
                const productIdInput = document.getElementById('productId');
                const submitBtn = productForm.querySelector('button[type="submit"]');
                const imageUrlDisplay = document.getElementById('imageUrlDisplay');
                const imageUrlInput = document.getElementById('imageUrl');

                if (productIdInput) productIdInput.value = '';
                if (submitBtn) submitBtn.textContent = 'Añadir Producto';
                if (imageUrlDisplay) imageUrlDisplay.textContent = 'Ningún archivo seleccionado';
                if (imageUrlInput) imageUrlInput.value = '';
            }
        });
    }

    if (navMyAccountLink) {
        navMyAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = 'my-account'; // Establece el hash
            if (myAccountSection) showSection(myAccountSection);
        });
    }

    if (navLoginLink) {
        navLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = 'login'; // Establece el hash
            if (loginSection) showSection(loginSection);
            if (loginForm) loginForm.reset();
        });
    }

    if (navRegisterLink) {
        navRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = 'register'; // Establece el hash
            if (registerSection) showSection(registerSection);
            if (registerForm) registerForm.reset();
        });
    }

    if (navLogoutLink) {
        navLogoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user'); // Importante: Limpiar también la info de usuario que main.js pueda haber guardado.
            alert('Sesión cerrada correctamente.');

            // Actualizar visibilidad de la navegación y refrescar productos (ahora sin botones de admin)
            await updateNavVisibility();
            if (window.refreshCurrentUserAndProducts) {
                await window.refreshCurrentUserAndProducts();
            }

            window.location.hash = ''; // Vuelve a la página de inicio sin hash
            if (heroSection) showSection(heroSection);
        });
    }

    // Listener para el botón "Explorar Productos" en la sección Hero
    const exploreProductsBtn = document.getElementById('explore-products-btn');
    if (exploreProductsBtn) {
        exploreProductsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            window.location.hash = 'products'; // Establece el hash
            if (productsSection) showSection(productsSection);
            // Esto es crucial para que main.js obtenga la info del usuario y luego cargue productos
            if (window.refreshCurrentUserAndProducts) {
                await window.refreshCurrentUserAndProducts();
            }
        });
    }


    // --- Inicialización ---
    // Usamos un setTimeout para asegurar que main.js ya haya expuesto window.refreshCurrentUserAndProducts
    setTimeout(async () => {
        await updateNavVisibility(); // Actualizar la navegación primero

        // Determinar la sección inicial
        const currentHash = window.location.hash;
        let initialSection = heroSection; // Default a heroSection

        if (currentHash === '#products' && productsSection) {
            initialSection = productsSection;
            // Si la sección inicial es productos, pedimos a main.js que los recargue con el estado actual
            if (window.refreshCurrentUserAndProducts) {
                await window.refreshCurrentUserAndProducts();
            }
        } else if (currentHash === '#add-product' && addProductSection) {
            initialSection = addProductSection;
        } else if (currentHash === '#login' && loginSection) {
            initialSection = loginSection;
        } else if (currentHash === '#register' && registerSection) {
            initialSection = registerSection;
        } else if (currentHash === '#my-account' && myAccountSection) {
            initialSection = myAccountSection;
        } else if (currentHash === '#home' && heroSection) { // Manejar explícitamente #home
            initialSection = heroSection;
        }

        // Si initialSection no se ha asignado correctamente por algún motivo, asegurar que se muestre heroSection
        if (!initialSection) {
            initialSection = heroSection;
        }

        showSection(initialSection); // Muestra la sección correcta

    }, 100); // Un pequeño retraso.
});