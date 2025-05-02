const express = require('express');
const { createTransaction, getTransactionById } = require('../Controllers/transactions');
const router = express.Router();

router.post('/transaction/:user_id' , createTransaction); // create transaction
router.get('/transaction/:user_id' , getTransactionById); // get transaction by id




module.exports = router;