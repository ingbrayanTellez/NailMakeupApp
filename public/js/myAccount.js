// public/js/myAccount.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const purchaseHistoryList = document.getElementById('purchase-history-list');
    const cartActivityList = document.getElementById('cart-activity-list'); // Mantener para futura expansión si es necesario
    const myAccountMessageContainer = document.getElementById('my-account-message-container');

    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const editProfileFormContainer = document.getElementById('edit-profile-form-container');
    const changePasswordFormContainer = document.getElementById('change-password-form-container');
    const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
    const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const changePasswordEmailInput = document.getElementById('change-password-email');


    const avatarUploadInput = document.getElementById('avatarUploadInput');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    const cancelAvatarBtn = document.getElementById('cancelAvatarBtn');
    const avatarFileNameSpan = document.getElementById('avatarFileName');
    const currentAvatarImage = document.getElementById('profile-image'); // Asume que ya existe

    // --- Funciones de Utilidad ---
    const getToken = () => localStorage.getItem('token');
    const getUserId = () => localStorage.getItem('currentUserId');

    /**
     * Muestra un mensaje en un contenedor específico dentro de la sección "Mi Cuenta".
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - Tipo de mensaje ('success', 'error', 'warning', 'info').
     * @param {string} targetContainerId - ID del contenedor donde se mostrará el mensaje (default: 'my-account-message-container').
     */
    const showMyAccountMessage = (message, type, targetContainerId = 'my-account-message-container') => {
        const container = document.getElementById(targetContainerId);
        if (container) {
            container.textContent = message;
            container.className = `form-message-container show ${type}-message`;
            container.style.display = 'block';
            setTimeout(() => {
                container.classList.remove('show');
                container.style.display = 'none';
                container.textContent = '';
                container.className = 'form-message-container';
            }, 5000);
        } else {
            console.warn(`myAccount.js: Contenedor de mensajes con ID '${targetContainerId}' no encontrado. Mensaje: ${message}`);
        }
    };


    // --- Funciones para Historial de Compras ---

    /**
     * Renderiza el historial de compras del usuario.
     * Expuesto globalmente como window.renderPurchaseHistory.
     */
    window.renderPurchaseHistory = async () => {
        console.log('myAccount.js: renderPurchaseHistory llamado.');
        const token = getToken();
        if (!token) {
            if (purchaseHistoryList) purchaseHistoryList.innerHTML = '<p class="text-center text-gray-500">Inicia sesión para ver tu historial de compras.</p>';
            return;
        }

        if (purchaseHistoryList) {
            purchaseHistoryList.innerHTML = '<p class="text-center text-gray-500">Cargando historial de compras...</p>';
        }

        try {
            const response = await fetch('/api/orders/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const orders = await response.json();
                console.log('myAccount.js: Órdenes obtenidas:', orders);
                displayPurchaseHistory(orders);
            } else if (response.status === 401 || response.status === 403) {
                showMyAccountMessage('No autorizado para ver el historial de compras. Por favor, inicia sesión de nuevo.', 'error');
                if (purchaseHistoryList) purchaseHistoryList.innerHTML = '<p class="text-center text-gray-500">Error de autenticación. Inicia sesión.</p>';
            } else {
                const errorData = await response.json();
                showMyAccountMessage(errorData.message || 'Error al cargar el historial de compras.', 'error');
                if (purchaseHistoryList) purchaseHistoryList.innerHTML = '<p class="text-center text-gray-500">Error al cargar el historial.</p>';
            }
        } catch (error) {
            console.error('myAccount.js: Error de red al cargar el historial de compras:', error);
            showMyAccountMessage('Error de conexión al cargar el historial de compras.', 'error');
            if (purchaseHistoryList) purchaseHistoryList.innerHTML = '<p class="text-center text-gray-500">Error de conexión.</p>';
        }
    };

    /**
     * Muestra las órdenes en el DOM.
     * @param {Array} orders - Array de objetos de orden.
     */
    const displayPurchaseHistory = (orders) => {
        if (!purchaseHistoryList) return;

        purchaseHistoryList.innerHTML = ''; // Limpiar lista existente

        if (orders.length === 0) {
            purchaseHistoryList.innerHTML = '<p class="text-center text-gray-500">No tienes compras realizadas todavía.</p>';
            return;
        }

        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('purchase-order-card'); // Clase para estilizar la tarjeta de orden

            const orderDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // === CAMBIOS APLICADOS AQUÍ PARA MANEJAR UNDEFINED ===
            let itemsHtml = order.items.map(item => {
                // Comprobaciones defensivas para item.productId y sus propiedades
                const productName = item && item.productId && item.productId.name ? item.productId.name : (item.name || 'Producto Desconocido');
                const itemQuantity = item && item.quantity ? item.quantity : 0;
                const itemPrice = item && item.productId && item.productId.price ? item.productId.price : (item.price || 0);
                const imageUrl = item && item.productId && item.productId.imageUrl ? item.productId.imageUrl : (item.imageUrl || '/img/placeholder.png');

                return `
                    <div class="order-item-detail">
                        <img src="${imageUrl}" alt="${productName}" class="order-item-image">
                        <span>${productName} (x${itemQuantity}) - $${itemPrice.toFixed(2)} c/u</span>
                    </div>
                `;
            }).join('');
            // ======================================================

            // Comprobaciones defensivas para shippingInfo y total
            const shippingName = order.shippingInfo && order.shippingInfo.name ? order.shippingInfo.name : 'N/A';
            const shippingAddress = order.shippingInfo && order.shippingInfo.address ? order.shippingInfo.address : 'N/A';
            const shippingCity = order.shippingInfo && order.shippingInfo.city ? order.shippingInfo.city : 'N/A';
            const shippingZip = order.shippingInfo && order.shippingInfo.zip ? order.shippingInfo.zip : 'N/A';
            const shippingCountry = order.shippingInfo && order.shippingInfo.country ? order.shippingInfo.country : 'N/A';
            const orderTotal = order.total ? order.total.toFixed(2) : '0.00';


            orderDiv.innerHTML = `
                <h3 class="order-id">Pedido ID: ${order._id}</h3>
                <p class="order-date">Fecha: ${orderDate}</p>
                <p class="order-total">Total: $${orderTotal}</p>
                <p class="order-status">Estado: <span class="status-${order.status}">${order.status}</span></p>
                <div class="order-items-container">
                    <h4>Productos:</h4>
                    ${itemsHtml}
                </div>
                <div class="order-shipping-info">
                    <h4>Envío a:</h4>
                    <p>${shippingName}</p>
                    <p>${shippingAddress}, ${shippingCity}</p>
                    <p>${shippingZip}, ${shippingCountry}</p>
                </div>
            `;
            purchaseHistoryList.appendChild(orderDiv);
        });
    };


    // --- Funciones para Perfil de Usuario ---

    /**
     * Carga la información del perfil del usuario en el formulario de edición.
     * Expuesto globalmente como window.loadUserProfile.
     */
    window.loadUserProfile = async () => {
        const currentUser = window.currentUserInfo; // Asume que main.js ya ha cargado currentUserInfo
        if (currentUser) {
            if (editProfileForm.username) editProfileForm.username.value = currentUser.username || '';
            if (editProfileForm.email) editProfileForm.email.value = currentUser.email || '';
            // Asegurarse de que el campo de email en el formulario de cambio de contraseña también se rellena
            if (changePasswordEmailInput) changePasswordEmailInput.value = currentUser.email || ''; 
            if (currentAvatarImage) currentAvatarImage.src = currentUser.avatarUrl || '/img/default-avatar.png';
        } else {
            showMyAccountMessage('No se pudo cargar la información del perfil. Por favor, inicia sesión.', 'warning');
        }
    };

    /**
     * Actualiza el perfil del usuario.
     */
    const updateProfile = async (event) => {
        event.preventDefault();
        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) {
            showMyAccountMessage('No autorizado. Por favor, inicia sesión.', 'error');
            return;
        }

        const username = editProfileForm.username.value.trim();
        const email = editProfileForm.email.value.trim();

        if (!username || !email) {
            showMyAccountMessage('El nombre de usuario y el email no pueden estar vacíos.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, email })
            });

            const data = await response.json();
            if (response.ok) {
                showMyAccountMessage(data.message || 'Perfil actualizado con éxito.', 'success');
                // Actualizar la información del usuario en localStorage y la variable global
                localStorage.setItem('user', JSON.stringify(data.user));
                window.currentUserInfo = data.user; 
                // Recargar el perfil para reflejar los cambios en la UI
                await window.loadUserProfile();
                // Ocultar el formulario de edición
                editProfileFormContainer.classList.add('hidden');
                editProfileBtn.classList.remove('hidden');
                changePasswordBtn.classList.remove('hidden');

            } else {
                showMyAccountMessage(data.message || 'Error al actualizar el perfil.', 'error');
            }
        } catch (error) {
            console.error('myAccount.js: Error de red al actualizar perfil:', error);
            showMyAccountMessage('Error de conexión al actualizar el perfil.', 'error');
        }
    };

    /**
     * Cambia la contraseña del usuario.
     */
    const changePassword = async (event) => {
        event.preventDefault();
        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) {
            showMyAccountMessage('No autorizado. Por favor, inicia sesión.', 'error');
            return;
        }

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const email = document.getElementById('change-password-email').value; // Usar el email del campo oculto

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            showMyAccountMessage('Por favor, rellena todos los campos de contraseña.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showMyAccountMessage('La nueva contraseña y la confirmación no coinciden.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showMyAccountMessage('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, oldPassword, newPassword }) // Enviar email también
            });

            const data = await response.json();
            if (response.ok) {
                showMyAccountMessage(data.message || 'Contraseña actualizada con éxito.', 'success');
                changePasswordForm.reset();
                // Ocultar el formulario de cambio de contraseña
                changePasswordFormContainer.classList.add('hidden');
                editProfileBtn.classList.remove('hidden');
                changePasswordBtn.classList.remove('hidden');
            } else {
                showMyAccountMessage(data.message || 'Error al cambiar la contraseña.', 'error');
            }
        } catch (error) {
            console.error('myAccount.js: Error de red al cambiar contraseña:', error);
            showMyAccountMessage('Error de conexión al cambiar la contraseña.', 'error');
        }
    };


    // --- Funciones para Avatar ---

    /**
     * Maneja la selección de un archivo de avatar.
     */
    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (avatarFileNameSpan) avatarFileNameSpan.textContent = file.name;
                if (saveAvatarBtn) saveAvatarBtn.style.display = 'inline-block';
                if (cancelAvatarBtn) cancelAvatarBtn.style.display = 'inline-block';
                if (changeAvatarBtn) changeAvatarBtn.style.display = 'none';
            } else {
                if (avatarFileNameSpan) avatarFileNameSpan.textContent = '';
                if (saveAvatarBtn) saveAvatarBtn.style.display = 'none';
                if (cancelAvatarBtn) cancelAvatarBtn.style.display = 'none';
                if (changeAvatarBtn) changeAvatarBtn.style.display = 'inline-block';
            }
        });
    }

    /**
     * Maneja la cancelación de la subida de avatar.
     */
    if (cancelAvatarBtn) {
        cancelAvatarBtn.addEventListener('click', () => {
            if (avatarUploadInput) avatarUploadInput.value = '';
            if (avatarFileNameSpan) avatarFileNameSpan.textContent = '';
            if (saveAvatarBtn) saveAvatarBtn.style.display = 'none';
            if (cancelAvatarBtn) cancelAvatarBtn.style.display = 'none';
            if (changeAvatarBtn) changeAvatarBtn.style.display = 'inline-block';
        });
    }

    /**
     * Sube el nuevo avatar al servidor.
     */
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', async () => {
            const token = getToken();
            const userId = getUserId();
            if (!token || !userId) {
                showMyAccountMessage('No autorizado. Por favor, inicia sesión.', 'error', 'avatarMessage');
                return;
            }

            const file = avatarUploadInput.files[0];
            if (!file) {
                showMyAccountMessage('Por favor, selecciona un archivo de imagen para el avatar.', 'warning', 'avatarMessage');
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file); // 'avatar' debe coincidir con el nombre del campo en Multer

            showMyAccountMessage('Subiendo avatar...', 'info', 'avatarMessage');

            try {
                const response = await fetch(`/api/users/${userId}/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();
                if (response.ok) {
                    showMyAccountMessage(data.message || 'Avatar actualizado con éxito.', 'success', 'avatarMessage');
                    // Actualizar la imagen en la UI
                    if (currentAvatarImage) currentAvatarImage.src = data.avatarUrl || '/img/default-avatar.png';
                    // Actualizar localStorage y currentUserInfo
                    const updatedUser = { ...window.currentUserInfo, avatarUrl: data.avatarUrl };
                    window.currentUserInfo = updatedUser;
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    if (avatarUploadInput) avatarUploadInput.value = '';
                    if (avatarFileNameSpan) avatarFileNameSpan.textContent = '';
                    if (saveAvatarBtn) saveAvatarBtn.style.display = 'none';
                    if (cancelAvatarBtn) cancelAvatarBtn.style.display = 'none';
                    if (changeAvatarBtn) changeAvatarBtn.style.display = 'inline-block'; 
                    
                    if (typeof window.refreshCurrentUserAndProducts === 'function') {
                        await window.refreshCurrentUserAndProducts(); 
                    }
                } else {
                    showMyAccountMessage(data.message || 'Error al actualizar el avatar.', 'error', 'avatarMessage');
                }
            } catch (error) {
                console.error('myAccount.js: Error de red al actualizar avatar:', error);
                showMyAccountMessage('Error de conexión al actualizar el avatar.', 'error', 'avatarMessage');
            }
        });
    }


    // --- Listeners para mostrar/ocultar formularios ---
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', async () => {
            editProfileFormContainer.classList.remove('hidden');
            changePasswordFormContainer.classList.add('hidden');
            editProfileBtn.classList.add('hidden');
            changePasswordBtn.classList.add('hidden');
            await window.loadUserProfile(); // Cargar datos actuales al abrir el formulario
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            changePasswordFormContainer.classList.remove('hidden');
            editProfileFormContainer.classList.add('hidden');
            editProfileBtn.classList.add('hidden');
            changePasswordBtn.classList.add('hidden');
            // Asegurarse de que el email se rellena al abrir el formulario de cambio de contraseña
            const currentUser = window.currentUserInfo;
            if (currentUser && changePasswordEmailInput) {
                changePasswordEmailInput.value = currentUser.email || '';
            }
        });
    }

    if (cancelEditProfileBtn) {
        cancelEditProfileBtn.addEventListener('click', () => {
            editProfileFormContainer.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            changePasswordBtn.classList.remove('hidden');
            editProfileForm.reset();
            // Limpiar mensajes de validación si los hay
            document.querySelectorAll('.validation-error').forEach(el => el.textContent = '');
        });
    }

    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', () => {
            changePasswordFormContainer.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            changePasswordBtn.classList.remove('hidden');
            changePasswordForm.reset();
            // Limpiar mensajes de validación si los hay
            document.querySelectorAll('.validation-error').forEach(el => el.textContent = '');
        });
    }

    // --- Listener para envío de formularios ---
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', updateProfile);
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }

    // Llamada inicial para cargar el historial de compras cuando la sección de la cuenta se activa
    // Esto se maneja en main.js a través de window.showSection('my-account')
});