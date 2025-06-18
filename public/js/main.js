// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const productList = document.getElementById('product-list');
    const productsSection = document.getElementById('products');
    const noProductsMessage = document.getElementById('no-products-message');

    // --- Elementos de Filtro ---
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const minPriceInput = document.getElementById('min-price-input');
    const maxPriceInput = document.getElementById('max-price-input');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // --- Elementos de Paginación ---
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');

    // --- Variables de Estado de Paginación y Filtro ---
    let currentPage = 1;
    const limit = 6; // Número de productos por página (ajusta según cuántos caben bien en diagonal)
    let totalPages = 1;

    // --- NUEVA VARIABLE GLOBAL PARA EL ESTADO DEL USUARIO ---
    let currentUserInfo = null; // Almacenará el objeto de usuario (incluido el rol)

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
     * Almacena el resultado en `currentUserInfo`.
     */
    const fetchCurrentUser = async () => {
        const token = getToken();
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    currentUserInfo = await response.json(); // Actualiza la variable global
                    localStorage.setItem('user', JSON.stringify(currentUserInfo)); // Opcional: mantén localStorage actualizado
                } else {
                    console.warn('Fallo al obtener información del usuario actual. El token podría ser inválido o haber expirado.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    currentUserInfo = null; // Limpiar si el token no es válido
                }
            } catch (error) {
                console.error('Error de red al obtener información del usuario actual:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                currentUserInfo = null;
            }
        } else {
            currentUserInfo = null; // No hay token, no hay usuario loggeado
            localStorage.removeItem('user'); // Asegúrate de que no haya información de usuario antigua
        }
    };


    /**
     * Muestra u oculta los botones de acción (editar/eliminar) según el rol del usuario.
     * Ahora utiliza la variable global `currentUserInfo`.
     * @param {string} productId - El ID del producto.
     * @returns {string} HTML de los botones de acción si el usuario es admin, vacío si no.
     */
    const renderAdminButtons = (productId) => {
        // Usa la variable global `currentUserInfo` que se carga asíncronamente
        if (currentUserInfo && currentUserInfo.role === 'admin') {
            return `
                <div class="product-actions">
                    <button class="btn edit-btn" data-id="${productId}">Editar</button>
                    <button class="btn delete-btn" data-id="${productId}">Eliminar</button>
                </div>
            `;
        }
        return '';
    };

    /**
     * Renderiza los productos en la cuadrícula.
     * @param {Array} products - Array de objetos producto.
     */
    const renderProducts = (products) => {
        if (!productList) return;

        productList.innerHTML = ''; // Limpiar productos existentes

        if (!Array.isArray(products)) {
            console.error("renderProducts recibió un argumento 'products' que no es un array:", products);
            noProductsMessage.classList.remove('hidden');
            noProductsMessage.textContent = "Error: Datos de productos inválidos recibidos del servidor.";
            return;
        }

        if (products.length === 0) {
            noProductsMessage.classList.remove('hidden');
            noProductsMessage.textContent = "No se encontraron productos que coincidan con tu búsqueda.";
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
                ${renderAdminButtons(product._id)}
            `;
            productList.appendChild(productCard);
        });

        // Añadir Event Listeners a los botones de Editar/Eliminar DESPUÉS de renderizarlos
        productList.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.id;
                if (window.editProduct) { // CAMBIO: De loadProductForEdit a editProduct
                    window.editProduct(productId); // CAMBIO: De loadProductForEdit a editProduct
                } else {
                    console.error('window.editProduct no está disponible. Asegúrate de que addProduct.js se cargue correctamente ANTES de main.js.');
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
        if (searchQuery) {
            params.append('search', searchQuery);
        }

        const category = categoryFilter.value;
        if (category && category !== 'All') {
            params.append('category', category);
        }

        const minPrice = parseFloat(minPriceInput.value);
        if (!isNaN(minPrice) && minPrice >= 0) {
            params.append('minPrice', minPrice);
        }

        const maxPrice = parseFloat(maxPriceInput.value);
        if (!isNaN(maxPrice) && maxPrice >= 0) {
            params.append('maxPrice', maxPrice);
        }

        try {
            const response = await fetch(`/api/products?${params.toString()}`);
            const data = await response.json();

            let productsToRender = [];
            let receivedTotalPages = 1;

            if (response.ok) {
                if (Array.isArray(data)) {
                    productsToRender = data;
                    receivedTotalPages = Math.ceil(data.length / limit) || 1;
                } else if (typeof data === 'object' && data !== null && Array.isArray(data.products)) {
                    productsToRender = data.products;
                    receivedTotalPages = data.totalPages || Math.ceil(data.products.length / limit) || 1;
                } else {
                    console.error('API response malformada: No se encontró un array de productos válido.', data);
                    productList.innerHTML = `<p class="error-message">Error al cargar productos: La respuesta del servidor es inválida.</p>`;
                    noProductsMessage.classList.remove('hidden');
                    return;
                }

                renderProducts(productsToRender);
                totalPages = receivedTotalPages;
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
        if (!token) {
            alert('No autorizado. Por favor, inicia sesión como administrador.');
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Producto eliminado con éxito.');
                fetchProducts(); // Recargar productos después de la eliminación
            } else {
                alert(data.message || 'Error al eliminar el producto.');
                console.error('Error al eliminar producto:', data.message);
            }
        } catch (error) {
            console.error('Error de red/servidor al eliminar producto:', error);
            alert('Error de conexión al eliminar el producto.');
        }
    };

    // --- Event Listeners ---

    // Botón "Explorar Productos" del Hero
    const exploreProductsBtn = document.getElementById('explore-products-btn');
    if (exploreProductsBtn) {
        exploreProductsBtn.addEventListener('click', async (event) => { // Marca como async
            event.preventDefault();
            const sections = document.querySelectorAll('section');
            sections.forEach(section => section.classList.add('hidden-section'));
            if (productsSection) {
                productsSection.classList.remove('hidden-section');
                productsSection.classList.add('current-section');
            }
            window.location.hash = 'products';
            await fetchCurrentUser(); // Obtener información del usuario ANTES de cargar productos
            fetchProducts();
        });
    }

    // Aplicar filtros
    applyFiltersBtn.addEventListener('click', async () => { // Marca como async
        currentPage = 1;
        await fetchCurrentUser(); // Opcional, si los filtros necesitan el rol de usuario para algo.
        fetchProducts();
    });

    // Limpiar filtros
    clearFiltersBtn.addEventListener('click', async () => { // Marca como async
        searchInput.value = '';
        categoryFilter.value = 'All';
        minPriceInput.value = '';
        maxPriceInput.value = '';
        currentPage = 1;
        await fetchCurrentUser(); // Opcional
        fetchProducts();
    });

    // Paginación
    prevPageBtn.addEventListener('click', async () => { // Marca como async
        if (currentPage > 1) {
            currentPage--;
            await fetchCurrentUser(); // Opcional
            fetchProducts();
        }
    });

    nextPageBtn.addEventListener('click', async () => { // Marca como async
        if (currentPage < totalPages) {
            currentPage++;
            await fetchCurrentUser(); // Opcional
            fetchProducts();
        }
    });

    // --- Exportación de funciones para otros scripts ---
    window.fetchProducts = fetchProducts; // Para que otros scripts puedan forzar la carga de productos
    window.renderAdminButtons = renderAdminButtons; // Aunque ahora usa currentUserInfo, puede ser útil si se modifica el DOM manualmente
    // Nueva función para que auth.js pueda refrescar el estado del usuario y los productos
    window.refreshCurrentUserAndProducts = async () => {
        await fetchCurrentUser();
        fetchProducts();
    };


    // --- Inicialización al cargar la página ---
    // Primero, carga la información del usuario
    fetchCurrentUser().then(() => {
        const currentHash = window.location.hash;
        if (currentHash === '#products' && productsSection) {
            productsSection.classList.remove('hidden-section');
            productsSection.classList.add('current-section');
            fetchProducts(); // Cargar productos después de tener la info del usuario
        } else if (currentHash === '#add-product' || currentHash === '#login' || currentHash === '#register' || currentHash === '#my-account') {
            // La visibilidad la maneja auth.js o addProduct.js
            // auth.js debería llamar a refreshCurrentUserAndProducts después del login/logout
        } else {
            const homeSection = document.getElementById('home');
            if (homeSection) {
                document.querySelectorAll('section').forEach(section => section.classList.add('hidden-section'));
                homeSection.classList.remove('hidden-section');
                homeSection.classList.add('current-section');
            }
        }
    });

    // Manejar la visibilidad de secciones basándose en el hash de la URL
    window.addEventListener('hashchange', async () => { // Marca como async
        const sections = document.querySelectorAll('section');
        sections.forEach(section => section.classList.add('hidden-section'));

        const currentHash = window.location.hash;
        let targetSection;

        if (currentHash) {
            targetSection = document.getElementById(currentHash.substring(1));
        } else {
            targetSection = document.getElementById('home');
        }

        if (targetSection) {
            targetSection.classList.remove('hidden-section');
            targetSection.classList.add('current-section');
            if (currentHash === '#products') {
                await fetchCurrentUser(); // Asegura que la info del usuario esté actualizada antes de cargar productos
                fetchProducts();
            }
        } else {
            document.getElementById('home').classList.remove('hidden-section');
            document.getElementById('home').classList.add('current-section');
        }
    });

    // Esta función getUserInfo local ya no es utilizada por renderAdminButtons
    // Puedes eliminarla o mantenerla si otros módulos aún la usan.
    // La dejé comentada porque ya no es la fuente principal del rol para renderAdminButtons.
    /*
    const getUserInfo = () => {
        try {
            const userString = localStorage.getItem('user');
            if (userString && userString !== 'undefined' && userString.trim() !== '') {
                return JSON.parse(userString);
            }
            return null;
        } catch (error) {
            console.error('Error al parsear la información del usuario del localStorage:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return null;
        }
    };
    */

    // Esta función `getUserByToken` ahora es una utilidad interna, no se usa directamente para renderizar botones.
    // auth.js puede seguir usándola si lo necesita para validar tokens de forma independiente.
    async function getUserByToken(token) {
        if (!token) return null;
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const user = await response.json();
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user info with token:', error);
            return null;
        }
    }
});