const express = require('express');
const { ListCart, AddItemToCart, UpdateItemInCart, RemoveItemFromCart, ClearCart } = require('../Controllers/cart');
const { AuthCheck } = require('../Middlewares/auth');
const router = express.Router();

// cart
router.get('/carts/:user_id', AuthCheck ,ListCart) // List all carts for a user
router.post('/carts/:user_id/items', AuthCheck,AddItemToCart) // Add an item to the cart
router.put('/carts/:user_id/items/:product_id', AuthCheck,UpdateItemInCart) // Update an item in the cart
router.delete('/carts/:user_id/items/:product_id', AuthCheck,RemoveItemFromCart) // Remove an item from the cart
router.delete('/carts/:user_id', AuthCheck,ClearCart) // Clear the cart for a user




module.exports = router;