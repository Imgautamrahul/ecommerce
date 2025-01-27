const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection with error handling
mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'ecommerce'
})
.then(() => {
    console.log('Connected to MongoDB successfully');
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Add error event handler
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Add disconnection event handler
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Add SIGINT handler
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    address: String,
    role: { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    // Vendor specific fields
    shopName: String,
    shopDescription: String,
    isVerified: { type: Boolean, default: false },
    vendorProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

// Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    subcategories: [{
        name: { type: String, required: true },
        description: String
    }],
    createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    description: String,
    image: String,
    stock: Number,
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    totalAmount: Number,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

// Vendor Schema
const vendorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    businessDescription: String,
    businessAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    businessPhone: String,
    businessEmail: { type: String, required: true },
    businessLogo: String,
    businessCategory: String,
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    bankDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String,
        ifscCode: String
    },
    documents: {
        businessRegistration: String,
        taxId: String,
        identityProof: String
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add pre-save middleware to update the updatedAt field
vendorSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Vendor = mongoose.model('Vendor', vendorSchema);

// Auth Routes with better error handling
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user with all fields
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role: 'user',
            createdAt: new Date(),
            lastLogin: null
        });
        
        await user.save();

        // Update stats after new user registration
        const stats = await updateAdminStats();
        
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Add this helper function to update stats
async function updateAdminStats() {
    try {
        const userCount = await User.countDocuments({ role: 'user' });
        const productCount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        return {
            users: userCount,
            products: productCount,
            orders: orderCount,
            revenue: totalRevenue[0]?.total || 0
        };
    } catch (error) {
        console.error('Error updating stats:', error);
        return null;
    }
}

// Simplified login route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials' 
            });
        }

        // Check if user has the requested role
        if (role && user.role !== role) {
            return res.status(403).json({ 
                success: false,
                error: `Access denied. ${role} privileges required.` 
            });
        }

        // Generate token with extended expiration for admin
        const expiresIn = user.role === 'admin' ? '24h' : '12h';
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn }
        );

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Login failed. Please try again.' 
        });
    }
});

// Simplified vendor registration route
app.post('/api/vendor/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            businessName,
            businessDescription,
            businessAddress,
            businessPhone,
            businessEmail,
            businessCategory
        } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }

        // Create user with vendor role
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'vendor',
            phone: businessPhone,
            address: businessAddress.street + ', ' + businessAddress.city,
            isVerified: true
        });
        await user.save();

        // Create vendor profile
        const vendor = new Vendor({
            userId: user._id,
            businessName,
            businessDescription,
            businessAddress,
            businessPhone,
            businessEmail,
            businessCategory,
            status: 'approved',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await vendor.save();

        // Generate token for immediate access
        const token = jwt.sign(
            { userId: user._id, role: 'vendor' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Vendor registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'vendor'
            }
        });
    } catch (error) {
        console.error('Vendor registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

// Add middleware to protect admin routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            error: 'Access denied. No token provided.' 
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = verified;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false,
            error: 'Invalid token' 
        });
    }
};

// Add admin role check middleware
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Access denied. Admin privileges required.' 
        });
    }
    next();
};

// Admin stats endpoint
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Fetch total customers (users with role 'user')
        const totalCustomers = await User.countDocuments({ role: 'user' });
        
        // Fetch total products
        const totalProducts = await Product.countDocuments();
        
        // Fetch total orders
        const totalOrders = await Order.countDocuments();
        
        // Calculate total revenue from all orders
        const revenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;
        
        // Fetch pending vendor count
        const pendingVendors = await User.countDocuments({ 
            role: 'vendor', 
            isVerified: false 
        });

        res.json({
            success: true,
            totalCustomers,
            totalProducts,
            totalOrders,
            totalRevenue,
            pendingVendors
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch admin stats'
        });
    }
});

// Update the customers route
app.get('/api/admin/customers', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Fetch all users with role 'user'
        const customers = await User.find(
            { role: 'user' },
            { password: 0 } // Exclude password field
        ).sort({ createdAt: -1 }); // Sort by newest first

        // Format the response
        const formattedCustomers = customers.map(customer => ({
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || '',
            address: customer.address || '',
            createdAt: customer.createdAt
        }));

        res.json({
            success: true,
            total: customers.length,
            customers: formattedCustomers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch customers' 
        });
    }
});

// Add this route to create an admin user (temporary, remove in production)
app.post('/api/create-admin', async (req, res) => {
    try {
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin'
        });
        
        await adminUser.save();
        res.json({ message: 'Admin user created successfully' });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ error: 'Failed to create admin user' });
    }
});

// Product routes
app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            total: products.length,
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, category, subcategory, price, stock, description, image } = req.body;
        
        const product = new Product({
            name,
            category,
            subcategory,
            price: parseFloat(price),
            stock: parseInt(stock),
            description,
            image
        });

        await product.save();
        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add product'
        });
    }
});

// Get single product route
app.get('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
});

// Update product route
app.put('/api/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, price, stock, category, subcategory, description, image } = req.body;
        
        // Find and update the product
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                price,
                stock,
                category,
                subcategory,
                description,
                ...(image && { image }) // Only update image if provided
            },
            { new: true } // Return updated product
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update product'
        });
    }
});

// Add vendor middleware
const isVendor = (req, res, next) => {
    if (req.user.role !== 'vendor') {
        return res.status(403).json({ error: 'Access denied. Vendor only.' });
    }
    next();
};

// Update vendor product routes
app.post('/api/vendor/products', authenticateToken, isVendor, async (req, res) => {
    try {
        const { name, category, subcategory, price, stock, description, image } = req.body;
        
        const product = new Product({
            name,
            category,
            subcategory,
            price: parseFloat(price),
            stock: parseInt(stock),
            description,
            image,
            vendor: req.user.userId
        });

        await product.save();

        // Update vendor's product list
        await User.findByIdAndUpdate(req.user.userId, {
            $push: { vendorProducts: product._id }
        });

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add product'
        });
    }
});

app.get('/api/vendor/products', authenticateToken, isVendor, async (req, res) => {
    try {
        const products = await Product.find({ vendor: req.user.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            total: products.length,
            products: products.map(product => ({
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                subcategory: product.subcategory,
                image: product.image,
                stock: product.stock,
                createdAt: product.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching vendor products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

app.get('/api/vendor/stats', authenticateToken, isVendor, async (req, res) => {
    try {
        const vendorId = req.user.userId;
        console.log('Fetching stats for vendor:', vendorId);

        // Fetch total products for this vendor
        const totalProducts = await Product.countDocuments({ vendor: vendorId });
        console.log('Product count:', totalProducts);

        // Fetch orders containing products from this vendor
        const orders = await Order.find({
            'products.vendor': vendorId
        });
        const totalOrders = orders.length;
        console.log('Order count:', totalOrders);

        // Calculate total revenue from orders containing vendor's products
        let totalRevenue = 0;
        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.vendor.toString() === vendorId.toString()) {
                    totalRevenue += product.price * product.quantity;
                }
            });
        });
        console.log('Revenue:', totalRevenue);

        // Calculate average rating if available
        const vendor = await Vendor.findOne({ userId: vendorId });
        const averageRating = vendor?.rating || 0;

        res.json({
            success: true,
            vendorStats: {
                totalProducts,
                totalOrders,
                totalRevenue,
                averageRating
            }
        });
    } catch (error) {
        console.error('Error in /api/vendor/stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch vendor stats',
            details: error.message 
        });
    }
});

// Add this route to create a vendor user (for testing)
app.post('/api/create-vendor', async (req, res) => {
    try {
        const vendorUser = new User({
            name: 'Vendor User',
            email: 'vendor@example.com',
            password: await bcrypt.hash('vendor123', 10),
            role: 'vendor',
            shopName: 'Test Shop',
            shopDescription: 'Test Shop Description',
            isVerified: true
        });
        
        await vendorUser.save();
        res.json({ message: 'Vendor user created successfully' });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor user' });
    }
});

// Get vendor profile route
app.get('/api/vendor/profile', authenticateToken, isVendor, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ userId: req.user.userId })
            .populate('userId', 'name email')
            .populate('products');
        
        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor profile not found'
            });
        }

        res.json({
            success: true,
            vendor
        });
    } catch (error) {
        console.error('Error fetching vendor profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor profile'
        });
    }
});

// Update vendor profile route
app.put('/api/vendor/profile', authenticateToken, isVendor, async (req, res) => {
    try {
        const updates = req.body;
        const vendor = await Vendor.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: updates },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            vendor
        });
    } catch (error) {
        console.error('Error updating vendor profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update vendor profile'
        });
    }
});

// Admin vendor management routes
app.get('/api/admin/vendors', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Find all users with vendor role
        const vendors = await User.find(
            { role: 'vendor' },
            { password: 0 } // Exclude password field
        ).sort({ createdAt: -1 });

        // Format the response
        const formattedVendors = vendors.map(vendor => ({
            _id: vendor._id,
            businessName: vendor.shopName || 'N/A',
            userId: {
                name: vendor.name,
                email: vendor.email
            },
            businessEmail: vendor.email,
            businessPhone: vendor.phone || 'N/A',
            businessCategory: vendor.shopDescription || 'N/A',
            businessDescription: vendor.shopDescription || 'N/A',
            isVerified: vendor.isVerified,
            createdAt: vendor.createdAt,
            products: vendor.vendorProducts || []
        }));

        res.json({
            success: true,
            vendors: formattedVendors
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendors'
        });
    }
});

app.get('/api/admin/vendors/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendor = await User.findOne(
            { _id: req.params.id, role: 'vendor' },
            { password: 0 }
        ).populate('vendorProducts');
        
        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        const formattedVendor = {
            _id: vendor._id,
            businessName: vendor.shopName || 'N/A',
            userId: {
                name: vendor.name,
                email: vendor.email
            },
            businessEmail: vendor.email,
            businessPhone: vendor.phone || 'N/A',
            businessCategory: vendor.shopDescription || 'N/A',
            businessDescription: vendor.shopDescription || 'N/A',
            businessAddress: {
                street: vendor.address || 'N/A',
                city: 'N/A',
                state: 'N/A',
                postalCode: 'N/A'
            },
            isVerified: vendor.isVerified,
            rating: 0,
            products: vendor.vendorProducts || [],
            createdAt: vendor.createdAt
        };

        res.json({
            success: true,
            vendor: formattedVendor
        });
    } catch (error) {
        console.error('Error fetching vendor details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor details'
        });
    }
});

app.post('/api/admin/vendors/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        // Update vendor status to approved
        vendor.status = 'approved';
        vendor.isVerified = true; // Automatically verify the vendor
        await vendor.save();

        // Update user role to vendor and set verification
        await User.findByIdAndUpdate(vendor.userId, { 
            role: 'vendor',
            isVerified: true
        });

        res.json({
            success: true,
            message: 'Vendor approved successfully'
        });
    } catch (error) {
        console.error('Error approving vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve vendor'
        });
    }
});

app.post('/api/admin/vendors/:id/reject', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        // Update vendor status to rejected
        vendor.status = 'rejected';
        await vendor.save();

        // Update user role back to regular user
        await User.findByIdAndUpdate(vendor.userId, { 
            role: 'user'
        });

        res.json({
            success: true,
            message: 'Vendor rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject vendor'
        });
    }
});

// Get vendor orders
app.get('/api/admin/vendor-orders/:vendorId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({
            'products.vendor': req.params.vendorId
        })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching vendor orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor orders'
        });
    }
});

// Public endpoint to fetch all products (both admin and vendor)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find()
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            total: products.length,
            products: products.map(product => ({
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                subcategory: product.subcategory,
                image: product.image,
                stock: product.stock,
                vendor: product.vendor,
                createdAt: product.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
});

// Add category routes
app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Category already exists'
            });
        }

        const category = new Category({
            name,
            description,
            subcategories: []
        });

        await category.save();

        res.status(201).json({
            success: true,
            category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create category'
        });
    }
});

app.post('/api/categories/:categoryId/subcategories', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Category.findById(req.params.categoryId);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if subcategory already exists
        const existingSubcategory = category.subcategories.find(sub => sub.name === name);
        if (existingSubcategory) {
            return res.status(400).json({
                success: false,
                error: 'Subcategory already exists'
            });
        }

        category.subcategories.push({ name, description });
        await category.save();

        res.status(201).json({
            success: true,
            category
        });
    } catch (error) {
        console.error('Error adding subcategory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add subcategory'
        });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    subcategories: { $addToSet: '$subcategory' }
                }
            },
            {
                $project: {
                    name: '$_id',
                    subcategories: 1,
                    _id: 0
                }
            }
        ]);

        res.json({
            success: true,
            categories: categories.map(cat => ({
                name: cat.name,
                subcategories: cat.subcategories.map(sub => ({
                    name: sub
                }))
            }))
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

app.get('/api/categories/:categoryId/products', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.categoryId })
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Error fetching category products:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category products'
        });
    }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price');

        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            customerName: order.user.name,
            products: order.products,
            totalAmount: order.totalAmount,
            status: order.status,
            orderDate: order.createdAt
        }));

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 