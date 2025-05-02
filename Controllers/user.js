const prisma = require('../Config/prisma');

// List all users with pagination and sorting (admun only)
exports.ListUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', order = 'asc' } = req.query;
        const users = await prisma.users.findMany({
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: {
                [sortBy]: order
            }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// update user by ID user update name and address (user only)
exports.UpdateUser = async (req, res) => {
    try {
        
        const userId = parseInt(req.params.id);
        const { name, address } = req.body;


        if (isNaN(userId) || !name || !address) {
            return res.status(400).json({ error: 'Invalid input' });
        }


        const updatedUser = await prisma.users.update({
            where: { user_id: userId },
            data: { name, address }
        });

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        // Handle errors (e.g., user not found, database errors)
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        // Log the error for debugging purposes
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// remove user by ID (admin only)
exports.RemoveUser = async (req, res) => {
    try {
        // Check if the user ID is valid
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        // Delete the user from the database
        const deletedUser = await prisma.users.delete({
            where: { user_id: userId }
        });
        res.json({ message: 'User deleted successfully', user: deletedUser });
        
    } catch (error) {
        // Handle errors (e.g., user not found, database errors)
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        // Log the error for debugging purposes
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};