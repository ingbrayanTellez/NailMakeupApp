// public/js/myAccount.js
console.log('myAccount.js: Script loaded - Version 2025-07-04-EDIT-PASSWORD-FIX'); // Updated version string for debugging

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const purchaseHistoryList = document.getElementById('purchase-history-list');
    const cartActivityList = document.getElementById('cart-activity-list');
    const myAccountMessageContainer = document.getElementById('my-account-message-container');
    const myAccountSection = document.getElementById('my-account'); // Assuming this exists for class toggling

    const profileUsernameSpan = document.getElementById('profile-username');
    const profileEmailSpan = document.getElementById('profile-email');
    const profileRoleSpan = document.getElementById('profile-role');

    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const editProfileFormContainer = document.getElementById('edit-profile-form-container');
    const changePasswordFormContainer = document.getElementById('change-password-form-container');
    const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
    const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');

    const editProfileForm = document.getElementById('edit-profile-form');
    const editUsernameInput = document.getElementById('edit-username');
    const editEmailInput = document.getElementById('edit-email');

    const changePasswordForm = document.getElementById('change-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    const changePasswordEmailInput = document.getElementById('change-password-email');

    const avatarUploadInput = document.getElementById('avatarUploadInput');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    const cancelAvatarBtn = document.getElementById('cancelAvatarBtn');
    const avatarFileNameSpan = document.getElementById('avatarFileName');
    const currentAvatarImage = document.getElementById('profile-image');
    const avatarMessageContainer = document.getElementById('avatarMessage');


    // --- Funciones de Utilidad ---
    const getToken = () => localStorage.getItem('token');
    // REMOVED: const getUserId = () => localStorage.getItem('currentUserId'); // No longer needed directly
    const getCurrentUserFromLocalStorage = () => {
        try {
            const userString = localStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch (e) {
            console.error("myAccount.js: Error parsing user from localStorage:", e);
            return null;
        }
    };


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

    /**
     * Validates form fields.
     * @param {Array<Object>} fields - An array of objects with { id, msg, pattern (optional) }.
     * @returns {boolean} True if all fields are valid, false otherwise.
     */
    const validateFormFields = (fields) => {
        let isValid = true;
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorSpan = document.getElementById(`${field.id}-error`);
            if (input && errorSpan) {
                if (input.value.trim() === '') {
                    errorSpan.textContent = field.msg;
                    isValid = false;
                } else if (field.pattern && !field.pattern.test(input.value.trim())) {
                    errorSpan.textContent = field.msg;
                    isValid = false;
                } else {
                    errorSpan.textContent = '';
                }
            } else {
                console.warn(`myAccount.js: validateFormFields - Input or error span not found for ID: ${field.id}`);
            }
        });
        return isValid;
    };

    /**
     * Clears form validation error messages.
     * @param {string} formId - The ID of the form whose errors are to be cleared.
     */
    const clearValidationErrors = (formId) => {
        const form = document.getElementById(formId);
        if (form) {
            form.querySelectorAll('.validation-error').forEach(span => {
                span.textContent = '';
            });
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

            const data = await (window.handleApiResponse ? window.handleApiResponse(response) : response.json());

            if (response.ok) {
                console.log('myAccount.js: Órdenes obtenidas:', data);
                displayPurchaseHistory(data);
            } else {
                showMyAccountMessage(data.message || 'Error al cargar el historial de compras.', 'error');
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

            let itemsHtml = order.items.map(item => {
                const productName = item && item.productId && item.productId.name ? item.productId.name : (item.name || 'Producto Desconocido');
                const itemQuantity = item && item.quantity ? item.quantity : 0;
                const itemPrice = item && item.productId && item.productId.price ? item.productId.price : (item.price || 0);
                // REMOVED: imageUrl = item && item.productId && item.productId.imageUrl ? item.productId.imageUrl : (item.imageUrl || '/img/placeholder.png');
                // REMOVED: <img src="${imageUrl}" alt="${productName}" class="order-item-image">
                return `
                    <div class="order-item-detail">
                        <span>${productName} (x${itemQuantity}) - $${itemPrice.toFixed(2)} c/u</span>
                    </div>
                `;
            }).join('');

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
     * Carga la información del perfil del usuario en la sección "Mi Cuenta" y formularios.
     * Expuesto globalmente como window.loadUserProfile.
     */
    window.loadUserProfile = async () => {
        console.log('myAccount.js: loadUserProfile called.');
        const token = getToken();
        if (!token) {
            showMyAccountMessage('You need to log in to view your account.', 'error');
            if (window.showSection) window.showSection('login');
            return;
        }

        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await (window.handleApiResponse ? window.handleApiResponse(response) : response.json());

            if (response.ok) {
                console.log('myAccount.js: User information loaded:', data);
                // Update global user info (main.js might also do this)
                window.currentUserInfo = data; 

                if (profileUsernameSpan) profileUsernameSpan.textContent = data.username;
                if (profileEmailSpan) profileEmailSpan.textContent = data.email;
                if (profileRoleSpan) profileRoleSpan.textContent = data.role;

                // Set initial values for edit form
                if (editUsernameInput) editUsernameInput.value = data.username || '';
                if (editEmailInput) editEmailInput.value = data.email || '';
                if (changePasswordEmailInput) changePasswordEmailInput.value = data.email || '';

                // Set avatar image
                if (currentAvatarImage) {
                    currentAvatarImage.src = data.avatarUrl || '/img/default-avatar.png';
                }

            } else {
                showMyAccountMessage(data.message || 'Error loading account information.', 'error');
                console.error('myAccount.js: Error loading account information:', data);
            }
        } catch (error) {
            console.error('myAccount.js: Error loading account information:', error);
            if (!error.message.includes('Session expired')) {
                showMyAccountMessage('Connection error loading account.', 'error');
            }
        }
    };


    /**
     * Actualiza el perfil del usuario.
     */
    const updateProfile = async (event) => {
        event.preventDefault();
        console.log('myAccount.js: updateProfile submission initiated.');

        clearValidationErrors('edit-profile-form');
        const fieldsToValidate = [
            { id: 'edit-username', msg: 'El nombre de usuario es requerido.' },
            { id: 'edit-email', msg: 'El email es requerido y debe ser válido.', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        ];

        if (!validateFormFields(fieldsToValidate)) {
            console.log('myAccount.js: Edit profile form validation failed.');
            showMyAccountMessage('Por favor, corrige los errores en el formulario.', 'error');
            return;
        }

        const token = getToken();
        // MODIFICACIÓN CLAVE: Usar _id de window.currentUserInfo
        const userId = window.currentUserInfo ? window.currentUserInfo._id : null; 

        if (!token || !userId) {
            console.warn('myAccount.js: No token or user ID found for profile update. Redirecting to login.');
            showMyAccountMessage('No autorizado. Por favor, inicia sesión.', 'error');
            if (window.showSection) window.showSection('login');
            return;
        }

        const username = editUsernameInput.value.trim();
        const email = editEmailInput.value.trim();

        const updatedUser = { username, email };
        console.log('myAccount.js: Sending profile update request to /api/users/' + userId + ' with data:', updatedUser);

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedUser)
            });

            console.log('myAccount.js: Profile update API response status:', response.status);
            const data = await (window.handleApiResponse ? window.handleApiResponse(response) : response.json());

            if (response.ok) {
                console.log('myAccount.js: Profile updated successfully. Backend response:', data);
                showMyAccountMessage(data.message || 'Perfil actualizado con éxito.', 'success');
                // Update localStorage and global user info
                if (data.user) { // Backend should return updated user object
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.currentUserInfo = data.user; 
                }
                await window.loadUserProfile(); // Reload profile info to reflect changes
                if (editProfileFormContainer) editProfileFormContainer.classList.add('hidden');
                if (myAccountSection) myAccountSection.classList.remove('show-edit-profile');
                if (editProfileBtn) editProfileBtn.classList.remove('hidden');
                if (changePasswordBtn) changePasswordBtn.classList.remove('hidden');

            } else {
                console.error('myAccount.js: Error updating profile. Backend message:', data.message || data);
                showMyAccountMessage(data.message || 'Error al actualizar el perfil.', 'error');
            }
        } catch (error) {
            console.error('myAccount.js: Network or API error updating profile:', error);
            if (!error.message.includes('Session expired')) {
                showMyAccountMessage('Error de conexión al actualizar el perfil.', 'error');
            }
        }
    };

    /**
     * Cambia la contraseña del usuario.
     */
    const changePassword = async (event) => {
        event.preventDefault();
        console.log('myAccount.js: changePassword submission initiated.');

        clearValidationErrors('change-password-form');
        const fieldsToValidate = [
            { id: 'current-password', msg: 'La contraseña actual es requerida.' },
            { id: 'new-password', msg: 'La nueva contraseña es requerida y debe tener al menos 6 caracteres.', pattern: /^.{6,}$/ },
            { id: 'confirm-new-password', msg: 'Confirma tu nueva contraseña.' }
        ];

        if (!validateFormFields(fieldsToValidate)) {
            console.log('myAccount.js: Change password form validation failed (fields).');
            showMyAccountMessage('Por favor, corrige los errores en el formulario.', 'error');
            return;
        }

        if (newPasswordInput.value !== confirmNewPasswordInput.value) {
            const confirmNewPasswordErrorSpan = document.getElementById('confirm-new-password-error');
            if (confirmNewPasswordErrorSpan) confirmNewPasswordErrorSpan.textContent = 'Las contraseñas no coinciden.';
            console.log('myAccount.js: Change password form validation failed (passwords mismatch).');
            showMyAccountMessage('Las nuevas contraseñas no coinciden.', 'error');
            return;
        }

        const token = getToken();
        // MODIFICACIÓN CLAVE: Usar _id de window.currentUserInfo
        const userId = window.currentUserInfo ? window.currentUserInfo._id : null;

        if (!token || !userId) {
            console.warn('myAccount.js: No token or user ID found for password change. Redirecting to login.');
            showMyAccountMessage('No autorizado. Por favor, inicia sesión.', 'error');
            if (window.showSection) window.showSection('login');
            return;
        }

        const oldPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const email = changePasswordEmailInput.value; // Use the email from the input field


        const passwordData = { email, oldPassword, newPassword };
        console.log('myAccount.js: Sending password change request to /api/users/' + userId + '/password.');

        try {
            const response = await fetch(`/api/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            console.log('myAccount.js: Password change API response status:', response.status);
            const data = await (window.handleApiResponse ? window.handleApiResponse(response) : response.json());

            if (response.ok) {
                console.log('myAccount.js: Password changed successfully. Backend response:', data);
                showMyAccountMessage(data.message || 'Contraseña actualizada con éxito.', 'success');
                changePasswordForm.reset();
                if (changePasswordFormContainer) changePasswordFormContainer.classList.add('hidden');
                if (myAccountSection) myAccountSection.classList.remove('show-change-password');
                if (editProfileBtn) editProfileBtn.classList.remove('hidden');
                if (changePasswordBtn) changePasswordBtn.classList.remove('hidden');
            } else {
                console.error('myAccount.js: Error changing password. Backend message:', data.message || data);
                showMyAccountMessage(data.message || 'Error al cambiar la contraseña.', 'error');
            }
        } catch (error) {
            console.error('myAccount.js: Network or API error changing password:', error);
            if (!error.message.includes('Session expired')) {
                showMyAccountMessage('Error de conexión al cambiar la contraseña.', 'error');
            }
        }
    };


    // --- Funciones para Avatar ---

    /**
     * Maneja la selección de un archivo de avatar.
     */
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            if (avatarUploadInput) avatarUploadInput.click();
        });
    }

    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (avatarFileNameSpan) avatarFileNameSpan.textContent = file.name;
                if (saveAvatarBtn) saveAvatarBtn.style.display = 'inline-block';
                if (cancelAvatarBtn) cancelAvatarBtn.style.display = 'inline-block';
                if (changeAvatarBtn) changeAvatarBtn.style.display = 'none';

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (currentAvatarImage) currentAvatarImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                if (avatarFileNameSpan) avatarFileNameSpan.textContent = '';
                if (saveAvatarBtn) saveAvatarBtn.style.display = 'none';
                if (cancelAvatarBtn) cancelAvatarBtn.style.display = 'none';
                if (changeAvatarBtn) changeAvatarBtn.style.display = 'inline-block';
                const currentUser = getCurrentUserFromLocalStorage();
                if (currentAvatarImage) currentAvatarImage.src = currentUser?.avatarUrl || '/img/default-avatar.png';
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
            const currentUser = getCurrentUserFromLocalStorage();
            if (currentAvatarImage) currentAvatarImage.src = currentUser?.avatarUrl || '/img/default-avatar.png';
            showMyAccountMessage('', 'info', 'avatarMessage');
        });
    }

    /**
     * Sube el nuevo avatar al servidor.
     */
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', async () => {
            const token = getToken();
            // MODIFICACIÓN CLAVE: Usar _id de window.currentUserInfo
            const userId = window.currentUserInfo ? window.currentUserInfo._id : null;

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
            formData.append('avatar', file);

            showMyAccountMessage('Subiendo avatar...', 'info', 'avatarMessage');
            if (saveAvatarBtn) saveAvatarBtn.disabled = true;
            if (cancelAvatarBtn) cancelAvatarBtn.disabled = true;

            try {
                const response = await fetch(`/api/users/${userId}/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await (window.handleApiResponse ? window.handleApiResponse(response) : response.json());

                if (response.ok) {
                    showMyAccountMessage(data.message || 'Avatar actualizado con éxito.', 'success', 'avatarMessage');
                    // Update avatar URL in localStorage and global user info
                    if (data.avatarUrl) { // Backend should return the new avatarUrl
                        const currentUser = getCurrentUserFromLocalStorage();
                        if (currentUser) {
                            localStorage.setItem('user', JSON.stringify({ ...currentUser, avatarUrl: data.avatarUrl }));
                            window.currentUserInfo = { ...currentUser, avatarUrl: data.avatarUrl };
                        }
                    }
                    if (currentAvatarImage) currentAvatarImage.src = data.avatarUrl || '/img/default-avatar.png';
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
            } finally {
                if (saveAvatarBtn) saveAvatarBtn.disabled = false;
                if (cancelAvatarBtn) cancelAvatarBtn.disabled = false;
            }
        });
    }


    // --- Listeners para mostrar/ocultar formularios ---
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', async () => {
            console.log('myAccount.js: Click on edit profile button.');
            if (editProfileFormContainer) editProfileFormContainer.classList.remove('hidden');
            if (changePasswordFormContainer) changePasswordFormContainer.classList.add('hidden');
            if (editProfileBtn) editProfileBtn.classList.add('hidden');
            if (changePasswordBtn) changePasswordBtn.classList.add('hidden');
            if (myAccountSection) myAccountSection.classList.add('show-edit-profile');
            clearValidationErrors('edit-profile-form');
            showMyAccountMessage('', 'info');
            await window.loadUserProfile();
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            console.log('myAccount.js: Click on change password button.');
            if (changePasswordFormContainer) changePasswordFormContainer.classList.remove('hidden');
            if (editProfileFormContainer) editProfileFormContainer.classList.add('hidden');
            if (editProfileBtn) editProfileBtn.classList.add('hidden');
            if (changePasswordBtn) changePasswordBtn.classList.add('hidden');
            if (myAccountSection) myAccountSection.classList.add('show-change-password');
            clearValidationErrors('change-password-form');
            changePasswordForm.reset();
            showMyAccountMessage('', 'info');

            const currentUser = getCurrentUserFromLocalStorage();
            if (currentUser && changePasswordEmailInput) {
                changePasswordEmailInput.value = currentUser.email || '';
            }
        });
    }

    if (cancelEditProfileBtn) {
        cancelEditProfileBtn.addEventListener('click', () => {
            console.log('myAccount.js: Click on cancel edit profile button.');
            if (editProfileFormContainer) editProfileFormContainer.classList.add('hidden');
            if (editProfileBtn) editProfileBtn.classList.remove('hidden');
            if (changePasswordBtn) changePasswordBtn.classList.remove('hidden');
            if (myAccountSection) myAccountSection.classList.remove('show-edit-profile');
            editProfileForm.reset();
            clearValidationErrors('edit-profile-form');
            showMyAccountMessage('', 'info');
            window.loadUserProfile(); // Reload info to reset fields to current user data
        });
    }

    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', () => {
            console.log('myAccount.js: Click on cancel change password button.');
            if (changePasswordFormContainer) changePasswordFormContainer.classList.add('hidden');
            if (editProfileBtn) editProfileBtn.classList.remove('hidden');
            if (changePasswordBtn) changePasswordBtn.classList.remove('hidden');
            if (myAccountSection) myAccountSection.classList.remove('show-change-password');
            changePasswordForm.reset();
            clearValidationErrors('change-password-form');
            showMyAccountMessage('', 'info');
        });
    }

    // --- Listener para envío de formularios ---
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', updateProfile);
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }

    // Initial call to load user profile info when the account section is activated
    // This should be handled by main.js via window.showSection('my-account')
});