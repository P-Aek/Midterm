const express = require('express');
const { Register, Login, Logout, CurrentUser, UpdatePassword, RecieveOTP, VerifyOTP, LoginOAuth } = require('../Controllers/auth');
const { AuthCheck, CheckAdmin } = require('../Middlewares/auth');
const router = express.Router();


router.post('/register' , Register);
router.post('/login' , Login);
router.post('/logout' , Logout);
router.post('/currentUser'  , AuthCheck, CurrentUser);
router.post('/currentAdmin'  , AuthCheck, CheckAdmin, CurrentUser);
router.put('/updatePassword' ,AuthCheck, UpdatePassword);
router.post('/otp/request' , RecieveOTP);
router.post('/otp/verify' , VerifyOTP);


module.exports = router;