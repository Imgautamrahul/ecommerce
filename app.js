// Theme Switcher
function initTheme() {
    const themeSwitch = document.getElementById('themeSwitch');
    if (!themeSwitch) return;
    
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }

    // Handle theme switch
    themeSwitch.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

// State management
let currentPage = 'home';
let cart = [];
let searchHistory = [];
let wishlist = [];
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let deliveryOption = 'standard';
let searchTerm = '';

// DOM Elements
const app = document.getElementById('app');

// Router
function navigate(page, data = null) {
    // Add animation class
    app.classList.add('fade-out');
    
    setTimeout(() => {
        currentPage = page;
        if (data) {
            selectedProduct = data;
            selectedColor = data.colors[0];
            selectedSize = data.sizes ? data.sizes[0] : null;
        }
        renderApp();
        app.classList.remove('fade-out');
    }, 150);
}

// Render Functions
function renderApp() {
    switch(currentPage) {
        case 'home':
            renderHome();
            break;
        case 'search':
            renderSearch();
            break;
        case 'cart':
            renderCart();
            break;
        case 'profile':
            if (!authState.isAuthenticated) {
                navigate('login');
                return;
            }
            renderProfile();
            break;
        case 'notifications':
            renderNotifications();
            break;
        case 'login':
            app.innerHTML = renderLogin();
            break;
        case 'signup':
            app.innerHTML = renderSignup();
            break;
        case 'product':
            renderProductDetail();
            break;
        case 'wishlist':
            renderWishlist();
            break;
        case 'delivery':
            renderDelivery();
            break;
        default:
            renderHome();
    }
    renderBottomNav();
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function renderNotifications() {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">Notifications</h1>
                    ${unreadCount > 0 ? `
                        <button onclick="markAllAsRead()" class="text-green-600 text-sm font-medium">
                            Mark all as read
                        </button>
                    ` : ''}
                </div>
            </div>

            <!-- Notification List -->
            <div class="divide-y divide-gray-200">
                ${notifications.length > 0 ? notifications.map(notification => `
                    <div class="p-4 bg-white ${!notification.isRead ? 'bg-green-50' : ''} transition-colors duration-200">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                     style="background-color: ${getNotificationColor(notification.color)}">
                                    <i class="fas ${notification.icon}"></i>
                                </div>
                            </div>
                            <div class="ml-4 flex-1">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-sm font-semibold text-gray-900">
                                        ${notification.title}
                                    </h3>
                                    <p class="text-xs text-gray-500">
                                        ${formatTimestamp(notification.timestamp)}
                                    </p>
                                </div>
                                <p class="mt-1 text-sm text-gray-600">
                                    ${notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="flex flex-col items-center justify-center p-8">
                        <i class="fas fa-bell-slash text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No notifications yet</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function getNotificationColor(color) {
    const colors = {
        'green': '#4CAF50',
        'orange': '#FF9800',
        'blue': '#2196F3',
        'purple': '#9C27B0',
        'red': '#F44336'
    };
    return colors[color] || colors.blue;
}

function markAllAsRead() {
    notifications.forEach(notification => {
        notification.isRead = true;
    });
    renderNotifications();
    showToast('All notifications marked as read');
}

// Function to fetch all products (both admin and vendor)
async function fetchAllProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Modified renderHome function
async function renderHome() {
    try {
        // Fetch products from MongoDB
        const loadedProducts = await fetchMongoProducts();
        
        // Map products to the expected format
        const formattedProducts = loadedProducts.map(p => ({
            ...p,
            rating: p.rating || 0,
            reviews: p.reviews || [],
            specifications: p.specifications || {},
            additionalInfo: p.additionalInfo || {},
            available: p.stock > 0
        }));

        app.innerHTML = `
            <div class="pb-16">
                <!-- Top Background Image -->
                <div class="top-background"></div>

                <div class="content-container pb-16">
                    <!-- Header -->
                    <div class="bg-white sticky top-0 z-10 shadow-sm">
                        <div class="flex items-center justify-between p-4">
                            <h1 class="text-xl font-bold">Home</h1>
                            <div class="flex items-center gap-4">
                                <!-- Profile Button -->
                                <button onclick="openProfile()" class="relative">
                                    <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                                        <i class="fas fa-user text-gray-600"></i>
                                    </div>
                                </button>
                                <!-- Theme Toggle Switch -->
                                <div class="theme-switch-wrapper">
                                    <i class="fas fa-sun"></i>
                                    <label class="theme-switch">
                                        <input type="checkbox" id="themeSwitch" onchange="handleThemeChange(this)">
                                        <span class="slider"></span>
                                    </label>
                                    <i class="fas fa-moon"></i>
                                </div>
                                <button onclick="navigate('wishlist')" class="relative">
                                    <i class="fas fa-heart text-gray-600"></i>
                                    ${wishlist.length > 0 ? `
                                        <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    ` : ''}
                                </button>
                                <button onclick="navigate('notifications')" class="relative">
                                    <i class="fas fa-bell text-gray-600"></i>
                                    ${notifications.some(n => !n.isRead) ? `
                                        <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    ` : ''}
                                </button>
                                <button onclick="navigate('cart')" class="relative">
                                    <i class="fas fa-shopping-cart text-gray-600"></i>
                                    ${cart.length > 0 ? `
                                        <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    ` : ''}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Secondary Navigation -->
                    <div class="bg-gray-800">
                        <button class="nav-scroll-button nav-scroll-left" onclick="scrollNavLeft()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="nav-container" id="navContainer">
                            <div class="nav-buttons">
                                <button class="nav-button" onclick="navigate('all')">
                                    <i class="fas fa-bars mr-2"></i>All
                                </button>
                                <button class="nav-button" onclick="navigate('deals')">Today's Deals</button>
                                <button class="nav-button" onclick="navigate('customer-service')">Customer Service</button>
                                <button class="nav-button" onclick="navigate('registry')">Registry</button>
                                <button class="nav-button" onclick="navigate('gift-cards')">Gift Cards</button>
                                <button class="nav-button" onclick="navigate('sell')">Sell</button>
                                <button class="nav-button" onclick="navigate('electronics')">Electronics</button>
                                <button class="nav-button" onclick="navigate('fashion')">Fashion</button>
                                <button class="nav-button" onclick="navigate('home-kitchen')">Home & Kitchen</button>
                                <button class="nav-button" onclick="navigate('books')">Books</button>
                                <button class="nav-button" onclick="navigate('computers')">Computers</button>
                                <button class="nav-button" onclick="navigate('toys')">Toys & Games</button>
                                <button class="nav-button" onclick="navigate('beauty')">Beauty & Personal Care</button>
                                <button class="nav-button" onclick="navigate('sports')">Sports & Fitness</button>
                                <button class="nav-button" onclick="navigate('automotive')">Automotive</button>
                                <button class="nav-button" onclick="navigate('health')">Health & Household</button>
                            </div>
                        </div>
                        <button class="nav-scroll-button nav-scroll-right" onclick="scrollNavRight()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    <!-- Prime Day Banner (optional) -->
                    <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 text-center">
                        <p class="text-sm font-medium">
                            <i class="fas fa-bolt mr-2"></i>
                            Flash Deals | Up to 70% off on premium brands
                            <a href="#" class="underline ml-2">Shop Now</a>
                        </p>
                    </div>

                    <!-- Search Bar -->
                    <div class="p-4">
                        <div class="relative" onclick="navigate('search')">
                            <input type="text" 
                                   placeholder="Search products..." 
                                   class="w-full p-3 rounded-lg bg-white shadow-md focus:outline-none"
                                   readonly>
                            <span class="absolute right-4 top-3">
                                <i class="fas fa-search text-gray-400"></i>
                            </span>
                        </div>
                    </div>

                    <!-- Promotions Carousel -->
                    <div class="px-4 mb-6">
                        <h2 class="offers-title mb-4">Special Offers</h2>
                        <div class="scroll-container">
                            <div class="scroll-wrapper">
                                ${[...promotions, ...promotions].map(promo => `
                                    <div class="flex-shrink-0 w-[300px] h-[160px] rounded-lg overflow-hidden relative bg-gradient-to-r ${promo.backgroundColor}">
                                        <div class="absolute inset-0 bg-black bg-opacity-20"></div>
                                        <div class="relative p-6 flex flex-col justify-between h-full">
                                            <div>
                                                <h3 class="text-white text-xl font-bold mb-2">${promo.title}</h3>
                                                <p class="text-white text-3xl font-bold mb-2">${promo.discount}</p>
                                            </div>
                                            <div class="flex justify-between items-center">
                                                <div>
                                                    <span class="text-white text-sm">Use code:</span>
                                                    <span class="text-white font-bold">${promo.code}</span>
                                                </div>
                                                <button onclick="copyPromoCode('${promo.code}')" 
                                                        class="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors">
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Bank Offers -->
                    <div class="px-4 mb-6">
                        <h2 class="offers-title mb-4">Bank Offers</h2>
                        <div class="scroll-container">
                            <div class="scroll-wrapper">
                                ${[...bankOffers, ...bankOffers].map(offer => `
                                    <div class="flex-shrink-0 w-[300px] rounded-lg overflow-hidden relative bg-gradient-to-r ${offer.backgroundColor}">
                                        <div class="relative p-6">
                                            <div class="flex items-center mb-3">
                                                <div class="w-12 h-12 bg-white rounded-lg p-2 mr-3">
                                                    <img src="${offer.image}" alt="${offer.bank}" class="w-full h-full object-contain">
                                                </div>
                                                <h3 class="text-white font-semibold">${offer.bank}</h3>
                                            </div>
                                            <p class="text-xl font-bold text-white mb-2">${offer.offer}</p>
                                            <div class="flex justify-between items-end">
                                                <div>
                                                    <p class="text-white text-sm opacity-90">Min. Purchase: ₹${offer.minPurchase}</p>
                                                    <p class="text-white text-xs opacity-75 mt-1">Valid till ${new Date(offer.validUntil).toLocaleDateString()}</p>
                                                </div>
                                                <button class="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors">
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Categories -->
                    <div class="category-section">
                        <div class="category-container px-4 mb-6">
                            <!-- Categories will be loaded dynamically -->
                        </div>
                    </div>

                    <!-- Products Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 mb-20">
                        ${formattedProducts.map(product => `
                            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" 
                                 onclick="showProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                                <div class="relative">
                                    <img src="${product.image}" 
                                         alt="${product.name}" 
                                         class="w-full h-48 sm:h-40 object-contain p-4">
                                    <button onclick="event.stopPropagation(); toggleWishlist('${product._id}')" 
                                            class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">
                                        <i class="fas fa-heart ${wishlist.includes(product._id) ? 'text-red-500' : 'text-gray-300'}"></i>
                                    </button>
                                </div>
                                <div class="p-4">
                                    <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                                    <div class="flex items-center mb-2">
                                        <div class="flex items-center">
                                            <span class="text-sm font-bold mr-1">${product.rating}</span>
                                            <i class="fas fa-star text-yellow-400 text-sm"></i>
                                        </div>
                                        <span class="text-gray-500 text-sm ml-2">${product.reviews ? product.reviews.length : 0} reviews</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-xl font-bold">₹${product.price}</span>
                                        <button onclick="event.stopPropagation(); addToCart('${product._id}')" 
                                                class="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600 transition-colors">
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Footer -->
                    <footer class="text-white mt-16">
                        <!-- Back to top button -->
                        <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" 
                                class="w-full bg-[#37475A] hover:bg-[#485769] py-3.5 text-sm text-center">
                            Back to top
                        </button>

                        <!-- Main Footer Content -->
                        <div class="bg-[#232F3E]">
                            <div class="container mx-auto py-8">
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                                    <div>
                                        <h3 class="font-bold mb-3">Get to Know Us</h3>
                                        <ul class="space-y-2 text-[14px] text-[#DDD]">
                                            <li><a href="#" class="hover:underline">About Us</a></li>
                                            <li><a href="#" class="hover:underline">Careers</a></li>
                                            <li><a href="#" class="hover:underline">Press Releases</a></li>
                                            <li><a href="#" class="hover:underline">Our Science</a></li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 class="font-bold mb-3">Connect with Us</h3>
                                        <ul class="space-y-2 text-[14px] text-[#DDD]">
                                            <li><a href="#" class="hover:underline">Facebook</a></li>
                                            <li><a href="#" class="hover:underline">Twitter</a></li>
                                            <li><a href="#" class="hover:underline">Instagram</a></li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 class="font-bold mb-3">Make Money with Us</h3>
                                        <ul class="space-y-2 text-[14px] text-[#DDD]">
                                            <li><a href="#" class="hover:underline">Sell on Shop</a></li>
                                            <li><a href="#" class="hover:underline">Sell under Shop Accelerator</a></li>
                                            <li><a href="#" class="hover:underline">Protect and Build Your Brand</a></li>
                                            <li><a href="#" class="hover:underline">Global Selling</a></li>
                                            <li><a href="#" class="hover:underline">Become an Affiliate</a></li>
                                            <li><a href="#" class="hover:underline">Fulfilment by Shop</a></li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 class="font-bold mb-3">Let Us Help You</h3>
                                        <ul class="space-y-2 text-[14px] text-[#DDD]">
                                            <li><a href="#" class="hover:underline">COVID-19 and Shop</a></li>
                                            <li><a href="#" class="hover:underline">Your Account</a></li>
                                            <li><a href="#" class="hover:underline">Returns Centre</a></li>
                                            <li><a href="#" class="hover:underline">100% Purchase Protection</a></li>
                                            <li><a href="#" class="hover:underline">Help</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Language and Region Selection -->
                        <div class="bg-[#232F3E] border-t border-[#3a4553] pt-8 pb-4">
                            <div class="container mx-auto px-4">
                                <div class="flex flex-wrap justify-center gap-4">
                                    <button class="border border-[#848688] rounded px-3 py-2 text-sm hover:border-white">
                                        <i class="fas fa-globe mr-2"></i>English
                                    </button>
                                    <button class="border border-[#848688] rounded px-3 py-2 text-sm hover:border-white">
                                        <i class="fas fa-rupee-sign mr-2"></i>INR - Indian Rupee
                                    </button>
                                    <button class="border border-[#848688] rounded px-3 py-2 text-sm hover:border-white">
                                        <i class="fas fa-map-marker-alt mr-2"></i>India
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Footer -->
                        <div class="bg-[#131A22] py-8">
                            <div class="container mx-auto px-4">
                                <!-- Services Grid -->
                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 max-w-6xl mx-auto text-center mb-6">
                                    <a href="#" class="text-[#DDD] hover:underline">
                                        <p class="text-[11px]">
                                            <span class="font-bold block mb-1">AbeBooks</span>
                                            <span class="text-[#999]">Books, art<br/>& collectibles</span>
                                        </p>
                                    </a>
                                    <a href="#" class="text-[#DDD] hover:underline">
                                        <p class="text-[11px]">
                                            <span class="font-bold block mb-1">Shopbop</span>
                                            <span class="text-[#999]">Designer<br/>Fashion Brands</span>
                                        </p>
                                    </a>
                                    <!-- Add more service links as needed -->
                                </div>

                                <!-- Copyright -->
                                <div class="text-center text-[12px] text-[#DDD] space-y-2">
                                    <div class="flex flex-wrap justify-center gap-4 text-[11px]">
                                        <a href="#" class="hover:underline">Conditions of Use & Sale</a>
                                        <a href="#" class="hover:underline">Privacy Notice</a>
                                        <a href="#" class="hover:underline">Interest-Based Ads</a>
                                    </div>
                                    <p class="text-[#999]">© 1996-${new Date().getFullYear()}, Shop.com, Inc. or its affiliates</p>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>

                ${renderBottomNav()}
            </div>

            ${renderBottomNav()}
        `;
    } catch (error) {
        console.error('Error rendering home:', error);
        showToast('Failed to load products');
    }
    
    // Initialize theme after rendering
    initTheme();
}

function renderProductDetail() {
    if (!selectedProduct) return navigate('home');

    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">${selectedProduct.name}</h1>
                    <button onclick="shareProduct(${selectedProduct.id})" class="ml-4">
                        <i class="fas fa-share-alt text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Images -->
            <div class="bg-white mb-4">
                <div class="relative">
                    <img src="${selectedProduct.image}" 
                         alt="${selectedProduct.name}" 
                         class="w-full h-48 sm:h-72 object-contain p-4">
                    <button onclick="toggleWishlist(${selectedProduct.id})" 
                            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <i class="fas fa-heart ${wishlist.includes(selectedProduct.id) ? 'text-red-500' : 'text-gray-300'} text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Info -->
            <div class="bg-white p-4 mb-4">
                <div class="flex flex-col sm:flex-row justify-between items-start mb-4">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">${selectedProduct.name}</h2>
                        <div class="flex items-center">
                            <div class="flex items-center mr-4">
                                <span class="text-xl font-bold mr-2">${selectedProduct.rating}</span>
                                <i class="fas fa-star text-yellow-400"></i>
                            </div>
                            <span class="text-gray-500">${selectedProduct.reviews.length} reviews</span>
                        </div>
                    </div>
                    <div class="text-3xl font-bold text-green-500">₹${selectedProduct.price}</div>
                </div>

                <!-- Color Selection -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Select Color</h3>
                    <div class="flex flex-wrap gap-3">
                        ${selectedProduct.colors.map(color => `
                            <button onclick="selectColor('${color}')" 
                                    class="w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                                        selectedColor === color ? 'border-green-500' : 'border-gray-200'
                                    }">
                                <div class="w-8 h-8 rounded-full" 
                                     style="background-color: ${color.toLowerCase()}"></div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Size Selection (if applicable) -->
                ${selectedProduct.sizes ? `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Select Size</h3>
                        <div class="flex flex-wrap gap-3">
                            ${selectedProduct.sizes.map(size => `
                                <button onclick="selectSize('${size}')"
                                        class="w-14 h-14 rounded-lg border-2 flex items-center justify-center ${
                                            selectedSize === size ? 'border-green-500 bg-green-50' : 'border-gray-200'
                                        }">
                                    ${size}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Quantity Picker -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Quantity</h3>
                    <div class="flex items-center space-x-4">
                        <button onclick="updateQuantity(selectedProduct.id, Math.max(1, (selectedProduct.quantity || 1) - 1))"
                                class="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="text-xl font-semibold">${selectedProduct.quantity || 1}</span>
                        <button onclick="updateQuantity(selectedProduct.id, (selectedProduct.quantity || 1) + 1)"
                                class="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>

                <!-- Product Description -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Description</h3>
                    <p class="text-gray-600">${selectedProduct.description}</p>
                </div>

                <!-- Specifications -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Specifications</h3>
                    <ul class="space-y-2">
                        ${selectedProduct.specifications.map(spec => `
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-2"></i>
                                ${spec}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Additional Information -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Additional Information</h3>
                    <ul class="space-y-2">
                        ${Object.entries(selectedProduct.additionalInfo).map(([key, value]) => `
                            <li class="flex items-center gap-2">
                                <i class="fas fa-check text-green-500"></i>
                                <span class="font-medium">${key.replace(/_/g, ' ')}:</span> ${value}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Reviews Section -->
                ${selectedProduct.reviews && selectedProduct.reviews.length > 0 ? `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Customer Reviews</h3>
                        <div class="space-y-4">
                            ${selectedProduct.reviews.map(review => `
                                <div class="border-b pb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <i class="fas fa-user text-gray-500"></i>
                                            </div>
                                            <span class="font-medium">${review.user?.name || 'Anonymous'}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-yellow-400 mr-1">${review.rating}</span>
                                            <i class="fas fa-star text-yellow-400"></i>
                                        </div>
                                    </div>
                                    <p class="text-gray-600">${review.comment}</p>
                                    <span class="text-sm text-gray-500">${new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg flex space-x-4">
                    <button onclick="addToCart(selectedProduct.id)" 
                            class="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center">
                        <i class="fas fa-cart-plus mr-2"></i>
                        Add to Cart
                    </button>
                    <button onclick="buyNow(selectedProduct.id)"
                            class="flex-1 bg-black text-white py-3 rounded-lg font-semibold">
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

function quickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const quickViewHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div class="p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">${product.name}</h3>
                        <button onclick="closeQuickView()" class="text-gray-500">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <img src="${product.image}" 
                         alt="${product.name}" 
                         class="w-full h-48 sm:h-64 object-contain mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-2xl font-bold">₹${product.price}</div>
                        <div class="flex items-center">
                            <span class="mr-1">${product.rating}</span>
                            <i class="fas fa-star text-yellow-400"></i>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-4">${product.description}</p>
                    <div class="flex space-x-4">
                        <button onclick="addToCart(${product.id}); closeQuickView()" 
                                class="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center">
                            <i class="fas fa-cart-plus mr-2"></i>
                            Add to Cart
                        </button>
                        <button onclick="navigate('product', ${JSON.stringify(product)}); closeQuickView()" 
                                class="flex-1 bg-black text-white py-3 rounded-lg font-semibold">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const quickViewElement = document.createElement('div');
    quickViewElement.id = 'quickView';
    quickViewElement.innerHTML = quickViewHtml;
    document.body.appendChild(quickViewElement);
}

function closeQuickView() {
    const quickView = document.getElementById('quickView');
    if (quickView) {
        quickView.remove();
    }
}

function renderWishlist() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">Wishlist</h1>
                </div>
            </div>

            ${wishlist.length === 0 ? `
                <div class="flex flex-col items-center justify-center p-8">
                    <i class="fas fa-heart text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Your wishlist is empty</p>
                    <button onclick="navigate('home')" 
                            class="mt-4 text-green-500 font-semibold">
                        Continue Shopping
                    </button>
                </div>
            ` : `
                <div class="grid grid-cols-2 gap-4 p-4">
                    ${products.filter(p => wishlist.includes(p.id)).map(product => `
                        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" 
                             onclick="navigate('product', ${JSON.stringify(product)})">
                            <div class="relative">
                                <img src="${product.image}" 
                                     alt="${product.name}" 
                                     class="w-full h-40 object-contain p-4">
                                <button onclick="event.stopPropagation(); toggleWishlist(${product.id})" 
                                        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                    <i class="fas fa-heart text-red-500"></i>
                                </button>
                            </div>
                            <div class="p-4">
                                <h3 class="font-medium mb-1 truncate">${product.name}</h3>
                                <div class="text-xl font-bold">₹${product.price}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>

        ${renderBottomNav()}
    `;
}

function renderBottomNav() {
    return `
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 bottom-nav">
            <div class="flex justify-around py-2">
                <button onclick="navigate('home')" 
                        class="ripple flex flex-col items-center p-2 ${currentPage === 'home' ? 'text-green-500' : 'text-gray-500'}">
                    <i class="fas fa-home text-xl mb-1"></i>
                    <span class="text-xs">Home</span>
                </button>
                <button onclick="navigate('search')" 
                        class="ripple flex flex-col items-center p-2 ${currentPage === 'search' ? 'text-green-500' : 'text-gray-500'}">
                    <i class="fas fa-search text-xl mb-1"></i>
                    <span class="text-xs">Search</span>
                </button>
                <button onclick="navigate('cart')" 
                        class="ripple flex flex-col items-center p-2 ${currentPage === 'cart' ? 'text-green-500' : 'text-gray-500'} relative">
                    <i class="fas fa-shopping-cart text-xl mb-1"></i>
                    ${cart.length > 0 ? `
                        <span class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                            ${cart.length}
                        </span>
                    ` : ''}
                    <span class="text-xs">Cart</span>
                </button>
                <button onclick="navigate('profile')" 
                        class="ripple flex flex-col items-center p-2 ${currentPage === 'profile' ? 'text-green-500' : 'text-gray-500'}">
                    <i class="fas fa-user text-xl mb-1"></i>
                    <span class="text-xs">Profile</span>
                </button>
            </div>
        </nav>
    `;
}

function renderDelivery() {
    const total = calculateSubtotal();
    const deliveryFee = deliveryOption === 'express' ? 50 : 0;
    const finalTotal = total + deliveryFee;

    // Get the product from cart (should be only one in case of Buy Now)
    const cartItem = cart[0];
    const product = cartItem?.product;

    if (!product) {
        navigate('home');
        showToast('No product selected');
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('cart')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">Delivery Details</h1>
                </div>
                <!-- Progress Steps -->
                <div class="flex justify-between px-8 py-4 border-t">
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mb-1">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <span class="text-xs text-green-500">Cart</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <div class="h-1 w-full bg-green-500"></div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mb-1">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <span class="text-xs text-green-500">Delivery</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <div class="h-1 w-full bg-gray-300"></div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center mb-1">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="text-xs text-gray-500">Complete</span>
                    </div>
                </div>
            </div>

            <!-- Product Summary -->
            <div class="bg-white p-4 mb-4">
                <h2 class="text-lg font-semibold mb-4">Order Summary</h2>
                <div class="flex items-center space-x-4">
                    <img src="${product.image}" alt="${product.name}" class="w-20 h-20 object-contain">
                    <div>
                        <h3 class="font-medium">${product.name}</h3>
                        <p class="text-gray-500">Quantity: ${cartItem.quantity}</p>
                        <p class="text-green-600 font-semibold">₹${product.price}</p>
                    </div>
                </div>
            </div>

            <!-- Delivery Form -->
            <form id="deliveryForm" class="p-4 space-y-6" onsubmit="event.preventDefault(); placeOrder();">
                <!-- Contact Information -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Contact Information</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                            <input type="text" id="fullName" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter your full name">
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                            <input type="tel" id="phone" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter your phone number">
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                            <input type="email" id="email" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter your email">
                        </div>
                    </div>
                </div>

                <!-- Delivery Address -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Delivery Address</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Street Address</label>
                            <input type="text" id="address" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter street address">
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">City</label>
                                <input type="text" id="city" required
                                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                       placeholder="Enter city">
                            </div>
                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">Postal Code</label>
                                <input type="text" id="postalCode" required
                                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                       placeholder="Enter postal code">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">State</label>
                            <input type="text" id="state" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter state">
                        </div>
                    </div>
                </div>

                <!-- Delivery Options -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Delivery Options</h2>
                    <div class="space-y-3">
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="deliveryOption" value="standard" 
                                   ${deliveryOption === 'standard' ? 'checked' : ''}
                                   onchange="updateDeliveryOption('standard')"
                                   class="w-4 h-4 text-green-500">
                            <div class="ml-3 flex-1">
                                <div class="font-medium">Standard Delivery</div>
                                <div class="text-sm text-gray-500">3-5 business days</div>
                            </div>
                            <div class="font-medium text-green-500">Free</div>
                        </label>
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="deliveryOption" value="express"
                                   ${deliveryOption === 'express' ? 'checked' : ''}
                                   onchange="updateDeliveryOption('express')"
                                   class="w-4 h-4 text-green-500">
                            <div class="ml-3 flex-1">
                                <div class="font-medium">Express Delivery</div>
                                <div class="text-sm text-gray-500">1-2 business days</div>
                            </div>
                            <div class="font-medium text-green-500">₹50</div>
                        </label>
                    </div>
                </div>

                <!-- Order Summary -->
                <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-gray-600">Total Amount</div>
                        <div class="text-xl font-bold">₹${finalTotal}</div>
                    </div>
                    <button type="submit"
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center">
                        <i class="fas fa-lock mr-2"></i>
                        Place Order
                    </button>
                </div>
            </form>
        </div>

        <!-- Success Modal -->
        <div id="successModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
            <div class="bg-white rounded-lg p-6 w-[90%] max-w-md">
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-3xl text-green-500 success-checkmark"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Order Placed Successfully!</h3>
                    <p class="text-gray-600 mb-6">Thank you for your order. We'll send you a confirmation email shortly.</p>
                    <button onclick="navigate('home')" 
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold">
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateDeliveryOption(option) {
    deliveryOption = option;
    renderDelivery();
}

function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    navigate('delivery');
}

function placeOrder() {
    const form = document.getElementById('deliveryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect form data
    const formData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postalCode').value,
        deliveryOption: deliveryOption,
        total: calculateSubtotal() + (deliveryOption === 'express' ? 50 : 0),
        items: cart // Include cart items in order details
    };

    // Store order details if needed
    localStorage.setItem('lastOrder', JSON.stringify(formData));

    // Show success modal
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('hidden');
    }

    // Clear cart
    cart = [];
    saveCart();
    
    // After 3 seconds, redirect to home
    setTimeout(() => {
        if (successModal) {
            successModal.classList.add('hidden');
        }
        navigate('home');
    }, 3000);
}

function renderSearch() {
    const randomTags = getRandomTrendingTags();
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <div class="flex-1 relative">
                        <input type="text" 
                               placeholder="Search products..." 
                               class="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                               oninput="setSearchTerm(this.value)"
                               value="${searchTerm || ''}">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
            </div>

            <!-- Trending Tags -->
            <div class="p-4">
                <div class="mb-4">
                    <h2 class="text-lg font-semibold text-gray-800 mb-3">Trending Now</h2>
                    <div class="flex flex-wrap gap-2">
                        ${randomTags.map(tag => `
                            <button onclick="setSearchTerm('${tag.name}')"
                                    class="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-green-50 hover:border-green-500 hover:text-green-600 transition-colors duration-200">
                                <i class="fas fa-trending-up text-green-500 mr-1"></i>
                                ${tag.name}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Search History -->
                ${searchHistory.length > 0 ? `
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-lg font-semibold text-gray-800">Recent Searches</h2>
                            <button onclick="clearSearchHistory()" 
                                    class="text-sm text-green-600 hover:text-green-700">
                                Clear All
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${searchHistory.map(term => `
                                <button onclick="setSearchTerm('${term}')"
                                        class="w-full p-3 bg-white rounded-lg flex items-center text-gray-700 hover:bg-gray-50">
                                    <i class="fas fa-history text-gray-400 mr-3"></i>
                                    ${term}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Search Results -->
            ${searchTerm ? `
                <div class="p-4 grid grid-cols-2 gap-4">
                    ${products
                        .filter(product => 
                            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(product => `
                            <div class="bg-white rounded-lg shadow overflow-hidden">
                                <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-cover">
                                <div class="p-3">
                                    <h3 class="font-semibold text-gray-800 truncate">${product.name}</h3>
                                    <p class="text-green-600 font-bold mt-1">$${product.price}</p>
                                </div>
                            </div>
                        `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function getRandomTrendingTags(count = 6) {
    return trendingTags
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
}

function setSearchTerm(term) {
    searchTerm = term;
    renderApp();
}

function clearSearchHistory() {
    searchHistory = [];
    renderApp();
}

function renderCart() {
    const total = cart.reduce((sum, item) => sum + (products.find(p => p.id === item.id).price * item.quantity), 0);
    
    app.innerHTML = `
        <div class="pb-32">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">Shopping Cart (${cart.length})</h1>
                </div>
            </div>

            ${cart.length === 0 ? `
                <div class="flex flex-col items-center justify-center p-8">
                    <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">Your cart is empty</p>
                    <button onclick="navigate('home')" 
                            class="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold">
                        Start Shopping
                    </button>
                </div>
            ` : `
                <!-- Cart Items -->
                <div class="space-y-4 p-4">
                    ${cart.map(item => {
                        const product = products.find(p => p.id === item.id);
                        if (!product) return '';
                        return `
                            <div class="bg-white rounded-lg shadow-md p-4">
                                <div class="flex items-center">
                                    <img src="${product.image}" 
                                         alt="${product.name}" 
                                         class="w-20 h-20 object-contain mr-4">
                                    <div class="flex-1">
                                        <h3 class="font-medium mb-1">${product.name}</h3>
                                        <div class="text-gray-500 mb-2">
                                            ${item.color ? `Color: ${item.color}` : ''}
                                            ${item.size ? ` • Size: ${item.size}` : ''}
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <div class="text-xl font-bold">₹${product.price}</div>
                                            <div class="flex items-center space-x-3">
                                                <button onclick="updateQuantity(${product.id}, ${item.quantity - 1})"
                                                        class="w-8 h-8 rounded-full border-2 flex items-center justify-center ${item.quantity === 1 ? 'text-red-500 border-red-500' : ''}">
                                                    <i class="fas ${item.quantity === 1 ? 'fa-trash' : 'fa-minus'}"></i>
                                                </button>
                                                <span class="font-medium">${item.quantity}</span>
                                                <button onclick="updateQuantity(${product.id}, ${item.quantity + 1})"
                                                        class="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Order Summary -->
                <div class="bg-white p-4 mb-4">
                    <h3 class="text-lg font-semibold mb-4">Order Summary</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal</span>
                            <span class="font-medium">₹${calculateSubtotal()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Shipping</span>
                            <span class="font-medium">Free</span>
                        </div>
                        <div class="border-t pt-2 mt-2">
                            <div class="flex justify-between">
                                <span class="font-semibold">Total</span>
                                <span class="font-bold text-xl">₹${calculateSubtotal()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `}

            ${cart.length > 0 ? `
                <!-- Checkout Button -->
                <div class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
                    <button onclick="checkout()" 
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center">
                        <i class="fas fa-lock mr-2"></i>
                        Proceed to Checkout (₹${calculateSubtotal()})
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function calculateSubtotal() {
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function login() {
    authState.isAuthenticated = true;
    authState.currentUser = {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://via.placeholder.com/50',
        phone: '+1234567890',
        address: '123 Street, City, Country'
    };
    showToast('Logged in successfully');
    renderApp();
}

function logout() {
    authState.isAuthenticated = false;
    authState.currentUser = null;
    showToast('Logged out successfully');
    renderApp();
}

function renderProfile() {
    app.innerHTML = `
        <div class="bg-white min-h-screen">
            <div class="bg-green-600 p-6 text-white">
                <div class="flex items-center gap-4">
                    <img src="${authState.currentUser.avatar}" alt="Profile" 
                         class="w-20 h-20 rounded-full border-2 border-white">
                    <div>
                        <h2 class="text-xl font-bold">${authState.currentUser.name}</h2>
                        <p class="text-green-100">${authState.currentUser.email}</p>
                    </div>
                </div>
            </div>
            
            <div class="p-4 space-y-4">
                <div class="bg-white rounded-lg shadow">
                    <div class="p-4 border-b">
                        <h3 class="text-lg font-semibold">Account Settings</h3>
                    </div>
                    <div class="divide-y">
                        <button class="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-user-circle text-gray-400"></i>
                                <span>Edit Profile</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </button>
                        <button class="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-lock text-gray-400"></i>
                                <span>Change Password</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </button>
                        <button class="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-bell text-gray-400"></i>
                                <span>Notifications</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow">
                    <div class="p-4 border-b">
                        <h3 class="text-lg font-semibold">Orders & Wishlist</h3>
                    </div>
                    <div class="divide-y">
                        <button class="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-shopping-bag text-gray-400"></i>
                                <span>My Orders</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </button>
                        <button onclick="navigate('wishlist')" class="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-heart text-gray-400"></i>
                                <span>Wishlist</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </button>
                        <button class="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-map-marker-alt text-gray-400"></i>
                                <span>Saved Addresses</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                        </button>
                    </div>
                </div>

                <button onclick="logout()" 
                        class="w-full p-4 text-red-600 font-semibold flex items-center justify-center gap-2 bg-white rounded-lg shadow hover:bg-red-50">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    `;
}

// Utility Functions
function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index === -1) {
        wishlist.push(productId);
        showToast('Added to wishlist');
    } else {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    }
    renderApp();
}

function selectColor(color) {
    selectedColor = color;
    renderApp();
}

function selectSize(size) {
    selectedSize = size;
    renderApp();
}

function shareProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (navigator.share) {
        navigator.share({
            title: product.name,
            text: product.description,
            url: window.location.href
        });
    } else {
        showToast('Share feature not supported');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function buyNow(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) {
        showToast('Product not found');
        return;
    }

    // Clear existing cart and add only this product
    cart = [];
    cart.push({
        id: productId,
        quantity: 1,
        product: product
    });
    
    saveCart();
    navigate('delivery');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) {
        showToast('Product not found');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1,
            product: product
        });
    }

    saveCart();
    showToast('Added to cart');
    renderApp();
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    saveCart();
    renderApp();
}

function resetCart() {
    cart = [];
    renderApp();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Initialize cart from localStorage
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderApp();
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    
    // Enable pull-to-refresh
    let touchStart = 0;
    let touchEnd = 0;
    
    app.addEventListener('touchstart', e => {
        touchStart = e.touches[0].clientY;
    }, { passive: true });
    
    app.addEventListener('touchmove', e => {
        touchEnd = e.touches[0].clientY;
        
        if (app.scrollTop === 0 && touchEnd > touchStart && (touchEnd - touchStart) > 100) {
            showToast('Refreshing...');
            setTimeout(() => renderApp(), 1000);
        }
    }, { passive: true });
});

function renderLogin() {
    return `
        <div class="flex flex-col items-center justify-center p-8">
            <h2 class="text-2xl font-bold mb-4">Login</h2>
            <form class="space-y-4 w-full max-w-md">
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                    <input type="email" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your email">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                    <input type="password" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your password">
                </div>
                <button class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold">
                    Login
                </button>
            </form>
            <p class="text-gray-500 text-center mt-4">
                Don't have an account? <button onclick="navigate('signup')" class="text-green-500">Signup</button>
            </p>
        </div>
    `;
}

function renderSignup() {
    return `
        <div class="flex flex-col items-center justify-center p-8">
            <h2 class="text-2xl font-bold mb-4">Signup</h2>
            <form class="space-y-4 w-full max-w-md">
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Name</label>
                    <input type="text" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your name">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                    <input type="email" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your email">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                    <input type="password" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your password">
                </div>
                <button class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold">
                    Signup
                </button>
            </form>
            <p class="text-gray-500 text-center mt-4">
                Already have an account? <button onclick="navigate('login')" class="text-green-500">Login</button>
            </p>
        </div>
    `;
}

// Add a handler for theme changes
function handleThemeChange(checkbox) {
    if (checkbox.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}

function scrollNavLeft() {
    const container = document.getElementById('navContainer');
    container.scrollBy({
        left: -200,
        behavior: 'smooth'
    });
}

function scrollNavRight() {
    const container = document.getElementById('navContainer');
    container.scrollBy({
        left: 200,
        behavior: 'smooth'
    });
}

// Add wheel event listener for mouse wheel scrolling
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('navContainer');
    if (container) {
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        });
    }
});

function showProductDetails(product) {
    selectedProduct = product;
    
    // Function to render dynamic specifications
    const renderSpecifications = (specs) => {
        if (!specs) return '';
        return Object.entries(specs).map(([key, value]) => `
            <li class="flex items-center gap-2">
                <i class="fas fa-check text-green-500"></i>
                <span class="font-medium">${key}:</span> ${value}
            </li>
        `).join('');
    };

    // Function to render additional information
    const renderAdditionalInfo = (info) => {
        if (!info) return '';
        return Object.entries(info).map(([key, value]) => `
            <div class="mb-3">
                <span class="font-medium">${key.replace(/_/g, ' ')}:</span>
                <span class="text-gray-600">${value}</span>
            </div>
        `).join('');
    };

    app.innerHTML = `
        <div class="pb-20">
            <!-- Product Image -->
            <div class="relative">
                <button onclick="navigate('home')" class="absolute top-4 left-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
                    <i class="fas fa-arrow-left text-gray-600"></i>
                </button>
                <div class="w-full h-[300px] bg-white relative">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-contain">
                    <button onclick="toggleWishlist('${product._id}')" 
                            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <i class="fas fa-heart ${wishlist.includes(product._id) ? 'text-red-500' : 'text-gray-300'} text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Info -->
            <div class="bg-white p-4 mb-4">
                <div class="flex flex-col sm:flex-row justify-between items-start mb-4">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">${product.name}</h2>
                        <div class="flex items-center">
                            <div class="flex items-center mr-4">
                                <span class="text-xl font-bold mr-2">${product.rating || 0}</span>
                                <i class="fas fa-star text-yellow-400"></i>
                            </div>
                            <span class="text-gray-500">${product.reviews ? product.reviews.length : 0} reviews</span>
                        </div>
                        ${product.stock ? `
                            <div class="mt-2">
                                <span class="text-${product.stock > 0 ? 'green' : 'red'}-500">
                                    ${product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="text-3xl font-bold text-green-500">₹${product.price}</div>
                </div>

                <!-- Product Description -->
                <div class="mb-6">
                    <p class="text-gray-600">${product.description}</p>
                </div>

                <!-- Dynamic Specifications -->
                ${product.specifications ? `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Specifications</h3>
                        <ul class="space-y-2">
                            ${renderSpecifications(product.specifications)}
                        </ul>
                    </div>
                ` : ''}

                <!-- Additional Information -->
                ${product.additionalInfo ? `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Additional Information</h3>
                        ${renderAdditionalInfo(product.additionalInfo)}
                    </div>
                ` : ''}

                <!-- Reviews Section -->
                ${product.reviews && product.reviews.length > 0 ? `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Customer Reviews</h3>
                        <div class="space-y-4">
                            ${product.reviews.map(review => `
                                <div class="border-b pb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <i class="fas fa-user text-gray-500"></i>
                                            </div>
                                            <span class="font-medium">${review.user?.name || 'Anonymous'}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <span class="text-yellow-400 mr-1">${review.rating}</span>
                                            <i class="fas fa-star text-yellow-400"></i>
                                        </div>
                                    </div>
                                    <p class="text-gray-600">${review.comment}</p>
                                    <span class="text-sm text-gray-500">${new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg flex space-x-4">
                    <button onclick="addToCart('${product._id}')" 
                            class="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus mr-2"></i>
                        Add to Cart
                    </button>
                    <button onclick="buyNow('${product._id}')"
                            class="flex-1 bg-black text-white py-3 rounded-lg font-semibold"
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `;
}
