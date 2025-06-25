// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM del Panel de Administración
    const adminDashboardSection = document.getElementById('admin-dashboard');
    // const adminNavDashboardBtn = document.getElementById('nav-admin-dashboard'); // Este se maneja en main.js
    const adminMessageContainer = document.getElementById('admin-message-container');

    // Elementos de filtrado y búsqueda de usuarios
    const userSearchInput = document.getElementById('userSearchInput'); // Campo de texto para búsqueda
    const userRoleFilter = document.getElementById('userRoleFilter'); // Select para filtrar por rol
    const applyUserFiltersBtn = document.getElementById('applyUserFiltersBtn'); // Botón para aplicar filtros
    const clearUserFiltersBtn = document.getElementById('clearUserFiltersBtn'); // Botón para limpiar filtros

    // Tabla de usuarios y paginación
    const userTableBody = document.getElementById('userTableBody'); // TBODY de la tabla de usuarios
    const noUsersMessage = document.getElementById('no-users-message'); // Mensaje dentro de la tabla si no hay usuarios
    const adminPrevPageBtn = document.getElementById('admin-prev-page-btn'); // Botón de página anterior
    const adminNextPageBtn = document.getElementById('admin-next-page-btn'); // Botón de página siguiente
    const adminPageInfo = document.getElementById('admin-page-info'); // Información de la página actual

    let currentPage = 1; // Página actual, inicializada en 1
    const usersPerPage = 10; // Número de usuarios a mostrar por página

    // Función de utilidad para mostrar mensajes (adaptada para admin.js)
    function showMessage(container, message, type = 'success') {
        if (!container) {
            console.error("Message container not found:", container);
            return;
        }
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-container', type);
        messageDiv.innerHTML = `<p>${message}</p>`;
        container.innerHTML = ''; // Limpiar mensajes anteriores
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show'); // Añadir clase para la transición CSS
        }, 10); 

        setTimeout(() => {
            messageDiv.classList.remove('show');
            messageDiv.addEventListener('transitionend', () => {
                messageDiv.remove(); // Eliminar el elemento después de la transición
            }, { once: true });
        }, 5000);
    }

    /**
     * Obtiene el token de autenticación del localStorage.
     * @returns {string|null} El token si existe, de lo contrario null.
     */
    const getToken = () => {
        return localStorage.getItem('token');
    };

    /**
     * Obtiene la información del usuario actual del localStorage (o de la variable global si está disponible).
     * @returns {object|null} El objeto de usuario si existe, de lo contrario null.
     */
    const getCurrentUserInfo = () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Error parsing user from localStorage:", e);
            return null;
        }
    };

    // --- Cargar y Mostrar Usuarios para el Administrador (Expuesta globalmente) ---
    async function loadUsersForAdmin() {
        const token = getToken();
        const currentUser = getCurrentUserInfo();

        if (!token || !currentUser || currentUser.role !== 'admin') {
            if (userTableBody) {
                userTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No autorizado. Debes iniciar sesión como administrador para ver esta sección.</td></tr>`;
            }
            if (noUsersMessage) {
                noUsersMessage.classList.remove('hidden');
                noUsersMessage.textContent = "Acceso denegado. Solo administradores.";
            }
            // Deshabilitar paginación
            if (adminPrevPageBtn) adminPrevPageBtn.disabled = true;
            if (adminNextPageBtn) adminNextPageBtn.disabled = true;
            if (adminPageInfo) adminPageInfo.textContent = 'Página 0 de 0';
            return;
        }

        const searchTerm = userSearchInput ? userSearchInput.value.trim() : '';
        const roleFilter = userRoleFilter ? userRoleFilter.value : '';

        if (userTableBody) userTableBody.innerHTML = '';
        if (noUsersMessage) {
            noUsersMessage.classList.remove('hidden');
            noUsersMessage.textContent = 'Cargando usuarios...';
        }

        try {
            let url = `/api/users?page=${currentPage}&limit=${usersPerPage}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                if (userTableBody) {
                    userTableBody.innerHTML = ''; // Limpiar de nuevo por si se cargó el mensaje de "cargando"

                    if (data.users.length === 0) {
                        const noUsersRow = document.createElement('tr');
                        noUsersRow.innerHTML = `<td colspan="5" class="no-results-message">No se encontraron usuarios.</td>`;
                        userTableBody.appendChild(noUsersRow);
                        if (noUsersMessage) noUsersMessage.classList.remove('hidden');
                        if (adminPrevPageBtn) adminPrevPageBtn.disabled = true;
                        if (adminNextPageBtn) adminNextPageBtn.disabled = true;
                        if (adminPageInfo) adminPageInfo.textContent = 'Página 0 de 0';
                        return;
                    } else {
                         if (noUsersMessage) noUsersMessage.classList.add('hidden');
                    }
                    
                    data.users.forEach(user => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${user._id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>
                                <span id="user-role-display-${user._id}">${user.role}</span>
                            </td>
                            <td class="user-actions">
                                <select id="select-role-${user._id}" data-user-id="${user._id}" class="role-select">
                                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                                </select>
                                <button class="btn btn-small save-role-btn" data-user-id="${user._id}">Guardar Rol</button>
                                <button class="btn btn-small btn-danger delete-user-btn" data-user-id="${user._id}">Eliminar</button>
                            </td>
                        `;
                        userTableBody.appendChild(row);
                    });

                    // Actualizar la información de paginación
                    currentPage = data.currentPage;
                    if (adminPageInfo) adminPageInfo.textContent = `Página ${data.currentPage} de ${data.totalPages}`;
                    if (adminPrevPageBtn) adminPrevPageBtn.disabled = data.currentPage === 1;
                    if (adminNextPageBtn) adminNextPageBtn.disabled = data.currentPage === data.totalPages;

                    // Añadir listeners a los botones de "Guardar Rol" dinámicamente
                    document.querySelectorAll('.save-role-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const userId = e.target.dataset.userId;
                            const newRole = document.getElementById(`select-role-${userId}`).value;
                            await updateRole(userId, newRole);
                        });
                    });

                    // Añadir listeners a los botones de "Eliminar Usuario" dinámicamente
                    document.querySelectorAll('.delete-user-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const userId = e.target.dataset.userId;
                            const currentLoggedInUserId = localStorage.getItem('currentUserId'); // Obtener el ID del usuario logueado

                            if (userId === currentLoggedInUserId) {
                                showMessage(adminMessageContainer, 'No puedes eliminar tu propia cuenta de administrador.', 'error');
                                return;
                            }

                            if (confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.')) {
                                await deleteUser(userId);
                            }
                        });
                    });
                }
            } else {
                if (adminMessageContainer) {
                    showMessage(adminMessageContainer, data.message || 'Error al cargar usuarios.', 'error');
                }
                if (userTableBody) {
                    userTableBody.innerHTML = `<tr><td colspan="5" class="error">${data.message || 'Error al cargar usuarios.'}</td></tr>`;
                }
                if (noUsersMessage) noUsersMessage.classList.remove('hidden');
                if (adminPrevPageBtn) adminPrevPageBtn.disabled = true;
                if (adminNextPageBtn) adminNextPageBtn.disabled = true;
                if (adminPageInfo) adminPageInfo.textContent = 'Página 0 de 0';
            }
        } catch (error) {
            if (adminMessageContainer) {
                showMessage(adminMessageContainer, 'Error de red al cargar usuarios.', 'error');
            }
            if (userTableBody) {
                userTableBody.innerHTML = `<tr><td colspan="5" class="error">Error de red al cargar usuarios.</td></tr>`;
            }
            console.error('Network error loading users:', error);
            if (noUsersMessage) noUsersMessage.classList.remove('hidden');
            if (adminPrevPageBtn) adminPrevPageBtn.disabled = true;
            if (adminNextPageBtn) adminNextPageBtn.disabled = true;
            if (adminPageInfo) adminPageInfo.textContent = 'Página 0 de 0';
        }
    }

    // --- Función para Actualizar el Rol de un Usuario ---
    async function updateRole(userId, newRole) {
        const token = getToken();
        const currentUser = getCurrentUserInfo();
        if (!token || !currentUser || currentUser.role !== 'admin') {
            showMessage(adminMessageContainer, 'No autorizado para modificar roles de usuario.', 'error');
            return;
        }

        showMessage(adminMessageContainer, 'Actualizando rol...', 'info');

        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(adminMessageContainer, data.message || 'Rol actualizado con éxito.', 'success');
                const userRoleSpan = document.getElementById(`user-role-display-${userId}`);
                if (userRoleSpan) userRoleSpan.textContent = newRole;
            } else {
                showMessage(adminMessageContainer, data.message || 'Error al actualizar el rol.', 'error');
            }
        } catch (error) {
            showMessage(adminMessageContainer, 'Error de red al actualizar el rol.', 'error');
            console.error('Network error updating role:', error);
        }
    }

    // --- Función para Eliminar un Usuario ---
    async function deleteUser(userId) {
        const token = getToken();
        const currentUser = getCurrentUserInfo();
        if (!token || !currentUser || currentUser.role !== 'admin') {
            showMessage(adminMessageContainer, 'No autorizado para eliminar usuarios.', 'error');
            return;
        }

        showMessage(adminMessageContainer, 'Eliminando usuario...', 'info');

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(adminMessageContainer, data.message || 'Usuario eliminado con éxito.', 'success');
                loadUsersForAdmin(); // Recargar la lista de usuarios para reflejar la eliminación
            } else {
                showMessage(adminMessageContainer, data.message || 'Error al eliminar usuario.', 'error');
            }
        } catch (error) {
            showMessage(adminMessageContainer, 'Error de red al eliminar usuario.', 'error');
            console.error('Network error deleting user:', error);
        }
    }

    // --- Event Listeners para filtros y paginación ---
    if (applyUserFiltersBtn) {
        applyUserFiltersBtn.addEventListener('click', () => {
            currentPage = 1; // Resetear a la primera página al aplicar filtros
            loadUsersForAdmin();
        });
    }

    if (clearUserFiltersBtn) {
        clearUserFiltersBtn.addEventListener('click', () => {
            if (userSearchInput) userSearchInput.value = ''; // Limpiar campo de búsqueda
            if (userRoleFilter) userRoleFilter.value = ''; // Resetear el select de rol a vacío/default
            currentPage = 1; // Resetear a la primera página al limpiar filtros
            loadUsersForAdmin();
        });
    }

    // Opcional: Buscar al presionar Enter en el input de búsqueda
    if (userSearchInput) {
        userSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1; // Resetear a la primera página al buscar
                loadUsersForAdmin();
            }
        });
    }

    if (adminPrevPageBtn) {
        adminPrevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) { // Asegurarse de que no estamos en la primera página
                currentPage--; // Decrementar el número de página
                loadUsersForAdmin(); // Cargar usuarios de la página anterior
            }
        });
    }

    if (adminNextPageBtn) {
        adminNextPageBtn.addEventListener('click', () => {
            // La lógica para deshabilitar el botón ya se maneja en loadUsersForAdmin
            // Si el botón no está deshabilitado, es seguro avanzar a la siguiente página
            currentPage++; // Incrementar el número de página
            loadUsersForAdmin(); // Cargar usuarios de la página siguiente
        });
    }

    // Exportar la función loadUsersForAdmin para que main.js pueda llamarla
    window.loadUsersForAdmin = loadUsersForAdmin;

    // // La lógica de navegación inicial y el listener para el botón del header
    // // se moverán a main.js para centralizar la navegación.
    // // Este admin.js solo debe manejar la carga de datos cuando se le pida.

    // // Cargar usuarios al iniciar si la URL tiene el hash #admin-dashboard
    // if (window.location.hash === '#admin-dashboard') {
    //      // Ya lo maneja main.js en showSection, no es necesario aquí.
    // }
});
