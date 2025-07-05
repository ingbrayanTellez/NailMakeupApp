document.addEventListener('DOMContentLoaded', () => {
    // Referências a elementos do DOM do Panel de Administración
    const adminDashboardSection = document.getElementById('admin-dashboard');
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

    /**
     * Obtiene el token de autenticación del localStorage.
     * @returns {string|null} El token si existe, de lo contrario null.
     */
    const getToken = () => {
        return localStorage.getItem('token');
    };

    /**
     * Obtiene la información del usuario actual del localStorage.
     * @returns {object|null} El objeto de usuario si existe, de lo contrario null.
     */
    const getCurrentUserInfo = () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("admin.js: Error parsing user from localStorage:", e);
            return null;
        }
    };

    // --- Cargar y Mostrar Usuarios para el Administrador (Expuesta globalmente) ---
    window.loadUsersForAdmin = async function () {
        console.log('admin.js: loadUsersForAdmin llamado.');
        const token = getToken();
        const currentUser = getCurrentUserInfo();

        // Validar si el usuario tiene permiso para acceder
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
            if (typeof window.showMessage === 'function') {
                window.showMessage('Acceso denegado al panel de administración.', 'error', 'admin-message-container');
            }
            return;
        }

        const searchTerm = userSearchInput ? userSearchInput.value.trim() : '';
        const roleFilter = userRoleFilter ? userRoleFilter.value : '';

        // Mostrar mensaje de carga y limpiar tabla
        if (userTableBody) userTableBody.innerHTML = '';
        if (noUsersMessage) {
            noUsersMessage.classList.remove('hidden');
            noUsersMessage.textContent = 'Cargando usuarios...';
        }
        if (typeof window.showMessage === 'function') {
            window.showMessage('Cargando usuarios...', 'info', 'admin-message-container');
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

                    if (!data.users || data.users.length === 0) {
                        const noUsersRow = document.createElement('tr');
                        noUsersRow.innerHTML = `<td colspan="5" class="no-results-message">No se encontraron usuarios.</td>`;
                        userTableBody.appendChild(noUsersRow);
                        if (noUsersMessage) noUsersMessage.classList.remove('hidden');
                        if (adminPrevPageBtn) adminPrevPageBtn.disabled = true;
                        if (adminNextPageBtn) adminNextPageBtn.disabled = true;
                        if (adminPageInfo) adminPageInfo.textContent = 'Página 0 de 0';
                        if (typeof window.showMessage === 'function') {
                            window.showMessage('No se encontraron usuarios.', 'info', 'admin-message-container');
                        }
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
                                <select class="user-role-select" data-user-id="${user._id}" data-initial-role="${user.role}" ${user.role === 'admin' && currentUser._id !== user._id ? 'disabled' : ''}>
                                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                                </select>
                            </td>
                            <td class="user-actions">
                                <button class="btn btn-small save-role-btn" data-user-id="${user._id}" disabled>Guardar Rol</button>
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

                    // Añadir listeners a los nuevos botones y selects
                    addTableEventListeners();
                }
                if (typeof window.showMessage === 'function') {
                    window.showMessage('Usuarios cargados.', 'success', 'admin-message-container');
                }
            } else {
                if (typeof window.showMessage === 'function') {
                    window.showMessage(data.message || 'Error al cargar usuarios.', 'error', 'admin-message-container');
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
            if (typeof window.showMessage === 'function') {
                window.showMessage('Error de red al cargar usuarios.', 'error', 'admin-message-container');
            }
            if (userTableBody) {
                userTableBody.innerHTML = `<tr><td colspan="5" class="error">Error de red al cargar usuarios.</td></tr>`;
            }
            console.error('admin.js: Network error loading users:', error);
            if (noUsersMessage) noUsersMessage.classList.remove('hidden');
            if (adminPrevPageBtn) adminPrevPageBtn.disabled = true;
            if (adminNextPageBtn) adminNextPageBtn.disabled = true;
            if (adminPageInfo) adminPageInfo.textContent = 'Página 0 de 0';
        }
    };

    /**
     * Añade event listeners a los botones y selects de la tabla después de que se renderiza.
     */
    const addTableEventListeners = () => {
        const currentUser = getCurrentUserInfo();

        // Event listener para cambiar el rol
        document.querySelectorAll('.user-role-select').forEach(select => {
            select.addEventListener('change', (event) => {
                const userId = event.target.dataset.userId;
                const initialRole = event.target.dataset.initialRole;
                const newRole = event.target.value;
                const saveBtn = document.querySelector(`.save-role-btn[data-user-id="${userId}"]`);
                
                // Un admin NO PUEDE cambiar su propio rol ni el rol de otro admin a "user" fácilmente.
                // Si el usuario actual es el que se está editando, deshabilitar el botón
                // O si el rol inicial era 'admin', el botón también debe estar deshabilitado para evitar degradar admins accidentalmente
                if (currentUser && userId === currentUser._id) {
                    saveBtn.disabled = true; // No puede cambiarse a sí mismo
                } else if (initialRole === 'admin' && newRole === 'user') {
                    // Si intenta cambiar un admin a usuario, deshabilitar (o requerir un proceso más estricto)
                    saveBtn.disabled = true;
                    if (typeof window.showMessage === 'function') {
                        window.showMessage('No se puede cambiar directamente el rol de un administrador a usuario.', 'warning', 'admin-message-container');
                    }
                } else if (newRole !== initialRole) {
                    saveBtn.disabled = false; // Habilitar si el rol ha cambiado y no es una restricción
                } else {
                    saveBtn.disabled = true; // Deshabilitar si el rol es el mismo
                }
            });
        });

        // Event listener para guardar el rol
        document.querySelectorAll('.save-role-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userId = event.target.dataset.userId;
                const selectElement = document.querySelector(`.user-role-select[data-user-id="${userId}"]`);
                const newRole = selectElement.value;

                if (currentUser && userId === currentUser._id) {
                    if (typeof window.showMessage === 'function') {
                        window.showMessage('No puedes cambiar tu propio rol.', 'warning', 'admin-message-container');
                    }
                    return;
                }
                // Prevenir cambiar un admin a user sin un proceso más robusto
                const initialRoleOfTarget = selectElement.dataset.initialRole;
                if (initialRoleOfTarget === 'admin' && newRole === 'user') {
                     if (typeof window.showMessage === 'function') {
                        window.showMessage('No se puede degradar directamente a un administrador a usuario.', 'warning', 'admin-message-container');
                    }
                    return;
                }

                // Usar el modal de confirmación
                if (typeof window.showConfirmModal === 'function') {
                    window.showConfirmModal(`¿Estás seguro de que quieres cambiar el rol de este usuario a "${newRole}"?`, async () => {
                        await updateRole(userId, newRole);
                        await window.loadUsersForAdmin(); // Recargar la tabla después de la actualización
                    });
                } else {
                    console.error('admin.js: window.showConfirmModal no está disponible. Asegúrate de que main.js se carga primero.');
                    // Fallback para ambientes sin el modal de confirmación.
                    if (confirm(`¿Estás seguro de que quieres cambiar el rol de este usuario a "${newRole}"?`)) {
                        await updateRole(userId, newRole);
                        await window.loadUsersForAdmin();
                    }
                }
            });
        });

        // Event listener para eliminar usuario
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userId = event.target.dataset.userId;
                const userRoleSelect = document.querySelector(`.user-role-select[data-user-id="${userId}"]`);
                
                if (currentUser && userId === currentUser._id) {
                    if (typeof window.showMessage === 'function') {
                        window.showMessage('No puedes eliminar tu propia cuenta.', 'warning', 'admin-message-container');
                    }
                    return;
                }
                
                if (userRoleSelect && userRoleSelect.value === 'admin') {
                    if (typeof window.showMessage === 'function') {
                        window.showMessage('No se puede eliminar a un usuario con rol de administrador desde aquí.', 'warning', 'admin-message-container');
                    }
                    return;
                }

                // Usar el modal de confirmación
                if (typeof window.showConfirmModal === 'function') {
                    window.showConfirmModal('¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.', async () => {
                        await deleteUser(userId);
                        await window.loadUsersForAdmin(); // Recargar la tabla después de la eliminación
                    });
                } else {
                    console.error('admin.js: window.showConfirmModal no está disponible. Asegúrate de que main.js se carga primero.');
                    // Fallback para ambientes sin el modal de confirmación.
                    if (confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.')) {
                        await deleteUser(userId);
                        await window.loadUsersForAdmin();
                    }
                }
            });
        });
    };

    // --- Función para Actualizar el Rol de un Usuario ---
    async function updateRole(userId, newRole) {
        const token = getToken();
        const currentUser = getCurrentUserInfo();
        if (!token || !currentUser || currentUser.role !== 'admin') {
            if (typeof window.showMessage === 'function') {
                window.showMessage('No autorizado para modificar roles de usuario.', 'error', 'admin-message-container');
            }
            return;
        }

        if (typeof window.showMessage === 'function') {
            window.showMessage('Actualizando rol...', 'info', 'admin-message-container');
        }

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
                if (typeof window.showMessage === 'function') {
                    window.showMessage(data.message || 'Rol actualizado con éxito.', 'success', 'admin-message-container');
                }
            } else {
                if (typeof window.showMessage === 'function') {
                    window.showMessage(data.message || 'Error al actualizar el rol.', 'error', 'admin-message-container');
                }
            }
        } catch (error) {
            if (typeof window.showMessage === 'function') {
                window.showMessage('Error de red al actualizar el rol.', 'error', 'admin-message-container');
            }
            console.error('admin.js: Network error updating role:', error);
        }
    }

    // --- Función para Eliminar un Usuario ---
    async function deleteUser(userId) {
        const token = getToken();
        const currentUser = getCurrentUserInfo();
        if (!token || !currentUser || currentUser.role !== 'admin') {
            if (typeof window.showMessage === 'function') {
                window.showMessage('No autorizado para eliminar usuarios.', 'error', 'admin-message-container');
            }
            return;
        }

        if (typeof window.showMessage === 'function') {
            window.showMessage('Eliminando usuario...', 'info', 'admin-message-container');
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                if (typeof window.showMessage === 'function') {
                    window.showMessage(data.message || 'Usuario eliminado con éxito.', 'success', 'admin-message-container');
                }
            } else {
                if (typeof window.showMessage === 'function') {
                    window.showMessage(data.message || 'Error al eliminar usuario.', 'error', 'admin-message-container');
                }
            }
        } catch (error) {
            if (typeof window.showMessage === 'function') {
                window.showMessage('Error de red al eliminar usuario.', 'error', 'admin-message-container');
            }
            console.error('admin.js: Network error deleting user:', error);
        }
    }

    // --- Event Listeners para filtros y paginación ---
    if (applyUserFiltersBtn) {
        applyUserFiltersBtn.addEventListener('click', () => {
            currentPage = 1; // Resetear a la primera página al aplicar filtros
            window.loadUsersForAdmin(); // Usar la función global
        });
    }

    if (clearUserFiltersBtn) {
        clearUserFiltersBtn.addEventListener('click', () => {
            if (userSearchInput) userSearchInput.value = ''; // Limpiar campo de búsqueda
            if (userRoleFilter) userRoleFilter.value = ''; // Resetear el select de rol a vacío/default
            currentPage = 1; // Resetear a la primera página al limpiar filtros
            window.loadUsersForAdmin(); // Usar la función global
        });
    }

    // Opcional: Buscar al presionar Enter en el input de búsqueda
    if (userSearchInput) {
        userSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1; // Resetear a la primera página al buscar
                window.loadUsersForAdmin(); // Usar la función global
            }
        });
    }

    if (adminPrevPageBtn) {
        adminPrevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) { // Asegurarse de que no estamos en la primera página
                currentPage--; // Decrementar el número de página
                window.loadUsersForAdmin(); // Usar la función global
            }
        });
    }

    if (adminNextPageBtn) {
        adminNextPageBtn.addEventListener('click', () => {
            // La lógica para deshabilitar el botón ya se maneja en loadUsersForAdmin
            // Si el botón no está deshabilitado, es seguro avanzar a la siguiente página
            currentPage++; // Incrementar el número de página
            window.loadUsersForAdmin(); // Usar la función global
        });
    }

    // Monitorear el cambio de sección para cargar los usuarios solo cuando sea necesario
    // Esto se vincula con la función showSection de main.js
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (adminDashboardSection && adminDashboardSection.classList.contains('current-section') && !adminDashboardSection.classList.contains('admin-dashboard-loaded')) {
                    // Cargar usuarios solo una vez cuando la sección se activa
                    window.loadUsersForAdmin();
                    adminDashboardSection.classList.add('admin-dashboard-loaded'); // Marcar como cargada
                } else if (adminDashboardSection && !adminDashboardSection.classList.contains('current-section') && adminDashboardSection.classList.contains('admin-dashboard-loaded')) {
                    // Resetear la marca cuando la sección se oculta
                    adminDashboardSection.classList.remove('admin-dashboard-loaded');
                    if (userTableBody) userTableBody.innerHTML = '<tr><td colspan="5">Cargando usuarios...</td></tr>'; // Mensaje de carga al ocultar
                    if (adminMessageContainer) adminMessageContainer.classList.remove('show', 'success', 'error', 'warning', 'info'); // Limpiar mensajes
                }
            }
        }
    });

    if (adminDashboardSection) {
        observer.observe(adminDashboardSection, { attributes: true });
    }
});
