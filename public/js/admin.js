document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM del Panel de Administración
    const adminDashboardSection = document.getElementById('admin-dashboard');
    const adminNavDashboardBtn = document.getElementById('nav-admin-dashboard'); // El botón de navegación del header
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

    // Función de utilidad para mostrar mensajes (similar a la de myAccount.js)
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

    // --- Cargar y Mostrar Usuarios para el Administrador ---
    async function loadUsersForAdmin() {
        const token = localStorage.getItem('token');
        if (!token) {
            // Si no hay token, el usuario no está autenticado o su sesión ha expirado
            if (adminDashboardSection) {
                adminDashboardSection.innerHTML = '<p class="error">Debes iniciar sesión como administrador para ver esta sección.</p>';
            }
            return;
        }

        const searchTerm = userSearchInput ? userSearchInput.value.trim() : ''; // Obtener término de búsqueda
        const roleFilter = userRoleFilter ? userRoleFilter.value : ''; // Obtener filtro de rol

        if (userTableBody) userTableBody.innerHTML = ''; // Limpiar el cuerpo de la tabla antes de cargar
        if (noUsersMessage) noUsersMessage.textContent = 'Cargando usuarios...'; // Mostrar mensaje de carga

        try {
            // Construir la URL de la API con los parámetros de paginación y filtro
            let url = `/api/users?page=${currentPage}&limit=${usersPerPage}`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`; // Añadir término de búsqueda si existe
            }
            if (roleFilter) {
                url += `&role=${encodeURIComponent(roleFilter)}`; // Añadir filtro de rol si existe
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Incluir el token de autorización
                }
            });

            const data = await response.json();

            if (response.ok) {
                if (userTableBody) {
                    userTableBody.innerHTML = ''; // Limpiar de nuevo por si se cargó el mensaje de "cargando"

                    if (data.users.length === 0) {
                        // Si no se encontraron usuarios, mostrar un mensaje
                        const noUsersRow = document.createElement('tr');
                        noUsersRow.innerHTML = `<td colspan="5" class="no-results-message">No se encontraron usuarios.</td>`;
                        userTableBody.appendChild(noUsersRow);
                        // Deshabilitar botones de paginación
                        adminPrevPageBtn.disabled = true;
                        adminNextPageBtn.disabled = true;
                        adminPageInfo.textContent = 'Página 0 de 0';
                        return;
                    }
                    
                    // Iterar sobre los usuarios y añadir una fila a la tabla por cada uno
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
                    adminPageInfo.textContent = `Página ${data.currentPage} de ${data.totalPages}`;
                    adminPrevPageBtn.disabled = data.currentPage === 1; // Deshabilitar si es la primera página
                    adminNextPageBtn.disabled = data.currentPage === data.totalPages; // Deshabilitar si es la última página

                    // Añadir listeners a los botones de "Guardar Rol" dinámicamente
                    document.querySelectorAll('.save-role-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const userId = e.target.dataset.userId; // Obtener el ID del usuario del atributo data
                            const newRole = document.getElementById(`select-role-${userId}`).value; // Obtener el nuevo rol seleccionado
                            await updateRole(userId, newRole);
                        });
                    });

                    // Añadir listeners a los botones de "Eliminar Usuario" dinámicamente
                    document.querySelectorAll('.delete-user-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const userId = e.target.dataset.userId;
                            const currentLoggedInUserId = localStorage.getItem('currentUserId');
                            
                            // Prevenir que un administrador intente eliminar su propia cuenta
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
                // Manejar errores de la API
                if (adminMessageContainer) {
                    showMessage(adminMessageContainer, data.message || 'Error al cargar usuarios.', 'error');
                }
                if (userTableBody) {
                    userTableBody.innerHTML = `<tr><td colspan="5" class="error">${data.message || 'Error al cargar usuarios.'}</td></tr>`;
                }
                // Deshabilitar paginación en caso de error
                adminPrevPageBtn.disabled = true;
                adminNextPageBtn.disabled = true;
                adminPageInfo.textContent = 'Página 0 de 0';
            }
        } catch (error) {
            // Manejar errores de red
            if (adminMessageContainer) {
                showMessage(adminMessageContainer, 'Error de red al cargar usuarios.', 'error');
            }
            if (userTableBody) {
                userTableBody.innerHTML = `<tr><td colspan="5" class="error">Error de red al cargar usuarios.</td></tr>`;
            }
            console.error('Network error loading users:', error);
             // Deshabilitar paginación en caso de error
             adminPrevPageBtn.disabled = true;
             adminNextPageBtn.disabled = true;
             adminPageInfo.textContent = 'Página 0 de 0';
        }
    }

    // --- Función para Actualizar el Rol de un Usuario ---
    async function updateRole(userId, newRole) {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (adminMessageContainer) {
            showMessage(adminMessageContainer, 'Actualizando rol...', 'info');
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
                if (adminMessageContainer) {
                    showMessage(adminMessageContainer, data.message || 'Rol actualizado con éxito.', 'success');
                }
                // Actualizar el rol mostrado en la tabla sin recargar toda la lista
                const userRoleSpan = document.getElementById(`user-role-display-${userId}`);
                if (userRoleSpan) userRoleSpan.textContent = newRole;
            } else {
                if (adminMessageContainer) {
                    showMessage(adminMessageContainer, data.message || 'Error al actualizar el rol.', 'error');
                }
            }
        } catch (error) {
            if (adminMessageContainer) {
                showMessage(adminMessageContainer, 'Error de red al actualizar el rol.', 'error');
            }
            console.error('Network error updating role:', error);
        }
    }

    // --- Función para Eliminar un Usuario ---
    async function deleteUser(userId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (adminMessageContainer) {
            showMessage(adminMessageContainer, 'Eliminando usuario...', 'info');
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
                if (adminMessageContainer) {
                    showMessage(adminMessageContainer, data.message || 'Usuario eliminado con éxito.', 'success');
                }
                // Recargar la lista de usuarios para reflejar la eliminación
                loadUsersForAdmin(); 
            } else {
                if (adminMessageContainer) {
                    showMessage(adminMessageContainer, data.message || 'Error al eliminar usuario.', 'error');
                }
            }
        } catch (error) {
            if (adminMessageContainer) {
                showMessage(adminMessageContainer, 'Error de red al eliminar usuario.', 'error');
            }
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

    // --- Listener para el botón de navegación "Administración" ---
    if (adminNavDashboardBtn) {
        adminNavDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Ocultar todas las secciones principales
            document.querySelectorAll('main > section').forEach(section => {
                section.classList.add('hidden-section');
                section.classList.remove('current-section');
            });
            // Mostrar solo la sección del panel de administración
            if (adminDashboardSection) {
                adminDashboardSection.classList.remove('hidden-section');
                adminDashboardSection.classList.add('current-section');
            } else {
                console.error("Admin dashboard section with ID 'admin-dashboard' not found.");
            }
            currentPage = 1; // Asegurarse de que la paginación empiece en la primera página al navegar a la sección
            loadUsersForAdmin(); // Cargar usuarios cada vez que se navega a la sección
        });
    }

    // Cargar usuarios al iniciar si la URL tiene el hash #admin-dashboard
    // Esto es útil si el usuario recarga la página o entra directamente con la URL
    if (window.location.hash === '#admin-dashboard') {
        if (adminDashboardSection) {
            // Asegurarse de que la sección de administración está visible
            document.querySelectorAll('main > section').forEach(section => {
                section.classList.add('hidden-section');
                section.classList.remove('current-section');
            });
            adminDashboardSection.classList.remove('hidden-section');
            adminDashboardSection.classList.add('current-section');
        }
        currentPage = 1; // Asegurarse de que la paginación empiece en la primera página
        loadUsersForAdmin();
    }
});