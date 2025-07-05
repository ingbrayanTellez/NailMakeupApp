// public/js/cart.js

document.addEventListener('DOMContentLoaded', () => {
    const cartCountSpan = document.getElementById('cart-item-count'); // Elemento para mostrar el número de ítems en el header
    const cartItemsContainer = document.getElementById('cart-items-container'); // Contenedor de ítems en la sección del carrito
    const cartTotalElement = document.getElementById('cart-total'); // Elemento para mostrar el total del carrito
    const clearCartBtn = document.getElementById('clear-cart-btn'); // Botón para vaciar el carrito
    const checkoutBtn = document.getElementById('checkout-btn'); // Botón para proceder al pago

    // --- Funciones de Utilidad (para obtener token y usuario) ---
    const getToken = () => localStorage.getItem('token');

    // currentUserInfo debería ser globalmente accesible desde main.js o auth.js
    // Si no lo es, deberías pasarla como argumento o tener una forma de obtenerla.
    // Para simplificar, asumimos que `window.currentUserInfo` está disponible.
    const getUserId = () => window.currentUserInfo ? window.currentUserInfo._id : null;

    /**
     * Función para mostrar mensajes en el contenedor específico del carrito.
     * Utiliza la función global window.showMessage.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - Tipo de mensaje ('success', 'error', 'warning', 'info').
     */
    const showCartMessage = (message, type) => {
        const targetContainerId = 'cart-message-container'; // ID del contenedor de mensajes del carrito
        if (typeof window.showMessage === 'function') {
            window.showMessage(message, type, targetContainerId);
        } else {
            console.warn(`cart.js: window.showMessage no está disponible. Mensaje: ${message}`);
            // Fallback simple si window.showMessage no está cargado
            alert(message); 
        }
    };

    /**
     * @desc Actualiza el estado de los botones del carrito (vaciar, proceder al pago).
     * @param {number} itemCount - Número de ítems en el carrito.
     */
    const updateCartButtonStates = (itemCount) => {
        if (clearCartBtn) {
            clearCartBtn.disabled = itemCount === 0;
            // Añade una clase para estilos visuales de botón deshabilitado
            clearCartBtn.classList.toggle('disabled-btn', itemCount === 0); 
        }
        if (checkoutBtn) {
            checkoutBtn.disabled = itemCount === 0;
            // Añade una clase para estilos visuales de botón deshabilitado
            checkoutBtn.classList.toggle('disabled-btn', itemCount === 0);
        }
    };

    /**
     * Obtiene el carrito del backend.
     * @returns {Object} El objeto del carrito del backend, o un objeto vacío si falla.
     */
    const getCartFromBackend = async () => {
        const token = getToken();
        if (!token) {
            console.warn('getCartFromBackend: No hay token de autenticación.');
            return { items: [], totalAmount: 0, totalItems: 0 };
        }

        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Asume que window.handleApiResponse maneja 401/403 y redirige si es necesario
            const data = await window.handleApiResponse(response); 

            if (response.ok) {
                // Asegúrate de que el backend devuelve un objeto con 'items' y 'totalAmount'
                return {
                    items: data.items || [],
                    totalAmount: data.totalAmount || 0, 
                    totalItems: data.items ? data.items.reduce((acc, item) => acc + item.quantity, 0) : 0
                };
            } else {
                showCartMessage(data.message || 'Error al obtener el carrito del backend.', 'error');
                console.error('Error al obtener el carrito del backend:', data.message || response.statusText);
                return { items: [], totalAmount: 0, totalItems: 0 };
            }
        } catch (error) {
            console.error('Error de red al obtener el carrito:', error);
            showCartMessage('Error de conexión al obtener el carrito.', 'error');
            return { items: [], totalAmount: 0, totalItems: 0 };
        }
    };

    /**
     * Renderiza los ítems del carrito en la sección del carrito.
     * También actualiza el contador en el header y el total.
     * Expuesta globalmente para ser llamada desde main.js o después de acciones del carrito.
     */
    window.fetchCartAndDisplay = async () => {
        console.log('cart.js: fetchCartAndDisplay llamado.');
        const cart = await getCartFromBackend();
        const items = cart.items;
        let total = cart.totalAmount; // Usar el total calculado por el backend
        let totalItemsCount = cart.totalItems; // Usar el total de ítems calculado por el backend

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = ''; // Limpiar el contenedor actual
        }

        if (!items || items.length === 0) {
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = '<li class="text-center text-gray-500">Tu carrito está vacío. ¡Empieza a añadir productos!</li>';
            }
            if (cartCountSpan) cartCountSpan.textContent = '0';
            if (cartTotalElement) cartTotalElement.textContent = '$0.00';
            // Actualizar estado de los botones cuando el carrito está vacío
            updateCartButtonStates(0); 
            // Actualizar el contador del carrito en el header (si main.js lo expone)
            if (typeof window.updateCartCountDisplay === 'function') {
                window.updateCartCountDisplay(0);
            }
            return;
        }

        const cartList = document.createElement('div');
        cartList.classList.add('cart-item-list');

        items.forEach(item => {
            if (item.productId) { // Asegurarse de que el producto existe (no fue eliminado de la DB)
                const itemTotal = item.quantity * item.price; // Usar item.price directamente si viene del backend
                
                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item');
                cartItemDiv.dataset.productId = item.productId; // Almacena el ID del producto

                cartItemDiv.innerHTML = `
                    <img src="${item.imageUrl || '/img/placeholder.png'}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>Precio Unitario: $${item.price.toFixed(2)}</p>
                        </div>
                        <div class="quantity-control">
                            <button class="btn btn-secondary quantity-btn" data-action="decrease">-</button>
                            <span>${item.quantity}</span>
                            <button class="btn btn-secondary quantity-btn" data-action="increase">+</button>
                        </div>
                        <p class="cart-item-total">Total: $${itemTotal.toFixed(2)}</p>
                        <button class="btn btn-danger remove-from-cart-btn">Remover</button>
                    </div>
                `;
                cartList.appendChild(cartItemDiv);
            }
        });

        if (cartItemsContainer) {
            cartItemsContainer.appendChild(cartList);
        }
        
        if (cartCountSpan) cartCountSpan.textContent = totalItemsCount.toString();
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
        // Actualizar estado de los botones
        updateCartButtonStates(totalItemsCount);
        // Actualizar el contador del carrito en el header (si main.js lo expone)
        if (typeof window.updateCartCountDisplay === 'function') {
            window.updateCartCountDisplay(totalItemsCount);
        }
    };


    /**
     * Añade un producto al carrito o incrementa su cantidad.
     * @param {string} productId - ID del producto.
     * @param {number} quantity - Cantidad a añadir (por defecto 1).
     */
    window.addToCart = async (productId, quantity = 1) => {
        const userId = getUserId();
        const token = getToken();

        if (!userId || !token) {
            showCartMessage('Debes iniciar sesión para añadir productos al carrito.', 'warning');
            if (typeof window.showSection === 'function') {
                window.showSection('login');
            } else {
                window.location.hash = '#login';
            }
            return;
        }

        try {
            const response = await fetch(`/api/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity
                })
            });

            const data = await window.handleApiResponse(response);

            if (response.ok) {
                showCartMessage(data.message, 'success');
                await window.fetchCartAndDisplay(); // Actualizar el carrito después de añadir
                // Opcional: Recargar productos para actualizar el stock visible
                if (typeof window.fetchProducts === 'function') {
                    await window.fetchProducts();
                }
            } else {
                showCartMessage(data.message || 'Error al añadir al carrito.', 'error');
                console.error('Error adding to cart:', data.message || response.statusText);
            }
        } catch (error) {
            console.error('Error de red al añadir al carrito:', error);
            showCartMessage('Error de conexión al añadir al carrito.', 'error');
        }
    };

    /**
     * Actualiza la cantidad de un ítem en el carrito.
     * @param {string} productId - ID del producto a actualizar.
     * @param {number} change - Cantidad a sumar o restar (ej. 1 para aumentar, -1 para disminuir).
     */
    const updateCartItemQuantity = async (productId, change) => {
        const userId = getUserId();
        const token = getToken();

        if (!userId || !token) {
            showCartMessage('Debes iniciar sesión para actualizar el carrito.', 'warning');
            if (typeof window.showSection === 'function') {
                window.showSection('login');
            } else {
                window.location.hash = '#login';
            }
            return;
        }

        try {
            // Reutilizamos la ruta /api/cart/add para manejar el incremento/decremento
            // El backend debe manejar la lógica de sumar o restar la cantidad
            const response = await fetch(`/api/cart/add`, {
                method: 'POST', // POST para añadir/actualizar cantidad
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: change // Enviamos el cambio (+1 o -1)
                })
            });

            const data = await window.handleApiResponse(response);

            if (response.ok) {
                showCartMessage(data.message, 'success'); 
                await window.fetchCartAndDisplay(); // Refrescar la vista del carrito
                // Opcional: Recargar productos para actualizar el stock visible
                if (typeof window.fetchProducts === 'function') {
                    await window.fetchProducts();
                }
            } else {
                showCartMessage(data.message || 'Error al actualizar cantidad.', 'error');
                console.error('Error updating cart quantity:', data.message || response.statusText);
            }
        } catch (error) {
            console.error('Error de red al actualizar la cantidad del carrito:', error);
            showCartMessage('Error de conexión al actualizar la cantidad del carrito.', 'error');
        }
    };

    /**
     * Remueve un ítem completamente del carrito.
     * @param {string} productId - ID del producto a remover.
     */
    const removeFromCart = async (productId) => {
        const userId = getUserId();
        const token = getToken();

        if (!userId || !token) {
            showCartMessage('Debes iniciar sesión para remover productos.', 'warning');
            if (typeof window.showSection === 'function') {
                window.showSection('login');
            } else {
                window.location.hash = '#login';
            }
            return;
        }

        // Confirmación antes de remover
        if (typeof window.showConfirmModal === 'function') { // Usa el modal de confirmación si está disponible
            window.showConfirmModal('¿Está seguro de que quiere remover este ítem del carrito?', async () => {
                try {
                    const response = await fetch(`/api/cart/remove/${productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json', // Importante para DELETE con body si el backend lo espera
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await window.handleApiResponse(response);

                    if (response.ok) {
                        showCartMessage(data.message, 'success');
                        await window.fetchCartAndDisplay(); // Refrescar la vista del carrito
                    } else {
                        showCartMessage(data.message || 'Error al remover del carrito.', 'error');
                        console.error('Error removing from cart:', data.message || response.statusText);
                    }
                } catch (error) {
                    console.error('Error de red al remover del carrito:', error);
                    showCartMessage('Error de conexión al remover del carrito.', 'error');
                }
            });
        } else {
            // Fallback si el modal no está disponible
            if (confirm('¿Está seguro de que quiere remover este ítem del carrito?')) {
                try {
                    const response = await fetch(`/api/cart/remove/${productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await window.handleApiResponse(response);

                    if (response.ok) {
                        showCartMessage(data.message, 'success');
                        await window.fetchCartAndDisplay();
                    } else {
                        showCartMessage(data.message || 'Error al remover del carrito.', 'error');
                        console.error('Error removing from cart:', data.message || response.statusText);
                    }
                } catch (error) {
                    console.error('Error de red al remover del carrito:', error);
                    showCartMessage('Error de conexión al remover del carrito.', 'error');
                }
            }
        }
    };

    /**
     * Limpia completamente el carrito del usuario.
     */
    const clearCart = async () => {
        const userId = getUserId();
        const token = getToken();

        if (!userId || !token) {
            showCartMessage('Debes iniciar sesión para limpiar el carrito.', 'warning');
            if (typeof window.showSection === 'function') {
                window.showSection('login');
            } else {
                window.location.hash = '#login';
            }
            return;
        }

        if (typeof window.showConfirmModal === 'function') { // Usa el modal de confirmación si está disponible
            window.showConfirmModal('¿Está seguro de que quiere vaciar todo su carrito? Esta acción es irreversible.', async () => {
                try {
                    const response = await fetch(`/api/cart/clear`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await window.handleApiResponse(response);

                    if (response.ok) {
                        showCartMessage(data.message, 'success');
                        await window.fetchCartAndDisplay(); // Refrescar la vista del carrito (quedará vacío)
                    } else {
                        showCartMessage(data.message || 'Error al limpiar el carrito.', 'error');
                        console.error('Error clearing cart:', data.message || response.statusText);
                    }
                } catch (error) {
                    console.error('Error de red al limpiar el carrito:', error);
                    showCartMessage('Error de conexión al limpiar el carrito.', 'error');
                }
            });
        } else {
            // Fallback si el modal no está disponible
            if (confirm('¿Está seguro de que quiere vaciar todo su carrito? Esta acción es irreversible.')) {
                try {
                    const response = await fetch(`/api/cart/clear`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const data = await window.handleApiResponse(response);

                    if (response.ok) {
                        showCartMessage(data.message, 'success');
                        await window.fetchCartAndDisplay();
                    } else {
                        showCartMessage(data.message || 'Error al limpiar el carrito.', 'error');
                        console.error('Error clearing cart:', data.message || response.statusText);
                    }
                } catch (error) {
                    console.error('Error de red al limpiar el carrito:', error);
                    showCartMessage('Error de conexión al limpiar el carrito.', 'error');
                }
            }
        }
    };


    // --- Listener de eventos para los botones de cantidad y remover en la sección del carrito ---
    // Usamos delegación de eventos en el contenedor padre para manejar clicks en botones dinámicos
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', async (event) => {
            const target = event.target;
            const cartItemDiv = target.closest('.cart-item'); // Encuentra el div del item del carrito
            const productId = cartItemDiv ? cartItemDiv.dataset.productId : null;

            if (!productId) {
                return; // No es un botón de un ítem de carrito o no tiene ID
            }

            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                await updateCartItemQuantity(productId, action === 'increase' ? 1 : -1);
            } else if (target.classList.contains('remove-from-cart-btn')) {
                await removeFromCart(productId); // removeFromCart ya maneja la confirmación
            }
        });
    }

    // Listener para el botón "Vaciar Carrito"
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            await clearCart(); // clearCart ya maneja la confirmación
        });
    }

    // Listener para el botón "Proceder al Pago"
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // Asegúrate de que el carrito no esté vacío antes de proceder
            const currentCartTotal = parseFloat(cartTotalElement.textContent.replace('$', ''));
            if (currentCartTotal > 0) {
                if (typeof window.showSection === 'function') {
                    window.showSection('checkout'); // Redirige a la sección de checkout
                } else {
                    console.error('cart.js: window.showSection no está disponible. No se puede redirigir a checkout.');
                    window.location.hash = '#checkout'; // Fallback
                }
            } else {
                showCartMessage('Tu carrito está vacío. Añade productos para proceder al pago.', 'warning');
            }
        });
    }

    // La llamada inicial para cargar el carrito se maneja mejor en main.js
    // para asegurar que todas las dependencias globales (como window.currentUserInfo) estén cargadas.
    // displayCartItems(); 
});