// public/js/addProduct.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- Referencias a Elementos del DOM del formulario de producto ---
    const addProductSection = document.getElementById('add-product');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('product-name');
    const productDescriptionInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productCategoryInput = document.getElementById('product-category');
    const productStockInput = document.getElementById('product-stock');
    const imageUrlInput = document.getElementById('imageUrl');
    const imageUrlDisplay = document.getElementById('imageUrlDisplay'); // Para mostrar el nombre del archivo
    const submitButton = productForm ? productForm.querySelector('button[type="submit"]') : null;
    const productFormTitle = document.getElementById('product-form-title'); 
    const productMessageContainer = document.getElementById('product-message-container'); // Contenedor de mensajes de producto

    // --- Referencias a elementos de validación ---
    const productNameError = document.getElementById('product-name-error');
    const productDescriptionError = document.getElementById('product-description-error');
    const productPriceError = document.getElementById('product-price-error');
    const productCategoryError = document.getElementById('product-category-error');
    const productStockError = document.getElementById('product-stock-error');
    const imageUrlError = document.getElementById('imageUrl-error');

    // Verificación inicial de existencia de elementos HTML
    if (!productForm || !submitButton || !imageUrlDisplay || !imageUrlInput || !productIdInput ||
        !productNameInput || !productDescriptionInput || !productPriceInput || !productCategoryInput ||
        !productStockInput || !addProductSection || !productFormTitle || !productNameError ||
        !productDescriptionError || !productPriceError || !productCategoryError || !productStockError || !imageUrlError || !productMessageContainer) {
        console.error("Error: Uno o más elementos HTML requeridos (formulario de producto o validación) no se encontraron. Asegúrate de que sus IDs/selectores sean correctos y existan en index.html.");
        return; // Detener la ejecución si no se encuentran los elementos críticos
    }

    // --- Funciones de Utilidad ---

    /**
     * Limpia los mensajes de error de validación del formulario.
     */
    const clearValidationErrors = () => {
        productNameError.textContent = '';
        productDescriptionError.textContent = '';
        productPriceError.textContent = '';
        productCategoryError.textContent = '';
        productStockError.textContent = '';
        imageUrlError.textContent = '';
    };

    /**
     * Muestra los errores de validación en los spans correspondientes.
     * @param {object} errors - Objeto con los errores devueltos por el servidor.
     */
    const displayValidationErrors = (errors) => {
        clearValidationErrors();
        if (errors.name) productNameError.textContent = errors.name;
        if (errors.description) productDescriptionError.textContent = errors.description;
        if (errors.price) productPriceError.textContent = errors.price;
        if (errors.category) productCategoryError.textContent = errors.category;
        if (errors.stock) productStockError.textContent = errors.stock;
        if (errors.imageUrl) imageUrlError.textContent = errors.imageUrl;
    };

    /**
     * Obtiene el token de autenticación del localStorage.
     * @returns {string|null} El token si existe, de lo contrario null.
     */
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    /**
     * Verifica el rol del usuario desde el localStorage.
     * @returns {string|null} El rol del usuario ('admin', 'user', etc.) o null si no está logueado o el rol no se puede determinar.
     */
    const getUserRole = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const userObject = JSON.parse(userString);
                return userObject.role;
            } catch (e) {
                console.error("addProduct.js: Error al parsear el objeto 'user' del localStorage:", e);
                return null;
            }
        }
        return null;
    };

    // --- Lógica del formulario Añadir/Editar Producto ---

    // Manejar el cambio de archivo para la imagen
    imageUrlInput.addEventListener('change', () => {
        if (imageUrlInput.files.length > 0) {
            imageUrlDisplay.textContent = `Seleccionado: ${imageUrlInput.files[0].name}`;
        } else {
            imageUrlDisplay.textContent = 'Ningún archivo seleccionado';
        }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearValidationErrors();

        const token = getAuthToken();
        const role = getUserRole();

        if (!token || role !== 'admin') {
            if (window.showMessage) window.showMessage('No autorizado. Solo los administradores pueden añadir o editar productos.', 'error', 'product-message-container');
            return;
        }

        const productId = productIdInput.value; // Obtener el ID del campo oculto (para edición)
        const isEditing = !!productId; // Si hay un ID, estamos editando

        const formData = new FormData();
        formData.append('name', productNameInput.value);
        formData.append('description', productDescriptionInput.value);
        formData.append('price', productPriceInput.value);
        formData.append('category', productCategoryInput.value);
        formData.append('stock', productStockInput.value);

        if (imageUrlInput.files.length > 0) {
            formData.append('imageUrl', imageUrlInput.files[0]);
        }

        let url = '/api/products';
        let method = 'POST';

        if (isEditing) {
            url = `/api/products/${productId}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // FormData se envía directamente, sin Content-Type
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    displayValidationErrors(data.errors);
                } else {
                    if (window.showMessage) window.showMessage(`Error: ${data.message || 'Error al procesar el producto.'}`, 'error', 'product-message-container');
                }
                return;
            }

            if (window.showMessage) window.showMessage(`Producto ${isEditing ? 'actualizado' : 'añadido'} con éxito!`, 'success', 'product-message-container');
            productForm.reset(); // Limpia el formulario

            // Restablecer el texto del botón y el título después de un envío exitoso
            submitButton.textContent = 'Añadir Producto';
            if (productFormTitle) {
                productFormTitle.textContent = 'Añadir Nuevo Producto';
            }
            imageUrlDisplay.textContent = 'Ningún archivo seleccionado'; // Limpiar la visualización del archivo
            productIdInput.value = ''; // Asegurarse de que el ID oculto se borre

            // Llama a la función global para recargar los productos en la lista
            if (window.fetchProducts) {
                window.fetchProducts();
            }
            clearValidationErrors(); // Limpiar errores después de un envío exitoso

            // Redirigir al usuario de vuelta a la sección de productos después de guardar
            if (window.showSection && document.getElementById('products')) {
                window.showSection('products');
            } else {
                window.location.hash = '#products';
            }


        } catch (error) {
            console.error('addProduct.js: Error al enviar el formulario del producto:', error);
            if (window.showMessage) window.showMessage('Error de conexión o de servidor al procesar el producto.', 'error', 'product-message-container');
        }
    });

    // Hacer la función editProduct global para que pueda ser llamada desde main.js
    window.editProduct = async (productId) => {
        try {
            // Asegúrate de que la sección de añadir/editar producto es visible
            if (window.showSection && addProductSection) {
                window.showSection('add-product'); // Pasar el ID de la sección
            } else {
                // Fallback si showSection no está disponible
                document.querySelectorAll('section').forEach(section => section.classList.add('hidden-section'));
                addProductSection.classList.remove('hidden-section');
            }

            const token = getAuthToken();
            if (!token) {
                if (window.showMessage) window.showMessage('Necesitas iniciar sesión para editar productos.', 'error', 'product-message-container');
                return;
            }

            const response = await fetch(`/api/products/${productId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (window.showMessage) window.showMessage(`Error al cargar el producto para edición: ${errorData.message || response.statusText}`, 'error', 'product-message-container');
                return;
            }

            const product = await response.json();

            // Llenar el formulario con los datos del producto
            productIdInput.value = product._id;
            productNameInput.value = product.name;
            productDescriptionInput.value = product.description;
            productPriceInput.value = product.price;
            productCategoryInput.value = product.category;
            productStockInput.value = product.stock;

            // Mostrar el nombre de la imagen actual (si existe) o indicar que no hay
            if (product.imageUrl && product.imageUrl !== '/img/placeholder.png') {
                const imageName = product.imageUrl.split('/').pop();
                imageUrlDisplay.textContent = `Actual: ${imageName}`;
            } else {
                imageUrlDisplay.textContent = 'Ningún archivo seleccionado';
            }

            // --- CAMBIO CLAVE AQUÍ PARA EL TÍTULO Y EL BOTÓN ---
            if (productFormTitle) {
                productFormTitle.textContent = 'Editar Producto'; // Cambia el título del formulario
            }
            submitButton.textContent = 'Actualizar Producto'; // Cambia el texto del botón

            clearValidationErrors(); // Limpiar errores previos si los había

        } catch (error) {
            console.error('addProduct.js: Error al cargar el producto para edición:', error);
            if (window.showMessage) window.showMessage('Error de conexión al cargar el producto para edición.', 'error', 'product-message-container');
        }
    };

    // Función para restablecer el formulario de producto (útil al navegar a la sección)
    window.resetProductForm = () => {
        if (productForm) productForm.reset();
        if (productIdInput) productIdInput.value = '';
        if (imageUrlDisplay) imageUrlDisplay.textContent = 'Ningún archivo seleccionado';
        if (submitButton) submitButton.textContent = 'Añadir Producto';
        if (productFormTitle) productFormTitle.textContent = 'Añadir Nuevo Producto';
        clearValidationErrors();
    };

    // Agregar un controlador para el botón de cancelar en el formulario de producto
    const cancelProductBtn = document.getElementById('cancel-product-btn');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
            window.resetProductForm(); // Usar la nueva función de reseteo

            // Regresar a la vista de productos
            if (window.showSection && document.getElementById('products')) {
                window.showSection('products');
            } else {
                window.location.hash = '#products';
            }
        });
    }

});
