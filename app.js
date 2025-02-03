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
let profileStats = {
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0
};
let selectedCategory = 'All';
let selectedSubcategory = null;

// Real-time update interval (in milliseconds)
const UPDATE_INTERVAL = 5000;

// Add this at the top with other state variables
let statsUpdateInterval = null;

// DOM Elements
const app = document.getElementById('app');

// Router
function navigate(page, data = null) {
    // Stop real-time updates when leaving profile page
    if (currentPage === 'profile') {
        stopRealTimeUpdates();
    }

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
    const mainContent = document.getElementById('app');
    if (!mainContent) return;

    // Add padding to the bottom of the page to account for the navigation
    mainContent.classList.add('pb-16');

    switch (currentPage) {
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
            renderLogin();
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

    // Add bottom navigation to all pages except login and signup
    if (!['login', 'signup'].includes(currentPage)) {
        mainContent.insertAdjacentHTML('beforeend', renderBottomNav());
    }
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
                    <h1 class="text-xl font-bold">Notifications</h1>
                    ${
                        unreadCount > 0
                            ? `
                        <button onclick="markAllAsRead()" class="text-green-600 text-sm font-medium">
                            Mark all as read
                        </button>
                    `
                            : ''
                    }
                </div>
            </div>

            <!-- Notification List -->
            <div class="divide-y divide-gray-200">
                ${
                    notifications.length > 0
                        ? notifications
                              .map(
                                  notification => `
                    <div class="p-4 bg-white ${
                        !notification.isRead ? 'bg-green-50' : ''
                    } transition-colors duration-200">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                     style="background-color: ${getNotificationColor(
                                         notification.color
                                     )}">
                                    <i class="fas ${notification.icon}"></i>
                                </div>
                            </div>
                            <div class="ml-4 flex-1">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-sm font-semibold text-gray-900">
                                        ${notification.title}
                                    </h3>
                                    <p class="text-xs text-gray-500">
                                        ${formatTimestamp(
                                            notification.timestamp
                                        )}
                                    </p>
                                </div>
                                <p class="mt-1 text-sm text-gray-600">
                                    ${notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                `
                              )
                              .join('')
                        : `
                    <div class="flex flex-col items-center justify-center p-8">
                        <i class="fas fa-bell-slash text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No notifications yet</p>
                    </div>
                `
                }
            </div>
        </div>
    `;
}

function getNotificationColor(color) {
    const colors = {
        green: '#4CAF50',
        orange: '#FF9800',
        blue: '#2196F3',
        purple: '#9C27B0',
        red: '#F44336'
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

function renderHome() {
    const categories = getAllCategories();
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <div class="w-8 flex-shrink-0">
                        <!-- Empty div for spacing -->
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <div class="h-12 flex items-center justify-center">
                            <img src="logo here" 
                                 alt="Groco" 
                                 class="h-12 w-auto object-contain"
                                 style="filter: brightness(1.1) contrast(1.1);">
                        </div>
                    </div>
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <button onclick="navigate('wishlist')" class="relative">
                            <i class="fas fa-heart text-gray-600 text-sm"></i>
                            ${wishlist.length > 0 
                                ? `<span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>` 
                                : ''}
                        </button>
                        <button onclick="navigate('notifications')" class="relative">
                            <i class="fas fa-bell text-gray-600 text-sm"></i>
                            ${notifications.some(n => !n.isRead) 
                                ? `<span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>` 
                                : ''}
                        </button>
                        <button onclick="navigate('cart')" class="relative">
                            <i class="fas fa-shopping-cart text-gray-600 text-sm"></i>
                            ${cart.length > 0 
                                ? `<span class="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">${cart.length}</span>` 
                                : ''}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="p-4">
                <div class="relative" onclick="navigate('search')">
                    <input type="text" 
                           placeholder="Search products..." 
                           class="w-full p-3 pl-12 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-soft"
                           readonly>
                    <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>


            <!-- Promotions Carousel -->
            <div class="px-4 mb-6">
                <div class="overflow-x-auto scroll-smooth flex space-x-4 pb-4">
                    ${promotions.map(promo => `
                        <div class="flex-shrink-0 w-80 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-4 text-white shadow-lg">
                            <h3 class="text-xl font-bold mb-2">${promo.title}</h3>
                            <p class="text-2xl font-bold mb-2">${promo.discount}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-sm">Use code: ${promo.code}</span>
                                <button class="bg-white text-green-500 px-4 py-1 rounded-full text-sm font-bold hover:shadow-md transition-shadow">
                                    Copy
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>






             <!-- Categories and Subcategories -->
            <div class="px-4 mb-6">
                <!-- Main Categories -->
                <div class="flex overflow-x-auto scroll-smooth space-x-4 pb-2">
                    <button onclick="filterByCategory('All')" 
                            class="ripple flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-all
                            ${selectedCategory === 'All' 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                                : 'bg-white shadow-soft hover:shadow-md'} whitespace-nowrap">
                        All
                    </button>
                    ${categories.map(category => `
                        <button onclick="filterByCategory('${category.name}')" 
                                class="ripple flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-all
                                ${category.name === selectedCategory 
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                                    : 'bg-white shadow-soft hover:shadow-md'} whitespace-nowrap">
                            <i class="${category.icon || 'fas fa-tag'} mr-2"></i>${category.name}
                        </button>
                    `).join('')}
                    ${authState.isAdmin ? `
                        <button onclick="showAddCategoryModal()" 
                                class="ripple flex-shrink-0 px-6 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
                            <i class="fas fa-plus mr-2"></i>Add Category
                            </button>
                    ` : ''}
                </div>

                <!-- Subcategories (show only when a category is selected) -->
                ${selectedCategory !== 'All' ? `
                    <div class="mt-4 flex overflow-x-auto scroll-smooth space-x-3 pb-2">
                        ${getSubcategoriesForCategory(selectedCategory).map(subcategory => `
                            <button onclick="filterBySubcategory('${subcategory}')"
                                    class="ripple flex-shrink-0 px-4 py-1 rounded-full text-sm ${
                                        subcategory === selectedSubcategory
                                            ? 'bg-green-100 text-green-700 border border-green-500'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }">
                                ${subcategory}
                                </button>
                        `).join('')}
                        ${authState.isAdmin ? `
                            <button onclick="showAddSubcategoryModal('${selectedCategory}')"
                                    class="ripple flex-shrink-0 px-4 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200">
                                <i class="fas fa-plus mr-1"></i>Add
                        </button>
                        ` : ''}
                    </div>
                ` : ''}
                </div>


            <!-- Filtered Products Grid -->
            <div class="grid grid-cols-2 gap-4 px-4 pb-20">
                    ${products
                    .filter(product => {
                        if (selectedCategory === 'All') return true;
                        if (selectedSubcategory) {
                            return product.category === selectedCategory && 
                                   product.subcategory === selectedSubcategory;
                        }
                        return product.category === selectedCategory;
                    })
                    .map(product => `
                        <div class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden" 
                             onclick="navigate('product', ${JSON.stringify(product)})">
                            <div class="relative">
                                <img src="${product.image}" 
                                     alt="${product.name}" 
                                     class="w-full h-40 object-contain p-4">
                                <div class="absolute top-2 left-2">
                                    <button onclick="event.stopPropagation(); quickView(${product.id})" 
                                            class="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transform hover:scale-110 transition-transform">
                                        <i class="fas fa-eye text-gray-600"></i>
                                    </button>
                                </div>
                                <button onclick="event.stopPropagation(); toggleWishlist(${product.id})" 
                                        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transform hover:scale-110 transition-transform">
                                    <i class="fas fa-heart ${wishlist.includes(product.id) ? 'text-red-500' : 'text-gray-300'}"></i>
                </button>
                    </div>
                            <div class="p-4">
                            <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs px-2 py-1 rounded-full ${product.available 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'}">
                                        ${product.available ? 'In Stock' : 'Out of Stock'}
                                </span>
                                    <div class="flex items-center">
                                        <span class="mr-1">${product.rating}</span>
                                        <i class="fas fa-star text-yellow-400"></i>
                            </div>
                            </div>
                                <h3 class="font-medium mb-1 truncate">${product.name}</h3>
                                <div class="flex justify-between items-center">
                                    <div class="text-xl font-bold text-gray-900">₹${product.price}</div>
                                    <button onclick="event.stopPropagation(); addToCart(${product.id})" 
                                            class="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                                        <i class="fas fa-plus"></i>
                            </button>
                        </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
        </div>
    `;
}

function getNavIcon(item) {
    const icons = {
        home: 'home',
        search: 'search',
        cart: 'shopping-cart',
        profile: 'user'
    };
    return icons[item] || 'home';
}

function renderSearch() {
    const randomTags = getRandomTrendingTags();

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-md">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <div class="flex-1 relative">
                        <div class="relative flex items-center">
                            <input type="text" 
                                   placeholder="Search products..." 
                                   class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-gray-50"
                                   oninput="setSearchTerm(this.value)"
                                   value="${searchTerm || ''}">
                            <i class="fas fa-search absolute left-4 text-gray-400 text-lg"></i>
                            ${searchTerm ? `
                                <button onclick="setSearchTerm('')" 
                                        class="absolute right-4 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Trending Tags -->
            <div class="p-6">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        <i class="fas fa-fire text-orange-500 mr-2"></i>
                        Trending Now
                    </h2>
                    <div class="flex flex-wrap gap-2">
                        ${randomTags
                            .map(
                                tag => `
                            <button onclick="setSearchTerm('${tag.name}')"
                                    class="px-4 py-2 bg-white rounded-full border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-500 hover:text-green-600 transition-all duration-200 flex items-center group">
                                <i class="fas fa-trending-up text-green-500 mr-2 group-hover:scale-110 transition-transform"></i>
                                ${tag.name}
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Search History -->
                ${
                    searchHistory.length > 0
                        ? `
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-history text-blue-500 mr-2"></i>
                                Recent Searches
                            </h2>
                            <button onclick="clearSearchHistory()" 
                                    class="text-sm text-red-500 hover:text-red-600 font-medium flex items-center">
                                <i class="fas fa-trash-alt mr-1"></i>
                                Clear All
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${searchHistory
                                .map(
                                    term => `
                                <button onclick="setSearchTerm('${term}')"
                                        class="w-full p-4 bg-gray-50 rounded-xl flex items-center text-gray-700 hover:bg-gray-100 transition-all duration-200 group">
                                    <i class="fas fa-history text-gray-400 mr-3 group-hover:text-blue-500 transition-colors"></i>
                                    <span class="flex-1 text-left">${term}</span>
                                    <i class="fas fa-search text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }
            </div>

            <!-- Search Results -->
            ${
                searchTerm
                    ? `
                <div class="px-6 pb-6">
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                            <i class="fas fa-search text-purple-500 mr-2"></i>
                            Search Results
                        </h2>
                        <div class="grid grid-cols-2 gap-4">
                            ${products
                                .filter(
                                    product =>
                                        product.name
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase()) ||
                                        product.category
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase())
                                )
                                .map(
                                    product => `
                                <div class="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200">
                                    <div class="relative">
                                        <img src="${product.image}" 
                                             alt="${product.name}" 
                                             class="w-full h-40 object-contain p-4">
                                        <button onclick="toggleWishlist(${product.id})" 
                                                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                                            <i class="fas fa-heart ${wishlist.includes(product.id) ? 'text-red-500' : 'text-gray-300'}"></i>
                                        </button>
                                    </div>
                                    <div class="p-4">
                                        <h3 class="font-medium text-gray-800 truncate">${product.name}</h3>
                                        <div class="flex items-center justify-between mt-2">
                                            <p class="text-green-600 font-bold">₹${product.price}</p>
                                            <button onclick="addToCart(${product.id})" 
                                                    class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                </div>
            `
                    : ''
            }
        </div>
    `;
}

function getRandomTrendingTags(count = 6) {
    return trendingTags.sort(() => Math.random() - 0.5).slice(0, count);
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
    // Filter out invalid products from cart
    cart = cart.filter(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            console.warn(`Removing invalid product with id ${item.id} from cart`);
            return false;
        }
        return true;
    });

    const total = calculateSubtotal();

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold">Shopping Cart (${cart.length})</h1>
                </div>
            </div>

            ${cart.length === 0 
                    ? `
                <div class="flex flex-col items-center justify-center py-12">
                    <i class="fas fa-shopping-cart text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">Your cart is empty</p>
                    <button onclick="navigate('home')" 
                            class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                        Continue Shopping
                    </button>
                </div>
            ` : `
                <!-- Cart Items -->
                <div class="p-4 space-y-4">
                    ${cart.map(item => {
                        const product = products.find(p => p.id === item.id);
                        // Skip rendering if product not found
                            if (!product) return '';
                            return `
                            <div class="bg-white rounded-lg shadow p-4">
                                <div class="flex items-start space-x-4">
                                    <img src="${product.image}" alt="${product.name}" 
                                         class="w-24 h-24 object-cover rounded-lg">
                                    <div class="flex-1">
                                        <h3 class="font-semibold text-gray-800">${product.name}</h3>
                                        <p class="text-green-600 font-bold">₹${product.price}</p>
                                        <div class="flex items-center mt-2">
                                            <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})"
                                                    class="w-8 h-8 flex items-center justify-center border rounded-l-lg ${item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-50'}"
                                                    ${item.quantity <= 1 ? 'disabled' : ''}>
                                                <i class="fas fa-minus"></i>
                                            </button>
                                            <span class="w-12 h-8 flex items-center justify-center border-t border-b">
                                                ${item.quantity}
                                            </span>
                                            <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})"
                                                    class="w-8 h-8 flex items-center justify-center border rounded-r-lg text-gray-600 hover:bg-gray-50">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <button onclick="removeFromCart(${item.id})" 
                                            class="text-red-500 hover:text-red-600">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}

                    <!-- Cart Summary -->
                    <div class="bg-white rounded-lg shadow p-4 mt-4">
                        <h3 class="font-semibold text-gray-800 mb-4">Order Summary</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Subtotal</span>
                                <span class="font-semibold">₹${total}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Shipping</span>
                                <span class="font-semibold">₹${total >= 500 ? '0' : '50'}</span>
                            </div>
                            <div class="border-t pt-2 mt-2">
                                <div class="flex justify-between">
                                    <span class="font-semibold">Total</span>
                                    <span class="font-bold text-green-600">₹${total >= 500 ? total : total + 50}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Checkout Button -->
                    <div class="fixed bottom-16 left-0 right-0 p-4 bg-white border-t">
                        <button onclick="proceedToCheckout()"
                                class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                            Proceed to Checkout (₹${total >= 500 ? total : total + 50})
                        </button>
                    </div>
                </div>
            `}
        </div>
    `;
}

function calculateSubtotal() {
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            console.warn(`Product with id ${item.id} not found`);
            return total;
        }
        return total + (product.price * item.quantity);
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

function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Welcome to Our Platform
                </h2>
                <div class="mt-4 text-center">
                    <div class="flex justify-center space-x-4">
                        <button onclick="showUserLogin()" 
                                id="userLoginBtn"
                                class="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 active">
                            Customer Login
                        </button>
                        <button onclick="showVendorLogin()"
                                id="vendorLoginBtn" 
                                class="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Vendor Login
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <!-- User Login Form -->
                    <form id="userLoginForm" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input type="email" id="userEmail" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input type="password" id="userPassword" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <button type="submit"
                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Sign in
                            </button>
                        </div>
                        
                        <div class="text-center">
                            <button type="button" onclick="showUserSignup()"
                                class="text-green-600 hover:text-green-700 text-sm font-medium">
                                New customer? Create an account
                            </button>
                        </div>
                    </form>

                    <!-- User Signup Form (Hidden by default) -->
                    <form id="userSignupForm" class="space-y-6" style="display: none;">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input type="text" id="userSignupName" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input type="email" id="userSignupEmail" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input type="password" id="userSignupPassword" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <input type="tel" id="userSignupPhone" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <button type="submit"
                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Sign up
                            </button>
                        </div>
                        
                        <div class="text-center">
                            <button type="button" onclick="showUserLogin()"
                                class="text-green-600 hover:text-green-700 text-sm font-medium">
                                Already have an account? Sign in
                            </button>
                        </div>
                    </form>

                    <!-- Vendor Login Form (Hidden by default) -->
                    <form id="vendorLoginForm" class="space-y-6" style="display: none;">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input type="text" id="vendorUsername" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input type="password" id="vendorPassword" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <button type="submit"
                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Sign in as Vendor
                            </button>
                        </div>
                        
                        <div class="text-center">
                            <button type="button" onclick="showVendorSignup()"
                                class="text-green-600 hover:text-green-700 text-sm font-medium">
                                New vendor? Apply for registration
                            </button>
                        </div>
                    </form>

                    <!-- Vendor Signup Form (Hidden by default) -->
                    <form id="vendorSignupForm" class="space-y-6" style="display: none;">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Business Name
                            </label>
                            <input type="text" id="vendorSignupName" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input type="email" id="vendorSignupEmail" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <input type="tel" id="vendorSignupPhone" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Business Address
                            </label>
                            <textarea id="vendorSignupAddress" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"></textarea>
                        </div>

                        <div>
                            <button type="submit"
                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                Submit Application
                            </button>
                        </div>
                        
                        <div class="text-center">
                            <button type="button" onclick="showVendorLogin()"
                                class="text-green-600 hover:text-green-700 text-sm font-medium">
                                Already registered? Sign in
                            </button>
                        </div>
                    </form>

                    <div class="mt-6">
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-gray-300"></div>
                            </div>
                            <div class="relative flex justify-center text-sm">
                                <span class="px-2 bg-white text-gray-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div class="mt-6 grid grid-cols-2 gap-3">
                            <div>
                                <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                    <i class="fab fa-google"></i>
                                </a>
                            </div>
                            <div>
                                <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                    <i class="fab fa-facebook-f"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('userLoginForm').addEventListener('submit', handleUserLogin);
    document.getElementById('vendorLoginForm').addEventListener('submit', handleVendorLogin);
    document.getElementById('userSignupForm').addEventListener('submit', handleUserSignup);
    document.getElementById('vendorSignupForm').addEventListener('submit', handleVendorSignup);
}

function showUserLogin() {
    document.getElementById('userLoginForm').style.display = 'block';
    document.getElementById('userSignupForm').style.display = 'none';
    document.getElementById('vendorLoginForm').style.display = 'none';
    document.getElementById('vendorSignupForm').style.display = 'none';
    
    document.getElementById('userLoginBtn').classList.add('bg-green-600', 'text-white');
    document.getElementById('userLoginBtn').classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById('vendorLoginBtn').classList.add('bg-gray-200', 'text-gray-700');
    document.getElementById('vendorLoginBtn').classList.remove('bg-green-600', 'text-white');
}

function showUserSignup() {
    document.getElementById('userLoginForm').style.display = 'none';
    document.getElementById('userSignupForm').style.display = 'block';
    document.getElementById('vendorLoginForm').style.display = 'none';
    document.getElementById('vendorSignupForm').style.display = 'none';
}

function showVendorLogin() {
    document.getElementById('userLoginForm').style.display = 'none';
    document.getElementById('userSignupForm').style.display = 'none';
    document.getElementById('vendorLoginForm').style.display = 'block';
    document.getElementById('vendorSignupForm').style.display = 'none';
    
    document.getElementById('vendorLoginBtn').classList.add('bg-green-600', 'text-white');
    document.getElementById('vendorLoginBtn').classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById('userLoginBtn').classList.add('bg-gray-200', 'text-gray-700');
    document.getElementById('userLoginBtn').classList.remove('bg-green-600', 'text-white');
}

function showVendorSignup() {
    document.getElementById('userLoginForm').style.display = 'none';
    document.getElementById('userSignupForm').style.display = 'none';
    document.getElementById('vendorLoginForm').style.display = 'none';
    document.getElementById('vendorSignupForm').style.display = 'block';
}

function handleVendorLogin(e) {
    e.preventDefault();
    const username = document.getElementById('vendorUsername').value;
    const password = document.getElementById('vendorPassword').value;

    // Check vendor credentials
    if (username === 'vendor' && password === 'vendor123') {
        sessionStorage.setItem('vendorLoggedIn', 'true');
        sessionStorage.setItem('showWelcome', 'true');
        window.location.href = 'vendor/vendor.html';
    } else {
        alert('Invalid vendor credentials! Please use vendor/vendor123');
    }
}

function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find user and compare encoded password
    const user = users.find(u => u.email === email && u.password === btoa(password));

    if (user) {
        // Set auth state
        authState.isAuthenticated = true;
        authState.user = user;
        
        // Store in session
        sessionStorage.setItem('loggedInUser', JSON.stringify(user));
        
        // Show success message
        showToast('Login successful!');
        
        // Navigate to profile page
        navigate('profile');
    } else {
        // For debugging, let's check if the user exists
        const userExists = users.find(u => u.email === email);
        if (userExists) {
            alert('Invalid password! Please try again.');
        } else {
            alert('User not found! Please sign up first.');
        }
    }
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
    toast.className =
        'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function buyNow(productId) {
    addToCart(productId);
    navigate('cart');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1,
            color: selectedColor,
            size: selectedSize
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

    // Enable pull-to-refresh
    let touchStart = 0;
    let touchEnd = 0;

    app.addEventListener(
        'touchstart',
        e => {
            touchStart = e.touches[0].clientY;
        },
        { passive: true }
    );

    app.addEventListener(
        'touchmove',
        e => {
            touchEnd = e.touches[0].clientY;

            if (
                app.scrollTop === 0 &&
                touchEnd > touchStart &&
                touchEnd - touchStart > 100
            ) {
                showToast('Refreshing...');
                setTimeout(() => renderApp(), 1000);
            }
        },
        { passive: true }
    );
});

function renderUserStats(userOrders, userWishlist) {
    const pendingOrders = userOrders.filter(o => o.status === 'pending');
    return `
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div onclick="viewAllOrders('all')" 
                class="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="text-3xl font-bold text-green-600 mb-1">${userOrders.length}</div>
                <div class="text-sm text-gray-600">Total Orders</div>
            </div>
            <div onclick="viewAllOrders('pending')"
                class="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="text-3xl font-bold text-yellow-600 mb-1">${pendingOrders.length}</div>
                <div class="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-3xl font-bold text-blue-600 mb-1">${userWishlist.length}</div>
                <div class="text-sm text-gray-600">Wishlist Items</div>
            </div>
        </div>
    `;
}

function viewAllOrders(filter = 'all') {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === authState.currentUser.id);
    const filteredOrders = filter === 'all' ? userOrders : userOrders.filter(order => order.status === filter);

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('profile')" class="mr-4">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">
                        ${filter === 'all' ? 'All Orders' : 'Pending Orders'}
                    </h1>
                </div>
                
                <!-- Order Status Filter -->
                <div class="flex gap-2 p-4 overflow-x-auto">
                    <button onclick="viewAllOrders('all')" 
                        class="px-4 py-2 rounded-full text-sm ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        All Orders
                    </button>
                    <button onclick="viewAllOrders('pending')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Pending
                    </button>
                    <button onclick="viewAllOrders('processing')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'processing' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Processing
                    </button>
                    <button onclick="viewAllOrders('shipped')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'shipped' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Shipped
                    </button>
                    <button onclick="viewAllOrders('delivered')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'delivered' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Delivered
                    </button>
                </div>
            </div>

            <div class="p-4 space-y-4">
                ${filteredOrders.length > 0 ? filteredOrders.map(order => `
                    <div class="bg-white rounded-lg shadow-md p-4">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="font-medium text-lg">#${order.orderId}</h3>
                                <p class="text-sm text-gray-500">${new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.status)}">
                                ${order.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="border-t border-b border-gray-100 py-4 my-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-600">Items</span>
                                <span class="font-medium">${order.items.length}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Total Amount</span>
                                <span class="font-medium">$${order.payment.total.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <!-- Order Items Preview -->
                        <div class="flex gap-2 mb-4 overflow-x-auto">
                            ${order.items.map(item => `
                                <div class="flex-shrink-0 w-16 h-16">
                                    <img src="${item.image}" alt="${item.name}" 
                                        class="w-full h-full object-cover rounded-md">
                                </div>
                            `).join('')}
                        </div>

                        <div class="flex justify-between items-center">
                            <button onclick="viewOrderDetails('${order.orderId}')" 
                                class="text-green-600 hover:text-green-700 font-medium text-sm">
                                View Details <i class="fas fa-chevron-right ml-1"></i>
                            </button>
                            ${order.status === 'delivered' ? `
                                <button onclick="rateOrder('${order.orderId}')"
                                    class="text-yellow-600 hover:text-yellow-700 font-medium text-sm">
                                    <i class="fas fa-star mr-1"></i> Rate Order
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : `
                    <div class="text-center py-8">
                        <i class="fas fa-box-open text-gray-400 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No ${filter} orders found</p>
                        <button onclick="navigate('home')" 
                            class="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
                            Continue Shopping
                        </button>
                    </div>
                `}
            </div>

            ${renderBottomNav()}
        </div>
    `;
}

function getStatusStyle(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'processing':
            return 'bg-blue-100 text-blue-800';
        case 'shipped':
            return 'bg-purple-100 text-purple-800';
        case 'delivered':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Admin functions for category management
function getAllCategories() {
    // Get categories from localStorage (both admin and vendor added)
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    // Add default categories if none exist
    if (categories.length === 0) {
        const defaultCategories = [
            { id: '1', name: 'Electronics', icon: 'fas fa-mobile-alt' },
            { id: '2', name: 'Fashion', icon: 'fas fa-tshirt' },
            { id: '3', name: 'Home', icon: 'fas fa-home' },
            { id: '4', name: 'Beauty', icon: 'fas fa-spa' },
            { id: '5', name: 'Books', icon: 'fas fa-book' }
        ];
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
        return defaultCategories;
    }
    
    return categories;
}

function getSubcategoriesForCategory(categoryName) {
    const categories = getAllCategories();
    const category = categories.find(cat => cat.name === categoryName);
    
    if (!category) return [];
    
    // Get all subcategories from localStorage
    const allSubcategories = JSON.parse(localStorage.getItem('subcategories') || '[]');
    
    // Filter subcategories for the selected category
    return allSubcategories
        .filter(sub => sub.parentId === category.id)
        .map(sub => sub.name);
}

function showAddCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Add New Category</h3>
            <form onsubmit="addNewCategory(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                    <input type="text" id="newCategoryName" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter category name">
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="this.closest('.fixed').remove()"
                            class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        Add Category
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function showAddSubcategoryModal(categoryName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Add Subcategory to ${categoryName}</h3>
            <form onsubmit="addNewSubcategory(event, '${categoryName}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Subcategory Name</label>
                    <input type="text" id="newSubcategoryName" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter subcategory name">
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="this.closest('.fixed').remove()"
                            class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Cancel
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        Add Subcategory
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function addNewCategory(event) {
    event.preventDefault();
    const categoryName = document.getElementById('newCategoryName').value;
    const categories = getAllCategories();
    categories.push({
        id: Date.now().toString(),
        name: categoryName,
        icon: 'fas fa-tag'
    });
    localStorage.setItem('categories', JSON.stringify(categories));
    event.target.closest('.fixed').remove();
    showToast(`Category "${categoryName}" added successfully`);
    renderApp();
}

function addNewSubcategory(event, categoryName) {
    event.preventDefault();
    const subcategoryName = document.getElementById('newSubcategoryName').value;
    const categories = getAllCategories();
    const category = categories.find(c => c.name === categoryName);
    if (!category) return;
    
    // Get all subcategories from localStorage
    const allSubcategories = JSON.parse(localStorage.getItem('subcategories') || '[]');
    
    // Add new subcategory
    allSubcategories.push({
        id: Date.now().toString(),
        parentId: category.id,
        name: subcategoryName
    });
    localStorage.setItem('subcategories', JSON.stringify(allSubcategories));
    event.target.closest('.fixed').remove();
    showToast(`Subcategory "${subcategoryName}" added successfully`);
    renderApp();
}

// Update the real-time update functions
function startRealTimeUpdates() {
    updateProfileStats(); // Initial update
    statsUpdateInterval = setInterval(updateProfileStats, UPDATE_INTERVAL);
}

function stopRealTimeUpdates() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
        statsUpdateInterval = null;
    }
}

function updateProfileStats() {
    if (authState.isAuthenticated) {
        // Fetch latest orders and wishlist data
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const userOrders = orders.filter(order => order.userId === authState.currentUser.id);
        
        // Update stats
        profileStats.totalOrders = userOrders.length;
        profileStats.pendingOrders = userOrders.filter(order => order.status === 'pending').length;
        profileStats.wishlistItems = wishlist.length;

        // Update UI if on profile page
        if (currentPage === 'profile') {
            const statsContainer = document.getElementById('profile-stats');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="bg-white p-4 rounded-lg shadow text-center">
                            <div class="text-2xl font-bold text-gray-800">${profileStats.totalOrders}</div>
                            <div class="text-sm text-gray-600">Total Orders</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow text-center">
                            <div class="text-2xl font-bold text-gray-800">${profileStats.pendingOrders}</div>
                            <div class="text-sm text-gray-600">Pending</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow text-center">
                            <div class="text-2xl font-bold text-gray-800">${profileStats.wishlistItems}</div>
                            <div class="text-sm text-gray-600">Wishlist</div>
                        </div>
                    </div>
                `;
            }
        }
    }
}

// Update renderProfile to properly handle authentication and display
function renderProfile() {
    if (!authState.isAuthenticated) {
        navigate('login');
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        navigate('login');
        return;
    }

    app.innerHTML = `
        <div class="container mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Profile Header -->
                <div class="flex items-center mb-6">
                    <div class="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold mr-4">
                        ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">${user.name || 'User'}</h2>
                        <p class="text-gray-600">${user.email}</p>
                    </div>
                </div>

                <!-- Profile Stats -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600" id="totalOrdersCount">0</div>
                        <div class="text-gray-600">Total Orders</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="pendingOrdersCount">0</div>
                        <div class="text-gray-600">Pending Orders</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-blue-600" id="wishlistCount">0</div>
                        <div class="text-gray-600">Wishlist Items</div>
                    </div>
                </div>

                <!-- Profile Tabs -->
                <div class="border-b border-gray-200 mb-6">
                    <nav class="flex space-x-4" aria-label="Profile tabs">
                        <button onclick="showProfileTab('orders')" id="ordersTab" 
                            class="px-3 py-2 text-sm font-medium text-green-600 border-b-2 border-green-600">
                            My Orders
                        </button>
                        <button onclick="showProfileTab('addresses')" id="addressesTab"
                            class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Addresses
                        </button>
                        <button onclick="showProfileTab('settings')" id="settingsTab"
                            class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Settings
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div id="profileTabContent">
                    <!-- Orders Tab (Default View) -->
                    <div id="ordersContent" class="space-y-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Recent Orders</h3>
                            <select onchange="filterOrders(this.value)" class="border rounded-md px-2 py-1">
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>
                        <div id="ordersList" class="space-y-4">
                            <!-- Orders will be loaded here -->
                        </div>
                    </div>

                    <!-- Addresses Tab -->
                    <div id="addressesContent" class="hidden space-y-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Saved Addresses</h3>
                            <button onclick="showAddAddressModal()" 
                                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                Add New Address
                            </button>
                        </div>
                        <div id="addressesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Addresses will be loaded here -->
                        </div>
                    </div>

                    <!-- Settings Tab -->
                    <div id="settingsContent" class="hidden space-y-6">
                        <div class="max-w-md">
                            <h3 class="text-lg font-semibold mb-4">Account Settings</h3>
                            <form onsubmit="updateProfile(event)" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" id="profileName" value="${user.name || ''}"
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" id="profileEmail" value="${user.email}" readonly
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-gray-50">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="tel" id="profilePhone" value="${user.phone || ''}"
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2">
                                </div>
                                <div>
                                    <button type="submit" 
                                        class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                            <div class="mt-6 pt-6 border-t">
                                <button onclick="logout()" 
                                    class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load initial data
    loadProfileData();
    startRealTimeUpdates();
}

function showProfileTab(tabName) {
    // Hide all tab contents
    document.getElementById('ordersContent').classList.add('hidden');
    document.getElementById('addressesContent').classList.add('hidden');
    document.getElementById('settingsContent').classList.add('hidden');
    
    // Remove active state from all tabs
    document.getElementById('ordersTab').classList.remove('text-green-600', 'border-b-2', 'border-green-600');
    document.getElementById('addressesTab').classList.remove('text-green-600', 'border-b-2', 'border-green-600');
    document.getElementById('settingsTab').classList.remove('text-green-600', 'border-b-2', 'border-green-600');
    
    // Add active state to selected tab
    document.getElementById(`${tabName}Tab`).classList.add('text-green-600', 'border-b-2', 'border-green-600');
    
    // Show selected tab content
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
}

function loadProfileData() {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) return;

    // Load orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === user.id);
    
    // Update stats
    document.getElementById('totalOrdersCount').textContent = userOrders.length;
    document.getElementById('pendingOrdersCount').textContent = 
        userOrders.filter(order => order.status === 'pending').length;
    document.getElementById('wishlistCount').textContent = user.wishlist?.length || 0;

    // Render orders
    renderOrders(userOrders);
    
    // Render addresses
    renderAddresses(user.addresses || []);
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                No orders found
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-semibold">Order #${order.id}</div>
                    <div class="text-sm text-gray-500">${new Date(order.date).toLocaleDateString()}</div>
                </div>
                <div class="px-3 py-1 rounded-full text-sm ${getOrderStatusColor(order.status)}">
                    ${order.status}
                </div>
            </div>
            <div class="mt-4">
                <div class="text-sm text-gray-600">Items: ${order.items.length}</div>
                <div class="font-semibold">Total: $${order.total.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

function getOrderStatusColor(status) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function renderAddresses(addresses) {
    const addressesList = document.getElementById('addressesList');
    if (!addressesList) return;

    if (addresses.length === 0) {
        addressesList.innerHTML = `
            <div class="text-center py-8 text-gray-500 col-span-2">
                No addresses saved
            </div>
        `;
        return;
    }

    addressesList.innerHTML = addresses.map((address, index) => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-medium">${address.type || 'Address'} ${index + 1}</h3>
                    <div class="text-sm text-gray-600">
                        ${address.street}
                        ${address.city}, ${address.state} ${address.zip}
                        ${address.country}
                        ${address.phone ? `<div class="mt-1">Phone: ${address.phone}</div>` : ''}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editAddress(${index})" class="text-blue-600 hover:text-blue-700">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteAddress(${index})" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterOrders(status) {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) return;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    let filteredOrders = orders.filter(order => order.userId === user.id);
    
    if (status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    renderOrders(filteredOrders);
}

function updateProfile(event) {
    event.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) return;

    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;

    // Update user data
    user.name = name;
    user.phone = phone;

    // Update in session storage
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));

    // Update in local storage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], name, phone };
        localStorage.setItem('users', JSON.stringify(users));
    }

    showToast('Profile updated successfully');
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

            ${wishlist.length === 0 
                ? `
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
                    ${products
                        .filter(p => wishlist.includes(p.id))
                        .map(product => `
                            <div class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden" 
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
                                    <div class="text-xl font-bold text-gray-900">₹${product.price}</div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            `}
        </div>
    `;
}

function renderProductDetail() {
    if (!selectedProduct) {
        navigate('home');
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold">${selectedProduct.name}</h1>
                    <button onclick="shareProduct(${selectedProduct.id})" class="ml-auto">
                        <i class="fas fa-share-alt text-gray-600"></i>
                    </button>
                        </div>
                        </div>

            <!-- Product Images -->
            <div class="bg-white mb-4">
                <div class="relative">
                    <img src="${selectedProduct.image}" 
                         alt="${selectedProduct.name}" 
                         class="w-full h-72 object-contain p-4">
                    <button onclick="toggleWishlist(${selectedProduct.id})" 
                            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <i class="fas fa-heart ${wishlist.includes(selectedProduct.id) ? 'text-red-500' : 'text-gray-300'} text-xl"></i>
                    </button>
                    </div>
                        </div>

            <!-- Product Info -->
            <div class="bg-white p-4 mb-4">
                <div class="flex justify-between items-start mb-4">
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
                ${selectedProduct.colors ? `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">Select Color</h3>
                        <div class="flex space-x-3">
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
                ` : ''}

                <!-- Size Selection -->
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

                <!-- Product Description -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Description</h3>
                    <p class="text-gray-600">${selectedProduct.description}</p>
                </div>

                <!-- Specifications -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-3">Specifications</h3>
                    <ul class="space-y-2">
                        ${selectedProduct.specs.map(spec => `
                            <li class="flex items-center">
                                <i class="fas fa-check text-green-500 mr-2"></i>
                                ${spec}
                            </li>
                        `).join('')}
                    </ul>
                </div>

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

    // Create a safe version of the product for JSON stringification
    const safeProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        rating: product.rating,
        colors: product.colors || [],
        sizes: product.sizes || [],
        specs: product.specs || [],
        reviews: product.reviews || [],
        available: product.available,
        category: product.category,
        subcategory: product.subcategory
    };

    const quickViewHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div class="p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">${product.name}</h3>
                        <button onclick="closeQuickView()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <img src="${product.image}" alt="${product.name}" 
                         class="w-full h-64 object-cover mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-2xl font-bold text-gray-900">₹${product.price}</div>
                        <div class="flex items-center">
                            <span class="mr-1">${product.rating}</span>
                            <i class="fas fa-star text-yellow-400"></i>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-4">${product.description}</p>
                    <div class="flex space-x-4">
                        <button onclick="addToCart(${product.id}); closeQuickView()" 
                                class="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center hover:bg-green-600 transition-colors">
                            <i class="fas fa-cart-plus mr-2"></i>
                            Add to Cart
                        </button>
                        <button onclick="viewProductDetails(${JSON.stringify(safeProduct).replace(/"/g, '&quot;')})" 
                                class="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
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

// Add this helper function to handle the product detail navigation
function viewProductDetails(product) {
    closeQuickView();
    setTimeout(() => {
        navigate('product', product);
    }, 100);
}

function closeQuickView() {
    const quickView = document.getElementById('quickView');
    if (quickView) {
        quickView.remove();
    }
}

// Add these functions to handle category filtering
function filterByCategory(category) {
    selectedCategory = category;
    selectedSubcategory = null; // Reset subcategory when changing category
    renderApp();
}

function filterBySubcategory(subcategory) {
    selectedSubcategory = subcategory;
    renderApp();
}

function getSubcategoriesForCategory(categoryName) {
    const categories = getAllCategories();
    const category = categories.find(c => c.name === categoryName);
    return category ? category.subcategories || [] : [];
}

// Add these functions for image slider functionality
let currentImageIndex = 0;

function changeMainImage(index) {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumbnail-image');
    
    if (mainImage && selectedProduct.images[index]) {
        currentImageIndex = index;
        mainImage.src = selectedProduct.images[index];
        
        // Update thumbnail borders
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('border-2', i === index);
            thumb.classList.toggle('border-green-500', i === index);
        });
    }
}

function nextImage() {
    const nextIndex = (currentImageIndex + 1) % selectedProduct.images.length;
    changeMainImage(nextIndex);
}

function prevImage() {
    const prevIndex = (currentImageIndex - 1 + selectedProduct.images.length) % selectedProduct.images.length;
    changeMainImage(prevIndex);
}

// Update the quick view modal to include view details button
function showQuickView(product) {
    const safeProduct = {
        ...product,
        description: product.description.replace(/"/g, '&quot;')
    };

    const quickViewHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg max-w-2xl w-full relative">
                <div class="p-6">
                    <button onclick="closeQuickView()" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                    <img src="${product.images[0]}" alt="${product.name}" 
                         class="w-full h-64 object-cover mb-4">
                    <!-- Rest of quick view content remains same -->
                    <div class="flex space-x-4">
                        <button onclick="addToCart(${product.id}); closeQuickView()" 
                                class="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center hover:bg-green-600 transition-colors">
                            <i class="fas fa-cart-plus mr-2"></i>
                            Add to Cart
                        </button>
                        <button onclick="viewProductDetails(${JSON.stringify(safeProduct).replace(/"/g, '&quot;')})" 
                                class="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
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

function renderBottomNav() {
    const isAuthenticated = JSON.parse(sessionStorage.getItem('loggedInUser')) !== null;
    
    return `
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-area z-50">
            <div class="max-w-screen-xl mx-auto">
                <div class="flex justify-around items-center py-2">
                    <button onclick="navigate('home')" 
                            class="flex flex-col items-center w-14">
                        <i class="fas fa-home text-lg mb-0.5 ${currentPage === 'home' ? 'text-green-500' : 'text-gray-600'}"></i>
                        <span class="text-[10px] ${currentPage === 'home' ? 'text-green-500' : 'text-gray-600'}">Home</span>
                    </button>
                    
                    <button onclick="navigate('search')"
                            class="flex flex-col items-center w-14">
                        <i class="fas fa-search text-lg mb-0.5 ${currentPage === 'search' ? 'text-green-500' : 'text-gray-600'}"></i>
                        <span class="text-[10px] ${currentPage === 'search' ? 'text-green-500' : 'text-gray-600'}">Search</span>
                    </button>
                    
                    <button onclick="navigate('cart')"
                            class="flex flex-col items-center w-14 relative">
                        <i class="fas fa-shopping-cart text-lg mb-0.5 ${currentPage === 'cart' ? 'text-green-500' : 'text-gray-600'}"></i>
                        <span class="text-[10px] ${currentPage === 'cart' ? 'text-green-500' : 'text-gray-600'}">Cart</span>
                        ${cart.length > 0 ? `
                            <span class="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] rounded-full">${cart.length}</span>
                        ` : ''}
                    </button>
                    
                    ${isAuthenticated ? `
                        <button onclick="navigate('profile')"
                                class="flex flex-col items-center w-14">
                            <i class="fas fa-user text-lg mb-0.5 ${currentPage === 'profile' ? 'text-green-500' : 'text-gray-600'}"></i>
                            <span class="text-[10px] ${currentPage === 'profile' ? 'text-green-500' : 'text-gray-600'}">Profile</span>
                        </button>
                    ` : `
                        <button onclick="navigate('login')"
                                class="flex flex-col items-center w-14">
                            <i class="fas fa-sign-in-alt text-lg mb-0.5 ${currentPage === 'login' ? 'text-green-500' : 'text-gray-600'}"></i>
                            <span class="text-[10px] ${currentPage === 'login' ? 'text-green-500' : 'text-gray-600'}">Login</span>
                        </button>
                    `}
                </div>
            </div>
        </nav>
    `;
}

function handleUserSignup(e) {
    e.preventDefault();
    const name = document.getElementById('userSignupName').value;
    const email = document.getElementById('userSignupEmail').value;
    const password = document.getElementById('userSignupPassword').value;
    const phone = document.getElementById('userSignupPhone').value;

    // Get existing users or initialize empty array
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if email already exists
    if (users.some(user => user.email === email)) {
        alert('Email already registered! Please login.');
        return;
    }

    // Create new user object
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: btoa(password), // Basic encoding for demo purposes
        phone,
        addresses: [],
        orders: [],
        wishlist: []
    };

    // Add to users array
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        id: Date.now(),
        type: 'new_user',
        message: `New user registered: ${name}`,
        details: {
            userId: newUser.id,
            email: email,
            phone: phone
        },
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Auto login after signup
    sessionStorage.setItem('loggedInUser', JSON.stringify(newUser));
    renderApp();
}

function handleVendorSignup(e) {
    e.preventDefault();
    const businessName = document.getElementById('vendorSignupName').value;
    const email = document.getElementById('vendorSignupEmail').value;
    const phone = document.getElementById('vendorSignupPhone').value;
    const address = document.getElementById('vendorSignupAddress').value;

    // Create vendor application
    const vendorApplication = {
        id: Date.now().toString(),
        businessName,
        email,
        phone,
        address,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    // Store vendor application
    const vendorApplications = JSON.parse(localStorage.getItem('vendorApplications')) || [];
    vendorApplications.push(vendorApplication);
    localStorage.setItem('vendorApplications', JSON.stringify(vendorApplications));

    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        id: Date.now(),
        type: 'vendor_application',
        message: `New vendor application: ${businessName}`,
        details: vendorApplication,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Show success message
    alert('Your application has been submitted successfully! Our team will review it and contact you soon.');
    showVendorLogin();
}

function renderProfile() {
    if (!authState.isAuthenticated) {
        navigate('login');
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        navigate('login');
        return;
    }

    app.innerHTML = `
        <div class="container mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Profile Header -->
                <div class="flex items-center mb-6">
                    <div class="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold mr-4">
                        ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">${user.name || 'User'}</h2>
                        <p class="text-gray-600">${user.email}</p>
                    </div>
                </div>

                <!-- Profile Stats -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600" id="totalOrdersCount">0</div>
                        <div class="text-gray-600">Total Orders</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-yellow-600" id="pendingOrdersCount">0</div>
                        <div class="text-gray-600">Pending Orders</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-blue-600" id="wishlistCount">0</div>
                        <div class="text-gray-600">Wishlist Items</div>
                    </div>
                </div>

                <!-- Profile Tabs -->
                <div class="border-b border-gray-200 mb-6">
                    <nav class="flex space-x-4" aria-label="Profile tabs">
                        <button onclick="showProfileTab('orders')" id="ordersTab" 
                            class="px-3 py-2 text-sm font-medium text-green-600 border-b-2 border-green-600">
                            My Orders
                        </button>
                        <button onclick="showProfileTab('addresses')" id="addressesTab"
                            class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Addresses
                        </button>
                        <button onclick="showProfileTab('settings')" id="settingsTab"
                            class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Settings
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div id="profileTabContent">
                    <!-- Orders Tab (Default View) -->
                    <div id="ordersContent" class="space-y-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Recent Orders</h3>
                            <select onchange="filterOrders(this.value)" class="border rounded-md px-2 py-1">
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>
                        <div id="ordersList" class="space-y-4">
                            <!-- Orders will be loaded here -->
                        </div>
                    </div>

                    <!-- Addresses Tab -->
                    <div id="addressesContent" class="hidden space-y-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Saved Addresses</h3>
                            <button onclick="showAddAddressModal()" 
                                class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                Add New Address
                            </button>
                        </div>
                        <div id="addressesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Addresses will be loaded here -->
                        </div>
                    </div>

                    <!-- Settings Tab -->
                    <div id="settingsContent" class="hidden space-y-6">
                        <div class="max-w-md">
                            <h3 class="text-lg font-semibold mb-4">Account Settings</h3>
                            <form onsubmit="updateProfile(event)" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" id="profileName" value="${user.name || ''}"
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" id="profileEmail" value="${user.email}" readonly
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-gray-50">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="tel" id="profilePhone" value="${user.phone || ''}"
                                        class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2">
                                </div>
                                <div>
                                    <button type="submit" 
                                        class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                            <div class="mt-6 pt-6 border-t">
                                <button onclick="logout()" 
                                    class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load initial data
    loadProfileData();
    startRealTimeUpdates();
}

function showProfileTab(tabName) {
    // Hide all tab contents
    document.getElementById('ordersContent').classList.add('hidden');
    document.getElementById('addressesContent').classList.add('hidden');
    document.getElementById('settingsContent').classList.add('hidden');
    
    // Remove active state from all tabs
    document.getElementById('ordersTab').classList.remove('text-green-600', 'border-b-2', 'border-green-600');
    document.getElementById('addressesTab').classList.remove('text-green-600', 'border-b-2', 'border-green-600');
    document.getElementById('settingsTab').classList.remove('text-green-600', 'border-b-2', 'border-green-600');
    
    // Add active state to selected tab
    document.getElementById(`${tabName}Tab`).classList.add('text-green-600', 'border-b-2', 'border-green-600');
    
    // Show selected tab content
    document.getElementById(`${tabName}Content`).classList.remove('hidden');
}

function loadProfileData() {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) return;

    // Load orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === user.id);
    
    // Update stats
    document.getElementById('totalOrdersCount').textContent = userOrders.length;
    document.getElementById('pendingOrdersCount').textContent = 
        userOrders.filter(order => order.status === 'pending').length;
    document.getElementById('wishlistCount').textContent = user.wishlist?.length || 0;

    // Render orders
    renderOrders(userOrders);
    
    // Render addresses
    renderAddresses(user.addresses || []);
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                No orders found
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-semibold">Order #${order.id}</div>
                    <div class="text-sm text-gray-500">${new Date(order.date).toLocaleDateString()}</div>
                </div>
                <div class="px-3 py-1 rounded-full text-sm ${getOrderStatusColor(order.status)}">
                    ${order.status}
                </div>
            </div>
            <div class="mt-4">
                <div class="text-sm text-gray-600">Items: ${order.items.length}</div>
                <div class="font-semibold">Total: $${order.total.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

function getOrderStatusColor(status) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function renderAddresses(addresses) {
    const addressesList = document.getElementById('addressesList');
    if (!addressesList) return;

    if (addresses.length === 0) {
        addressesList.innerHTML = `
            <div class="text-center py-8 text-gray-500 col-span-2">
                No addresses saved
            </div>
        `;
        return;
    }

    addressesList.innerHTML = addresses.map((address, index) => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-medium">${address.type || 'Address'} ${index + 1}</h3>
                    <div class="text-sm text-gray-600">
                        ${address.street}
                        ${address.city}, ${address.state} ${address.zip}
                        ${address.country}
                        ${address.phone ? `<div class="mt-1">Phone: ${address.phone}</div>` : ''}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editAddress(${index})" class="text-blue-600 hover:text-blue-700">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteAddress(${index})" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterOrders(status) {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) return;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    let filteredOrders = orders.filter(order => order.userId === user.id);
    
    if (status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    renderOrders(filteredOrders);
}

function updateProfile(event) {
    event.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) return;

    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;

    // Update user data
    user.name = name;
    user.phone = phone;

    // Update in session storage
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));

    // Update in local storage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], name, phone };
        localStorage.setItem('users', JSON.stringify(users));
    }

    showToast('Profile updated successfully');
}

function renderSearch() {
    const randomTags = getRandomTrendingTags();

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-md">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <div class="flex-1 relative">
                        <div class="relative flex items-center">
                            <input type="text" 
                                   placeholder="Search products..." 
                                   class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 bg-gray-50"
                                   oninput="setSearchTerm(this.value)"
                                   value="${searchTerm || ''}">
                            <i class="fas fa-search absolute left-4 text-gray-400 text-lg"></i>
                            ${searchTerm ? `
                                <button onclick="setSearchTerm('')" 
                                        class="absolute right-4 text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Trending Tags -->
            <div class="p-6">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        <i class="fas fa-fire text-orange-500 mr-2"></i>
                        Trending Now
                    </h2>
                    <div class="flex flex-wrap gap-2">
                        ${randomTags
                            .map(
                                tag => `
                            <button onclick="setSearchTerm('${tag.name}')"
                                    class="px-4 py-2 bg-white rounded-full border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-500 hover:text-green-600 transition-all duration-200 flex items-center group">
                                <i class="fas fa-trending-up text-green-500 mr-2 group-hover:scale-110 transition-transform"></i>
                                ${tag.name}
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Search History -->
                ${
                    searchHistory.length > 0
                        ? `
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-history text-blue-500 mr-2"></i>
                                Recent Searches
                            </h2>
                            <button onclick="clearSearchHistory()" 
                                    class="text-sm text-red-500 hover:text-red-600 font-medium flex items-center">
                                <i class="fas fa-trash-alt mr-1"></i>
                                Clear All
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${searchHistory
                                .map(
                                    term => `
                                <button onclick="setSearchTerm('${term}')"
                                        class="w-full p-4 bg-gray-50 rounded-xl flex items-center text-gray-700 hover:bg-gray-100 transition-all duration-200 group">
                                    <i class="fas fa-history text-gray-400 mr-3 group-hover:text-blue-500 transition-colors"></i>
                                    <span class="flex-1 text-left">${term}</span>
                                    <i class="fas fa-search text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }
            </div>

            <!-- Search Results -->
            ${
                searchTerm
                    ? `
                <div class="px-6 pb-6">
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                            <i class="fas fa-search text-purple-500 mr-2"></i>
                            Search Results
                        </h2>
                        <div class="grid grid-cols-2 gap-4">
                            ${products
                                .filter(
                                    product =>
                                        product.name
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase()) ||
                                        product.category
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase())
                                )
                                .map(
                                    product => `
                                <div class="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200">
                                    <div class="relative">
                                        <img src="${product.image}" 
                                             alt="${product.name}" 
                                             class="w-full h-40 object-contain p-4">
                                        <button onclick="toggleWishlist(${product.id})" 
                                                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                                            <i class="fas fa-heart ${wishlist.includes(product.id) ? 'text-red-500' : 'text-gray-300'}"></i>
                                        </button>
                                    </div>
                                    <div class="p-4">
                                        <h3 class="font-medium text-gray-800 truncate">${product.name}</h3>
                                        <div class="flex items-center justify-between mt-2">
                                            <p class="text-green-600 font-bold">₹${product.price}</p>
                                            <button onclick="addToCart(${product.id})" 
                                                    class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                </div>
            `
                    : ''
            }
        </div>
    `;
}

function getRandomTrendingTags(count = 6) {
    return trendingTags.sort(() => Math.random() - 0.5).slice(0, count);
}

function setSearchTerm(term) {
    searchTerm = term;
    renderApp();
}

function clearSearchHistory() {
    searchHistory = [];
    renderApp();
}

// Add checkout functionality
function proceedToCheckout() {
    if (!authState.isAuthenticated) {
        showToast('Please login to proceed with checkout');
        navigate('login');
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        showToast('Please login to proceed with checkout');
        navigate('login');
        return;
    }

    // Create a new order
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const newOrder = {
        id: Date.now().toString(),
        userId: user.id,
        items: cart.map(item => {
            const product = products.find(p => p.id === item.id);
            return {
                ...item,
                name: product.name,
                price: product.price,
                image: product.image
            };
        }),
        total: calculateSubtotal(),
        status: 'pending',
        date: new Date().toISOString()
    };

    // Add order to orders list
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear the cart
    cart = [];
    saveCart();

    // Show success message
    showToast('Order placed successfully!');

    // Navigate to profile/orders
    navigate('profile');
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;
    
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = newQuantity;
        saveCart();
        renderCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    showToast('Item removed from cart');
}
