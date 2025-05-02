const prisma = require("../Config/prisma");

exports.ListCart = async (req, res) => {
  try {
    // Extract user_id from URL params
    const { user_id } = req.params;
    const cart = await prisma.carts.findFirst({
      where: { user_id: parseInt(user_id) },
    });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    const items = await prisma.cartItems.findMany({
      where: { cart_id: cart.id },
    });
    res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.AddItemToCart = async (req, res) => {
  try {
    // Extract user_id from URL params and product_id, quantity from the request body
    const { user_id } = req.params;
    const { product_id, quantity } = req.body;

    // Check if product_id and quantity are provided
    if (!product_id || !quantity) {
      return res
        .status(400)
        .json({ error: "Product ID and quantity are required" });
    }

    // Convert string inputs to integers
    const userId = parseInt(user_id);
    const productId = parseInt(product_id);
    const quantityInt = parseInt(quantity);
    // Validate the quantity is a positive integer
    if (isNaN(quantityInt) || quantityInt <= 0) {
      return res
        .status(400)
        .json({ error: "Quantity must be a positive integer" });
    }

    // Check if the user exists in the database
    const user = await prisma.users.findUnique({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the product exists in the database
    const product = await prisma.products.findUnique({
      where: { product_id: productId },
      select: {
        product_id: true,
        price: true,
        quantity: true,
        product_name: true,
      },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    // Check if the requested quantity is available
    if (quantityInt > product.quantity) {
      return res
        .status(400)
        .json({ error: "Requested quantity exceeds available stock" });
    }

    // Check if the user already has a cart
    let cart = await prisma.carts.findFirst({ where: { user_id: userId } });

    // If the cart doesn't exist, create a new one and add the product to it
    if (!cart) {
      cart = await prisma.carts.create({
        data: {
          user_id: userId,
          items: {
            create: [
              {
                quantity: quantityInt,
                price: product.price,
                product: {
                  connect: { product_id: productId },
                },
              },
            ],
          },
        },
      });

      // Respond with a success message
      return res.status(200).json({
        message: `Added ${product.product_name} amount ${quantityInt} added to cart.`,
      });
    }

    // Check if the product is already in the cart
    const existingItem = await prisma.cartItems.findFirst({
      where: {
          cart_id: cart.id,
          product_id: productId,
      },
    });

    if (existingItem) {
      // If it exists, update the quantity by adding the new amount
      const newTotalQuantity = existingItem.quantity + quantityInt;
      // Check if the new quantity exceeds available stock
      if (newTotalQuantity > product.quantity) {
        return res
          .status(400)
          .json({ error: `Can't add more than available stock` });
      }

      await prisma.cartItems.update({
        where: {
          cart_item_id : existingItem.cart_item_id,
        },
        data: {
          quantity: newTotalQuantity,
        },
      });
    } else {
      // If not, create a new cart item with the product and quantity
      await prisma.cartItems.create({
        data: {
          cart: { connect: { cart_id: cart.cart_id } },
          product: { connect: { product_id: productId } },
          quantity: quantityInt,
          price: product.price,
        },
      });
    }

    // Respond with a success message
    return res.status(200).json({
      message: `${product.product_name} amount ${quantityInt} added to cart.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.UpdateItemInCart = async (req, res) => {
  try {
    // Extract user_id and product_id from URL params and quantity from the request body
    const { user_id, product_id } = req.params;
    const { quantity } = req.body;

    // Check if quantity is provided
    if(quantity === undefined || quantity === null) {
      return res.status(400).json({ error: "Quantity is required" });
    }

    // Convert string inputs to integers
    const userId = parseInt(user_id,10);
    const productId = parseInt(product_id,10);
    const quantityInt = parseInt(quantity,10);

    // Validate the quantity is a positive integer
    if (isNaN(quantityInt) || quantityInt <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    // Check if the user exists in the database
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the user's cart
    const cart = await prisma.carts.findFirst({
      where: { user_id: userId },
    });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    // check quantity is not more than available stock
    const product = await prisma.products.findUnique({
      where: { product_id: productId },
      select: {
        product_id: true,
        product_name: true,
        quantity: true, 
      },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    // check if the requested quantity is available
    if (quantityInt > product.quantity) {
      return res
        .status(400)
        .json({ error: `Cannot add more than available stock for ${product.product_name}` });
    }

    // Find the item in the cart
    const item = await prisma.cartItems.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
    });
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }
    // Handle quantity = 0
    if (quantityInt === 0) {
      await prisma.cartItems.delete({
        where: {
          cart_item_id: item.cart_item_id,
        },
      });
      return res.status(200).json({ message: `${product.product_name} removed from the cart` });
    }

    // Update the item's quantity in the cart
    await prisma.cartItems.update({
      where: {
        cart_item_id : item.cart_item_id,
      },
      data: {
        quantity: quantityInt,
      },
    });
    // Respond with a success message
    res.status(200).json({ message: `${product.product_name} amount ${quantityInt} updated successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.RemoveItemFromCart = async (req, res) => {
  try {
    // Extract user_id and product_id from URL params
    const { user_id, product_id } = req.params;

    // Check if the user exists in the database
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(user_id, 10) },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the user's cart
    const cart = await prisma.carts.findFirst({
      where: { user_id: parseInt(user_id, 10) },
    });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Find the item in the cart
    const item = await prisma.cartItems.findFirst({
      where: {
        cart_id: cart.id,
        product_id: parseInt(product_id),
      },
    });
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // Remove the items from the cart
    await prisma.cartItems.delete({
      where: {
        cart_item_id: item.cart_item_id,
      },
    });
    // Check if the cart is empty after removing the item
    const remainingItems = await prisma.cartItems.findMany({
      where: { cart_id: cart.id },
    });
    if (remainingItems.length === 0) {
      // If the cart is empty, delete the cart as well
      await prisma.carts.delete({
        where: { cart_id: cart.cart_id },
      });
    } 
    // Respond with a success message
    res.status(200).json({ message: "Item removed from cart successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
    
  }
};

exports.ClearCart = async (req, res) => {
  try {
    // Extract user_id from URL params
    const { user_id } = req.params;

    // Check if the user exists in the database
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(user_id) },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the user's cart
    const cart = await prisma.carts.findFirst({
      where: { user_id: parseInt(user_id) },
    });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Clear all items in the cart
    await prisma.cartItems.deleteMany({ where: { cart_id: cart.id } });

    // Respond with a success message
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
