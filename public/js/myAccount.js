document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM de Mi Cuenta
    const myAccountSection = document.getElementById('my-account');
    const myAccountNavBtn = document.getElementById('nav-my-account');
    const myAccountMessageContainer = document.getElementById('my-account-message-container');
    const activityMessageContainer = document.getElementById('activity-message-container');

    // Elementos de perfil
    const profileAvatarImg = document.getElementById('profile-image');
    const avatarUploadInput = document.getElementById('avatarUploadInput');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    const cancelAvatarBtn = document.getElementById('cancelAvatarBtn');
    const avatarFileNameSpan = document.getElementById('avatarFileName');
    const avatarMessageContainer = document.getElementById('avatarMessage');

    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');

    // Formularios de edición de perfil
    const editProfileFormContainer = document.getElementById('edit-profile-form-container');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editUsernameInput = document.getElementById('edit-username');
    const editEmailInput = document.getElementById('edit-email');
    const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');

    // Formularios de cambio de contraseña
    const changePasswordFormContainer = document.getElementById('change-password-form-container');
    const changePasswordForm = document.getElementById('change-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');

    // Actividad del Usuario
    const purchaseHistoryList = document.getElementById('purchase-history-list');
    const cartActivityList = document.getElementById('cart-activity-list');

    // Funciones de utilidad
    function showMessage(container, message, type = 'success') {
        if (!container) {
            console.error("Message container not found:", container);
            return;
        }
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-container', type);
        messageDiv.innerHTML = `<p>${message}</p>`;
        container.innerHTML = '';
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10); 

        setTimeout(() => {
            messageDiv.classList.remove('show');
            messageDiv.addEventListener('transitionend', () => {
                messageDiv.remove();
            }, { once: true });
        }, 5000);
    }

    function clearValidationErrors(form) {
        if (form) {
            form.querySelectorAll('.validation-error').forEach(span => span.textContent = '');
        }
    }

    function showValidationError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        } else {
            console.warn(`Validation error element with ID '${elementId}' not found.`);
        }
    }

    // --- Cargar y Mostrar Información del Usuario ---
    async function loadUserProfile() {
        const token = localStorage.getItem('token');
        if (!token) {
            if (myAccountSection) {
                myAccountSection.innerHTML = '<p class="error">Debes iniciar sesión para ver esta sección.</p>';
            }
            return;
        }

        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('currentUserId', data._id);

                if (profileUsername) profileUsername.textContent = data.username;
                if (profileEmail) profileEmail.textContent = data.email;
                if (profileRole) profileRole.textContent = data.role;
                if (profileAvatarImg) {
                    // CORRECCIÓN CLAVE: Usar directamente data.profileImage, ya que el backend envía la ruta completa
                    profileAvatarImg.src = data.profileImage 
                        ? `${data.profileImage}?t=${new Date().getTime()}` // Eliminado '/img/avatars/' aquí
                        : '/img/default-avatar.png';
                }
                
                if (editUsernameInput) editUsernameInput.value = data.username;
                if (editEmailInput) editEmailInput.value = data.email;

                const adminNavContainer = document.getElementById('nav-admin-dashboard-container');
                if (adminNavContainer) {
                    if (data.role === 'admin') {
                        adminNavContainer.style.display = 'list-item';
                    } else {
                        adminNavContainer.style.display = 'none';
                    }
                }
                
                loadUserActivity(data._id);
            } else {
                if (myAccountMessageContainer) {
                    showMessage(myAccountMessageContainer, data.message || 'Error al cargar el perfil.', 'error');
                }
                console.error('Error fetching user profile:', data.message);
            }
        } catch (error) {
            if (myAccountMessageContainer) {
                showMessage(myAccountMessageContainer, 'Error de red al cargar el perfil.', 'error');
            }
            console.error('Network error fetching user profile:', error);
        }
    }

    // --- Gestión de Perfil ---
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            if (editProfileFormContainer) {
                editProfileFormContainer.classList.add('active'); // Mostrar el formulario de edición
            }
            if (changePasswordFormContainer) {
                changePasswordFormContainer.classList.remove('active'); // Asegurarse de que el otro formulario esté oculto
            }
            if (myAccountMessageContainer) myAccountMessageContainer.innerHTML = '';
            if (editProfileForm) clearValidationErrors(editProfileForm);
        });
    }

    if (cancelEditProfileBtn) {
        cancelEditProfileBtn.addEventListener('click', () => {
            if (editProfileFormContainer) {
                editProfileFormContainer.classList.remove('active'); // Ocultar el formulario de edición
            }
            if (myAccountMessageContainer) myAccountMessageContainer.innerHTML = '';
            if (editProfileForm) clearValidationErrors(editProfileForm);
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidationErrors(editProfileForm);

            const newUsername = editUsernameInput ? editUsernameInput.value.trim() : '';
            const newEmail = editEmailInput ? editEmailInput.value.trim() : '';
            const userId = localStorage.getItem('currentUserId');
            const token = localStorage.getItem('token');

            let isValid = true;
            if (!newUsername) { showValidationError('edit-username-error', 'El nombre de usuario es requerido.'); isValid = false; }
            if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { showValidationError('edit-email-error', 'Ingresa un email válido.'); isValid = false; }

            if (!isValid) return;

            try {
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ username: newUsername, email: newEmail })
                });

                const data = await response.json();

                if (response.ok) {
                    if (myAccountMessageContainer) {
                        showMessage(myAccountMessageContainer, data.message || 'Perfil actualizado con éxito.', 'success');
                    }
                    if (editProfileFormContainer) {
                           editProfileFormContainer.classList.remove('active'); // Ocultar el formulario después de guardar
                    }
                    loadUserProfile();
                } else {
                    if (myAccountMessageContainer) {
                        showMessage(myAccountMessageContainer, data.message || 'Error al actualizar el perfil.', 'error');
                    }
                }
            } catch (error) {
                if (myAccountMessageContainer) {
                    showMessage(myAccountMessageContainer, 'Error de red al actualizar el perfil.', 'error');
                }
                console.error('Network error updating profile:', error);
            }
        });
    }

    // --- Gestión de Contraseña ---
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            if (changePasswordFormContainer) {
                changePasswordFormContainer.classList.add('active'); // Mostrar el formulario de cambio de contraseña
            }
            if (editProfileFormContainer) {
                editProfileFormContainer.classList.remove('active'); // Asegurarse de que el otro formulario esté oculto
            }
            if (myAccountMessageContainer) myAccountMessageContainer.innerHTML = '';
            if (changePasswordForm) {
                changePasswordForm.reset();
                clearValidationErrors(changePasswordForm);
            }
        });
    }

    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', () => {
            if (changePasswordFormContainer) {
                changePasswordFormContainer.classList.remove('active'); // Ocultar el formulario de cambio de contraseña
            }
            if (myAccountMessageContainer) myAccountMessageContainer.innerHTML = '';
            if (changePasswordForm) {
                changePasswordForm.reset();
                clearValidationErrors(changePasswordForm);
            }
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidationErrors(changePasswordForm);

            const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
            const newPassword = newPasswordInput ? newPasswordInput.value : '';
            const confirmNewPassword = confirmNewPasswordInput ? confirmNewPasswordInput.value : '';
            const token = localStorage.getItem('token');

            let isValid = true;
            if (!currentPassword) { showValidationError('current-password-error', 'Ingresa tu contraseña actual.'); isValid = false; }
            if (!newPassword || newPassword.length < 6) { showValidationError('new-password-error', 'La nueva contraseña debe tener al menos 6 caracteres.'); isValid = false; }
            if (newPassword !== confirmNewPassword) { showValidationError('confirm-new-password-error', 'Las contraseñas no coinciden.'); isValid = false; }
            if (currentPassword === newPassword) { showValidationError('new-password-error', 'La nueva contraseña no puede ser igual a la actual.'); isValid = false; }

            if (!isValid) return;

            try {
                const response = await fetch('/api/auth/change-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    if (myAccountMessageContainer) {
                        showMessage(myAccountMessageContainer, data.message || 'Contraseña actualizada con éxito.', 'success');
                    }
                    if (changePasswordFormContainer) {
                        changePasswordFormContainer.classList.remove('active'); // Ocultar el formulario después de guardar
                    }
                    if (changePasswordForm) changePasswordForm.reset();
                } else {
                    if (myAccountMessageContainer) {
                        showMessage(myAccountMessageContainer, data.message || 'Error al cambiar la contraseña.', 'error');
                    }
                }
            } catch (error) {
                if (myAccountMessageContainer) {
                    showMessage(myAccountMessageContainer, 'Error de red al cambiar la contraseña.', 'error');
                }
                console.error('Network error changing password:', error);
            }
        });
    }

    // --- Gestión de Imagen de Perfil (código previamente corregido) ---
    if (changeAvatarBtn && avatarUploadInput && saveAvatarBtn && cancelAvatarBtn && avatarFileNameSpan) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarUploadInput.click();
        });

        avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                avatarFileNameSpan.textContent = file.name;
                saveAvatarBtn.style.display = 'inline-block';
                cancelAvatarBtn.style.display = 'inline-block';
                changeAvatarBtn.style.display = 'none';
            } else {
                avatarFileNameSpan.textContent = '';
                saveAvatarBtn.style.display = 'none';
                cancelAvatarBtn.style.display = 'none';
                changeAvatarBtn.style.display = 'inline-block';
            }
        });

        saveAvatarBtn.addEventListener('click', async () => {
            const file = avatarUploadInput.files[0];
            if (!file) {
                showMessage(avatarMessageContainer, 'No se ha seleccionado ninguna imagen.', 'error');
                return;
            }

            const userId = localStorage.getItem('currentUserId');
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                showMessage(avatarMessageContainer, 'Subiendo imagen...', 'info');
                const response = await fetch(`/api/users/${userId}/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(avatarMessageContainer, data.message || 'Imagen de perfil actualizada.', 'success');
                    if (profileAvatarImg && data.profileImage) {
                        // CORRECCIÓN CLAVE: Usar directamente data.profileImage
                        profileAvatarImg.src = `${data.profileImage}?t=${new Date().getTime()}`; // Eliminado '/img/avatars/' aquí
                    }
                    avatarUploadInput.value = '';
                    avatarFileNameSpan.textContent = '';
                    saveAvatarBtn.style.display = 'none';
                    cancelAvatarBtn.style.display = 'none';
                    changeAvatarBtn.style.display = 'inline-block';
                    loadUserProfile(); // Vuelve a cargar el perfil para asegurar la actualización en otros lugares
                } else {
                    showMessage(avatarMessageContainer, data.message || 'Error al subir la imagen.', 'error');
                }

            } catch (error) {
                showMessage(avatarMessageContainer, 'Error de red al subir la imagen.', 'error');
                console.error('Network error uploading profile image:', error);
            }
        });

        cancelAvatarBtn.addEventListener('click', () => {
            avatarUploadInput.value = '';
            avatarFileNameSpan.textContent = '';
            saveAvatarBtn.style.display = 'none';
            cancelAvatarBtn.style.display = 'none';
            changeAvatarBtn.style.display = 'inline-block';
            showMessage(avatarMessageContainer, 'Carga de imagen cancelada.', 'info');
        });
    }

    // --- Actividad del Usuario (Compras y Carrito) ---
    async function loadUserActivity(userId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (purchaseHistoryList) purchaseHistoryList.innerHTML = '<li>Cargando historial de compras...</li>';
        if (cartActivityList) cartActivityList.innerHTML = '<li>Cargando actividad del carrito...</li>';

        try {
            const response = await fetch(`/api/users/${userId}/activity`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                if (data.purchases && data.purchases.length > 0 && purchaseHistoryList) {
                    purchaseHistoryList.innerHTML = '';
                    data.purchases.forEach(purchase => {
                        const li = document.createElement('li');
                        li.classList.add('activity-item');
                        li.innerHTML = `
                            <span>Compra: ${purchase.id} - Total: $${purchase.total}</span>
                            <span class="timestamp">${new Date(purchase.date).toLocaleDateString()}</span>
                        `;
                        purchaseHistoryList.appendChild(li);
                    });
                } else if (purchaseHistoryList) {
                    purchaseHistoryList.innerHTML = '<li class="activity-item">No hay compras registradas aún.</li>';
                }

                if (data.cartActivity && data.cartActivity.length > 0 && cartActivityList) {
                    cartActivityList.innerHTML = '';
                    data.cartActivity.forEach(activity => {
                        const li = document.createElement('li');
                        li.classList.add('activity-item');
                        li.innerHTML = `
                            <span>Carrito: Producto ${activity.productId} - Acción: ${activity.action}</span>
                            <span class="timestamp">${new Date(activity.date).toLocaleDateString()}</span>
                        `;
                        cartActivityList.appendChild(li);
                    });
                } else if (cartActivityList) {
                    cartActivityList.innerHTML = '<li class="activity-item">No hay actividad reciente en el carrito.</li>';
                }

                if (data.message && activityMessageContainer) {
                    showMessage(activityMessageContainer, data.message, 'info');
                }

            } else {
                if (activityMessageContainer) {
                    showMessage(activityMessageContainer, data.message || 'Error al cargar la actividad del usuario.', 'error');
                }
            }
        } catch (error) {
            if (activityMessageContainer) {
                showMessage(activityMessageContainer, 'Error de red al cargar la actividad.', 'error');
            }
            console.error('Network error loading user activity:', error);
        }
    }

    // --- Listener para el botón de navegación "Mi Cuenta" ---
    if (myAccountNavBtn) {
        myAccountNavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('main > section').forEach(section => {
                section.classList.add('hidden-section');
                section.classList.remove('current-section');
            });
            if (myAccountSection) {
                myAccountSection.classList.remove('hidden-section');
                myAccountSection.classList.add('current-section');
            } else {
                console.error("My account section with ID 'my-account' not found.");
            }

            loadUserProfile();
        });
    }

    // Validar y cargar perfil si ya se está en la sección al cargar la página
    if (window.location.hash === '#my-account') {
        if (myAccountSection) {
            document.querySelectorAll('main > section').forEach(section => {
                section.classList.add('hidden-section');
                section.classList.remove('current-section');
            });
            myAccountSection.classList.remove('hidden-section');
            myAccountSection.classList.add('current-section');
        }
        loadUserProfile();
    }
});