// public/js/checkout.js
console.log('checkout.js: Script cargado - Versión 2025-07-04-ZIP-DEBUG'); // <-- ¡VERIFICA ESTE MENSAJE EN TU CONSOLA!

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountSpan = document.getElementById('cart-count'); 
    const checkoutOrderSummaryTableBody = document.getElementById('checkout-items-list');
    const checkoutTotalElement = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const cancelCheckoutBtn = document.getElementById('cancel-checkout-btn'); 
    const checkoutMessageContainer = document.getElementById('checkout-message-container');
    const shippingForm = document.getElementById('shipping-form'); 

    // --- Referencias a elementos del MODAL DE PAGO ---
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModal');
    const paymentForm = document.getElementById('payment-form');
    const submitPaymentBtn = document.getElementById('submitPaymentBtn');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
    const paymentMessageContainer = document.getElementById('payment-message-container');

    // --- NUEVAS REFERENCIAS A ELEMENTOS DE PAGO ---
    const paymentMethodSelect = document.getElementById('paymentMethod'); 
    const creditCardFields = document.getElementById('credit-card-fields'); // Contenedor de campos de tarjeta

    // --- Funciones de Utilidad (para obtener token y usuario) ---
    const getToken = () => localStorage.getItem('token');
    const getCurrentUserFromLocalStorage = () => {
        try {
            const userString = localStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch (e) {
            console.error("checkout.js: Error al analizar el rol de usuario desde localStorage:", e);
            return null;
        }
    };

    /**
     * Muestra un mensaje en un contenedor específico.
     * Adaptado para usar window.showMessage para consistencia global.
     * @param {string} targetContainerId - El ID del elemento DOM donde mostrar el mensaje.
     * @param {string} message - El mensaje a mostrar.
     * @param {string} type - Tipo de mensaje ('success', 'error', 'warning', 'info').
     */
    const showLocalMessage = (targetContainerId, message, type) => {
        if (typeof window.showMessage === 'function') {
            window.showMessage(message, type, targetContainerId);
        } else {
            // Fallback si window.showMessage no está cargado
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
            }
        }
    };


    /**
     * Obtiene el carrito del backend.
     * Ahora espera que el backend devuelva el objeto del carrito directamente (ej. {_id: '...', items: [...]}).
     * @returns {Object} El objeto del carrito del backend (con items y totalAmount), o un objeto vacío si falla.
     */
    const getCartFromBackend = async () => {
        console.log('checkout.js: getCartFromBackend llamado.');
        const token = getToken();
        if (!token) {
            return { items: [], totalAmount: 0 }; 
        }

        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await window.handleApiResponse(response); 
            
            if (data && Array.isArray(data.items)) { 
                console.log('checkout.js: Carrito obtenido del backend:', data); 
                const totalAmount = data.items.reduce((sum, item) => sum + (item.productId ? item.productId.price : 0) * item.quantity, 0);
                return { ...data, totalAmount }; 
            } else {
                console.error('checkout.js: Formato de carrito inesperado del backend (no tiene propiedad items o no es array):', data);
                return { items: [], totalAmount: 0 };
            }
        } catch (error) {
            console.error('checkout.js: Error al obtener el carrito:', error);
            return { items: [], totalAmount: 0 };
        }
    };

    /**
     * Renderiza los ítems del carrito en la sección del carrito.
     * También actualiza el contador en el header y el total.
     */
    window.fetchCartAndDisplay = async () => {
        console.log('checkout.js: fetchCartAndDisplay llamado.');
        const cartData = await getCartFromBackend(); 
        const items = cartData.items; 
        let total = cartData.totalAmount || 0; 
        let totalItemsCount = 0; 

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = ''; 
        }

        if (!items || items.length === 0) {
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío. ¡Empieza a añadir productos!</p>';
            }
            if (cartCountSpan) cartCountSpan.textContent = '0';
            if (cartTotalElement) cartTotalElement.textContent = '$0.00';
            if (placeOrderBtn) placeOrderBtn.disabled = true; 
            return;
        }

        if (placeOrderBtn) placeOrderBtn.disabled = false; 

        const cartList = document.createElement('div');
        cartList.classList.add('cart-item-list');

        items.forEach(item => {
            if (!item.productId) { 
                console.warn(`checkout.js: Ítem en el carrito sin productId (posiblemente producto eliminado), saltando:`, item);
                return; 
            }
            const product = item.productId; 
            const itemTotal = item.quantity * product.price;
            totalItemsCount += item.quantity;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.dataset.productId = product._id; 

            cartItemDiv.innerHTML = `
                <img src="${product.imageUrl || '/img/placeholder.png'}" alt="${product.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-details">
                        <h4>${product.name}</h4>
                        <p>Precio Unitario: $${product.price.toFixed(2)}</p>
                        <p class="cart-item-subtotal">Subtotal: $${itemTotal.toFixed(2)}</p>
                    </div>
                    <div class="quantity-control">
                        <button class="btn btn-secondary quantity-btn" data-action="decrease" data-product-id="${product._id}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-secondary quantity-btn" data-action="increase" data-product-id="${product._id}" ${item.quantity >= product.stock ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn btn-danger remove-from-cart-btn" data-product-id="${product._id}">🗑️ Remover</button>
                    </div>
                </div>
            `;
            cartList.appendChild(cartItemDiv);
        });

        if (cartItemsContainer) {
            cartItemsContainer.appendChild(cartList);
        }
        
        if (cartCountSpan) cartCountSpan.textContent = totalItemsCount.toString();
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    };


    /**
     * Añade un producto al carrito o incrementa su cantidad.
     * @param {string} productId - ID del producto.
     * @param {number} quantity - Cantidad a añadir (por defecto 1).
     */
    window.addToCart = async (productId, quantity = 1) => { 
        console.log(`checkout.js: addToCart llamado para productId: ${productId}, quantity: ${quantity}`);
        const token = getToken();

        if (!token) {
            if (window.showMessage) window.showMessage('Necesita iniciar sesión para añadir productos al carrito.', 'error');
            if (window.showSection) window.showSection('login');
            return;
        }

        try {
            const response = await fetch('/api/cart', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId, quantity }) 
            });

            const data = await window.handleApiResponse(response); 
            
            if (window.showMessage) window.showMessage(data.message || 'Producto añadido al carrito.', 'success');
            await window.fetchCartAndDisplay(); 
        } catch (error) {
            console.error('checkout.js: Error al añadir producto al carrito:', error);
            if (!error.message.includes('Sesión expirada')) { 
                if (window.showMessage) window.showMessage('Error de conexión al añadir al carrito.', 'error');
            }
        }
    };

    /**
     * Actualiza la cantidad de un ítem en el carrito.
     * @param {string} productId - ID del producto a actualizar.
     * @param {number} change - Cantidad a sumar o restar (ej. 1 para aumentar, -1 para disminuir).
     */
    window.updateCartItemQuantity = async (productId, change) => {
        console.log(`checkout.js: updateCartItemQuantity llamado para productId: ${productId}, change: ${change}`);
        const token = getToken();

        if (!token) {
            if (window.showMessage) window.showMessage('Necesita iniciar sesión para actualizar el carrito.', 'error');
            if (window.showSection) window.showSection('login');
            return;
        }

        try {
            const response = await fetch(`/api/cart/${productId}/quantity`, { 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ change }) 
            });

            const data = await window.handleApiResponse(response); 
            
            await window.fetchCartAndDisplay(); 
        } catch (error) {
            console.error('checkout.js: Error al actualizar cantidad:', error);
            if (!error.message.includes('Sesión expirada')) {
                if (window.showMessage) window.showMessage('Error de conexión al actualizar la cantidad del carrito.', 'error');
            }
        }
    };

    /**
     * Remueve un ítem completamente del carrito.
     * @param {string} productId - ID del producto a remover.
     */
    window.removeFromCart = async (productId) => {
        console.log(`checkout.js: removeFromCart llamado para productId: ${productId}`);
        const token = getToken();

        if (!token) {
            if (window.showMessage) window.showMessage('Necesita iniciar sesión para remover productos.', 'error');
            if (window.showSection) window.showSection('login');
            return;
        }

        try {
            const response = await fetch(`/api/cart/${productId}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await window.handleApiResponse(response); 
            
            if (window.showMessage) window.showMessage(data.message || 'Producto removido del carrito.', 'success');
            await window.fetchCartAndDisplay(); 
        } catch (error) {
            console.error('checkout.js: Error al remover del carrito:', error);
            if (!error.message.includes('Sesión expirada')) {
                if (window.showMessage) window.showMessage('Error de conexión al remover del carrito.', 'error');
            }
        }
    };

    /**
     * Vacía el carrito del usuario.
     * Expuesto globalmente para que auth.js (al login) pueda llamarlo.
     */
    window.clearCart = async () => {
        console.log('checkout.js: clearCart llamado.');
        const token = getToken();
        if (!token) {
            console.warn('checkout.js: No hay token encontrado, no se puede vaciar el carrito.');
            return;
        }
        try {
            const response = await fetch('/api/cart/clear', { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await window.handleApiResponse(response); 
            
            console.log('checkout.js: Carrito vaciado exitosamente en el backend.', data);
        } catch (error) {
            console.error('checkout.js: Error al vaciar el carrito:', error);
            if (!error.message.includes('Sesión expirada')) {
                // Puedes decidir mostrar un mensaje aquí o no, ya que clearCart es a menudo una acción de fondo
            }
        }
    };


    /**
     * Muestra el resumen del pedido en la sección de checkout.
     * Expuesto como window.initializeCheckoutSection 
     */
    window.initializeCheckoutSection = async () => { 
        console.log('checkout.js: initializeCheckoutSection llamado.');
        const cartData = await getCartFromBackend(); 
        const cartItems = cartData.items;
        const totalAmount = cartData.totalAmount; 

        if (!checkoutOrderSummaryTableBody || !checkoutTotalElement || !shippingForm) {
            console.error("checkout.js: Elementos del DOM de checkout no encontrados.");
            showLocalMessage('checkout-message-container', 'Error interno: Faltan elementos en la página de pago.', 'error');
            return;
        }

        checkoutOrderSummaryTableBody.innerHTML = ''; 
        
        if (cartItems.length === 0) {
            checkoutOrderSummaryTableBody.innerHTML = '<tr><td colspan="4" class="empty-cart-message">Tu carrito está vacío. Por favor, añade productos primero.</td></tr>';
            checkoutTotalElement.textContent = '$0.00';
            if (placeOrderBtn) placeOrderBtn.disabled = true; 
            showLocalMessage('checkout-message-container', 'Tu carrito está vacío. Redirigiendo al carrito...', 'info');
            setTimeout(() => {
                if (window.showSection) window.showSection('cart');
            }, 2000);
            return;
        }

        if (placeOrderBtn) placeOrderBtn.disabled = false; 

        cartItems.forEach(item => {
            if (!item.productId) {
                console.warn(`checkout.js: Ítem en el carrito sin productId (posiblemente producto eliminado), saltando en checkout:`, item);
                return;
            }
            const product = item.productId;
            const itemTotal = product.price * item.quantity;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${itemTotal.toFixed(2)}</td>
            `;
            checkoutOrderSummaryTableBody.appendChild(row);
        });

        checkoutTotalElement.textContent = `$${totalAmount.toFixed(2)}`; 

        const currentUser = getCurrentUserFromLocalStorage();
        if (currentUser && currentUser.shippingAddress) {
            if (document.getElementById('fullName')) document.getElementById('fullName').value = currentUser.shippingAddress.name || '';
            if (document.getElementById('address')) document.getElementById('address').value = currentUser.shippingAddress.address || '';
            if (document.getElementById('city')) document.getElementById('city').value = currentUser.shippingAddress.city || '';
            if (document.getElementById('postalCode')) document.getElementById('postalCode').value = currentUser.shippingAddress.zip || ''; 
            if (document.getElementById('country')) document.getElementById('country').value = currentUser.shippingAddress.country || '';
        }
        if (paymentForm) paymentForm.reset();
        if (creditCardFields) creditCardFields.style.display = 'none';
        if (paymentMethodSelect) paymentMethodSelect.value = ''; 
    };

    /**
     * Simula el procesamiento de un pago.
     * @returns {Promise<boolean>} Resuelve a true si el pago es exitoso, false si falla.
     */
    const simulatePayment = async () => {
        console.log('checkout.js: simulatePayment llamado.');
        showLocalMessage('payment-message-container', 'Procesando pago...', 'info');
        if (submitPaymentBtn) submitPaymentBtn.disabled = true;
        if (cancelPaymentBtn) cancelPaymentBtn.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 2000)); 

        const isSuccess = Math.random() < 0.5; 

        if (submitPaymentBtn) submitPaymentBtn.disabled = false;
        if (cancelPaymentBtn) cancelPaymentBtn.disabled = false;

        if (isSuccess) {
            showLocalMessage('payment-message-container', 'Pago exitoso. Redirigiendo...', 'success');
            return true;
        } else {
            showLocalMessage('payment-message-container', 'Error en el pago. Por favor, inténtalo de nuevo.', 'error');
            return false;
        }
    };

    /**
     * Finaliza el pedido enviándolo al backend.
     * @param {Object} orderDetails - Los detalles del pedido a enviar.
     */
    const finalizeOrderInBackend = async (orderDetails) => {
        console.log('checkout.js: finalizeOrderInBackend llamado.');
        console.log('checkout.js: Detalles de la orden a enviar:', orderDetails); // <-- ¡VERIFICA ESTE LOG!
        const token = getToken();
        if (!token) {
            showLocalMessage('checkout-message-container', 'Necesita iniciar sesión para finalizar un pedido.', 'error');
            console.error('finalizeOrderInBackend: No hay token.');
            return;
        }

        showLocalMessage('checkout-message-container', 'Finalizando pedido...', 'info');
        // Deshabilitar botones mientras se procesa el pedido
        if (placeOrderBtn) placeOrderBtn.disabled = true;
        if (submitPaymentBtn) submitPaymentBtn.disabled = true; 
        if (cancelPaymentBtn) cancelPaymentBtn.disabled = true;

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderDetails)
            });

            console.log('checkout.js: Respuesta de la API recibida. Status:', response.status); // <-- ¡VERIFICA ESTE LOG!
            const data = await window.handleApiResponse(response); // Esto manejará 401/403 y lanzará errores

            if (response.ok) {
                showLocalMessage('checkout-message-container', data.message || '¡Pedido realizado con éxito!', 'success');
                console.log('checkout.js: Pedido exitoso! Respuesta del backend:', data); // <-- ¡VERIFICA ESTE LOG!
                
                // Limpiar carrito en el frontend y backend
                if (typeof window.clearCart === 'function') {
                    console.log('checkout.js: Llamando a window.clearCart() para vaciar el carrito.'); // <-- ¡VERIFICA ESTE LOG!
                    await window.clearCart(); 
                } else {
                    console.warn('checkout.js: window.clearCart no está disponible.');
                }
                
                // Actualizar contador del carrito en el header
                if (typeof window.updateCartCountDisplay === 'function') {
                    window.updateCartCountDisplay(0);
                } else {
                    console.warn('checkout.js: window.updateCartCountDisplay no está disponible.');
                }

                // Limpiar formularios
                if (shippingForm) shippingForm.reset();
                if (paymentForm) paymentForm.reset();
                if (paymentMethodSelect) paymentMethodSelect.value = ''; 
                if (creditCardFields) creditCardFields.style.display = 'none'; 
                if (paymentModal) paymentModal.style.display = 'none'; // Cerrar el modal de pago

                // Redirigir a la sección de mi cuenta y actualizar historial de compras
                if (typeof window.showSection === 'function') {
                    window.showSection('my-account'); 
                } else {
                    window.location.hash = '#my-account'; 
                }
                
                if (typeof window.renderPurchaseHistory === 'function') {
                    await window.renderPurchaseHistory(); 
                } else {
                    console.warn('checkout.js: window.renderPurchaseHistory no está disponible.');
                }

            } else {
                showLocalMessage('checkout-message-container', data.message || 'Error al procesar el pedido.', 'error');
                console.error('checkout.js: Error al procesar el pedido. Respuesta del backend:', data.message || data); // <-- ¡VERIFICA ESTE LOG!
            }
        } catch (error) {
            console.error('checkout.js: Error de red o API al procesar el pedido:', error); // <-- ¡VERIFICA ESTE LOG!
            if (!error.message.includes('Sesión expirada')) {
                showLocalMessage('checkout-message-container', 'Error de conexión al procesar el pedido. Por favor, inténtalo de nuevo.', 'error');
            }
        } finally {
            // Re-habilitar botones
            if (placeOrderBtn) placeOrderBtn.disabled = false;
            if (submitPaymentBtn) submitPaymentBtn.disabled = false;
            if (cancelPaymentBtn) cancelPaymentBtn.disabled = false;
        }
    };


    /**
     * Realiza la lógica para finalizar el pedido.
     * Expuesto como window.placeOrder
     */
    window.placeOrder = async () => {
        console.log('checkout.js: window.placeOrder (desde el botón "Finalizar Pedido") llamado.');
        const token = getToken();
        if (!token) {
            showLocalMessage('checkout-message-container', 'Necesita iniciar sesión para finalizar un pedido.', 'error');
            return;
        }

        // --- VALIDACIONES ---
        document.querySelectorAll('.validation-error').forEach(el => el.textContent = '');
        showLocalMessage('checkout-message-container', '', 'info'); 
        showLocalMessage('payment-message-container', '', 'info'); 

        const isShippingValid = validateShippingForm();
        
        if (!paymentMethodSelect) {
            console.error('ERROR CRÍTICO en window.placeOrder: El elemento <select id="paymentMethod"> no se encontró en el DOM. Asegúrate de que el ID es correcto en index.html.');
            showLocalMessage('checkout-message-container', 'Error interno: No se pudo cargar el selector de método de pago. Recarga la página.', 'error');
            if (placeOrderBtn) placeOrderBtn.disabled = true;
            return; 
        }

        const paymentMethod = paymentMethodSelect.value; 
        const paymentMethodError = document.getElementById('paymentMethod-error');

        if (!paymentMethod) { 
            if (paymentMethodError) paymentMethodError.textContent = 'Por favor, selecciona un método de pago.';
            showLocalMessage('checkout-message-container', 'Por favor, selecciona un método de pago.', 'error');
            return;
        } else {
            if (paymentMethodError) paymentMethodError.textContent = '';
        }

        if (!isShippingValid) {
            showLocalMessage('checkout-message-container', 'Por favor, corrige los errores en la información de envío.', 'error');
            return;
        }
        // --- FIN VALIDACIONES ---
        
        const cartData = await getCartFromBackend();
        const cartItems = cartData.items;

        if (cartItems.length === 0) {
            showLocalMessage('checkout-message-container', 'Su carrito está vacío. Añada productos antes de finalizar el pedido.', 'warning');
            console.warn('checkout.js: Pedido no puede ser finalizado: Carrito vacío.');
            return;
        }

        const currentCartTotal = parseFloat(checkoutTotalElement.textContent.replace('$', ''));
        if (currentCartTotal <= 0) {
            showLocalMessage('checkout-message-container', 'Tu carrito está vacío. No puedes realizar un pedido.', 'warning');
            return;
        }

        if (paymentMethod === 'credit_card') {
            console.log('checkout.js: Método de pago es Tarjeta de Crédito. Mostrando modal de pago.');
            if (paymentModal) paymentModal.style.display = 'flex';
            showLocalMessage('payment-message-container', 'Por favor, introduce los detalles de tu tarjeta.', 'info');
        } else {
            console.log(`checkout.js: Método de pago es ${paymentMethod}. Finalizando orden directamente.`);
            const shippingInfo = {
                name: document.getElementById('fullName').value.trim(),
                address: document.getElementById('address').value.trim(),
                city: document.getElementById('city').value.trim(), 
                // country: document.getElementById('country').value.trim(), // Se mantiene el país
                // Ya no se incluye postalCode aquí, según tu indicación.
                country: document.getElementById('country').value.trim(), // Asegúrate de que este campo exista en tu HTML
            };

            const orderItems = cartItems.map(item => ({
                productId: item.productId._id,
                name: item.productId.name,
                quantity: item.quantity,
                price: item.productId.price,
                imageUrl: item.productId.imageUrl
            }));

            const orderData = {
                items: orderItems,
                shippingInfo,
                paymentMethod,
                paymentDetails: {}, 
                total: currentCartTotal,
                status: 'pending', 
                paymentStatus: 'paid' 
            };
            await finalizeOrderInBackend(orderData);
        }
    };


    // --- NUEVAS FUNCIONES DE VALIDACIÓN ---
    /**
     * Valida el formulario de información de envío.
     * Muestra mensajes de error directamente en los spans de validación.
     * @returns {boolean} True si todos los campos son válidos, false de lo contrario.
     */
    const validateShippingForm = () => {
        let isValid = true;
        const fields = [
            { id: 'fullName', msg: 'El nombre completo es obligatorio.' },
            { id: 'address', msg: 'La dirección es obligatoria.' },
            { id: 'city', msg: 'La ciudad es obligatoria.' },
            { id: 'postalCode', msg: 'El código postal es obligatorio.' }, // Se mantiene la validación si el campo existe en HTML
            { id: 'country', msg: 'El país es obligatorio.' }
        ];

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorSpan = document.getElementById(`${field.id}-error`);
            if (input && errorSpan) { // Solo valida si el input existe en el DOM
                if (input.value.trim() === '') {
                    errorSpan.textContent = field.msg;
                    isValid = false;
                } else {
                    errorSpan.textContent = '';
                }
            }
        });
        return isValid;
    };

    /**
     * Valida el formulario de información de pago.
     * Muestra mensajes de error directamente en los spans de validación.
     * @returns {boolean} True si todos los campos son válidos, false de lo contrario.
     */
    const validatePaymentForm = () => {
        let isValid = true;
        if (!paymentMethodSelect) {
            console.error('validatePaymentForm: paymentMethodSelect es null. No se puede validar el método de pago.');
            return false; 
        }

        if (paymentMethodSelect.value === 'credit_card') {
            const cardNumberInput = document.getElementById('cardNumber');
            const expiryDateInput = document.getElementById('expiryDate'); 
            const cvcInput = document.getElementById('cvc');
            const cardNameInput = document.getElementById('cardName');

            const cardFields = [
                { input: cardNumberInput, pattern: /^[0-9]{13,19}$/, msg: 'Número de tarjeta inválido (13-19 dígitos).' },
                { input: cvcInput, pattern: /^\d{3,4}$/, msg: 'CVC inválido (3 o 4 dígitos).' },
                { input: cardNameInput, pattern: /.+/, msg: 'Nombre en la tarjeta es obligatorio.' }
            ];

            cardFields.forEach(field => {
                if (field.input) {
                    const errorSpan = document.getElementById(`${field.input.id}-error`);
                    if (!field.pattern.test(field.input.value.trim())) {
                        if (errorSpan) errorSpan.textContent = field.msg;
                        isValid = false;
                    } else {
                        if (errorSpan) errorSpan.textContent = '';
                    }
                }
            });

            if (expiryDateInput) {
                const expiryDateError = document.getElementById('expiryDate-error');
                const expiryValue = expiryDateInput.value.trim();

                if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryValue)) {
                    if (expiryDateError) expiryDateError.textContent = 'Fecha de vencimiento inválida (MM/AA).';
                    isValid = false;
                } else {
                    const [month, year] = expiryValue.split('/').map(Number);
                    const fullYear = 2000 + year; 
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth() + 1; 

                    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
                        if (expiryDateError) expiryDateError.textContent = 'Tarjeta expirada.';
                        isValid = false;
                    } else {
                        if (expiryDateError) expiryDateDateError.textContent = '';
                    }
                }
            }
        }
        return isValid;
    };
    // --- FIN NUEVAS FUNCIONES DE VALIDACIÓN ---


    // --- Event Listeners ---
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', async (event) => {
            const target = event.target;
            const productId = target.dataset.productId || target.closest('.cart-item')?.dataset.productId;

            if (!productId) {
                return;
            }

            if (target.classList.contains('quantity-btn')) {
                const action = target.dataset.action;
                await window.updateCartItemQuantity(productId, action === 'increase' ? 1 : -1);
            } else if (target.classList.contains('remove-from-cart-btn')) {
                if (window.showConfirmModal) {
                    window.showConfirmModal('¿Está seguro de que quiere remover este ítem del carrito?', async () => {
                        await window.removeFromCart(productId);
                    });
                } else { 
                    if (confirm('¿Está seguro de que quiere remover este ítem del carrito?')) {
                        await window.removeFromCart(productId);
                    }
                }
            }
        });
    }

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            console.log('checkout.js: Clic en placeOrderBtn.');
            window.placeOrder();
        });
    }

    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', () => {
            console.log('checkout.js: Clic en cancelCheckoutBtn.');
            if (window.showSection) {
                window.showSection('cart'); 
            } else {
                window.location.hash = '#cart'; 
            }
        });
    }

    // --- Event Listeners para el MODAL DE PAGO ---
    if (paymentMethodSelect) { 
        paymentMethodSelect.addEventListener('change', () => {
            if (paymentMethodSelect.value === 'credit_card') {
                if (creditCardFields) creditCardFields.style.display = 'block';
                showLocalMessage('payment-message-container', '', 'info'); 
            } else {
                if (creditCardFields) creditCardFields.style.display = 'none';
                if (paymentForm) paymentForm.reset();
                showLocalMessage('payment-message-container', '', 'info'); 
            }
            document.querySelectorAll('#credit-card-fields .validation-error').forEach(el => el.textContent = '');
            if (document.getElementById('paymentMethod-error')) document.getElementById('paymentMethod-error').textContent = '';
        });
    } else {
        console.error('ERROR: El elemento paymentMethodSelect no se encontró para añadir el listener de cambio.');
    }

    if (closePaymentModalBtn) {
        closePaymentModalBtn.addEventListener('click', () => {
            console.log('checkout.js: Clic en closePaymentModalBtn.');
            if (paymentModal) paymentModal.style.display = 'none'; 
            if (paymentForm) paymentForm.reset(); 
            showLocalMessage('payment-message-container', '', 'info'); 
            document.querySelectorAll('.validation-error').forEach(el => el.textContent = ''); 
        });
    }

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', () => {
            console.log('checkout.js: Clic en cancelPaymentBtn.');
            if (paymentModal) paymentModal.style.display = 'none'; 
            if (paymentForm) paymentForm.reset(); 
            showLocalMessage('checkout-message-container', 'Proceso de pago cancelado.', 'warning'); 
            document.querySelectorAll('.validation-error').forEach(el => el.textContent = ''); 
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            console.log('checkout.js: paymentForm submit event detectado (dentro del modal).');

            const isPaymentValid = validatePaymentForm(); 
            if (!isPaymentValid) {
                showLocalMessage('payment-message-container', 'Por favor, corrige los errores en los detalles de pago.', 'error');
                return;
            }

            console.log('checkout.js: Iniciando simulación de pago...');
            const paymentSuccess = await simulatePayment();

            if (paymentSuccess) {
                console.log('checkout.js: Simulación de pago exitosa. Preparando detalles del pedido para el backend...');
                const currentCartTotal = parseFloat(checkoutTotalElement.textContent.replace('$', ''));
                const cartData = await getCartFromBackend();
                const cartItems = cartData.items;

                const shippingInfo = {
                    name: document.getElementById('fullName').value.trim(),
                    address: document.getElementById('address').value.trim(),
                    city: document.getElementById('city').value.trim(), 
                    // Ya no se incluye postalCode aquí, según tu indicación.
                    country: document.getElementById('country').value.trim(),
                };

                const orderItems = cartItems.map(item => ({
                    productId: item.productId._id,
                    name: item.productId.name,
                    quantity: item.quantity,
                    price: item.productId.price,
                    imageUrl: item.productId.imageUrl
                }));

                const orderDetails = {
                    items: orderItems,
                    total: currentCartTotal, 
                    shippingInfo: shippingInfo, 
                    paymentMethod: paymentMethodSelect ? paymentMethodSelect.value : 'unknown', 
                    paymentDetails: { 
                        cardNumber: document.getElementById('cardNumber').value.trim(),
                        expiryDate: document.getElementById('expiryDate').value.trim(), 
                        cvc: document.getElementById('cvc').value.trim(),
                        cardName: document.getElementById('cardName').value.trim(),
                    },
                    status: 'pending', 
                    paymentStatus: 'paid' 
                };
                console.log('checkout.js: OrderDetails preparados para backend desde modal:', orderDetails);
                await finalizeOrderInBackend(orderDetails);
            } else {
                console.log('checkout.js: Simulación de pago fallida. No se finaliza la orden.');
            }
        });
    }


    window.updateCartCountDisplay = (count) => {
        if (cartCountSpan) {
            cartCountSpan.textContent = count.toString();
        }
    };
});
