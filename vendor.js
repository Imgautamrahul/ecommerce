// Vendor credentials
const VENDOR_CREDENTIALS = {
    username: 'vendor',
    password: 'vendor123'
};

// Check if vendor is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('vendorLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Handle vendor login
function handleVendorLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === VENDOR_CREDENTIALS.username && password === VENDOR_CREDENTIALS.password) {
        sessionStorage.setItem('vendorLoggedIn', 'true');
        sessionStorage.setItem('showWelcome', 'true');
        loadDashboardMetrics();
    } else {
        alert('Invalid credentials!');
    }
}

// Handle vendor logout
function handleVendorLogout(event) {
    event.preventDefault();
    sessionStorage.removeItem('vendorLoggedIn');
    sessionStorage.removeItem('showWelcome');
    window.location.href = '../index.html';
}

// Initialize local storage with vendor data
function initializeLocalStorage() {
    if (!localStorage.getItem('vendorProducts')) {
        localStorage.setItem('vendorProducts', JSON.stringify([]));
    }
    if (!localStorage.getItem('vendorOrders')) {
        localStorage.setItem('vendorOrders', JSON.stringify([]));
    }
    if (!localStorage.getItem('vendorNotifications')) {
        localStorage.setItem('vendorNotifications', JSON.stringify([]));
    }
    if (!localStorage.getItem('categories')) {
        localStorage.setItem('categories', JSON.stringify([]));
    }
    if (!localStorage.getItem('subcategories')) {
        localStorage.setItem('subcategories', JSON.stringify([]));
    }
}

// DOM Elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.sidebar nav a');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        if (link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });

            // Add active class to clicked link
            link.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
                loadSectionData(targetId);
            }

            // Close sidebar on mobile when clicking a link
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                const menuToggle = document.getElementById('mobile-menu-toggle');
                
                if (sidebar && overlay) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    if (menuToggle) {
                        menuToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        }
    });
});

// Load section data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardMetrics();
            loadNotifications();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'categories':
            loadCategories();
            loadParentCategoryOptions();
            break;
        case 'settings':
            // Handle settings if needed
            break;
    }
}

// Dashboard Functions
function loadDashboardMetrics() {
    const vendorProducts = JSON.parse(localStorage.getItem('vendorProducts')) || [];
    const vendorOrders = JSON.parse(localStorage.getItem('vendorOrders')) || [];
    const totalSales = calculateTotalSales(vendorOrders);

    document.getElementById('total-products').textContent = vendorProducts.length;
    document.getElementById('active-orders').textContent = vendorOrders.filter(
        order => ['pending', 'shipped'].includes(order.status)
    ).length;
    document.getElementById('total-sales').textContent = `₹${totalSales}`;
}

function calculateTotalSales(orders) {
    return orders.reduce((total, order) => total + order.payment.total, 0).toFixed(2);
}

function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('vendorNotifications')) || [];
    const notificationsList = document.getElementById('notifications-list');

    notificationsList.innerHTML = '';
    notifications.slice(0, 5).forEach(notification => {
        const div = document.createElement('div');
        div.className = 'notification-item';
        div.innerHTML = `
            <i class="fas ${notification.icon}"></i>
            <span>${notification.message}</span>
            <small>${new Date(notification.timestamp).toLocaleString()}</small>
        `;
        notificationsList.appendChild(div);
    });
}

// Product Management Functions
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('vendorProducts')) || [];
    const productsContainer = document.getElementById('products-container');

    productsContainer.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="products-table-body"></tbody>
        </table>
    `;

    const tableBody = document.getElementById('products-table-body');
    products.forEach((product, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${product.images && product.images[0] ? product.images[0] : '../assets/images/placeholder.jpg'}" 
                     alt="${product.name}"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            </td>
            <td>${product.name}</td>
            <td>₹${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.category || 'N/A'}</td>
            <td>
                <button onclick="editProduct(${index})" class="btn btn-primary btn-sm">Edit</button>
                <button onclick="deleteProduct(${index})" class="btn btn-danger btn-sm">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Image handling functions
let productImages = [];

function handleImageUpload(input) {
    const maxImages = 10;
    const imagePreview = document.getElementById('image-preview');
    const countDisplay = document.getElementById('selected-images-count');
    
    if (input.files.length + productImages.length > maxImages) {
        alert(`You can only upload up to ${maxImages} images. Please remove some images first.`);
        input.value = '';
        return;
    }

    Array.from(input.files).forEach(file => {
        if (productImages.length >= maxImages) {
            alert(`Maximum ${maxImages} images allowed`);
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please upload only image files');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            productImages.push(e.target.result);
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    });

    input.value = '';
}

function updateImagePreview() {
    const imagePreview = document.getElementById('image-preview');
    const countDisplay = document.getElementById('selected-images-count');
    
    imagePreview.innerHTML = productImages.map((image, index) => `
        <div class="position-relative" style="width: 100px; height: 100px;">
            <img src="${image}" 
                 class="img-thumbnail" 
                 style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" 
                    class="btn btn-danger btn-sm position-absolute top-0 end-0"
                    onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    countDisplay.textContent = `Selected images: ${productImages.length}/10`;
}

function removeImage(index) {
    productImages.splice(index, 1);
    updateImagePreview();
}

// Product Modal Functions
function openAddProductModal() {
    const productModal = document.getElementById('productModal');
    if (!productModal) {
        console.error('Product modal not found');
        return;
    }

    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    productImages = [];
    updateImagePreview();
    
    loadProductCategories();

    const modal = new bootstrap.Modal(productModal);
    modal.show();
}

function saveProduct() {
    const productId = document.getElementById('product-id').value;
    const productName = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const category = document.getElementById('product-category').value;
    
    if (!productName || !description || !price || !stock || !category) {
        alert('Please fill in all required fields');
        return;
    }

    if (productImages.length === 0) {
        alert('Please upload at least one product image');
        return;
    }

    const products = JSON.parse(localStorage.getItem('vendorProducts')) || [];
    const newProduct = {
        id: productId || Date.now().toString(),
        name: productName,
        description,
        price,
        stock,
        category,
        images: productImages,
        vendorId: 'vendor123'
    };

    if (productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            products[index] = newProduct;
        }
    } else {
        products.push(newProduct);
    }

    localStorage.setItem('vendorProducts', JSON.stringify(products));
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    loadProducts();
    addNotification(`Product ${productId ? 'updated' : 'added'} successfully`, 'fa-box');
}

// Edit and Delete Product Functions
function editProduct(index) {
    const products = JSON.parse(localStorage.getItem('vendorProducts')) || [];
    const product = products[index];

    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-category').value = product.category || '';
    
    productImages = product.images || [];
    updateImagePreview();

    loadProductCategories();
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function deleteProduct(index) {
    if (confirm('Are you sure you want to delete this product?')) {
        const products = JSON.parse(localStorage.getItem('vendorProducts')) || [];
        const productName = products[index].name;
        products.splice(index, 1);
        localStorage.setItem('vendorProducts', JSON.stringify(products));
        addNotification('Product deleted: ' + productName, 'fa-trash');
        loadProducts();
        loadDashboardMetrics();
    }
}

// Category Management Functions
function openAddCategoryModal() {
    // Clear form fields
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryIcon').value = '';
    document.getElementById('parentCategory').value = '';
    
    // Load parent categories
    loadParentCategories();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
}

function loadParentCategories() {
    const select = document.getElementById('parentCategory');
    select.innerHTML = '<option value="">None (Create Main Category)</option>';
    
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    categories.forEach(category => {
        if (!category.parentId) { // Only main categories can be parents
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        }
    });
}

function saveCategory() {
    const categoryName = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const parentId = document.getElementById('parentCategory').value;
    const icon = document.getElementById('categoryIcon').value.trim();
    const categoryId = document.getElementById('categoryForm').dataset.categoryId;

    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }

    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    if (categoryId) {
        // Update existing category
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                name: categoryName,
                description: description,
                icon: icon || 'fas fa-tag',
                parentId: parentId || null,
                vendorId: sessionStorage.getItem('vendorId')
            };
        }
    } else {
        // Add new category
        const newCategory = {
            id: Date.now().toString(),
            name: categoryName,
            description: description,
            icon: icon || 'fas fa-tag',
            parentId: parentId || null,
            vendorId: sessionStorage.getItem('vendorId')
        };
        categories.push(newCategory);
    }

    localStorage.setItem('categories', JSON.stringify(categories));

    // If it's a subcategory, add it to subcategories list
    if (parentId) {
        const subcategories = JSON.parse(localStorage.getItem('subcategories') || '[]');
        if (!categoryId) {
            subcategories.push({
                id: Date.now().toString(),
                name: categoryName,
                parentId: parentId,
                vendorId: sessionStorage.getItem('vendorId')
            });
            localStorage.setItem('subcategories', JSON.stringify(subcategories));
        }
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
    modal.hide();

    // Refresh categories list
    loadCategories();
    
    // Show success message
    showToast('Category saved successfully');
}

function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    const subcategoriesList = document.getElementById('subcategories-list');
    
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const vendorId = sessionStorage.getItem('vendorId');
    
    // Filter categories for this vendor
    const vendorCategories = categories.filter(cat => !cat.parentId);
    
    // Render main categories with enhanced styling
    categoriesList.innerHTML = vendorCategories.map(category => `
        <div class="list-group-item d-flex justify-content-between align-items-center hover:bg-gray-50">
            <div class="d-flex align-items-center">
                <div class="category-icon">
                    <i class="${category.icon || 'fas fa-tag'} text-primary"></i>
                </div>
                <div class="ms-3">
                    <h5 class="mb-0 fw-medium">${category.name}</h5>
                    ${category.description ? `
                        <small class="text-muted d-block mt-1">${category.description}</small>
                    ` : ''}
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick="editCategory('${category.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteCategory('${category.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Get subcategories
    const subcategories = JSON.parse(localStorage.getItem('subcategories') || '[]');
    
    // Render subcategories with enhanced styling
    subcategoriesList.innerHTML = subcategories.map(subcategory => {
        const parentCategory = categories.find(cat => cat.id === subcategory.parentId);
        return `
            <div class="list-group-item d-flex justify-content-between align-items-center hover:bg-gray-50">
                <div class="d-flex align-items-center">
                    <div class="category-icon">
                        <i class="${subcategory.icon || 'fas fa-tag'} text-secondary"></i>
                    </div>
                    <div class="ms-3">
                        <h5 class="mb-0 fw-medium">${subcategory.name}</h5>
                        <small class="text-muted d-block mt-1">
                            Parent: ${parentCategory ? parentCategory.name : 'Unknown'}
                        </small>
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary rounded-pill me-1" onclick="editCategory('${subcategory.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="deleteCategory('${subcategory.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function openAddCategoryModal() {
    // Clear form fields
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryIcon').value = '';
    document.getElementById('parentCategory').value = '';
    
    // Load parent categories
    loadParentCategories();
    
    // Show modal with enhanced styling
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();

    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.classList.add('ripple');
    });
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const subcategories = JSON.parse(localStorage.getItem('subcategories') || '[]');
        
        // Remove the category
        const updatedCategories = categories.filter(cat => cat.id !== categoryId);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        // Remove any subcategories
        const updatedSubcategories = subcategories.filter(sub => sub.parentId !== categoryId);
        localStorage.setItem('subcategories', JSON.stringify(updatedSubcategories));
        
        loadCategories();
        showToast('Category deleted successfully');
    }
}

function loadParentCategoryOptions() {
    const select = document.getElementById('parent-category');
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    const mainCategories = categories.filter(cat => !cat.parentId);
    select.innerHTML = `
        <option value="">None (Main Category)</option>
        ${mainCategories.map(cat => `
            <option value="${cat.id}">${cat.name}</option>
        `).join('')}
    `;
}

// Order Management Functions
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('vendorOrders')) || [];
    const ordersContainer = document.getElementById('orders-container');

    ordersContainer.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Orders Management</h5>
                <div class="btn-group">
                    <button class="btn btn-outline-secondary btn-sm" onclick="filterOrders('all')">All</button>
                    <button class="btn btn-outline-warning btn-sm" onclick="filterOrders('pending')">Pending</button>
                    <button class="btn btn-outline-info btn-sm" onclick="filterOrders('shipped')">Shipped</button>
                    <button class="btn btn-outline-success btn-sm" onclick="filterOrders('delivered')">Delivered</button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="orders-table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    renderOrdersTable(orders);
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    tableBody.innerHTML = '';
    
    orders.forEach((order, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="fw-medium">${order.orderId}</span>
                <br>
                <small class="text-muted">${new Date(order.orderDate).toLocaleDateString()}</small>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div>
                        <div class="fw-medium">${order.shipping.fullName}</div>
                        <div class="text-muted small">${order.shipping.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="badge bg-light text-dark">${order.items.length} items</span>
                    <button class="btn btn-link btn-sm" onclick="viewOrderItems(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
            <td>
                <div class="fw-medium">₹${order.payment.total.toFixed(2)}</div>
                <small class="text-muted">${order.payment.method}</small>
            </td>
            <td>
                <span class="badge bg-${getStatusColor(order.status)}">
                    ${order.status.toUpperCase()}
                </span>
            </td>
            <td>
                <div class="text-muted small">
                    ${new Date(order.orderDate).toLocaleString()}
                </div>
            </td>
            <td>
                <div class="btn-group">
                    <button onclick="viewOrderDetails(${index})" class="btn btn-info btn-sm" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="updateOrderStatus(${index})" class="btn btn-primary btn-sm" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function filterOrders(status) {
    const orders = JSON.parse(localStorage.getItem('vendorOrders')) || [];
    const filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
    renderOrdersTable(filteredOrders);
}

// Settings Functions
function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (currentPassword !== VENDOR_CREDENTIALS.password) {
        alert('Current password is incorrect');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }
    
    VENDOR_CREDENTIALS.password = newPassword;
    localStorage.setItem('vendorPassword', newPassword);
    
    e.target.reset();
    alert('Password updated successfully!');
    addNotification('Password was updated', 'fa-key');
}

// Utility Functions
function addNotification(message, icon) {
    const notifications = JSON.parse(localStorage.getItem('vendorNotifications')) || [];
    notifications.unshift({
        message,
        icon: icon || 'fa-info-circle',
        timestamp: new Date().toISOString()
    });

    if (notifications.length > 20) {
        notifications.pop();
    }

    localStorage.setItem('vendorNotifications', JSON.stringify(notifications));
    loadNotifications();
}

// Initialize mobile menu functionality
function initializeMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', 
                sidebar.classList.contains('active'));
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!checkAuth()) {
        return;
    }

    // Initialize local storage
    initializeLocalStorage();

    // Initialize mobile menu
    initializeMobileMenu();

    // Load initial data
    loadDashboardMetrics();
    loadProducts();
    loadCategories();
    loadOrders();

    // Add navigation event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    // Show welcome notification if needed
    const showWelcome = sessionStorage.getItem('showWelcome');
    if (showWelcome === 'true') {
        addNotification('Welcome back to your vendor dashboard!', 'fas fa-smile-beam');
        sessionStorage.removeItem('showWelcome');
    }
});

// Update the showSection function
function showSection(targetId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const targetSection = document.getElementById(targetId);
    const targetLink = document.querySelector(`a[href="#${targetId}"]`);
    
    if (targetSection && targetLink) {
        targetSection.classList.add('active');
        targetLink.classList.add('active');
        
        // Load section specific data
        if (targetId === 'dashboard') {
            loadDashboardMetrics();
        } else if (targetId === 'products') {
            loadProducts();
        } else if (targetId === 'categories') {
            loadCategories();
        } else if (targetId === 'orders') {
            loadOrders();
        }
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            if (sidebar && mobileMenuToggle) {
                sidebar.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        }
    }
}

// Update the navigation event listeners
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        showSection(targetId);
    });
});

// Add these category management functions
function loadCategories() {
    const categoriesList = document.getElementById('categories-list');
    const subcategoriesList = document.getElementById('subcategories-list');
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    if (categoriesList) {
        categoriesList.innerHTML = categories
            .filter(cat => !cat.parentId)
            .map(category => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${category.name}</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editCategory('${category.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${category.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    }
    
    if (subcategoriesList) {
        subcategoriesList.innerHTML = categories
            .filter(cat => cat.parentId)
            .map(subcategory => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${subcategory.name} (${getParentCategoryName(subcategory.parentId)})</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editCategory('${subcategory.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${subcategory.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
    }
}

function getParentCategoryName(parentId) {
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '';
}

function loadParentCategoryOptions() {
    const select = document.getElementById('parent-category');
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    const mainCategories = categories.filter(cat => !cat.parentId);
    select.innerHTML = `
        <option value="">None (Main Category)</option>
        ${mainCategories.map(cat => `
            <option value="${cat.id}">${cat.name}</option>
        `).join('')}
    `;
}

// Add this initialization function
function initializeVendorDashboard() {
    // Initialize local storage
    if (!localStorage.getItem('vendorProducts')) {
        localStorage.setItem('vendorProducts', JSON.stringify([]));
    }
    if (!localStorage.getItem('vendorOrders')) {
        localStorage.setItem('vendorOrders', JSON.stringify([]));
    }
    if (!localStorage.getItem('vendorNotifications')) {
        localStorage.setItem('vendorNotifications', JSON.stringify([]));
    }
    if (!localStorage.getItem('categories')) {
        localStorage.setItem('categories', JSON.stringify([]));
    }
    if (!localStorage.getItem('subcategories')) {
        localStorage.setItem('subcategories', JSON.stringify([]));
    }

    // Load initial data
    loadDashboardMetrics();
    loadNotifications();

    // Add event listeners for navigation
    const navLinks = document.querySelectorAll('.sidebar nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetSection = document.querySelector(link.getAttribute('href'));
            showSection(targetSection);
            loadSectionData(targetSection.id);
            
            // On mobile, close the menu after navigation
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
                document.getElementById('mobile-menu-toggle').setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Show welcome message if needed
    if (sessionStorage.getItem('showWelcome') === 'true') {
        addNotification('Welcome to Vendor Dashboard!', 'fa-smile');
        sessionStorage.removeItem('showWelcome');
    }
}