// public/js/main.js

// --- VARIABLES GLOBALES (accesibles si el script se carga) ---
let currentUserInfo = null; // Almacenará el objeto de usuario (incluido el rol)

/**
 * Función global para mostrar mensajes.
 * Expuesta en window para uso general.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - Tipo de mensaje ('success', 'error', 'warning', 'info').
 * @param {string} targetContainerId - ID del contenedor donde se mostrará el mensaje (default: 'global-message-container').
 */
window.showMessage = (message, type, targetContainerId = 'global-message-container') => {
    const container = document.getElementById(targetContainerId);
    if (container) {
        container.textContent = message;
        container.className = `message-container show ${type}`; // 'type' puede ser 'success', 'error', 'warning', 'info'
        setTimeout(() => {
            container.classList.remove('show');
        }, 3000);
    } else {
    }
};

/**
 * Muestra un modal de confirmación personalizado.
 * Expuesto en window para uso general (auth.js, products.js, etc.).
 * @param {string} message El mensaje a mostrar en el modal.
 * @param {function} onConfirm La función a ejecutar si el usuario confirma.
 */
window.showConfirmModal = (message, onConfirm) => {
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalBtnYes = document.getElementById('confirmModalBtnYes');
    const confirmModalBtnNo = document.getElementById('confirmModalBtnNo');
    const closeConfirmModalBtn = document.getElementById('closeConfirmModal'); 

    if (!confirmModal || !confirmModalMessage || !confirmModalBtnYes || !confirmModalBtnNo || !closeConfirmModalBtn) {
        console.error("main.js: No se encontraron todos los elementos del modal de confirmación. Asegúrate de que existan en tu HTML.");
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }

    confirmModalMessage.textContent = message;
    confirmModal.style.display = 'flex'; 
    
    confirmModalBtnYes.onclick = null;
    confirmModalBtnNo.onclick = null;
    closeConfirmModalBtn.onclick = null; 

    confirmModalBtnYes.onclick = () => {
        window.hideConfirmModal();
        onConfirm(); 
    };
    confirmModalBtnNo.onclick = () => {
        window.hideConfirmModal();
    };
    closeConfirmModalBtn.onclick = () => { 
        window.hideConfirmModal();
    };
};

/**
 * Oculta el modal de confirmación.
 * Expuesto en window para uso general.
 */
window.hideConfirmModal = () => {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'none'; 
    }
};

/**
 * Función auxiliar para manejar respuestas de la API, especialmente errores de autenticación.
 * @param {Response} response - La respuesta de la API.
 * @returns {Promise<Object>} - La data JSON de la respuesta.
 * @throws {Error} - Si la respuesta no es OK o si el token ha expirado.
 */
window.handleApiResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUserId');
        currentUserInfo = null; // Asegurarse de que la variable global también se limpia
        if (window.showSection) {
            window.showMessage('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'error');
            window.showSection('login');
        } else {
            // Fallback si showSection no está disponible (ej. en la carga inicial)
            window.location.hash = '#login';
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
        }
        // Lanzar un error para que el bloque catch de la función que llamó a handleApiResponse lo maneje
        throw new Error('Sesión expirada o no autorizada.');
    }
    
    // Intentar parsear siempre, incluso si es un error HTTP, para obtener el mensaje del backend
    const data = await response.json(); 

    if (!response.ok) {
        // Si no es un 401/403 pero sigue siendo un error HTTP, lanzar el mensaje del backend
        throw new Error(data.message || `Error HTTP: ${response.status} - ${response.statusText}`);
    }

    return data;
};


document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a Elementos del DOM (asegúrate de que estos IDs existan en index.html) ---
    const productList = document.getElementById('product-list');
    const productsSection = document.getElementById('products');
    const noProductsMessage = document.getElementById('no-products-message');

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

    // --- Referencias a elementos del HEADER y SECCIONES ---
    const navLinks = document.querySelectorAll('.header-nav-icons ul li a'); 
    const sections = document.querySelectorAll('main section'); 
    const headerSearchInputContainer = document.querySelector('.header-search-bar-wrapper');

    // Referencias a los contenedores LI de navegación (¡IMPORTANTES para display: none/block!)
    const navMyAccountContainer = document.getElementById('nav-my-account-container');
    const navLoginContainer = document.getElementById('nav-login-container');
    const navLogoutContainer = document.getElementById('nav-logout-container');
    const navAddProductContainer = document.getElementById('nav-add-product-container');
    const navAdminDashboardContainer = document.getElementById('nav-admin-dashboard-container');
    const navCartContainer = document.getElementById('nav-cart-container'); 
    const cartCountSpan = document.getElementById('cart-count'); 

    // Asignar los elementos de la sección (estos deben existir en index.html)
    const homeSection = document.getElementById('home');
    const addProductSection = document.getElementById('add-product');
    const loginSection = document.getElementById('login');
    const registerSection = document.getElementById('register');
    const myAccountSection = document.getElementById('my-account');
    const adminDashboardSection = document.getElementById('admin-dashboard');
    const cartSection = document.getElementById('cart'); 
    const checkoutSection = document.getElementById('checkout'); 

    // --- Funciones de Utilidad (que NO dependen de currentUserInfo para su definición) ---

    /**
     * Obtiene el token de autenticación del localStorage.
     * @returns {string|null} El token si existe, de lo contrario null.
     */
    const getToken = () => localStorage.getItem('token');

    /**
     * Obtiene y actualiza la información del usuario actual.
     * Almacena el resultado en `currentUserInfo` y actualiza la UI de "Mi Cuenta".
     */
    const fetchCurrentUser = async () => {
        const token = getToken();
        if (!token) {
            currentUserInfo = null;
            localStorage.removeItem('user'); 
            localStorage.removeItem('currentUserId');
            console.log('main.js: No hay token. Usuario no autenticado.');
            return;
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Usar la nueva función handleApiResponse
            const data = await window.handleApiResponse(response); // Esto manejará 401/403 y lanzará errores

            currentUserInfo = data; 
            localStorage.setItem('user', JSON.stringify(data)); 
            localStorage.setItem('currentUserId', data._id); 

            const profileUsername = document.getElementById('profile-username');
            const profileEmail = document.getElementById('profile-email');
            const profileRole = document.getElementById('profile-role');
            const profileImage = document.getElementById('profile-image');
            if (profileUsername) profileUsername.textContent = currentUserInfo.username;
            if (profileEmail) profileEmail.textContent = currentUserInfo.email;
            if (profileRole) profileRole.textContent = currentUserInfo.role;
            if (profileImage) profileImage.src = currentUserInfo.avatarUrl || '/img/default-avatar.png';
            
            console.log('main.js: Usuario actual fetchado y actualizado:', currentUserInfo);

        } catch (error) {
            // El error ya fue manejado por handleApiResponse (limpieza de sesión y redirección)
            // o es un error HTTP que no es 401/403, o un error de red.
            console.error('main.js: Error al obtener información del usuario actual:', error);
            // Asegurarse de que el estado local se limpia si no lo hizo handleApiResponse
            currentUserInfo = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('currentUserId');

            const profileUsername = document.getElementById('profile-username');
            const profileEmail = document.getElementById('profile-email');
            const profileRole = document.getElementById('profile-role');
            const profileImage = document.getElementById('profile-image');
            if (profileUsername) profileUsername.textContent = 'Error de conexión';
            if (profileEmail) profileEmail.textContent = 'Error de conexión';
            if (profileRole) profileRole.textContent = 'Error de conexión';
            if (profileImage) profileImage.src = '/img/default-avatar.png';
        } finally {
            window.updateMenuVisibility(currentUserInfo ? currentUserInfo.role : null);
        }
    };

    /**
     * Función para actualizar la visibilidad del menú de navegación.
     * Expuesto globalmente para que auth.js y otros scripts puedan llamarlo.
     * Asegura que los elementos existen antes de intentar cambiar su estilo.
     */
    window.updateMenuVisibility = (userRole) => {
        if (!navMyAccountContainer || !navLoginContainer || !navLogoutContainer || 
            !navAddProductContainer || !navAdminDashboardContainer || !navCartContainer) {
        }

        if (userRole) { 
            navLoginContainer.style.display = 'none';
            navMyAccountContainer.style.display = 'list-item';
            navLogoutContainer.style.display = 'list-item';

            if (userRole === 'admin') {
                navAddProductContainer.style.display = 'list-item';
                navAdminDashboardContainer.style.display = 'list-item';
                navCartContainer.style.display = 'none'; 
            } else { 
                navAddProductContainer.style.display = 'none';
                navAdminDashboardContainer.style.display = 'none';
                navCartContainer.style.display = 'list-item'; 
            }
        } else { 
            navMyAccountContainer.style.display = 'none';
            navLogoutContainer.style.display = 'none';
            navAddProductContainer.style.display = 'none';
            navAdminDashboardContainer.style.display = 'none';
            navLoginContainer.style.display = 'list-item';
            navCartContainer.style.display = 'list-item'; 
        }
        console.log('main.js: Visibilidad del menú actualizada para rol:', userRole);
    };

    /**
     * Función para mostrar una sección y ocultar las demás.
     * Expuesta globalmente para ser utilizada por otros scripts.
     * @param {string} sectionId - ID de la sección a mostrar.
     */
    window.showSection = async (sectionId) => {
        let targetSectionElement = document.getElementById(sectionId);

        if (!sectionId || !targetSectionElement) {
            console.warn(`main.js: Sección con ID '${sectionId}' no encontrada o nula. Redirigiendo a 'home'.`);
            targetSectionElement = homeSection; 
            sectionId = 'home';
        }

        const isLoggedIn = !!currentUserInfo;
        const isAdmin = isLoggedIn && currentUserInfo.role === 'admin';

        if (sectionId === 'my-account' && !isLoggedIn) {
            window.showMessage('Por favor, inicia sesión para acceder a tu cuenta.', 'warning');
            targetSectionElement = loginSection;
            sectionId = 'login';
        } else if (sectionId === 'add-product' && !isAdmin) {
            window.showMessage('Acceso denegado. Solo los administradores pueden añadir productos.', 'error');
            targetSectionElement = productsSection;
            sectionId = 'products';
        } else if (sectionId === 'admin-dashboard' && !isAdmin) {
            window.showMessage('Acceso denegado. Solo los administradores pueden acceder al panel de administración.', 'error');
            targetSectionElement = productsSection;
            sectionId = 'products';
        } else if ((sectionId === 'cart' || sectionId === 'checkout') && !isLoggedIn) {
            window.showMessage('Por favor, inicia sesión para ver tu carrito o proceder al pago.', 'warning');
            targetSectionElement = loginSection;
            sectionId = 'login';
        }

        sections.forEach(section => {
            section.classList.remove('current-section');
            section.classList.add('hidden-section');
        });
        
        if (targetSectionElement) { 
            targetSectionElement.classList.add('current-section');
            targetSectionElement.classList.remove('hidden-section');
            window.location.hash = sectionId; 
        } else {
            console.error(`main.js: ¡Error crítico! La sección de destino final '${sectionId}' sigue siendo nula.`);
            window.location.hash = ''; 
        }

        console.log(`main.js: Mostrando sección: ${sectionId}`);
        if (sectionId === 'products') {
            await fetchProducts(); 
        } else if (sectionId === 'cart') {
            if (typeof window.fetchCartAndDisplay === 'function') {
                await window.fetchCartAndDisplay(); 
            } else {
                console.warn('main.js: window.fetchCartAndDisplay no está disponible. Asegúrese de que checkout.js o cart.js se carga correctamente.');
            }
        } else if (sectionId === 'admin-dashboard') {
            if (typeof window.loadUsersForAdmin === 'function') {
                await window.loadUsersForAdmin(); 
            } else {
                console.warn("main.js: window.loadUsersForAdmin no está disponible. Asegúrese de que admin.js se carga correctamente.");
            }
        } else if (sectionId === 'my-account') {
            if (typeof window.renderPurchaseHistory === 'function') {
                await window.renderPurchaseHistory(); 
            } else {
                console.warn('main.js: window.renderPurchaseHistory no está disponible. Asegúrese de que myAccount.js se carga correctamente.');
            }
        } else if (sectionId === 'checkout') {
            if (typeof window.initializeCheckoutSection === 'function') { 
                await window.initializeCheckoutSection();
            } else {
                console.warn('main.js: window.initializeCheckoutSection no está disponible. Asegúrese de que checkout.js se carga correctamente.');
            }
        } else if (sectionId === 'add-product') {
             if (typeof window.resetProductForm === 'function') {
                 window.resetProductForm(); 
             } else {
                 console.warn('main.js: window.resetProductForm no está disponible. Asegúrese de que addProduct.js se carga correctamente.');
             }
        }

        if (headerSearchInputContainer) { 
            const sectionsWithoutSearch = ['my-account', 'admin-dashboard', 'checkout', 'login', 'register', 'add-product'];
            if (sectionsWithoutSearch.includes(sectionId)) {
                headerSearchInputContainer.style.display = 'none';
            } else {
                headerSearchInputContainer.style.display = 'block';
            }
        }
    };

    const fetchProducts = async () => {
        console.log('main.js: fetchProducts llamado. currentUserInfo:', currentUserInfo);

        let queryParams = `page=${currentPage}&limit=${limit}`;
        const searchVal = searchInput.value.trim();
        const categoryVal = categoryFilter.value;
        const minPriceVal = minPriceInput.value;
        const maxPriceVal = maxPriceInput.value;

        if (searchVal) {
            queryParams += `&search=${encodeURIComponent(searchVal)}`;
        }
        if (categoryVal && categoryVal !== 'All') {
            queryParams += `&category=${encodeURIComponent(categoryVal)}`;
        }
        if (minPriceVal) {
            queryParams += `&minPrice=${encodeURIComponent(minPriceVal)}`;
        }
        if (maxPriceVal) {
            queryParams += `&maxPrice=${encodeURIComponent(maxPriceVal)}`;
        }

        try {
            const response = await fetch(`/api/products?${queryParams}`);
            // Usar la nueva función handleApiResponse
            const data = await window.handleApiResponse(response); // Esto manejará 401/403 y lanzará errores

            console.log('main.js: Datos RAW de productos recibidos del backend:', data); // Debugging
            renderProducts(data.products);
            updatePagination(data.totalProducts, data.page, limit); 
        } catch (error) {
            console.error('main.js: Error fetching products:', error);
            // No mostrar un mensaje de error si el error fue por expiración de sesión (ya lo maneja handleApiResponse)
            if (!error.message.includes('Sesión expirada')) {
                if (productList) productList.innerHTML = `<p class="error-message">Error al cargar productos: ${error.message}</p>`;
                if (noProductsMessage) noProductsMessage.style.display = 'block';
                if (pageInfoSpan) pageInfoSpan.textContent = 'Página 0 de 0';
                if (prevPageBtn) prevPageBtn.disabled = true;
                if (nextPageBtn) nextPageBtn.disabled = true;
                window.showMessage('Error al cargar productos. Por favor, inténtalo de nuevo más tarde.', 'error', 'global-message-container');
            }
        }
    };

    const renderProducts = (products) => {
        if (!productList) {
            console.error('main.js: Elemento productList no encontrado.');
            return;
        }
        productList.innerHTML = '';
        if (noProductsMessage) {
            if (products.length === 0) {
                noProductsMessage.textContent = 'No se encontraron productos que coincidan con los filtros.';
                noProductsMessage.style.display = 'block';
                return;
            }
            noProductsMessage.style.display = 'none';
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            const imageUrl = product.imageUrl && product.imageUrl.startsWith('/') ? product.imageUrl : '/img/placeholder.png';

            productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="product-image">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-stock">Stock: ${product.stock}</p>
                <div class="product-actions">
                    ${!currentUserInfo || currentUserInfo.role === 'user' ? `
                        <button class="btn btn-primary add-to-cart-btn" 
                                data-product-id="${product._id}"
                                data-product-name="${product.name}"
                                data-product-price="${product.price}"
                                data-product-image="${imageUrl}">Añadir al Carrito</button>
                    ` : ''}
                    ${currentUserInfo && currentUserInfo.role === 'admin' ? `
                        <button class="btn btn-secondary edit-product-btn" data-product-id="${product._id}">Editar</button>
                        <button class="btn btn-danger delete-product-btn" data-product-id="${product._id}">Eliminar</button>
                    ` : ''}
                </div>
            `;
            productList.appendChild(productCard);
        });

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.productId;
                if (productId && typeof window.addToCart === 'function') { 
                    await window.addToCart(productId, 1); 
                } else {
                    console.error('main.js: La función addToCart no está definida o faltan datos del producto.');
                    window.showMessage('Error: Funcionalidad del carrito no disponible. Intente recargar la página.', 'error');
                }
            });
        });

        document.querySelectorAll('.edit-product-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.productId;
                if (productId && typeof window.editProduct === 'function') { 
                    window.showSection('add-product'); 
                    await window.editProduct(productId); 
                } else {
                    console.error('main.js: La función editProduct no está definida. Asegúrese de que addProduct.js se carga correctamente.');
                    window.showMessage('Error: Funcionalidad de edición no disponible.', 'error');
                }
            });
        });

        document.querySelectorAll('.delete-product-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                if (productId && typeof window.showConfirmModal === 'function') { 
                    window.showConfirmModal('¿Está seguro de que desea eliminar este producto? Esta acción es irreversible.', async () => {
                        await deleteProduct(productId);
                    });
                } else {
                    console.error('main.js: La función showConfirmModal no está definida. Asegúrese de que main.js se carga correctamente.');
                    window.showMessage('Error: Funcionalidad de confirmación no disponible.', 'error');
                }
            });
        });
    };

    const deleteProduct = async (productId) => {
        const token = getToken();
        if (!token || !currentUserInfo || currentUserInfo.role !== 'admin') { 
            window.showMessage('No autorizado. Solo los administradores pueden eliminar productos.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Usar la nueva función handleApiResponse
            const data = await window.handleApiResponse(response); // Esto manejará 401/403 y lanzará errores

            window.showMessage(data.message || 'Producto eliminado con éxito.', 'success'); 
            fetchProducts(); 
        } catch (error) {
            console.error('main.js: Error en la eliminación del producto (red/servidor):', error);
            // No mostrar un mensaje de error si el error fue por expiración de sesión
            if (!error.message.includes('Sesión expirada')) {
                window.showMessage('Error de conexión al intentar eliminar el producto.', 'error'); 
            }
        }
    };

    // --- Funciones de Paginación ---
    const updatePagination = (totalProducts, currentPageParam, limitParam) => {
        // Asegurarse de que los valores son números válidos de forma más robusta
        const totalProductsNum = Number(totalProducts); 
        const currentPageNum = Number(currentPageParam);
        const limitNum = Number(limitParam);

        // === NUEVOS LOGS PARA DEPURACIÓN ===
        console.log(`main.js: updatePagination - Tipo de totalProductsNum: ${typeof totalProductsNum}, Valor: ${totalProductsNum}`);
        console.log(`main.js: updatePagination - Tipo de currentPageNum: ${typeof currentPageNum}, Valor: ${currentPageNum}`);
        console.log(`main.js: updatePagination - Tipo de limitNum: ${typeof limitNum}, Valor: ${limitNum}`);
        // ===================================

        if (isNaN(totalProductsNum) || isNaN(currentPageNum) || isNaN(limitNum) || limitNum <= 0) {
            console.error('main.js: Valores de paginación inválidos. Asegúrate de que el backend devuelve números válidos para totalProducts, page y limit.');
            console.trace('main.js: Pila de llamadas para el error de paginación inválida.'); 
            if (pageInfoSpan) pageInfoSpan.textContent = 'Página 0 de 0';
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            return;
        }

        totalPages = Math.ceil(totalProductsNum / limitNum);
        currentPage = currentPageNum; 

        if (pageInfoSpan) { 
            pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;
        }
        if (prevPageBtn) { 
            prevPageBtn.disabled = currentPage === 1;
        }
        if (nextPageBtn) { 
            nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        }
        console.log(`main.js: Paginación actualizada: Página ${currentPage} de ${totalPages}`);
    };

    // --- Listeners para Filtros y Paginación ---
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            currentPage = 1; 
            fetchProducts();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = 'All';
            if (minPriceInput) minPriceInput.value = '';
            if (maxPriceInput) maxPriceInput.value = '';
            currentPage = 1;
            fetchProducts();
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchProducts();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchProducts();
            }
        });
    }

    const getSectionElementFromHash = (hash) => {
        const sectionMap = {
            'home': homeSection,
            'products': productsSection,
            'add-product': addProductSection,
            'login': loginSection,
            'register': registerSection,
            'my-account': myAccountSection,
            'admin-dashboard': adminDashboardSection,
            'cart': cartSection,
            'checkout': checkoutSection
        };

        let targetSection = sectionMap[hash];

        const isLoggedIn = !!currentUserInfo;
        const isAdmin = isLoggedIn && currentUserInfo.role === 'admin';

        if (hash === 'my-account' && !isLoggedIn) {
            targetSection = loginSection;
            window.showMessage('Por favor, inicia sesión para acceder a tu cuenta.', 'warning');
        } else if (hash === 'add-product' && !isAdmin) {
            targetSection = productsSection; 
            window.showMessage('Acceso denegado. Solo los administradores pueden añadir productos.', 'error');
        } else if (hash === 'admin-dashboard' && !isAdmin) {
            targetSection = productsSection; 
            window.showMessage('Acceso denegado. Solo los administradores pueden acceder al panel de administración.', 'error');
        } else if ((hash === 'cart' || hash === 'checkout') && !isLoggedIn) {
            targetSection = loginSection;
            window.showMessage('Por favor, inicia sesión para ver tu carrito o proceder al pago.', 'warning');
        } 
        // If targetSection is still null after checks, default to homeSection
        if (!targetSection) {
            targetSection = homeSection; 
        }
        return targetSection;
    };


    navLinks.forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            const targetId = event.target.closest('a').getAttribute('href').substring(1); 
            console.log('main.js: Clic en enlace de navegación:', targetId);
            await window.showSection(targetId); 
        });
    });

    const logoLink = document.getElementById('logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log('main.js: Clic en el logo. Redirigiendo a home.');
            await window.showSection('home');
        });
    }

    const exploreProductsBtnRef = document.getElementById('explore-products-btn'); 
    if (exploreProductsBtnRef) {
        exploreProductsBtnRef.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log('main.js: Clic en "Explorar Productos". Redirigiendo a products.');
            await window.showSection('products');
        });
    }

    async function handleHashChange() {
        const hash = window.location.hash.substring(1); 
        console.log('main.js: hashchange detectado:', hash);
        await window.showSection(hash); 
    }

    window.addEventListener('hashchange', handleHashChange);

    window.refreshCurrentUserAndProducts = async () => {
        console.log('main.js: refreshCurrentUserAndProducts llamado.');
        await fetchCurrentUser(); 
        fetchProducts(); 

        if (typeof window.fetchCartAndDisplay === 'function') {
            await window.fetchCartAndDisplay();
        } else {
            console.warn('main.js: window.fetchCartAndDisplay no está disponible en refreshCurrentUserAndProducts. Asegúrese de que checkout.js/cart.js se carga correctamente.');
        }
        if (typeof window.loadUsersForAdmin === 'function') {
            const adminDashboardActive = adminDashboardSection && adminDashboardSection.classList.contains('current-section');
            if (adminDashboardActive || (currentUserInfo && currentUserInfo.role === 'admin')) {
                await window.loadUsersForAdmin();
            }
        } else {
            console.warn('main.js: window.loadUsersForAdmin no está disponible en refreshCurrentUserAndProducts. Asegúrese de que admin.js se carga correctamente.');
        }
        if (typeof window.loadUserProfile === 'function') {
             await window.loadUserProfile();
        } else {
            console.warn('main.js: window.loadUserProfile no está disponible en refreshCurrentUserAndProducts. Asegúrese de que myAccount.js se carga correctamente.');
        }
    };

    console.log('main.js: DOMContentLoaded - Iniciando.');
    await fetchCurrentUser(); 
    
    const currentHash = window.location.hash.substring(1);
    let initialSection = homeSection; 

    if (currentHash) {
        initialSection = getSectionElementFromHash(currentHash);
    } 

    if (initialSection) {
        await window.showSection(initialSection.id); 
    } else {
        console.error('main.js: No se pudo determinar la sección inicial, mostrando la principal por defecto.');
        await window.showSection('home');
    }

    // --- INICIO DE LA ADICIÓN PARA EL BOTÓN "PROCEDER AL PAGO" ---
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            console.log('main.js: Clic en checkout-btn. Redirigiendo a #checkout.');
            if (window.showSection) {
                window.showSection('checkout');
            } else {
                window.location.hash = '#checkout';
            }
            // La función initializeCheckoutSection se llamará automáticamente por window.showSection('checkout')
        });
    }
    // --- FIN DE LA ADICIÓN PARA EL BOTÓN "PROCEDER AL PAGO" ---

    // Listener para el botón de logout
    const logoutLink = document.getElementById('nav-logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log('main.js: Clic en logout.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            currentUserInfo = null;
            window.updateMenuVisibility(null); // Actualizar UI de navegación a estado no autenticado
            if (typeof window.clearCart === 'function') {
                await window.clearCart(); // Vaciar el carrito al cerrar sesión
            }
            if (typeof window.updateCartCountDisplay === 'function') {
                window.updateCartCountDisplay(0); // Resetear el contador del carrito
            }
            window.showSection('home'); // Redirigir al inicio
            window.showMessage('Has cerrado sesión exitosamente.', 'success');
        });
    }
});
