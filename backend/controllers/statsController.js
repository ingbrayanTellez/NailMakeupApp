// backend/controllers/statsController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order'); // Necesitarás el modelo de Order para ventas
const Product = require('../models/Product'); // Necesitarás el modelo de Product para productos más vendidos
const User = require('../models/User'); // Necesitarás el modelo de User para usuarios activos

// @desc    Get total sales
// @route   GET /api/admin/stats/sales
// @access  Private/Admin
exports.getTotalSales = asyncHandler(async (req, res) => {
    // Agrega todos los pedidos que tienen un estado de 'delivered' o 'completed'
    // y suma sus totales.
    const totalSalesResult = await Order.aggregate([
        { $match: { status: 'delivered' } }, // O el estado final de tu pedido
        { $group: { _id: null, totalSales: { $sum: '$total' } } }
    ]);

    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

    res.status(200).json({ totalSales });
});

// @desc    Get top selling products
// @route   GET /api/admin/stats/top-products
// @access  Private/Admin
exports.getTopProducts = asyncHandler(async (req, res) => {
    // Agrega los productos de todos los pedidos y cuenta sus cantidades
    const topProducts = await Order.aggregate([
        { $match: { status: 'delivered' } }, // Considera solo pedidos finalizados
        { $unwind: '$items' }, // Descompone el array de items
        {
            $group: {
                _id: '$items.productId', // Agrupa por el ID del producto
                totalSoldQuantity: { $sum: '$items.quantity' }, // Suma la cantidad vendida
                productName: { $first: '$items.name' } // Toma el nombre del primer item (asumiendo que es consistente)
            }
        },
        { $sort: { totalSoldQuantity: -1 } }, // Ordena de mayor a menor cantidad vendida
        { $limit: 5 } // Limita a los 5 productos más vendidos
    ]);

    res.status(200).json({ topProducts });
});

// @desc    Get active users count
// @route   GET /api/admin/stats/active-users
// @access  Private/Admin
exports.getActiveUsersCount = asyncHandler(async (req, res) => {
    // Cuenta los usuarios que están marcados como activos
    const activeUsersCount = await User.countDocuments({ isActive: true });
    res.status(200).json({ activeUsersCount });
});
