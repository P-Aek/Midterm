const express = require('express');
const { ListUsers, UpdateUser, RemoveUser } = require('../Controllers/user');
const { AuthCheck, CheckAdmin } = require('../Middlewares/auth');
const router = express.Router();

// user
router.get('/users' , AuthCheck , CheckAdmin ,ListUsers); // List all users
router.put('/user/:id' ,  AuthCheck ,UpdateUser); // Update user by ID
router.delete('/user/:id' , AuthCheck , CheckAdmin ,RemoveUser); // Remove user by ID

module.exports = router;

