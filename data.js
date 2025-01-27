// Initialize products array
let products = [];

// Categories
const categories = ['All', 'Electronics', 'Fashion', 'Books', 'Home & Kitchen', 'Toys & Games', 'Beauty', 'Sports', 'Vendor'];

// Trending tags data
const trendingTags = [
    { name: 'Electronics', icon: 'fas fa-laptop' },
    { name: 'Fashion', icon: 'fas fa-tshirt' },
    { name: 'Books', icon: 'fas fa-book' },
    { name: 'Home', icon: 'fas fa-home' },
    { name: 'Beauty', icon: 'fas fa-spa' },
    { name: 'Sports', icon: 'fas fa-futbol' },
    { name: 'Toys', icon: 'fas fa-gamepad' },
    { name: 'Kitchen', icon: 'fas fa-utensils' }
];

const promotions = [
    {
        id: 1,
        title: "Flash Sale",
        discount: "50% OFF",
        code: "FLASH50",
        validUntil: "2025-02-01",
        image: "https://img.freepik.com/free-vector/flash-sale-background-with-thunder_23-2147905134.jpg",
        backgroundColor: "from-purple-600 to-purple-700"
    },
    {
        id: 2,
        title: "New User Special",
        discount: "₹500 OFF",
        code: "NEWUSER500",
        validUntil: "2025-03-01",
        image: "https://img.freepik.com/free-vector/welcome-concept-illustration_114360-399.jpg",
        backgroundColor: "from-blue-500 to-blue-600"
    },
    {
        id: 3,
        title: "Fashion Week",
        discount: "40% OFF",
        code: "FASHION40",
        validUntil: "2025-01-31",
        image: "https://img.freepik.com/free-vector/fashion-sale-banner-template_23-2148935598.jpg",
        backgroundColor: "from-pink-500 to-pink-600"
    },
    {
        id: 4,
        title: "Electronics Deal",
        discount: "Up to 60% OFF",
        code: "GADGET60",
        validUntil: "2025-02-15",
        image: "https://img.freepik.com/free-vector/realistic-electronics-sale-illustration_23-214950341.jpg",
        backgroundColor: "from-cyan-500 to-cyan-600"
    },
    {
        id: 5,
        title: "Weekend Special",
        discount: "Buy 1 Get 1",
        code: "WEEKEND",
        validUntil: "2025-02-10",
        image: "https://img.freepik.com/free-vector/special-offer-sale-discount-banner_180786-46.jpg",
        backgroundColor: "from-orange-500 to-orange-600"
    },
    {
        id: 6,
        title: "Midnight Sale",
        discount: "30% + Extra 10%",
        code: "MIDNIGHT",
        validUntil: "2025-02-05",
        image: "https://img.freepik.com/free-vector/gradient-flash-sale-background_23-2149027975.jpg",
        backgroundColor: "from-indigo-500 to-indigo-600"
    },
    {
        id: 7,
        title: "Premium Member",
        discount: "Extra 15% OFF",
        code: "PREMIUM15",
        validUntil: "2025-03-15",
        image: "https://img.freepik.com/free-vector/gradient-premium-background_23-2149339717.jpg",
        backgroundColor: "from-yellow-500 to-yellow-600"
    },
    {
        id: 8,
        title: "Clearance Sale",
        discount: "Up to 70% OFF",
        code: "CLEAR70",
        validUntil: "2025-02-20",
        image: "https://img.freepik.com/free-vector/sale-banner-template_23-2148935716.jpg",
        backgroundColor: "from-red-500 to-red-600"
    }
];

// Add seasonal promotions
const seasonalPromotions = [
    {
        id: "spring1",
        title: "Spring Collection",
        discount: "New Arrivals",
        image: "https://img.freepik.com/free-vector/spring-sale-instagram-post_23-2148849921.jpg",
        backgroundColor: "from-green-400 to-green-500"
    },
    {
        id: "summer1",
        title: "Summer Essentials",
        discount: "Starting ₹499",
        image: "https://img.freepik.com/free-vector/summer-sale-background_23-2148523022.jpg",
        backgroundColor: "from-yellow-400 to-yellow-500"
    }
];

// Add bank offers
const bankOffers = [
    {
        id: "bank1",
        bank: "HDFC Bank",
        offer: "10% Instant Discount",
        minPurchase: "1000",
        maxDiscount: "2500",
        validUntil: "2025-03-31",
        cardTypes: ["Credit Card", "Debit Card"],
        image: "https://1000logos.net/wp-content/uploads/2021/06/HDFC-Bank-logo.png",
        backgroundColor: "from-blue-500 to-blue-600"
    },
    {
        id: "bank2",
        bank: "ICICI Bank",
        offer: "No Cost EMI",
        minPurchase: "3000",
        tenure: ["3 months", "6 months"],
        validUntil: "2025-03-31",
        cardTypes: ["Credit Card"],
        image: "https://companieslogo.com/img/orig/IBN-af38b5c0.png?t=1648383607",
        backgroundColor: "from-orange-500 to-orange-600"
    },
    {
        id: "bank3",
        bank: "SBI Card",
        offer: "5% Cashback",
        minPurchase: "2000",
        maxCashback: "1000",
        validUntil: "2025-03-31",
        cardTypes: ["Credit Card"],
        image: "https://www.sbicard.com/sbi-card-en/assets/media/images/personal/credit-cards/sbi-card-elite/elite-card-banner-image.png",
        backgroundColor: "from-purple-500 to-purple-600"
    },
    {
        id: "bank4",
        bank: "Axis Bank",
        offer: "15% Discount on EMI",
        minPurchase: "5000",
        maxDiscount: "3000",
        validUntil: "2025-03-31",
        cardTypes: ["Credit Card"],
        image: "https://logos-download.com/wp-content/uploads/2016/06/Axis_Bank_logo_logotype.png",
        backgroundColor: "from-red-500 to-red-600"
    },
    {
        id: "bank5",
        bank: "Kotak Bank",
        offer: "Extra 8% Off",
        minPurchase: "1500",
        maxDiscount: "2000",
        validUntil: "2025-03-31",
        cardTypes: ["All Cards"],
        image: "https://www.kotak.com/content/dam/Kotak/kotak-bank-logo.jpg",
        backgroundColor: "from-red-500 to-red-600"
    }
];

// Notification data
const notifications = [
    {
        id: 1,
        type: 'order',
        title: 'Order Delivered',
        message: 'Your order #1234 has been delivered successfully',
        timestamp: new Date(2025, 0, 14, 8, 30).getTime(),
        isRead: false,
        icon: 'fa-box-check',
        color: 'green'
    },
    {
        id: 2,
        type: 'promo',
        title: 'Special Offer',
        message: 'Get 50% off on all winter collection items!',
        timestamp: new Date(2025, 0, 14, 7, 15).getTime(),
        isRead: false,
        icon: 'fa-tag',
        color: 'orange'
    },
    {
        id: 3,
        type: 'news',
        title: 'New Collection Arrived',
        message: 'Check out our latest spring collection',
        timestamp: new Date(2025, 0, 13, 18, 45).getTime(),
        isRead: true,
        icon: 'fa-tshirt',
        color: 'blue'
    },
    {
        id: 4,
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully',
        timestamp: new Date(2025, 0, 13, 15, 20).getTime(),
        isRead: true,
        icon: 'fa-user-check',
        color: 'purple'
    }
];

// Function to assign MongoDB product data to products array
async function assignMongoProducts(mongoProducts) {
    products = mongoProducts.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description,
        image: product.image,
        stock: product.stock || 0,
        rating: product.rating || 0,
        reviews: product.reviews || [],
        specifications: product.specifications || {},
        additionalInfo: product.additionalInfo || {},
        status: product.status,
        vendor: product.vendor,
        ...product // Spread operator to include any additional fields
    }));
    return products;
}

// Function to fetch products from MongoDB
async function fetchMongoProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        return await assignMongoProducts(data.products);
    } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to sample data if fetch fails
        products = [
            {
                _id: "1",
                name: "AirPods Pro",
                price: 24999,
                category: "Electronics",
                rating: 4.8,
                image: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95&.v=1660803972361",
                description: "Experience immersive sound with active noise cancellation.",
                specifications: {
                    "Noise Cancellation": "Active",
                    "Mode": "Transparency",
                    "Audio": "Spatial"
                },
                reviews: [
                    { user: "John", rating: 5, comment: "Great product!" }
                ],
                stock: 10
            },
            {
                _id: "2",
                name: "MacBook Air",
                price: 99999,
                category: "Electronics",
                rating: 4.9,
                image: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-space-gray-select-201810?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1633027804000",
                description: "Supercharged by M2 chip. The world's thinnest laptop.",
                specifications: {
                    "Chip": "M2",
                    "Display": "13.6-inch Liquid Retina",
                    "RAM": "8GB"
                },
                reviews: [
                    { user: "Sarah", rating: 5, comment: "Amazing laptop!" }
                ],
                stock: 5
            }
        ];
        return products;
    }
}

// Export for use in other files
window.products = products;
window.fetchMongoProducts = fetchMongoProducts;
window.assignMongoProducts = assignMongoProducts;
