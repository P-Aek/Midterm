const prisma = require("../Config/prisma");

exports.ListOrders = async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        items: true,
        user: true
      },
      orderBy: {
        order_date: 'desc'
      }
    });
    
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving orders' });
  }
};

exports.GetOrder = async (req, res) => {
  const userId = parseInt(req.params.user_id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid User ID' });
  }

  try {
    const orders = await prisma.orders.findMany({
      where: {
        user_id: userId
      },
      include: {
        items: true,
        user: true
      },
      orderBy: {
        order_date: 'desc'
      }
    });

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving orders' });
  }
};

exports.CreateOrder = async (req, res) => {
  // Get user_id from URL parameters
  const userId = parseInt(req.params.user_id); // Assuming user_id is in params and is an integer

  // Basic validation for userId (check if it's a valid number)
  if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid User ID in parameters.' });
  }

  try {
    // 1. Check if the user exists (optional but recommended)
    const user = await prisma.users.findUnique({ where: { user_id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 2. Find the user's cart and its items
    const userCart = await prisma.carts.findFirst({
        where: { user_id: userId },
        include: {
            items: true, // Include all cart items
        },
    });

    // Check if cart exists and has items
    if (!userCart || !userCart.items || userCart.items.length === 0) {
        return res.status(400).json({ error: 'User cart is empty or not found.' });
    }

    // 3. Get product details and check stock for all items in the cart
    const productIdsInCart = userCart.items.map(item => item.product_id);
    const products = await prisma.products.findMany({
      where: {
        product_id: {
          in: productIdsInCart,
        },
      },
    });

    // Create a map for easy product lookup by id
    const productMap = products.reduce((map, product) => {
      map[product.product_id] = product;
      return map;
    }, {});

    let totalOrderAmount = 0; // Total price of the order
    const orderItemsToCreate = []; // Data for creating Order Items based on cart items
    const productUpdates = []; // Data for updating product stock

    // Loop through each item in the user's cart
    for (const cartItem of userCart.items) {
      const product = productMap[cartItem.product_id];

      // Validate product existence and stock (using the quantity from the cart item)
      if (!product) {
        // This case is less likely if cart items are created correctly, but good for robustness
        return res.status(404).json({ error: `Product with ID: ${cartItem.product_id} from cart not found.` });
      }
      if (product.quantity < cartItem.quantity) {
        // If stock is insufficient for an item in the cart
        return res.status(400).json({ error: `Insufficient stock for product "${product.product_name}" in cart. Available: ${product.quantity}, Requested in cart: ${cartItem.quantity}` });
      }

      // Calculate the total price for each item based on cart quantity and product price
      const itemTotalPrice = cartItem.quantity * product.price;
      totalOrderAmount += itemTotalPrice;

      // Prepare data for creating Order Item from the cart item
      orderItemsToCreate.push({
        product_id: cartItem.product_id,
        product_name: product.product_name, // Use product name from fetched data
        quantity: cartItem.quantity,
        price: product.price, // Use the actual product price
        Total_price: itemTotalPrice, // Total price for the order item
      });

      // Prepare data for stock update
      productUpdates.push({
        product_id: product.product_id,
        newQuantity: product.quantity - cartItem.quantity, // New stock quantity after deducting cart quantity
      });
    }

    // 4. Perform Transaction: Create Order, Create Order Items, Update Stock, and Delete Cart Items
    const result = await prisma.$transaction(async (prisma) => {
      // 4a. Create the main order
      const newOrder = await prisma.orders.create({
        data: {
          user_id: userId,
          // order_date and order_status will use default values defined in the schema
        },
      });

      // 4b. Prepare data for creating multiple Order Items, linking them to the new order
      const orderItemsData = orderItemsToCreate.map(item => ({
        ...item,
        order_id: newOrder.order_id, // Link to the newly created main Order
      }));

      // 4c. Create multiple Order Items
      await prisma.orderitems.createMany({
        data: orderItemsData,
      });

      // 4d. Update product stock
      for (const update of productUpdates) {
        await prisma.products.update({
          where: { product_id: update.product_id },
          data: { quantity: update.newQuantity },
        });
      }

      // 4e. Delete all items from the user's cart after successful order creation and stock update
      await prisma.cartItems.deleteMany({
          where: {
              cart_id: userCart.cart_id, // Delete all items from this specific cart
          },
      });


      // 4f. Fetch the created Order including its Order Items for the response
      const createdOrder = await prisma.orders.findUnique({
        where: { order_id: newOrder.order_id },
        include: {
          items: true, // Include the created Order Items
        },
      });

      return createdOrder; // Return the created Order with items
    });

    // 5. Respond with the created order
    res.status(201).json(result);

  } catch (error) {
    // Handle errors
    // console.error('Error creating order from cart:', error);
    // Check for specific Prisma errors if needed for more detailed handling
    // But for general errors, we send a 500 Internal Server Error response
    res.status(500).json({ error: 'An error occurred while creating the order from the cart.' });
  }
};

exports.ChangeOrderStatus = async (req, res) => {
  const orderId = parseInt(req.params.order_id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid Order ID' });
  }

  try {
    const updatedOrder = await prisma.orders.update({
      where: {
        order_id: orderId
      },
      data: {
        order_status: 'paid'
      },
      include: {
        items: true,
        user: true
      }
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Error updating order status' });
  }
};

exports.DeleteOrder = async (req, res) => {
  const userId = parseInt(req.params.user_id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid User ID' });
  }

  try {
    // Delete only pending orders for the user
    const deletedOrders = await prisma.orders.deleteMany({
      where: {
        user_id: userId,
        order_status: 'pending'
      }
    });

    if (deletedOrders.count === 0) {
      return res.status(404).json({ message: 'No pending orders found for this user' });
    }

    res.status(200).json({ message: `Deleted ${deletedOrders.count} pending orders` });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting orders' });
  }
};
