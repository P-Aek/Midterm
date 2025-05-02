const express = require('express');
const { createTransaction, getTransactionById } = require('../Controllers/transactions');
const { AuthCheck } = require('../Middlewares/auth');
const router = express.Router();

router.post('/transaction/:user_id' , AuthCheck, createTransaction); // create transaction
router.get('/transaction/:user_id/:transaction_id' , AuthCheck, getTransactionById); // get transaction by id




module.exports = router;