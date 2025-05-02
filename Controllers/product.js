const prisma = require('../Config/prisma');



// list count products
exports.ListProducts = async (req,res) => {
    try {
        const { count } = req.params;
        const products = await prisma.products.findMany({
            take: parseInt(count),
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
};

// List a single product
exports.ListOneProduct = async (req,res) => {
    try {
        const { id } = req.params;
        
        const product = await prisma.products.findUnique({
            where: {
                product_id: parseInt(id),
            }
        });
        if (!product) {
            return res.status(404).json({message: 'Product not found'});
        }
        res.status(200).json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
};

// create a product
exports.CreateProduct = async (req,res) => {
    try {
        const {name , description , price , quantity } = req.body;
        const product = await prisma.products.create({
            data: {
                product_name : name,
                description: description,
                price : price,
                quantity : quantity,
                updatedAt: new Date(),
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
};

// update a product
exports.UpdateProduct = async (req,res) => {
    try {
        const {name , description , price , quantity } = req.body;
        const { id } = req.params;
        const product = await prisma.products.update({
            where: {
                product_id: parseInt(id),
            },
            data: {
                product_name : name,
                description: description,
                price : price,
                quantity : quantity,
                updatedAt: new Date(),
            }
        });
        res.status(200).json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
        
    }
};

// delete a product
exports.DeleteProduct = async (req,res) => {
    try {
        const { id } = req.params;
        // Check if the product exists
        const productExists = await prisma.products.findUnique({
            where: {
                product_id: parseInt(id),
            }
        });
        if (!productExists) {
            return res.status(404).json({message: 'Product not found'});
        }
        const product = await prisma.products.delete({
            where: {
                product_id: parseInt(id),
            }
        });
        res.status(200).send(`${product.product_name}, id: ${product.product_id} deleted successfully`);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
};