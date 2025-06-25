// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const productList = document.getElementById('product-list');
    const productsSection = document.getElementById('products');
    const noProductsMessage = document.getElementById('no-products-message');
    // Las referencias a elementos del DOM de admin-dashboard se manejan en admin.js

    // --- Elementos de Filtro de Productos ---
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const minPriceInput = document.getElementById('min-price-input');
    const maxPriceInput = document.getElementById('max-price-input');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // --- Elementos de Paginación de Productos ---
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');

    // --- Variables de Estado de Paginación y Filtro de Productos ---
    let currentPage = 1;
    const limit = 6; // Número de productos por página
    let totalPages = 1;

    // --- VARIABLE GLOBAL PARA EL ESTADO DEL USUARIO ---
    let currentUserInfo = null; // Almacenará el objeto de usuario (incluido el rol)

    // --- Referencias a elementos del HEADER y SECCIONES ---
    const navLinks = document.querySelectorAll('.header-nav-icons ul li a');
    const sections = document.querySelectorAll('main section');
    const headerSearchInputContainer = document.querySelector('.header-search-bar-wrapper');

    // --- Carrito de compras ---
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartCountSpan = document.createElement('span'); // Span for cart item count
    cartCountSpan.id = 'cart-count';
    cartCountSpan.textContent = '0'; // Initial value
    
    const navCartLink = document.getElementById('nav-cart-link');
    if (navCartLink) {
        navCartLink.appendChild(cartCountSpan);
    }

    // --- Funciones de Utilidad ---

    /**
     * Obtiene el token de autenticación del localStorage.
     * @returns {string|null} El token si existe, de lo contrario null.
     */
    const getToken = () => {
        return localStorage.getItem('token');
    };

    /**
     * Obtiene y actualiza la información del usuario actual.
     * Almacena el resultado en `currentUserInfo` y actualiza la UI de "Mi Cuenta".
     */
    const fetchCurrentUser = async () => {
        const token = getToken();
        const profileUsername = document.getElementById('profile-username');
        const profileEmail = document.getElementById('profile-email');
        const profileRole = document.getElementById('profile-role');
        const profileImage = document.getElementById('profile-image');

        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    currentUserInfo = await response.json();
                    localStorage.setItem('user', JSON.stringify(currentUserInfo));
                    // Actualizar la información de perfil en la sección "Mi Cuenta"
                    if (profileUsername) profileUsername.textContent = currentUserInfo.username;
                    if (profileEmail) profileEmail.textContent = currentUserInfo.email;
                    if (profileRole) profileRole.textContent = currentUserInfo.role;
                    if (profileImage) profileImage.src = currentUserInfo.avatarUrl || '/img/default-avatar.png';
                    localStorage.setItem('currentUserId', currentUserInfo._id); // Guarda el ID del usuario logueado
                } else {
                    console.warn('Fallo al obtener información del usuario actual. El token podría ser inválido o haber expirado.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('currentUserId');
                    currentUserInfo = null;
                    // Limpiar también la UI de Mi Cuenta si no se pudo cargar el usuario
                    if (profileUsername) profileUsername.textContent = 'No disponible';
                    if (profileEmail) profileEmail.textContent = 'No disponible';
                    if (profileRole) profileRole.textContent = 'No disponible';
                    if (profileImage) profileImage.src = '/img/default-avatar.png';
                }
            } catch (error) {
                console.error('Error de red al obtener información del usuario actual:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('currentUserId');
                currentUserInfo = null;
                // Limpiar también la UI de Mi Cuenta en caso de error de red
                if (profileUsername) profileUsername.textContent = 'Error';
                if (profileEmail) profileEmail.textContent = 'Error';
                if (profileRole) profileRole.textContent = 'Error';
                if (profileImage) profileImage.src = '/img/default-avatar.png';
            }
        } else {
            currentUserInfo = null;
            localStorage.removeItem('user');
            localStorage.removeItem('currentUserId');
            // Limpiar la UI de Mi Cuenta si no hay usuario logueado
            if (profileUsername) profileUsername.textContent = 'No logueado';
            if (profileEmail) profileEmail.textContent = 'No logueado';
            if (profileRole) profileRole.textContent = 'No logueado';
            if (profileImage) profileImage.src = '/img/default-avatar.png';
        }
    };

    /**
     * Muestra u oculta los botones de acción (editar/eliminar) según el rol del usuario.
     * @param {string} productId - El ID del producto.
     * @returns {string} HTML de los botones de acción si el usuario es admin, vacío si no.
     */
    const renderAdminButtons = (productId) => {
        if (currentUserInfo && currentUserInfo.role === 'admin') {
            return `
                <button class="btn edit-btn" data-id="${productId}">Editar</button>
                <button class="btn delete-btn" data-id="${productId}">Eliminar</button>
            `;
        }
        return '';
    };

    /**
     * Función global para mostrar mensajes.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - Tipo de mensaje ('success', 'error', 'warning').
     */
    function showMessage(message, type) {
        const container = document.getElementById('global-message-container');
        if (container) {
            container.textContent = message;
            container.className = `message-container show ${type}`;
            setTimeout(() => {
                container.classList.remove('show');
            }, 3000);
        }
    }

    /**
     * Renderiza los productos en la cuadrícula.
     * @param {Array} products - Array de objetos producto.
     */
    const renderProducts = (products) => {
        if (!productList) return;

        productList.innerHTML = '';

        if (!Array.isArray(products) || products.length === 0) {
            noProductsMessage.classList.remove('hidden');
            noProductsMessage.textContent = products.length === 0 ? "No se encontraron productos que coincidan con tu búsqueda." : "Error: Datos de productos inválidos recibidos del servidor.";
            return;
        } else {
            noProductsMessage.classList.add('hidden');
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.imageUrl || '/img/placeholder.jpg'}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <p>Categoría: ${product.category}</p>
                    <p>Stock: ${product.stock}</p>
                </div>
                <div class="product-actions">
                    <button class="btn add-to-cart-btn" 
                            data-product-id="${product._id}" 
                            data-product-name="${product.name}" 
                            data-product-price="${product.price}">Añadir al Carrito</button>
                    ${renderAdminButtons(product._id)}
                </div>
            `;
            productList.appendChild(productCard);
        });

        productList.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.id;
                if (window.editProduct) { 
                    window.editProduct(productId); 
                } else {
                    console.error('window.editProduct no está disponible. Asegúrate de que addProduct.js se cargue correctamente.');
                }
            });
        });

        productList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar este producto?')) { 
                    deleteProduct(productId);
                }
            });
        });
    };

    /**
     * Actualiza el estado de los botones de paginación y la información de la página.
     */
    const updatePaginationControls = () => {
        pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    };

    /**
     * Obtiene los productos de la API con filtros y paginación.
     */
    const fetchProducts = async () => {
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('limit', limit);

        const searchQuery = searchInput.value.trim();
        if (searchQuery) params.append('search', searchQuery);
        const category = categoryFilter.value;
        if (category && category !== 'All') params.append('category', category);
        const minPrice = parseFloat(minPriceInput.value);
        if (!isNaN(minPrice) && minPrice >= 0) params.append('minPrice', minPrice);
        const maxPrice = parseFloat(maxPriceInput.value);
        if (!isNaN(maxPrice) && maxPrice >= 0) params.append('maxPrice', maxPrice);

        try {
            const response = await fetch(`/api/products?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                const productsToRender = data.products || [];
                renderProducts(productsToRender);
                totalPages = data.totalPages || 1;
                updatePaginationControls();
            } else {
                console.error('Error al obtener productos:', data.message);
                productList.innerHTML = `<p class="error-message">Error al cargar productos: ${data.message || 'Error desconocido'}</p>`;
                noProductsMessage.classList.add('hidden');
                totalPages = 1;
                updatePaginationControls();
            }
        } catch (error) {
            console.error('Error de red/servidor al obtener productos:', error);
            productList.innerHTML = `<p class="error-message">No se pudo conectar con el servidor para cargar los productos. Por favor, verifica tu conexión.</p>`;
            noProductsMessage.classList.add('hidden');
            totalPages = 1;
            updatePaginationControls();
        }
    };

    /**
     * Elimina un producto por su ID.
     * @param {string} productId - El ID del producto a eliminar.
     */
    const deleteProduct = async (productId) => {
        const token = getToken();
        if (!token || (currentUserInfo && currentUserInfo.role !== 'admin')) { // Asegurar que sea admin
            showMessage('No autorizado. Por favor, inicia sesión como administrador.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || 'Producto eliminado con éxito.', 'success'); 
                fetchProducts();
            } else {
                showMessage(data.message || 'Error al eliminar el producto.', 'error'); 
                console.error('Error al eliminar producto:', data.message);
            }
        } catch (error) {
            console.error('Error de red/servidor al eliminar producto:', error);
            showMessage('Error de conexión al eliminar el producto.', 'error'); 
        }
    };

    // --- Funcionalidad del Carrito de Compras ---

    /**
     * Obtiene el carrito del backend y actualiza el frontend.
     */
    async function fetchCartAndDisplay() {
        try {
            const token = getToken();
            if (!token) {
                renderCart([]); 
                updateCartCount(0);
                return;
            }

            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });
            const cartData = await response.json();

            if (response.ok) {
                renderCart(cartData.items);
                updateCartCount(cartData.items.length);
            } else {
                showMessage(`Error al cargar el carrito: ${cartData.message}`, 'error');
                renderCart([]);
                updateCartCount(0);
            }
        } catch (error) {
            console.error('Error de red al obtener el carrito:', error);
            showMessage('Error de conexión al cargar el carrito.', 'error');
            renderCart([]);
            updateCartCount(0);
        }
    }

    /**
     * Renderiza el contenido del carrito en la interfaz.
     * @param {Array} items - Array de ítems del carrito.
     */
    function renderCart(items) {
        if (!cartItemsContainer || !cartTotalElement || !checkoutBtn) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (items.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío. ¡Empieza a añadir productos!</p>';
            checkoutBtn.disabled = true;
        } else {
            items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                const productIdToUse = item.productId && item.productId._id ? item.productId._id : item.productId;

                itemElement.innerHTML = `
                    <div class="cart-item-info">
                        <img src="${item.imageUrl || '/img/placeholder.png'}" alt="${item.name}" class="cart-item-img"/>
                        <div class="cart-item-details">
                            <h3>${item.name}</h3>
                            <p>Precio unitario: $${item.price.toFixed(2)}</p>
                            <div class="quantity-control">
                                <button class="quantity-btn decrease-qty" data-product-id="${productIdToUse}">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn increase-qty" data-product-id="${productIdToUse}">+</button>
                            </div>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="btn btn-danger remove-item-btn" data-product-id="${productIdToUse}">Remover</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
                total += item.price * item.quantity;
            });
            checkoutBtn.disabled = false;
        }
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    /**
     * Actualiza el contador de ítems en el encabezado.
     * @param {number} count - Número total de ítems en el carrito.
     */
    function updateCartCount(count) {
        if (cartCountSpan) {
            cartCountSpan.textContent = count;
        }
    }

    /**
     * Añade un producto al carrito.
     * @param {string} productId - ID del producto a añadir.
     * @param {number} quantity - Cantidad a añadir (por defecto 1).
     */
    async function addToCart(productId, quantity = 1) {
        const token = getToken();
        if (!token) {
            showMessage('Necesitas iniciar sesión para añadir productos al carrito.', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId, quantity })
            });
            const result = await response.json();
            if (response.ok) {
                showMessage('Producto añadido al carrito!', 'success');
                fetchCartAndDisplay();
            } else {
                showMessage(`Error al añadir producto: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error de red al añadir producto:', error);
            showMessage('Error de conexión al añadir producto.', 'error');
        }
    }

    /**
     * Actualiza la cantidad de un producto específico en el carrito.
     * @param {string} productId - ID del producto a actualizar.
     * @param {number} newQuantity - La nueva cantidad deseada para el producto.
     */
    async function updateCartItemQuantity(productId, newQuantity) {
        const token = getToken();
        if (!token) {
            showMessage('Necesitas iniciar sesión para modificar tu carrito.', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/cart/update-quantity', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId, quantity: newQuantity })
            });
            const result = await response.json();
            if (response.ok) {
                showMessage('Cantidad del producto actualizada.', 'success');
                fetchCartAndDisplay();
            } else {
                showMessage(`Error al actualizar cantidad: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error de red al actualizar cantidad:', error);
            showMessage('Error de conexión al actualizar la cantidad.', 'error');
        }
    }

    /**
     * Elimina un producto del carrito.
     * @param {string} productId - ID del producto a eliminar.
     */
    async function removeCartItem(productId) {
        const token = getToken();
        if (!token) {
            showMessage('Necesitas iniciar sesión para eliminar productos de tu carrito.', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                showMessage('Producto eliminado del carrito.', 'warning');
                fetchCartAndDisplay();
            } else {
                showMessage(`Error al eliminar producto: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error de red al eliminar producto:', error);
            showMessage('Error de conexión al eliminar producto.', 'error');
        }
    }

    /**
     * Función para mostrar una sección y ocultar las demás.
     * @param {string} sectionId - ID de la sección a mostrar.
     */
    function showSection(sectionId) {
        let targetSectionElement = document.getElementById(sectionId);
        if (!sectionId || !targetSectionElement) {
            console.error(`Sección con ID '${sectionId}' no encontrada. Redirigiendo a 'home'.`);
            sectionId = 'home';
            targetSectionElement = document.getElementById('home');
        }

        sections.forEach(section => {
            section.classList.remove('current-section');
            section.classList.add('hidden-section');
        });
        
        if (targetSectionElement) {
            targetSectionElement.classList.add('current-section');
            targetSectionElement.classList.remove('hidden-section');
        }

        // Lógica para ocultar/mostrar la barra de búsqueda del header
        if (headerSearchInputContainer) { 
            if (sectionId === 'my-account' || sectionId === 'admin-dashboard') { // También ocultar en admin-dashboard
                headerSearchInputContainer.style.display = 'none';
            } else {
                headerSearchInputContainer.style.display = 'block';
            }
        }

        // Si se va a la sección del carrito, actualiza su contenido
        if (sectionId === 'cart') {
            fetchCartAndDisplay();
        }
        // Si se va a la sección de productos, asegúrate de cargar los productos
        else if (sectionId === 'products') { // Usar else if para que solo una se ejecute
            fetchProducts();
        }
        // Si se va a la sección de administración, llama a la función de admin.js
        else if (sectionId === 'admin-dashboard') {
            // Asegurarse de que window.loadUsersForAdmin esté disponible
            if (window.loadUsersForAdmin) {
                window.loadUsersForAdmin();
            } else {
                console.error("window.loadUsersForAdmin no está disponible. Asegúrate de que admin.js se cargue correctamente.");
            }
        }
        // Si se va a la sección Mi Cuenta, actualiza la info del usuario
        else if (sectionId === 'my-account') {
            fetchCurrentUser(); 
        }
    }

    // --- Event Listeners ---

    // Event Listeners para los botones de añadir/quitar del carrito y eliminar (Globalmente)
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const productId = event.target.dataset.productId;
            if (productId) addToCart(productId, 1);
        }
        else if (event.target.classList.contains('decrease-qty')) {
            const productId = event.target.dataset.productId;
            const quantitySpan = event.target.nextElementSibling;
            const currentQuantity = parseInt(quantitySpan.textContent);
            if (productId && currentQuantity > 0) updateCartItemQuantity(productId, currentQuantity - 1);
        } else if (event.target.classList.contains('increase-qty')) {
            const productId = event.target.dataset.productId;
            const quantitySpan = event.target.previousElementSibling;
            const currentQuantity = parseInt(quantitySpan.textContent);
            if (productId) updateCartItemQuantity(productId, currentQuantity + 1);
        }
        else if (event.target.classList.contains('remove-item-btn')) {
            const productId = event.target.dataset.productId;
            if (productId) removeCartItem(productId);
        }
    });

    // Botón "Explorar Productos" del Hero 
    const exploreProductsBtnRef = document.getElementById('explore-products-btn'); 
    if (exploreProductsBtnRef) {
        exploreProductsBtnRef.addEventListener('click', async (event) => {
            event.preventDefault();
            showSection('products');
            await fetchCurrentUser();
            fetchProducts();
        });
    }

    // Aplicar filtros
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', async () => {
            currentPage = 1;
            await fetchCurrentUser(); 
            fetchProducts();
        });
    }

    // Limpiar filtros
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', async () => {
            searchInput.value = '';
            categoryFilter.value = 'All';
            minPriceInput.value = '';
            maxPriceInput.value = '';
            currentPage = 1;
            await fetchCurrentUser(); 
            fetchProducts();
        });
    }

    // Paginación
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', async () => {
            if (currentPage > 1) {
                currentPage--;
                await fetchCurrentUser(); 
                fetchProducts();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', async () => {
            if (currentPage < totalPages) {
                currentPage++;
                await fetchCurrentUser(); 
                fetchProducts();
            }
        });
    }

    // --- Event Listeners para navegación principal ---
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = event.target.closest('a').getAttribute('href').substring(1); 
            showSection(targetId);
        });
    });

    // --- MANEJADOR ESPECÍFICO PARA CERRAR SESIÓN ---
    const navLogoutLink = document.getElementById('nav-logout-link'); 
    if (navLogoutLink) {
        navLogoutLink.addEventListener('click', async (event) => {
            event.preventDefault(); 

            localStorage.removeItem('token'); 
            localStorage.removeItem('user');  
            localStorage.removeItem('currentUserId'); // Asegúrate de limpiar también esto
            currentUserInfo = null;           

            await window.refreshCurrentUserAndProducts(); 
            
            window.location.hash = ''; 
            showSection('home'); 
            showMessage('Sesión cerrada con éxito.', 'success'); 
        });
    }


    // --- Exportación de funciones para otros scripts ---
    window.fetchProducts = fetchProducts; 
    window.renderAdminButtons = renderAdminButtons; 
    // Esta función ahora será el punto central para refrescar todo el UI después de un cambio de estado de usuario
    window.refreshCurrentUserAndProducts = async () => {
        await fetchCurrentUser();
        if (currentUserInfo) {
            window.updateMenuVisibility(currentUserInfo.role);
        } else {
            window.updateMenuVisibility(null);
        }
        fetchProducts(); // Siempre recarga productos
        fetchCartAndDisplay(); // Siempre recarga el carrito
        // Solo llamar a loadUsersForAdmin si la función existe globalmente (es decir, admin.js fue cargado)
        // y si estamos en la sección de administración O el usuario es admin
        if (window.loadUsersForAdmin && currentUserInfo && currentUserInfo.role === 'admin') {
            const currentHash = window.location.hash.substring(1);
            if (currentHash === 'admin-dashboard') {
                 window.loadUsersForAdmin(); // Recargar la tabla de usuarios solo si está visible
            }
        } else if (window.loadUsersForAdmin && (!currentUserInfo || currentUserInfo.role !== 'admin')) {
             // Si admin.js existe pero el usuario no es admin, limpiar la tabla si estaba visible
            if (document.getElementById('admin-dashboard')?.classList.contains('current-section')) {
                 // Puedes añadir una función en admin.js para limpiar la tabla
                 // o simplemente asegurarse de que loadUsersForAdmin maneje la falta de autorización
                window.loadUsersForAdmin(); // loadUsersForAdmin ya maneja el caso de no admin
            }
        }
    };


    // --- Lógica de visibilidad del menú por rol ---
    window.updateMenuVisibility = function(userRole) {
        const myAccountNav = document.getElementById('nav-my-account-container');
        const loginNav = document.getElementById('nav-login-container');
        const logoutNav = document.getElementById('nav-logout-container');
        const addProductNav = document.getElementById('nav-add-product-container');
        const adminDashboardNav = document.getElementById('nav-admin-dashboard-container');
        const cartNav = document.getElementById('nav-cart-container');

        if (!myAccountNav || !loginNav || !logoutNav || !addProductNav || !adminDashboardNav || !cartNav) {
            console.warn("Algunos elementos de navegación no se encontraron. La visibilidad del menú podría no funcionar correctamente.");
            return;
        }

        if (userRole) { 
            loginNav.style.display = 'none';
            myAccountNav.style.display = 'list-item';
            logoutNav.style.display = 'list-item';

            if (userRole === 'admin') {
                addProductNav.style.display = 'list-item';
                adminDashboardNav.style.display = 'list-item';
                cartNav.style.display = 'none'; 
            } else { 
                addProductNav.style.display = 'none';
                adminDashboardNav.style.display = 'none';
                cartNav.style.display = 'list-item'; 
            }
        } else { 
            myAccountNav.style.display = 'none';
            logoutNav.style.display = 'none';
            addProductNav.style.display = 'none';
            adminDashboardNav.style.display = 'none';
            loginNav.style.display = 'list-item';
            cartNav.style.display = 'list-item'; 
        }
    };

    // --- Manejar la visibilidad de secciones basándose en el hash de la URL ---
    window.addEventListener('hashchange', async () => {
        const hash = window.location.hash.substring(1);
        showSection(hash);
    });

    // --- Inicialización al cargar la página ---
    fetchCurrentUser().then(() => {
        const currentHash = window.location.hash.substring(1);
        showSection(currentHash); 
        if (currentUserInfo) {
            window.updateMenuVisibility(currentUserInfo.role);
        } else {
            window.updateMenuVisibility(null);
        }
        fetchCartAndDisplay(); 
        // No llamar a loadUsersForAdmin aquí, se hará a través de showSection
    });

});
