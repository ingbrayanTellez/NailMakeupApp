// backend/controllers/discountController.js
const asyncHandler = require('express-async-handler');
const Discount = require('../models/Discount'); // Asegúrate de que la ruta a tu modelo Discount sea correcta

// @desc    Get all discounts
// @route   GET /api/admin/discounts
// @access  Private/Admin
exports.getAllDiscounts = asyncHandler(async (req, res) => {
    const discounts = await Discount.find({});
    res.status(200).json(discounts);
});

// @desc    Create a new discount
// @route   POST /api/admin/discounts
// @access  Private/Admin
exports.createDiscount = asyncHandler(async (req, res) => {
    const { code, type, value, minOrderAmount, expiryDate, maxUses } = req.body;

    if (!code || !type || !value) {
        res.status(400);
        throw new Error('Código, tipo y valor del descuento son requeridos.');
    }

    if (!['percentage', 'fixed'].includes(type)) {
        res.status(400);
        throw new Error('Tipo de descuento inválido. Debe ser "percentage" o "fixed".');
    }

    const discountExists = await Discount.findOne({ code });
    if (discountExists) {
        res.status(400);
        throw new Error('Ya existe un descuento con este código.');
    }

    const discount = await Discount.create({
        code,
        type,
        value,
        minOrderAmount,
        expiryDate,
        maxUses
    });

    res.status(201).json({ message: 'Descuento creado exitosamente.', discount });
});

// @desc    Update a discount
// @route   PUT /api/admin/discounts/:id
// @access  Private/Admin
exports.updateDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { code, type, value, minOrderAmount, expiryDate, maxUses } = req.body;

    const discount = await Discount.findById(id);

    if (!discount) {
        res.status(404);
        throw new Error('Descuento no encontrado.');
    }

    // Opcional: Verificar si el código ya existe en otro descuento
    if (code && code !== discount.code) {
        const existingDiscount = await Discount.findOne({ code, _id: { $ne: id } });
        if (existingDiscount) {
            res.status(400);
            throw new Error('Ya existe otro descuento con este código.');
        }
    }

    discount.code = code || discount.code;
    discount.type = type || discount.type;
    discount.value = value !== undefined ? value : discount.value;
    discount.minOrderAmount = minOrderAmount !== undefined ? minOrderAmount : discount.minOrderAmount;
    discount.expiryDate = expiryDate !== undefined ? expiryDate : discount.expiryDate;
    discount.maxUses = maxUses !== undefined ? maxUses : discount.maxUses;

    const updatedDiscount = await discount.save();

    res.status(200).json({ message: 'Descuento actualizado exitosamente.', discount: updatedDiscount });
});

// @desc    Delete a discount
// @route   DELETE /api/admin/discounts/:id
// @access  Private/Admin
exports.deleteDiscount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const discount = await Discount.findById(id);

    if (!discount) {
        res.status(404);
        throw new Error('Descuento no encontrado.');
    }

    await discount.deleteOne();

    res.status(200).json({ message: 'Descuento eliminado exitosamente.' });
});
