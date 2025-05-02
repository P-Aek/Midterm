const express = require('express');
const { ListProducts, ListOneProduct, UpdateProduct, CreateProduct, DeleteProduct } = require('../Controllers/product');
const { AuthCheck, CheckAdmin } = require('../Middlewares/auth');
const router = express.Router();

// product
router.get('/products/:count' , AuthCheck , ListProducts); // List count products
router.get('/product/:id' , AuthCheck , ListOneProduct); // List a single product
// Admin Only
router.post('/product' , AuthCheck, CheckAdmin ,CreateProduct); // Create a product
router.put('/product/:id' , AuthCheck, CheckAdmin , UpdateProduct); // Update a product
router.delete('/product/:id' , AuthCheck, CheckAdmin , DeleteProduct); // Delete a product


module.exports = router;