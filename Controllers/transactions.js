const prisma = require('../Config/prisma');


exports.createTransaction = async (req, res) => {
    res.send('create transaction');
};

exports.getTransactionById = async (req, res) => {
    res.send('get transaction by id');
};
