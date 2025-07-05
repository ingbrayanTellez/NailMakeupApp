// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const registerUsernameInput = document.getElementById('register-username');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const navLogoutLink = document.getElementById('nav-logout-link');

    // --- Función de Utilidad para Autenticación ---
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
                // Si la respuesta no es OK, el backend ya debería enviar un mensaje de error útil
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error('auth.js: Error en solicitud de autenticación:', error);
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
            window.showMessage('Por favor, ingresa tu email y contraseña.', 'warning', 'login-message-container');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            window.showMessage('Formato de email inválido.', 'error', 'login-message-container');
            return;
        }

        window.showMessage('Iniciando sesión...', 'info', 'login-message-container');

        try {
            const data = await authRequest('/api/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            // No guardar el objeto 'user' aquí; main.js lo fetchará con /api/auth/me
            // localStorage.setItem('user', JSON.stringify(data.user)); // Eliminado
            
            window.showMessage('¡Inicio de sesión exitoso!', 'success', 'login-message-container');
            
            // Llama a la función global de main.js para actualizar la UI completa
            if (typeof window.refreshCurrentUserAndProducts === 'function') {
                await window.refreshCurrentUserAndProducts();
                window.showSection('products'); // Redirige a la sección de productos
            } else {
                console.error("auth.js: window.refreshCurrentUserAndProducts no está disponible. Asegúrate de que main.js se cargue primero.");
                // Fallback si main.js no carga correctamente (menos ideal)
                window.location.hash = '#products';
            }

            if (loginForm) loginForm.reset(); // Limpiar formulario
        } catch (error) {
            window.showMessage(error.message || 'Error al iniciar sesión. Credenciales inválidas.', 'error', 'login-message-container');
            console.error('auth.js: Login error:', error);
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

        // Validaciones básicas
        if (!username || !email || !password) {
            window.showMessage('Por favor, completa todos los campos.', 'warning', 'register-message-container');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            window.showMessage('Formato de email inválido.', 'error', 'register-message-container');
            return;
        }
        if (password.length < 6) {
            window.showMessage('La contraseña debe tener al menos 6 caracteres.', 'warning', 'register-message-container');
            return;
        }

        window.showMessage('Registrando usuario...', 'info', 'register-message-container');

        try {
            const data = await authRequest('/api/auth/register', { username, email, password });
            // Después del registro, no necesitamos auto-loguear aquí.
            // Si el backend devuelve un token al registrar, puedes optar por guardarlo.
            // Por ahora, asumimos que el usuario debe loguearse después.
            
            window.showMessage('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success', 'register-message-container');
            if (registerForm) registerForm.reset(); // Limpia los campos del formulario
            if (typeof window.showSection === 'function') {
                window.showSection('login'); // Redirige a la sección de login
            } else {
                window.location.hash = '#login';
            }
            // No es necesario llamar a refreshCurrentUserAndProducts aquí a menos que el registro auto-loguee
        } catch (error) {
            window.showMessage(error.message || 'Error en el registro. El usuario o email ya existe.', 'error', 'register-message-container');
            console.error('auth.js: Registration error:', error);
        }
    };

    // --- Event Listeners ---
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    } else {
        console.warn("auth.js: Elemento con ID 'login-form' no encontrado.");
    }

    if (registerForm) {
        registerForm.addEventListener('submit', registerUser);
    } else {
        console.warn("auth.js: Elemento con ID 'register-form' no encontrado.");
    }

    // --- Lógica de CERRAR SESIÓN ---
    if (navLogoutLink) {
        navLogoutLink.addEventListener('click', async (e) => {
            e.preventDefault(); // Evita que el enlace # recargue la página o cambie el hash

            window.showConfirmModal('¿Estás seguro de que quieres cerrar sesión?', async () => {
                // Limpiar el token y la información del usuario del almacenamiento local
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('currentUserId'); 

                window.showMessage('Sesión cerrada correctamente.', 'success');
                
                // Llama a la función global de main.js para actualizar la UI completa
                if (typeof window.refreshCurrentUserAndProducts === 'function') {
                    await window.refreshCurrentUserAndProducts();
                    window.showSection('home'); // Redirigir a la página de inicio
                } else {
                    console.error("auth.js: window.refreshCurrentUserAndProducts no está disponible. Asegúrate de que main.js se cargue primero y exponga esta función.");
                    // Fallback básico si main.js no carga correctamente
                    window.location.hash = '#home';
                }
            });
        });
    } else {
        console.warn("auth.js: Enlace de cerrar sesión (nav-logout-link) no encontrado.");
    }
});
