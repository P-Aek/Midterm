const prisma = require("../Config/prisma");

exports.createTransaction = async (req, res) => {
    try {
      const userId = parseInt(req.params.user_id);
      // check req
      if (isNaN(userId) || userId <= 0) {
          return res.status(400).json({ error: 'Invalid User ID in URL parameters.' });
      }
  
      const { order_id, payment_method } = req.body;
      // check req
      if (
        order_id === undefined ||
        payment_method === undefined
      ) {
        return res
          .status(400)
          .json({ error: "Order ID and payment method are required in request body." });
      }
      // validate
      const orderIdInt = parseInt(order_id);
  
      if (isNaN(orderIdInt) || orderIdInt <= 0) {
        return res
          .status(400)
          .json({ error: "Order ID in request body must be a positive integer." });
      }
      if (
        typeof payment_method !== "string" ||
        payment_method.trim().length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Payment method in request body must be a non-empty string." });
      }
  
      // Check order exist and include items
      const order = await prisma.orders.findUnique({
        where: { order_id: orderIdInt },
        include: { items: true }
      });
  
      // Check if the order exists and has items
      if (!order || !order.items || order.items.length === 0) {
          // If order not found, or found but has no items (shouldn't happen if order creation is correct)
          return res.status(404).json({ error: `Order with ID ${orderIdInt} not found or has no items.` });
      }
  
      // Check that the order belongs to this user
      if (order.user_id !== userId) {
          // If the order does not belong to this user, return 404 to avoid leaking info
          return res.status(404).json({ error: `Order with ID ${orderIdInt} not found for this user.` });
          // Or return 403 Forbidden if you want to indicate the order exists but is not accessible
          // return res.status(403).json({ error: 'You do not have permission to access this order.' });
      }
      
      // Calculate the total amount from order items
      const totalAmount = order.items.reduce((sum, item) => sum + item.Total_price, 0);
  
      // Define the initial transaction status (e.g., 'pending')
      const initialStatus = 'pending'; // Or any other suitable initial status
  
      // Create the new transaction
      const newTransaction = await prisma.transactions.create({
        data: {
          order_id: orderIdInt, // Use the order_id from the request body (already validated and confirmed to exist)
          payment_method: payment_method,
          amount: totalAmount,
          status: initialStatus
        },
      });
  
      // respond with the created transaction details
      res.status(201).json(newTransaction);
  
    } catch (error) {
      console.error('Error creating transaction:', error); 
      res
        .status(500)
        .json({ error: "An error occurred while creating the transaction." });
    }
  };

exports.getTransactionById = async (req, res) => {
    try {
        const userId = parseInt(req.params.user_id);
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        const transactionId = parseInt(req.params.transaction_id);
        if (isNaN(transactionId) || transactionId <= 0) {
            return res.status(400).json({ error: 'Invalid Transaction ID in URL parameters.' });
        };

        const transactions = await prisma.transactions.findUnique({
            where : { transaction_id : transactionId },
            include: {
                order: true
            }
        });

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ error: `Transaction with ID ${transactionId} not found.` });
        }

        if (!transactions.order || transactions.order.user_id !== userId) {
            return res.status(404).json({ error: `Transaction with ID ${transactionId} not found for this user.` });
        }

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: "An error occurred while fetching transactions" });
    }
};
