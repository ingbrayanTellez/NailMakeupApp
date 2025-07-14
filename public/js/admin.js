// public/js/admin.js
console.log('admin.js: Script cargado - Versión 2025-07-07-ADMIN-FEATURES-FIXED');

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const adminDashboardSection = document.getElementById('admin-dashboard');
    const adminMessageContainer = document.getElementById('admin-message-container');

    // Elementos de la pestaña de Usuarios (EXISTENTE)
    const userTableBody = document.getElementById('userTableBody');
    const userSearchInput = document.getElementById('userSearchInput');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const applyUserFiltersBtn = document.getElementById('applyUserFiltersBtn');
    const clearUserFiltersBtn = document.getElementById('clearUserFiltersBtn');
    const adminPrevPageBtn = document.getElementById('admin-prev-page-btn');
    const adminNextPageBtn = document.getElementById('admin-next-page-btn');
    const adminPageInfo = document.getElementById('admin-page-info');
    let currentUsersPage = 1;
    const usersPerPage = 10;
    let totalUsersPages = 1;

    // Elementos de las pestañas de Admin
    const tabButtons = document.querySelectorAll('.admin-tabs .tab-button');
    const adminTabContent = document.getElementById('admin-tab-content');

    // Elementos de la pestaña de Pedidos (NUEVOS)
    const orderTableBody = document.getElementById('orderTableBody');
    const orderSearchInput = document.getElementById('orderSearchInput');
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    const applyOrderFiltersBtn = document.getElementById('applyOrderFiltersBtn');
    const clearOrderFiltersBtn = document.getElementById('clearOrderFiltersBtn');
    const adminOrderPrevPageBtn = document.getElementById('admin-order-prev-page-btn');
    const adminOrderNextPageBtn = document.getElementById('admin-order-next-page-btn');
    const adminOrderPageInfo = document.getElementById('admin-order-page-info');
    let currentOrdersPage = 1;
    const ordersPerPage = 10;
    let totalOrdersPages = 1;

    // Elementos de la pestaña de Categorías (NUEVOS)
    const categoryForm = document.getElementById('category-form');
    const categoryIdInput = document.getElementById('categoryId');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryNameError = document.getElementById('categoryName-error');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    const cancelCategoryEditBtn = document.getElementById('cancelCategoryEditBtn');
    const categoryTableBody = document.getElementById('categoryTableBody');

    // Elementos de la pestaña de Descuentos (NUEVOS)
    const discountForm = document.getElementById('discount-form');
    const discountIdInput = document.getElementById('discountId');
    const discountCodeInput = document.getElementById('discountCode');
    const discountCodeError = document.getElementById('discountCode-error');
    const discountTypeSelect = document.getElementById('discountType');
    const discountValueInput = document.getElementById('discountValue');
    const discountValueError = document.getElementById('discountValue-error');
    const discountMinOrderInput = document.getElementById('discountMinOrder');
    const discountExpiryInput = document.getElementById('discountExpiry');
    const discountMaxUsesInput = document.getElementById('discountMaxUses');
    const saveDiscountBtn = document.getElementById('saveDiscountBtn');
    const cancelDiscountEditBtn = document.getElementById('cancelDiscountEditBtn');
    const discountTableBody = document.getElementById('discountTableBody');

    // Elementos de la pestaña de Estadísticas (NUEVOS)
    const totalSalesElement = document.getElementById('totalSales');
    const topProductsList = document.getElementById('topProductsList');
    const activeUsersCountElement = document.getElementById('activeUsersCount');


    // --- Funciones de Utilidad ---
    const getToken = () => localStorage.getItem('token');

    /**
     * Muestra un mensaje en el contenedor de mensajes del admin.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - Tipo de mensaje ('success', 'error', 'warning', 'info').
     */
    const showAdminMessage = (message, type) => {
        if (window.showMessage) { // Usar la función global showMessage de main.js
            window.showMessage(message, type, 'admin-message-container');
        } else {
            console.warn('admin.js: window.showMessage no está disponible.');
            if (adminMessageContainer) {
                adminMessageContainer.textContent = message;
                adminMessageContainer.className = `message-container show ${type}`;
                setTimeout(() => {
                    adminMessageContainer.classList.remove('show');
                }, 3000);
            }
        }
    };

    /**
     * Valida un campo de formulario.
     * @param {HTMLInputElement} inputElement - El elemento input a validar.
     * @param {HTMLElement} errorElement - El span donde mostrar el error.
     * @returns {boolean} True si es válido, false si no.
     */
    const validateInput = (inputElement, errorElement, message = 'Este campo es obligatorio.') => {
        if (!inputElement || !errorElement) return true; // Si no existen, no validar
        if (inputElement.value.trim() === '') {
            errorElement.textContent = message;
            return false;
        }
        errorElement.textContent = '';
        return true;
    };

    /**
     * Alterna la visibilidad de las pestañas del panel de administración.
     * @param {string} tabId - El ID de la pestaña a mostrar (ej. 'users', 'orders').
     */
    const showAdminTab = (tabId) => {
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        const tabPanes = adminTabContent.querySelectorAll('.admin-tab-pane');
        tabPanes.forEach(pane => {
            if (pane.id === `admin-tab-${tabId}`) {
                pane.classList.add('active');
                pane.classList.remove('hidden');
            } else {
                pane.classList.remove('active');
                pane.classList.add('hidden');
            }
        });

        // Cargar datos específicos de la pestaña al mostrarla
        switch (tabId) {
            case 'users':
                fetchUsers();
                break;
            case 'orders':
                fetchOrders();
                break;
            case 'categories':
                fetchCategories();
                break;
            case 'discounts':
                fetchDiscounts();
                break;
            case 'stats':
                fetchStatistics(); // Llamada a la función de estadísticas
                break;
        }
    };

    // --- Gestión de Usuarios (EXISTENTE y Mejorada) ---

    /**
     * Fetches users from the backend and renders them in the admin table.
     */
    const fetchUsers = async () => {
        showAdminMessage('Cargando usuarios...', 'info');
        userTableBody.innerHTML = '<tr><td colspan="6">Cargando usuarios...</td></tr>'; // Actualizado a 6 columnas

        const searchTerm = userSearchInput.value.trim();
        const roleFilter = userRoleFilter.value;

        let queryParams = `page=${currentUsersPage}&limit=${usersPerPage}`;
        if (searchTerm) {
            queryParams += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (roleFilter) {
            queryParams += `&role=${encodeURIComponent(roleFilter)}`;
        }

        try {
            const response = await fetch(`/api/admin/users?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await window.handleApiResponse(response); // Usa el manejador global de API

            if (data.users && data.users.length > 0) {
                userTableBody.innerHTML = '';
                data.users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user._id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>
                            <select class="user-role-select" data-id="${user._id}">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </td>
                        <td>
                            <span class="user-status-text ${user.isActive ? 'text-success' : 'text-error'}">
                                ${user.isActive ? 'Activo' : 'Bloqueado'}
                            </span>
                        </td>
                        <td class="user-actions">
                            <button class="btn btn-small save-role-btn" data-id="${user._id}">Guardar Rol</button>
                            <button class="btn btn-small toggle-active-btn" data-id="${user._id}" data-is-active="${user.isActive}">
                                ${user.isActive ? 'Bloquear' : 'Desbloquear'}
                            </button>
                            <button class="btn btn-small btn-danger delete-user-btn" data-id="${user._id}">Eliminar</button>
                            <button class="btn btn-small view-activity-btn" data-id="${user._id}" data-username="${user.username}">Ver Actividad</button>
                        </td>
                    `;
                    userTableBody.appendChild(row);
                });
                totalUsersPages = Math.ceil(data.totalUsers / usersPerPage);
                updateUserPaginationControls();
                showAdminMessage('Usuarios cargados.', 'success');
            } else {
                userTableBody.innerHTML = '<tr><td colspan="6">No se encontraron usuarios.</td></tr>';
                totalUsersPages = 1;
                updateUserPaginationControls();
                showAdminMessage('No se encontraron usuarios.', 'info');
            }
        } catch (error) {
            console.error('admin.js: Error fetching users:', error);
            userTableBody.innerHTML = '<tr><td colspan="6" class="text-error">Error al cargar usuarios.</td></tr>';
            showAdminMessage('Error al cargar usuarios.', 'error');
        }
    };

    /**
     * Updates pagination controls for users.
     */
    const updateUserPaginationControls = () => {
        adminPageInfo.textContent = `Página ${currentUsersPage} de ${totalUsersPages || 1}`;
        adminPrevPageBtn.disabled = currentUsersPage === 1;
        adminNextPageBtn.disabled = currentUsersPage === totalUsersPages || totalUsersPages === 0;
    };

    /**
     * Updates a user's role.
     * @param {string} userId - The ID of the user.
     * @param {string} newRole - The new role ('user' or 'admin').
     */
    const updateUserRole = async (userId, newRole) => {
        if (!window.confirmModal) { // Fallback si el modal no está disponible
            if (!confirm(`¿Estás seguro de cambiar el rol del usuario a ${newRole}?`)) return;
        } else {
            window.showConfirmModal(`¿Estás seguro de cambiar el rol del usuario a ${newRole}?`, async () => {
                try {
                    const response = await fetch(`/api/admin/users/${userId}/role`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ role: newRole })
                    });
                    await window.handleApiResponse(response);
                    showAdminMessage('Rol de usuario actualizado con éxito.', 'success');
                    fetchUsers(); // Recargar la lista de usuarios
                } catch (error) {
                    console.error('admin.js: Error updating user role:', error);
                    showAdminMessage('Error al actualizar el rol del usuario.', 'error');
                }
            });
        }
    };

    /**
     * Toggles a user's active status (block/unblock).
     * @param {string} userId - The ID of the user.
     * @param {boolean} currentStatus - The current active status of the user.
     */
    const toggleUserActiveStatus = async (userId, currentStatus) => {
        const action = currentStatus ? 'bloquear' : 'desbloquear';
        if (!window.confirmModal) {
            if (!confirm(`¿Estás seguro de ${action} a este usuario?`)) return;
        } else {
            window.showConfirmModal(`¿Estás seguro de ${action} a este usuario?`, async () => {
                try {
                    const response = await fetch(`/api/admin/users/${userId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ isActive: !currentStatus })
                    });
                    await window.handleApiResponse(response);
                    showAdminMessage(`Usuario ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} con éxito.`, 'success');
                    fetchUsers(); // Recargar la lista de usuarios
                } catch (error) {
                    console.error('admin.js: Error toggling user status:', error);
                    showAdminMessage(`Error al ${action} al usuario.`, 'error');
                }
            });
        }
    };

    /**
     * Deletes a user.
     * @param {string} userId - The ID of the user to delete.
     */
    const deleteUser = async (userId) => {
        if (!window.confirmModal) {
            if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.')) return;
        } else {
            window.showConfirmModal('¿Estás seguro de eliminar este usuario? Esta acción es irreversible.', async () => {
                try {
                    const response = await fetch(`/api/admin/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    await window.handleApiResponse(response);
                    showAdminMessage('Usuario eliminado con éxito.', 'success');
                    fetchUsers(); // Recargar la lista de usuarios
                } catch (error) {
                    console.error('admin.js: Error deleting user:', error);
                    showAdminMessage('Error al eliminar usuario.', 'error');
                }
            });
        }
    };

    /**
     * Fetches and displays a specific user's activity (e.g., orders).
     * @param {string} userId - The ID of the user.
     * @param {string} username - The username for display.
     */
    const viewUserActivity = async (userId, username) => {
        showAdminMessage(`Cargando actividad para ${username}...`, 'info');
        try {
            const response = await fetch(`/api/admin/users/${userId}/activity`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await window.handleApiResponse(response);

            let activityHtml = `<h4>Actividad para ${username}</h4>`;
            if (data.orders && data.orders.length > 0) {
                activityHtml += '<h5>Pedidos:</h5><ul>';
                data.orders.forEach(order => {
                    activityHtml += `<li>Pedido ID: ${order._id} - Total: $${order.total.toFixed(2)} - Estado: ${order.status}</li>`;
                });
                activityHtml += '</ul>';
            } else {
                activityHtml += '<p>No hay pedidos registrados para este usuario.</p>';
            }
            // Aquí puedes añadir más tipos de actividad si tu backend los proporciona
            // Ej: if (data.cartHistory) { ... }

            // Usar showConfirmModal para mostrar la actividad, ya que es un modal flexible
            window.showConfirmModal(activityHtml, () => {}, true); // El tercer parámetro 'true' indica que no hay botón "Sí"
            showAdminMessage('Actividad de usuario cargada.', 'success');
        } catch (error) {
            console.error('admin.js: Error fetching user activity:', error);
            showAdminMessage('Error al cargar la actividad del usuario.', 'error');
        }
    };


    // --- Gestión de Pedidos (NUEVOS) ---

    /**
     * Fetches orders from the backend and renders them.
     */
    const fetchOrders = async () => {
        showAdminMessage('Cargando pedidos...', 'info');
        orderTableBody.innerHTML = '<tr><td colspan="6">Cargando pedidos...</td></tr>';

        const searchTerm = orderSearchInput.value.trim();
        const statusFilter = orderStatusFilter.value;

        let queryParams = `page=${currentOrdersPage}&limit=${ordersPerPage}`;
        if (searchTerm) {
            queryParams += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (statusFilter) {
            queryParams += `&status=${encodeURIComponent(statusFilter)}`;
        }

        try {
            const response = await fetch(`/api/admin/orders?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await window.handleApiResponse(response);

            if (data.orders && data.orders.length > 0) {
                orderTableBody.innerHTML = '';
                data.orders.forEach(order => {
                    const orderDate = new Date(order.createdAt).toLocaleDateString();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${order._id}</td>
                        <td>${order.user ? order.user.username : 'N/A'}</td>
                        <td>$${order.total.toFixed(2)}</td>
                        <td>
                            <select class="order-status-select" data-id="${order._id}">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Enviado</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </td>
                        <td>${orderDate}</td>
                        <td class="order-actions">
                            <button class="btn btn-small update-status-btn" data-id="${order._id}">Actualizar</button>
                            <button class="btn btn-small view-order-details-btn" data-id="${order._id}">Ver Detalles</button>
                        </td>
                    `;
                    orderTableBody.appendChild(row);
                });
                totalOrdersPages = Math.ceil(data.totalOrders / ordersPerPage);
                updateOrderPaginationControls();
                showAdminMessage('Pedidos cargados.', 'success');
            } else {
                orderTableBody.innerHTML = '<tr><td colspan="6">No se encontraron pedidos.</td></tr>';
                totalOrdersPages = 1;
                updateOrderPaginationControls();
                showAdminMessage('No se encontraron pedidos.', 'info');
            }
        } catch (error) {
            console.error('admin.js: Error fetching orders:', error);
            orderTableBody.innerHTML = '<tr><td colspan="6" class="text-error">Error al cargar pedidos.</td></tr>';
            showAdminMessage('Error al cargar pedidos.', 'error');
        }
    };

    /**
     * Updates pagination controls for orders.
     */
    const updateOrderPaginationControls = () => {
        adminOrderPageInfo.textContent = `Página ${currentOrdersPage} de ${totalOrdersPages || 1}`;
        adminOrderPrevPageBtn.disabled = currentOrdersPage === 1;
        adminOrderNextPageBtn.disabled = currentOrdersPage === totalOrdersPages || totalOrdersPages === 0;
    };

    /**
     * Updates an order's status.
     * @param {string} orderId - The ID of the order.
     * @param {string} newStatus - The new status.
     */
    const updateOrderStatus = async (orderId, newStatus) => {
        if (!window.confirmModal) {
            if (!confirm(`¿Estás seguro de cambiar el estado del pedido a ${newStatus}?`)) return;
        } else {
            window.showConfirmModal(`¿Estás seguro de cambiar el estado del pedido a ${newStatus}?`, async () => {
                try {
                    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ status: newStatus })
                    });
                    await window.handleApiResponse(response);
                    showAdminMessage('Estado del pedido actualizado con éxito.', 'success');
                    fetchOrders(); // Recargar la lista de pedidos
                } catch (error) {
                    console.error('admin.js: Error updating order status:', error);
                    showAdminMessage('Error al actualizar el estado del pedido.', 'error');
                }
            });
        }
    };

    /**
     * Displays detailed information about a specific order.
     * @param {string} orderId - The ID of the order.
     */
    const viewOrderDetails = async (orderId) => {
        showAdminMessage(`Cargando detalles del pedido ${orderId}...`, 'info');
        try {
            // La URL aquí debe ser /api/admin/orders/:id, no /api/orders/:id
            const response = await fetch(`/api/admin/orders/${orderId}`, { 
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const order = await window.handleApiResponse(response); // Aquí es donde ocurre el error si la respuesta no es JSON válido

            // Verificar si order.user o order.shippingInfo existen antes de acceder a sus propiedades
            const username = order.user ? order.user.username : 'N/A';
            const userEmail = order.user ? order.user.email : 'N/A';
            const shippingName = order.shippingInfo ? order.shippingInfo.name : 'N/A';
            const shippingAddress = order.shippingInfo ? order.shippingInfo.address : 'N/A';
            const shippingCity = order.shippingInfo ? order.shippingInfo.city : 'N/A';
            const shippingCountry = order.shippingInfo ? order.shippingInfo.country : 'N/A';
            const paymentMethod = order.paymentMethod || 'N/A';

            let detailsHtml = `
                <h4>Detalles del Pedido #${order._id}</h4>
                <p><strong>Usuario:</strong> ${username} (${userEmail})</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> ${order.status}</p>
                <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <h5>Productos:</h5>
                <ul>
            `;
            // Asegurarse de que order.items es un array antes de iterar
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    detailsHtml += `<li>${item.name} (x${item.quantity}) - $${item.price.toFixed(2)} c/u</li>`;
                });
            } else {
                detailsHtml += `<li>No hay productos en este pedido.</li>`;
            }
            detailsHtml += `</ul>
                <h5>Información de Envío:</h5>
                <p><strong>Nombre:</strong> ${shippingName}</p>
                <p><strong>Dirección:</strong> ${shippingAddress}, ${shippingCity}, ${shippingCountry}</p>
                <p><strong>Método de Pago:</strong> ${paymentMethod}</p>
            `;

            window.showConfirmModal(detailsHtml, () => {}, true); // Usar showConfirmModal como modal de visualización
            showAdminMessage('Detalles del pedido cargados.', 'success');
        } catch (error) {
            console.error('admin.js: Error fetching order details:', error);
            showAdminMessage('Error al cargar los detalles del pedido.', 'error');
        }
    };


    // --- Gestión de Categorías (NUEVOS) ---

    /**
     * Fetches categories from the backend and renders them.
     */
    const fetchCategories = async () => {
        showAdminMessage('Cargando categorías...', 'info');
        categoryTableBody.innerHTML = '<tr><td colspan="3">Cargando categorías...</td></tr>';
        try {
            const response = await fetch('/api/categories', { // Este endpoint puede ser público o admin-only
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await window.handleApiResponse(response);

            if (data && data.length > 0) {
                categoryTableBody.innerHTML = '';
                data.forEach(category => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${category._id}</td>
                        <td>${category.name}</td>
                        <td class="category-actions">
                            <button class="btn btn-small edit-category-btn" data-id="${category._id}" data-name="${category.name}">Editar</button>
                            <button class="btn btn-small btn-danger delete-category-btn" data-id="${category._id}">Eliminar</button>
                        </td>
                    `;
                    categoryTableBody.appendChild(row);
                });
                showAdminMessage('Categorías cargadas.', 'success');
            } else {
                categoryTableBody.innerHTML = '<tr><td colspan="3">No se encontraron categorías.</td></tr>';
                showAdminMessage('No se encontraron categorías.', 'info');
            }
        } catch (error) {
            console.error('admin.js: Error fetching categories:', error);
            categoryTableBody.innerHTML = '<tr><td colspan="3" class="text-error">Error al cargar categorías.</td></tr>';
            showAdminMessage('Error al cargar categorías.', 'error');
        }
    };

    /**
     * Handles category form submission (create/edit).
     * @param {Event} event - The form submission event.
     */
    const handleCategoryFormSubmit = async (event) => {
        event.preventDefault();
        categoryNameError.textContent = '';

        const name = categoryNameInput.value.trim();
        if (!validateInput(categoryNameInput, categoryNameError, 'El nombre de la categoría es obligatorio.')) {
            showAdminMessage('Por favor, introduce un nombre para la categoría.', 'error');
            return;
        }

        const categoryId = categoryIdInput.value;
        const method = categoryId ? 'PUT' : 'POST';
        const url = categoryId ? `/api/admin/categories/${categoryId}` : '/api/admin/categories';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ name })
            });
            await window.handleApiResponse(response);
            showAdminMessage(`Categoría ${categoryId ? 'actualizada' : 'creada'} con éxito.`, 'success');
            categoryForm.reset();
            categoryIdInput.value = ''; // Limpiar ID oculto
            saveCategoryBtn.textContent = 'Guardar Categoría';
            cancelCategoryEditBtn.style.display = 'none';
            categoryNameError.textContent = ''; // Limpiar errores
            fetchCategories(); // Recargar la lista de categorías
        } catch (error) {
            console.error('admin.js: Error saving category:', error);
            showAdminMessage(`Error al ${categoryId ? 'actualizar' : 'crear'} categoría.`, 'error');
        }
    };

    /**
     * Sets the category form for editing.
     * @param {string} id - The ID of the category to edit.
     * @param {string} name - The name of the category to edit.
     */
    const editCategory = (id, name) => {
        categoryIdInput.value = id;
        categoryNameInput.value = name;
        saveCategoryBtn.textContent = 'Actualizar Categoría';
        cancelCategoryEditBtn.style.display = 'inline-block';
        showAdminMessage('Editando categoría...', 'info');
    };

    /**
     * Deletes a category.
     * @param {string} id - The ID of the category to delete.
     */
    const deleteCategory = async (id) => {
        if (!window.confirmModal) {
            if (!confirm('¿Estás seguro de eliminar esta categoría? Esto podría afectar a los productos asociados.')) return;
        } else {
            window.showConfirmModal('¿Estás seguro de eliminar esta categoría? Esto podría afectar a los productos asociados.', async () => {
                try {
                    const response = await fetch(`/api/admin/categories/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    await window.handleApiResponse(response);
                    showAdminMessage('Categoría eliminada con éxito.', 'success');
                    fetchCategories(); // Recargar la lista de categorías
                } catch (error) {
                    console.error('admin.js: Error deleting category:', error);
                    showAdminMessage('Error al eliminar categoría.', 'error');
                }
            });
        }
    };


    // --- Gestión de Descuentos (NUEVOS) ---

    /**
     * Fetches discounts from the backend and renders them.
     */
    const fetchDiscounts = async () => {
        showAdminMessage('Cargando descuentos...', 'info');
        discountTableBody.innerHTML = '<tr><td colspan="7">Cargando descuentos...</td></tr>';
        try {
            const response = await fetch('/api/admin/discounts', { // Admin-only endpoint
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await window.handleApiResponse(response);

            if (data && data.length > 0) {
                discountTableBody.innerHTML = '';
                data.forEach(discount => {
                    const expiryDate = discount.expiryDate ? new Date(discount.expiryDate).toLocaleDateString() : 'N/A';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${discount.code}</td>
                        <td>${discount.type === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</td>
                        <td>${discount.value}${discount.type === 'percentage' ? '%' : '$'}</td>
                        <td>${discount.minOrderAmount ? `$${discount.minOrderAmount.toFixed(2)}` : 'N/A'}</td>
                        <td>${expiryDate}</td>
                        <td>${discount.maxUses ? discount.maxUses : 'Ilimitado'}</td>
                        <td class="discount-actions">
                            <button class="btn btn-small edit-discount-btn" data-id="${discount._id}">Editar</button>
                            <button class="btn btn-small btn-danger delete-discount-btn" data-id="${discount._id}">Eliminar</button>
                        </td>
                    `;
                    discountTableBody.appendChild(row);
                });
                showAdminMessage('Descuentos cargados.', 'success');
            } else {
                discountTableBody.innerHTML = '<tr><td colspan="7">No se encontraron descuentos.</td></tr>';
                showAdminMessage('No se encontraron descuentos.', 'info');
            }
        } catch (error) {
            console.error('admin.js: Error fetching discounts:', error);
            discountTableBody.innerHTML = '<tr><td colspan="7" class="text-error">Error al cargar descuentos.</td></tr>';
            showAdminMessage('Error al cargar descuentos.', 'error');
        }
    };

    /**
     * Handles discount form submission (create/edit).
     * @param {Event} event - The form submission event.
     */
    const handleDiscountFormSubmit = async (event) => {
        event.preventDefault();
        discountCodeError.textContent = '';
        discountValueError.textContent = '';

        const code = discountCodeInput.value.trim();
        const type = discountTypeSelect.value;
        const value = parseFloat(discountValueInput.value);
        const minOrderAmount = discountMinOrderInput.value ? parseFloat(discountMinOrderInput.value) : null;
        const expiryDate = discountExpiryInput.value ? new Date(discountExpiryInput.value).toISOString() : null;
        const maxUses = discountMaxUsesInput.value ? parseInt(discountMaxUsesInput.value, 10) : null;

        let isValid = true;
        if (!validateInput(discountCodeInput, discountCodeError, 'El código de descuento es obligatorio.')) {
            isValid = false;
        }
        if (isNaN(value) || value <= 0) {
            discountValueError.textContent = 'El valor debe ser un número positivo.';
            isValid = false;
        }

        if (!isValid) {
            showAdminMessage('Por favor, corrige los errores en el formulario de descuento.', 'error');
            return;
        }

        const discountId = discountIdInput.value;
        const method = discountId ? 'PUT' : 'POST';
        const url = discountId ? `/api/admin/discounts/${discountId}` : '/api/admin/discounts';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ code, type, value, minOrderAmount, expiryDate, maxUses })
            });
            await window.handleApiResponse(response);
            showAdminMessage(`Descuento ${discountId ? 'actualizado' : 'creado'} con éxito.`, 'success');
            discountForm.reset();
            discountIdInput.value = '';
            saveDiscountBtn.textContent = 'Guardar Descuento';
            cancelDiscountEditBtn.style.display = 'none';
            discountCodeError.textContent = '';
            discountValueError.textContent = '';
            fetchDiscounts();
        } catch (error) {
            console.error('admin.js: Error saving discount:', error);
            showAdminMessage(`Error al ${discountId ? 'actualizar' : 'crear'} descuento.`, 'error');
        }
    };

    /**
     * Sets the discount form for editing.
     * @param {Object} discount - The discount object to edit.
     */
    const editDiscount = (discount) => {
        discountIdInput.value = discount._id;
        discountCodeInput.value = discount.code;
        discountTypeSelect.value = discount.type;
        discountValueInput.value = discount.value;
        discountMinOrderInput.value = discount.minOrderAmount || '';
        discountExpiryInput.value = discount.expiryDate ? new Date(discount.expiryDate).toISOString().split('T')[0] : '';
        discountMaxUsesInput.value = discount.maxUses || '';
        saveDiscountBtn.textContent = 'Actualizar Descuento';
        cancelDiscountEditBtn.style.display = 'inline-block';
        showAdminMessage('Editando descuento...', 'info');
    };

    /**
     * Deletes a discount.
     * @param {string} id - The ID of the discount to delete.
     */
    const deleteDiscount = async (id) => {
        if (!window.confirmModal) {
            if (!confirm('¿Estás seguro de eliminar este descuento?')) return;
        } else {
            window.showConfirmModal('¿Estás seguro de eliminar este descuento?', async () => {
                try {
                    const response = await fetch(`/api/admin/discounts/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${getToken()}` }
                    });
                    await window.handleApiResponse(response);
                    showAdminMessage('Descuento eliminado con éxito.', 'success');
                    fetchDiscounts();
                } catch (error) {
                    console.error('admin.js: Error deleting discount:', error);
                    showAdminMessage('Error al eliminar descuento.', 'error');
                }
            });
        }
    };

    // --- NUEVA FUNCIÓN: Obtener descuento por ID para edición ---
    const fetchDiscountForEdit = async (discountId) => {
        showAdminMessage(`Cargando descuento para editar: ${discountId}...`, 'info');
        try {
            const response = await fetch(`/api/admin/discounts/${discountId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const discount = await window.handleApiResponse(response); // Usa el manejador global

            if (discount) {
                editDiscount(discount); // Pasa el objeto completo a editDiscount
                showAdminMessage('Descuento listo para editar.', 'success');
            } else {
                showAdminMessage('No se pudo encontrar el descuento para editar.', 'error');
            }
        } catch (error) {
            console.error('admin.js: Error fetching discount for edit:', error);
            showAdminMessage('Error al cargar el descuento para editar.', 'error');
        }
    };

    // --- Estadísticas y Reportes (NUEVOS) ---

    /**
     * Fetches and displays various statistics.
     */
    const fetchStatistics = async () => { // Esta es la única declaración de fetchStatistics
        showAdminMessage('Cargando estadísticas...', 'info');
        totalSalesElement.textContent = '$0.00';
        topProductsList.innerHTML = '<li>Cargando...</li>';
        activeUsersCountElement.textContent = '0';

        try {
            // Fetch Total Sales
            const salesResponse = await fetch('/api/admin/stats/sales', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const salesData = await window.handleApiResponse(salesResponse);
            totalSalesElement.textContent = `$${(salesData.totalSales || 0).toFixed(2)}`;

            // Fetch Top Products
            const topProductsResponse = await fetch('/api/admin/stats/top-products', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const topProductsData = await window.handleApiResponse(topProductsResponse);
            if (topProductsData.topProducts && topProductsData.topProducts.length > 0) {
                topProductsList.innerHTML = '';
                topProductsData.topProducts.forEach(product => {
                    // Asegúrate de que 'product.name' y 'product.totalSoldQuantity' existen
                    const productName = product.name || 'Producto Desconocido';
                    const soldQuantity = product.totalSoldQuantity || 0; // Usar totalSoldQuantity
                    const li = document.createElement('li');
                    li.textContent = `${productName} (${soldQuantity} unidades vendidas)`;
                    topProductsList.appendChild(li);
                });
            } else {
                topProductsList.innerHTML = '<li>No hay productos más vendidos aún.</li>';
            }

            // Fetch Active Users
            const activeUsersResponse = await fetch('/api/admin/stats/active-users', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const activeUsersData = await window.handleApiResponse(activeUsersResponse);
            activeUsersCountElement.textContent = activeUsersData.activeUsersCount || 0;

            showAdminMessage('Estadísticas cargadas.', 'success');
        } catch (error) {
            console.error('admin.js: Error fetching statistics:', error);
            showAdminMessage('Error al cargar estadísticas.', 'error');
        }
    };


    // --- Inicialización y Listeners ---

    /**
     * Global function to render the admin dashboard.
     * This will be called by main.js when the admin dashboard section is shown.
     */
    window.renderAdminDashboard = async () => {
        // Por defecto, mostrar la pestaña de usuarios al entrar al dashboard
        showAdminTab('users');
    };

    // Listeners para las pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showAdminTab(button.dataset.tab);
        });
    });

    // Listeners para la gestión de usuarios
    if (applyUserFiltersBtn) applyUserFiltersBtn.addEventListener('click', fetchUsers);
    if (clearUserFiltersBtn) clearUserFiltersBtn.addEventListener('click', () => {
        userSearchInput.value = '';
        userRoleFilter.value = '';
        currentUsersPage = 1;
        fetchUsers();
    });
    if (adminPrevPageBtn) adminPrevPageBtn.addEventListener('click', () => {
        if (currentUsersPage > 1) {
            currentUsersPage--;
            fetchUsers();
        }
    });
    if (adminNextPageBtn) adminNextPageBtn.addEventListener('click', () => {
        if (currentUsersPage < totalUsersPages) {
            currentUsersPage++;
            fetchUsers();
        }
    });

    // Delegación de eventos para la tabla de usuarios (para botones dinámicos)
    if (userTableBody) {
        userTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const userId = target.dataset.id;

            if (target.classList.contains('save-role-btn')) {
                const newRole = target.closest('tr').querySelector('.user-role-select').value;
                updateUserRole(userId, newRole);
            } else if (target.classList.contains('toggle-active-btn')) {
                const currentStatus = target.dataset.isActive === 'true'; // Convertir a booleano
                toggleUserActiveStatus(userId, currentStatus);
            } else if (target.classList.contains('delete-user-btn')) {
                deleteUser(userId);
            } else if (target.classList.contains('view-activity-btn')) {
                const username = target.dataset.username;
                viewUserActivity(userId, username);
            }
        });
    }

    // Listeners para la gestión de pedidos
    if (applyOrderFiltersBtn) applyOrderFiltersBtn.addEventListener('click', fetchOrders);
    if (clearOrderFiltersBtn) clearOrderFiltersBtn.addEventListener('click', () => {
        orderSearchInput.value = '';
        orderStatusFilter.value = '';
        currentOrdersPage = 1;
        fetchOrders();
    });
    if (adminOrderPrevPageBtn) adminOrderPrevPageBtn.addEventListener('click', () => {
        if (currentOrdersPage > 1) {
            currentOrdersPage--;
            fetchOrders();
        }
    });
    if (adminOrderNextPageBtn) adminOrderNextPageBtn.addEventListener('click', () => {
        if (currentOrdersPage < totalOrdersPages) {
            currentOrdersPage++;
            fetchOrders();
        }
    });

    // Delegación de eventos para la tabla de pedidos
    if (orderTableBody) {
        orderTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const orderId = target.dataset.id;

            if (target.classList.contains('update-status-btn')) {
                const newStatus = target.closest('tr').querySelector('.order-status-select').value;
                updateOrderStatus(orderId, newStatus);
            } else if (target.classList.contains('view-order-details-btn')) {
                viewOrderDetails(orderId);
            }
        });
    }

    // Listeners para la gestión de categorías
    if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    if (cancelCategoryEditBtn) cancelCategoryEditBtn.addEventListener('click', () => {
        categoryForm.reset();
        categoryIdInput.value = '';
        saveCategoryBtn.textContent = 'Guardar Categoría';
        cancelCategoryEditBtn.style.display = 'none';
        categoryNameError.textContent = ''; // Limpiar errores
        showAdminMessage('Edición de categoría cancelada.', 'info');
    });
    // Delegación de eventos para la tabla de categorías
    if (categoryTableBody) {
        categoryTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const categoryId = target.dataset.id;
            const categoryName = target.dataset.name;

            if (target.classList.contains('edit-category-btn')) {
                editCategory(categoryId, categoryName);
            } else if (target.classList.contains('delete-category-btn')) {
                deleteCategory(categoryId);
            }
        });
    }

    // Listeners para la gestión de descuentos
    if (discountForm) discountForm.addEventListener('submit', handleDiscountFormSubmit);
    if (cancelDiscountEditBtn) cancelDiscountEditBtn.addEventListener('click', () => {
        discountForm.reset();
        discountIdInput.value = '';
        saveDiscountBtn.textContent = 'Guardar Descuento';
        cancelDiscountEditBtn.style.display = 'none';
        discountCodeError.textContent = '';
        discountValueError.textContent = '';
        showAdminMessage('Edición de descuento cancelada.', 'info');
    });
    // Delegación de eventos para la tabla de descuentos
    if (discountTableBody) {
        discountTableBody.addEventListener('click', (event) => {
            const target = event.target;
            const discountId = target.dataset.id;

            if (target.classList.contains('edit-discount-btn')) {
                // *** CORRECCIÓN AQUÍ: Obtener el descuento completo antes de editar ***
                // Llama a la nueva función para obtener el descuento por ID
                fetchDiscountForEdit(discountId); 
            } else if (target.classList.contains('delete-discount-btn')) {
                deleteDiscount(discountId);
            }
        });
    }
});
