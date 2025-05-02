const express = require('express');
const { ListOrders, GetOrder, CreateOrder, ChangeOrderStatus, DeleteOrder } = require('../Controllers/order');
const { AuthCheck, CheckAdmin } = require('../Middlewares/auth');
const router = express.Router();

// order
router.get('/orders', AuthCheck , CheckAdmin ,  ListOrders) // List all orders, only accessible by admin
router.get('/orders/:user_id', AuthCheck , GetOrder) // Get a specific order by ID, accessible by all authenticated users
router.post('/orders/:user_id', AuthCheck , CreateOrder) // Create a new order, accessible by all authenticated users
router.put('/orders/status/:order_id' , AuthCheck , CheckAdmin , ChangeOrderStatus) // Change the status of an order, accessible by admin only
router.delete('/orders/:user_id', AuthCheck , CheckAdmin , DeleteOrder) // Delete an order, accessible by admin only


module.exports = router;