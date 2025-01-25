// Logout function
function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    window.location.href = 'profile.html';
}

// Add sample data to the table
document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.querySelector('tbody');
    const sampleOrders = [
        { id: '#ORD001', customer: 'John Doe', product: 'iPhone 13', amount: '₹72,999', status: 'Delivered' },
        { id: '#ORD002', customer: 'Jane Smith', product: 'MacBook Air', amount: '₹94,999', status: 'Processing' },
        { id: '#ORD003', customer: 'Mike Johnson', product: 'AirPods Pro', amount: '₹24,999', status: 'Shipped' },
        { id: '#ORD004', customer: 'Sarah Williams', product: 'iPad Pro', amount: '₹81,999', status: 'Pending' },
    ];

    sampleOrders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.product}</td>
            <td>${order.amount}</td>
            <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
            <td>
                <button class="action-btn">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
});

// Fetch admin stats with error handling and loading states
async function fetchAdminStats() {
    const statElements = document.querySelectorAll('.stat-card');
    
    try {
        // Show loading state
        statElements.forEach(el => {
            el.querySelector('.stat-value').textContent = 'Loading...';
        });

        const token = localStorage.getItem('adminToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        
        const stats = await response.json();
        updateDashboardStats(stats);
        
        // Update last refresh time
        document.getElementById('lastRefresh').textContent = 
            `Last updated: ${new Date().toLocaleTimeString()}`;
            
    } catch (error) {
        console.error('Error fetching stats:', error);
        // Show error state
        statElements.forEach(el => {
            el.querySelector('.stat-value').textContent = 'Error loading data';
        });
        
        // If unauthorized, redirect to login
        if (error.message.includes('401') || error.message.includes('403')) {
            window.location.href = 'profile.html#signin';
        }
    }
}

// Update dashboard with stats and animations
function updateDashboardStats(stats) {
    // Orders
    animateValue(
        document.querySelector('[data-stat="orders"] .stat-value'),
        stats.orders
    );
    
    // Revenue
    animateValue(
        document.querySelector('[data-stat="revenue"] .stat-value'),
        stats.revenue,
        true
    );
    
    // Users
    animateValue(
        document.querySelector('[data-stat="users"] .stat-value'),
        stats.users
    );
    
    // Products
    animateValue(
        document.querySelector('[data-stat="products"] .stat-value'),
        stats.products
    );
}

// Animate number changes
function animateValue(element, value, isCurrency = false) {
    const duration = 1000; // Animation duration in milliseconds
    const start = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
    const end = value;
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (range * progress));
        element.textContent = isCurrency 
            ? `₹${current.toLocaleString()}`
            : current.toLocaleString();
            
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Auto refresh stats every 5 minutes
setInterval(fetchAdminStats, 5 * 60 * 1000);

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
        window.location.href = 'profile.html';
        return;
    }
    
    // Initial fetch
    fetchAdminStats();
    
    // Add refresh button functionality
    document.getElementById('refreshStats')?.addEventListener('click', () => {
        fetchAdminStats();
    });

    // Add event listeners for navigation
    document.querySelector('.nav-item i.fa-users')?.parentElement?.addEventListener('click', (e) => {
        e.preventDefault();
        showCustomers();
    });

    document.querySelector('.nav-item i.fa-box')?.parentElement?.addEventListener('click', (e) => {
        e.preventDefault();
        showProducts();
    });

    document.querySelector('.nav-item i.fa-store')?.parentElement?.addEventListener('click', (e) => {
        e.preventDefault();
        showVendors();
    });

    // Initial load of vendors to update badge count
    fetchVendorCount();
});

// Function to fetch vendor count for badge
async function fetchVendorCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/admin/vendors', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendors');
        }

        const data = await response.json();
        const pendingVendors = data.vendors.filter(v => !v.isVerified).length;
        
        // Update badge count
        const badge = document.getElementById('vendorRequestCount');
        if (badge) {
            badge.textContent = pendingVendors;
            badge.style.display = pendingVendors > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error fetching vendor count:', error);
        // If unauthorized, redirect to login
        if (error.message.includes('401') || error.message.includes('403')) {
            window.location.href = 'profile.html#signin';
        }
    }
}

// Function to show dashboard
function showDashboard() {
    // Hide all sections
    document.querySelectorAll('.dashboard-content > div').forEach(section => {
        section.style.display = 'none';
    });

    // Show stats grid and recent activity
    document.querySelector('.stats-grid').style.display = 'grid';
    document.querySelector('.refresh-section').style.display = 'block';

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item i.fa-home').parentElement.classList.add('active');

    // Refresh stats
    fetchAdminStats();
}

// Function to show customers section
async function showCustomers() {
    try {
        const token = localStorage.getItem('token');
        const adminAuth = localStorage.getItem('adminAuth');
        
        if (!token || !adminAuth) {
            window.location.href = 'profile.html';
            return;
        }

        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customers');
        }

        const data = await response.json();
        // TODO: Implement customers display logic
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Add search functionality
const searchInput = document.getElementById('customerSearch');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#customersList tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Function to show products section
async function showProducts() {
    // Hide other sections
    const allSections = document.querySelectorAll('.dashboard-content > div');
    allSections.forEach(section => {
        section.style.display = 'none';
    });

    // Show products section
    const productsSection = document.getElementById('productsSection');
    productsSection.style.display = 'block';

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item i.fa-box').parentElement.classList.add('active');

    await fetchAndDisplayProducts();
}

// Fetch and display products
async function fetchAndDisplayProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading products...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            productsList.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-box"></i>
                            <p>No products found</p>
                            <button class="add-btn" onclick="showAddProductModal()">
                                Add Your First Product
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        productsList.innerHTML = data.products.map(product => `
            <tr>
                <td>
                    <div class="product-image-cell">
                        <img src="${product.image || 'placeholder.jpg'}" 
                             alt="${product.name}" 
                             class="product-thumbnail"
                             onerror="this.src='placeholder.jpg'">
                    </div>
                </td>
                <td>
                    <div class="product-info-cell">
                    <div class="product-name">${product.name}</div>
                        <div class="product-description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</div>
                    </div>
                </td>
                <td>
                    <div class="category-cell">
                        <div class="category">${product.category}</div>
                        ${product.subcategory ? `<div class="subcategory">${product.subcategory}</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="price-cell">
                        <div class="general-price">₹${product.price}</div>
                        ${product.creditPrice ? `<div class="credit-price">Credit: ₹${product.creditPrice}</div>` : ''}
                    </div>
                </td>
                <td>
                    <div class="stock-cell">
                        <span class="stock-badge ${getStockStatusClass(product.stock)}">
                        ${getStockStatusText(product.stock)}
                    </span>
                        <div class="stock-count">${product.stock || 0} units</div>
                    </div>
                </td>
                <td class="action-buttons">
                    <button class="action-btn view-btn" title="View Details" onclick="viewProduct('${product._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Edit Product" onclick="editProduct('${product._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete Product" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add CSS styles for the table
        const style = document.createElement('style');
        style.textContent = `
            .product-image-cell img {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 4px;
            }
            .product-info-cell {
                padding: 8px 0;
            }
            .product-name {
                font-weight: bold;
                margin-bottom: 4px;
            }
            .product-description {
                font-size: 0.9em;
                color: #666;
            }
            .category-cell {
                padding: 4px 0;
            }
            .category {
                font-weight: 500;
            }
            .subcategory {
                font-size: 0.9em;
                color: #666;
                margin-top: 2px;
            }
            .price-cell {
                padding: 4px 0;
            }
            .general-price {
                font-weight: bold;
                color: #2c5282;
            }
            .credit-price {
                font-size: 0.9em;
                color: #666;
                margin-top: 2px;
            }
            .stock-cell {
                padding: 4px 0;
            }
            .stock-badge {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 500;
            }
            .stock-count {
                font-size: 0.9em;
                color: #666;
                margin-top: 4px;
            }
            .out-of-stock {
                background-color: #FED7D7;
                color: #C53030;
            }
            .low-stock {
                background-color: #FEEBC8;
                color: #C05621;
            }
            .in-stock {
                background-color: #C6F6D5;
                color: #2F855A;
            }
            .action-buttons {
                display: flex;
                gap: 8px;
            }
            .action-btn {
                padding: 6px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .view-btn {
                background-color: #EBF8FF;
                color: #3182CE;
            }
            .edit-btn {
                background-color: #F0FFF4;
                color: #38A169;
            }
            .delete-btn {
                background-color: #FFF5F5;
                color: #E53E3E;
            }
            .action-btn:hover {
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);

    } catch (error) {
        console.error('Error:', error);
        productsList.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load products: ${error.message}</p>
                        <button onclick="fetchAndDisplayProducts()" class="retry-btn">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Helper functions for stock status
function getStockStatusClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
}

function getStockStatusText(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
}

// Add CKEditor initialization
let editor = null;

function initCKEditor() {
    if (typeof ClassicEditor === 'undefined') {
        console.error('CKEditor is not loaded');
        return;
    }

    // Destroy existing editor if it exists
    if (editor) {
        editor.destroy().catch(error => {
            console.error('Error destroying editor:', error);
        });
    }

    // Initialize CKEditor
    ClassicEditor
        .create(document.querySelector('#productDescription'), {
            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'undo', 'redo'],
            heading: {
                options: [
                    { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                    { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                    { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                    { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                ]
            },
            placeholder: 'Start typing your product description...'
        })
        .then(newEditor => {
            editor = newEditor;
        })
        .catch(error => {
            console.error('Error initializing CKEditor:', error);
        });
}

// Add image preview functionality
document.getElementById('productImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
});

// Add common modal styles
const commonModalStyles = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.3s ease;
    }

    .modal-content {
        background-color: #fff;
        margin: 5% auto;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        position: relative;
        animation: slideIn 0.3s ease;
        max-height: 85vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
        margin: 0;
        color: #2d3748;
        font-size: 1.5rem;
    }

    .close-btn {
        position: absolute;
        right: 15px;
        top: 15px;
        font-size: 24px;
        cursor: pointer;
        background: none;
        border: none;
        color: #666;
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: #000;
    }

    .form-group {
        margin-bottom: 15px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #4a5568;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        border-color: #3182ce;
        box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        outline: none;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }

    .submit-btn,
    .cancel-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    .submit-btn {
        background-color: #3182ce;
        color: white;
    }

    .submit-btn:hover {
        background-color: #2c5282;
    }

    .cancel-btn {
        background-color: #edf2f7;
        color: #4a5568;
    }

    .cancel-btn:hover {
        background-color: #e2e8f0;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    /* File upload styles */
    .file-upload-container {
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .file-upload-container:hover {
        border-color: #3182ce;
        background-color: #ebf8ff;
    }

    .file-upload-container i {
        font-size: 24px;
        color: #4a5568;
        margin-bottom: 8px;
    }

    .image-preview {
        margin-top: 15px;
        text-align: center;
    }

    .image-preview img {
        max-width: 200px;
        max-height: 200px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
`;

// Function to apply common modal styles
function applyModalStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = commonModalStyles;
    document.head.appendChild(styleElement);
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', applyModalStyles);

// Update showAddProductModal function
function showAddProductModal() {
    const modal = document.getElementById('addProductModal');
    modal.style.display = 'block';
    initCKEditor();
}

// Update showAddSubcategoryModal function
function showAddSubcategoryModal() {
    const modal = document.getElementById('addSubcategoryModal');
    const parentCategorySelect = document.getElementById('parentCategory');
    
    // Load parent categories
    loadParentCategories(parentCategorySelect);
    
    modal.style.display = 'block';
}

// Update closeAddProductModal function
function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    modal.style.display = 'none';
    document.getElementById('addProductForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    if (editor) {
        editor.setData('');
    }
}

// Update closeAddSubcategoryModal function
function closeAddSubcategoryModal() {
    const modal = document.getElementById('addSubcategoryModal');
    modal.style.display = 'none';
    document.getElementById('addSubcategoryForm').reset();
}

// Function to show vendors section
async function showVendors() {
    // Hide all sections
    document.querySelectorAll('.dashboard-content > div').forEach(section => {
        section.style.display = 'none';
    });

    // Show vendors section
    document.getElementById('vendorsSection').style.display = 'block';

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item i.fa-store').parentElement.classList.add('active');

    try {
        const token = localStorage.getItem('token');
        const adminAuth = localStorage.getItem('adminAuth');
        
        if (!token || !adminAuth) {
            window.location.href = 'profile.html';
            return;
        }

        const response = await fetch('http://localhost:5000/api/admin/vendors', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendors');
        }

        const data = await response.json();
    const vendorsList = document.getElementById('vendorsList');
        
        if (data.vendors.length === 0) {
        vendorsList.innerHTML = `
            <tr>
                    <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-store"></i>
                            <p>No vendors found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

        vendorsList.innerHTML = data.vendors.map(vendor => `
        <tr>
            <td>
                    <div class="vendor-info-cell">
                        <div class="vendor-name">${vendor.businessName}</div>
                        <div class="vendor-owner">${vendor.name || 'N/A'}</div>
                </div>
            </td>
            <td>
                    <div class="contact-info-cell">
                        <div class="vendor-email">${vendor.businessEmail}</div>
                        <div class="vendor-phone">${vendor.businessPhone || 'N/A'}</div>
                    </div>
            </td>
                <td>
                    <div class="business-info-cell">
                        <div class="business-category">${vendor.businessCategory || 'N/A'}</div>
                        <div class="business-address">${vendor.businessAddress?.city || 'N/A'}</div>
                    </div>
                </td>
                <td>
                    <div class="status-cell">
                        <span class="status-badge ${vendor.status === 'approved' ? 'status-approved' : 'status-pending'}">
                            ${vendor.status || 'Pending'}
                </span>
                    </div>
                </td>
                <td>
                    <div class="metrics-cell">
                        <div class="rating">${vendor.rating ? vendor.rating.toFixed(1) + ' ★' : 'No ratings'}</div>
                        <div class="products-count">${vendor.products?.length || 0} products</div>
                    </div>
            </td>
            <td class="action-buttons">
                    <button class="action-btn view-btn" title="View Details" onclick="viewVendorDetails('${vendor._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                    <button class="action-btn edit-btn" title="Edit Vendor" onclick="editVendor('${vendor._id}')">
                        <i class="fas fa-edit"></i>
                </button>
                    <button class="action-btn ${vendor.status === 'pending' ? 'approve-btn' : 'block-btn'}" 
                            title="${vendor.status === 'pending' ? 'Approve Vendor' : 'Block Vendor'}"
                            onclick="${vendor.status === 'pending' ? 'approveVendor' : 'blockVendor'}('${vendor._id}')">
                        <i class="fas ${vendor.status === 'pending' ? 'fa-check' : 'fa-ban'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add CSS styles for the vendor table
        const style = document.createElement('style');
        style.textContent = `
            .vendor-info-cell {
                padding: 8px 0;
            }
            .vendor-name {
                font-weight: bold;
                margin-bottom: 4px;
            }
            .vendor-owner {
                font-size: 0.9em;
                color: #666;
            }
            .contact-info-cell {
                padding: 4px 0;
            }
            .vendor-email {
                color: #2c5282;
                margin-bottom: 4px;
            }
            .vendor-phone {
                font-size: 0.9em;
                color: #666;
            }
            .business-info-cell {
                padding: 4px 0;
            }
            .business-category {
                font-weight: 500;
                margin-bottom: 4px;
            }
            .business-address {
                font-size: 0.9em;
                color: #666;
            }
            .status-cell {
                padding: 4px 0;
            }
            .status-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 500;
            }
            .status-approved {
                background-color: #C6F6D5;
                color: #2F855A;
            }
            .status-pending {
                background-color: #FEEBC8;
                color: #C05621;
            }
            .metrics-cell {
                padding: 4px 0;
            }
            .rating {
                font-weight: bold;
                color: #2c5282;
                margin-bottom: 4px;
            }
            .products-count {
                font-size: 0.9em;
                color: #666;
            }
            .action-buttons {
                display: flex;
                gap: 8px;
            }
            .action-btn {
                padding: 6px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .view-btn {
                background-color: #EBF8FF;
                color: #3182CE;
            }
            .edit-btn {
                background-color: #F0FFF4;
                color: #38A169;
            }
            .approve-btn {
                background-color: #C6F6D5;
                color: #2F855A;
            }
            .block-btn {
                background-color: #FED7D7;
                color: #C53030;
            }
            .action-btn:hover {
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);

    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Function to view vendor details
function viewVendorDetails(vendorId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };

    // Show loading state
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading vendor details...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Fetch and display vendor details
    fetch('http://localhost:5000/api/admin/vendors', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const vendor = data.vendors.find(v => v._id === vendorId);
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Vendor Details</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="vendor-details">
                    <div class="vendor-info">
                        <h3>${vendor.businessName}</h3>
                        <div class="info-grid">
                            <div class="info-group">
                                <label>Owner Name</label>
                                <p>${vendor.name || 'N/A'}</p>
                            </div>
                            <div class="info-group">
                                <label>Email</label>
                                <p>${vendor.businessEmail}</p>
                            </div>
                            <div class="info-group">
                                <label>Phone</label>
                                <p>${vendor.businessPhone || 'N/A'}</p>
                            </div>
                            <div class="info-group">
                                <label>Category</label>
                                <p>${vendor.businessCategory || 'N/A'}</p>
                            </div>
                            <div class="info-group">
                                <label>Status</label>
                                <p><span class="status-badge ${vendor.status === 'approved' ? 'status-approved' : 'status-pending'}">
                                    ${vendor.status || 'Pending'}
                                </span></p>
                            </div>
                            <div class="info-group">
                                <label>Rating</label>
                                <p>${vendor.rating ? vendor.rating.toFixed(1) + ' ★' : 'No ratings'}</p>
                            </div>
                            <div class="info-group">
                                <label>Products</label>
                                <p>${vendor.products?.length || 0} products</p>
                            </div>
                            <div class="info-group">
                                <label>Member Since</label>
                                <p>${new Date(vendor.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        ${vendor.businessAddress ? `
                            <div class="address-section">
                                <h4>Business Address</h4>
                                <p>${vendor.businessAddress.street || ''}</p>
                                <p>${vendor.businessAddress.city || ''}</p>
                                <p>${vendor.businessAddress.state || ''} ${vendor.businessAddress.postalCode || ''}</p>
                            </div>
                ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="edit-btn" onclick="editVendor('${vendor._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn ${vendor.status === 'pending' ? 'approve-btn' : 'block-btn'}"
                            onclick="${vendor.status === 'pending' ? 'approveVendor' : 'blockVendor'}('${vendor._id}')">
                        <i class="fas ${vendor.status === 'pending' ? 'fa-check' : 'fa-ban'}"></i>
                        ${vendor.status === 'pending' ? 'Approve' : 'Block'}
                    </button>
                </div>
            </div>
        `;

        // Add styles for vendor details modal
        const style = document.createElement('style');
        style.textContent = `
            .vendor-details {
                padding: 20px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-top: 20px;
            }
            .info-group {
                margin-bottom: 15px;
            }
            .info-group label {
                display: block;
                font-size: 0.9em;
                color: #666;
                margin-bottom: 5px;
            }
            .info-group p {
                font-weight: 500;
                margin: 0;
            }
            .address-section {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .address-section h4 {
                margin-bottom: 10px;
                color: #2d3748;
            }
            .address-section p {
                margin: 5px 0;
                color: #4a5568;
            }
        `;
        document.head.appendChild(style);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to load vendor details', 'error');
        modal.remove();
    });
}

// Function to approve vendor
async function approveVendor(vendorId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:5000/api/admin/vendors/${vendorId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to approve vendor');
        }

        showNotification('Vendor approved successfully!', 'success');
        await showVendors(); // Refresh the vendors list
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Function to block vendor
async function blockVendor(vendorId) {
    if (!confirm('Are you sure you want to block this vendor?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:5000/api/admin/vendors/${vendorId}/block`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to block vendor');
        }

        showNotification('Vendor blocked successfully!', 'success');
        await showVendors(); // Refresh the vendors list
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Function to show subcategories section
function showSubcategories() {
    // Hide all sections
    document.querySelectorAll('.dashboard-content > div').forEach(section => {
        section.style.display = 'none';
    });

    // Show subcategories section
    document.getElementById('subcategoriesSection').style.display = 'block';

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item i.fa-tag').parentElement.classList.add('active');

    // Load subcategories
    fetchAndDisplaySubcategories();
}

// Function to fetch and display subcategories
async function fetchAndDisplaySubcategories() {
    const subcategoriesList = document.getElementById('subcategoriesList');
    subcategoriesList.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading subcategories...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        const token = localStorage.getItem('token');
        const adminAuth = localStorage.getItem('adminAuth');
        
        if (!token || !adminAuth) {
            window.location.href = 'profile.html';
            return;
        }

        // Fetch all products to get unique categories and subcategories
        const response = await fetch('http://localhost:5000/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subcategories');
        }

        const data = await response.json();
        const categoryMap = new Map();

        // Process products to extract unique categories and subcategories
        data.products.forEach(product => {
            if (product.category) {
                if (!categoryMap.has(product.category)) {
                    categoryMap.set(product.category, new Set());
                }
                if (product.subcategory) {
                    categoryMap.get(product.category).add(product.subcategory);
                }
            }
        });

        const allSubcategories = [];
        categoryMap.forEach((subcategories, category) => {
            subcategories.forEach(subcategory => {
                allSubcategories.push({
                    name: subcategory,
                    parentCategory: category
                });
            });
        });

        if (allSubcategories.length === 0) {
            subcategoriesList.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            <i class="fas fa-tag"></i>
                            <p>No subcategories found</p>
                            <button class="add-btn" onclick="showAddSubcategoryModal()">
                                Add Your First Subcategory
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        subcategoriesList.innerHTML = allSubcategories.map(subcategory => `
            <tr>
                <td>${subcategory.name}</td>
                <td>${subcategory.parentCategory}</td>
                <td class="action-buttons">
                    <button class="action-btn delete-btn" title="Delete Subcategory" onclick="deleteSubcategory('${subcategory.parentCategory}', '${subcategory.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
            </td>
        </tr>
    `).join('');

    } catch (error) {
        console.error('Error:', error);
        subcategoriesList.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load subcategories: ${error.message}</p>
                        <button onclick="fetchAndDisplaySubcategories()" class="retry-btn">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function showAddSubcategoryModal() {
    const modal = document.getElementById('addSubcategoryModal');
    const parentCategorySelect = document.getElementById('parentCategory');
    
    // Load parent categories
    loadParentCategories(parentCategorySelect);
    
    modal.style.display = 'block';
}

async function loadParentCategories(selectElement) {
    try {
        const response = await fetch('http://localhost:5000/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        const categories = new Set();
        
        // Extract unique categories from products
        data.products.forEach(product => {
            if (product.category) {
                categories.add(product.category);
            }
        });
        
        selectElement.innerHTML = `
            <option value="">Select Parent Category</option>
            ${Array.from(categories).map(category => `
                <option value="${category}">${category}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading parent categories:', error);
        showNotification('Failed to load parent categories', 'error');
    }
}

function closeAddSubcategoryModal() {
    const modal = document.getElementById('addSubcategoryModal');
    modal.style.display = 'none';
    document.getElementById('addSubcategoryForm').reset();
}

async function handleAddSubcategory(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const token = localStorage.getItem('token');
        const adminAuth = localStorage.getItem('adminAuth');
        
        if (!token || !adminAuth) {
            window.location.href = 'profile.html';
            return;
        }

        const categoryName = formData.get('parentCategory');
        const subcategoryName = formData.get('name');

        // Create a template product with the new category and subcategory
        const productData = {
            name: `${subcategoryName} Template`,
            description: `Template product for ${subcategoryName} subcategory`,
            price: 0,
            category: categoryName,
            subcategory: subcategoryName,
            image: 'placeholder.jpg',
            addedBy: 'admin',
            status: 'approved'
        };

        const response = await fetch('http://localhost:5506/api/admin/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Failed to add subcategory');
        }

        showNotification('Subcategory added successfully!', 'success');
        closeAddSubcategoryModal();
        
        // Refresh all category dropdowns
        await Promise.all([
            fetchAndDisplaySubcategories(),
            loadCategories() // Refresh main page category dropdown
        ]);

        // If a category is selected in the product form, reload its subcategories
        const productCategory = document.getElementById('productCategory');
        if (productCategory && productCategory.value) {
            loadSubcategories(productCategory.value);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Update loadCategories function to include subcategories
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:5506/api/categories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        const categorySelect = document.getElementById('productCategory');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            data.categories.forEach(category => {
                categorySelect.innerHTML += `
                    <option value="${category.name}">${category.name}</option>
                `;
            });
        }

        return data.categories;
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Failed to load categories', 'error');
        return [];
    }
}

// Update loadSubcategories function to use the new schema
async function loadSubcategories(categoryName) {
    if (!categoryName) {
        const subcategorySelect = document.getElementById('productSubcategory');
        subcategorySelect.innerHTML = '<option value="">Select Category First</option>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:5506/api/admin/products?category=${categoryName}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subcategories');
        }

        const data = await response.json();
        const subcategorySelect = document.getElementById('productSubcategory');
        const subcategories = new Set();
        
        // Extract unique subcategories for this category
        data.products.forEach(product => {
            if (product.subcategory) {
                subcategories.add(product.subcategory);
            }
        });
        
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
        subcategories.forEach(subcategory => {
            subcategorySelect.innerHTML += `
                <option value="${subcategory}">${subcategory}</option>
            `;
        });
    } catch (error) {
        console.error('Error loading subcategories:', error);
        showNotification('Failed to load subcategories', 'error');
    }
}

// Add search functionality for subcategories
document.getElementById('subcategorySearch')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#subcategoriesList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Add function to view subcategory products
async function viewSubcategoryProducts(category, subcategory) {
    try {
        const response = await fetch(`http://localhost:5506/api/admin/products?category=${category}&subcategory=${subcategory}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subcategory products');
        }

        const data = await response.json();
        // TODO: Display products in a modal or redirect to filtered products view
        showProducts();
        // You might want to add filtering to the products view here
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Add function to delete subcategory
async function deleteSubcategory(category, subcategory) {
    if (!confirm(`Are you sure you want to delete the subcategory "${subcategory}" from "${category}"?`)) {
        return;
    }

    try {
        // Instead of deleting the subcategory directly, we'll update all products in this subcategory
        const response = await fetch(`http://localhost:5506/api/admin/products?category=${category}&subcategory=${subcategory}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subcategory products');
        }

        const data = await response.json();
        
        // Update each product to remove the subcategory
        await Promise.all(data.products.map(product => 
            fetch(`http://localhost:5506/api/admin/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subcategory: '' })
            })
        ));

        showNotification('Subcategory deleted successfully!', 'success');
        await fetchAndDisplaySubcategories();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Product Management Functions

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const adminAuth = localStorage.getItem('adminAuth');
        
        if (!token || !adminAuth) {
            window.location.href = 'profile.html';
            return;
        }

        const response = await fetch(`http://localhost:5506/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete product');
        }

        showNotification('Product deleted successfully!', 'success');
        await fetchAndDisplayProducts();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

function viewProduct(productId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };

    // Show loading state
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading product details...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Fetch and display product details
    fetch('http://localhost:5506/api/admin/products', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const product = data.products.find(p => p._id === productId);
        if (!product) {
            throw new Error('Product not found');
        }

        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Product Details</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="product-details">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p><strong>Category:</strong> ${product.category}</p>
                        <p><strong>Subcategory:</strong> ${product.subcategory || 'N/A'}</p>
                        <p><strong>Price:</strong> ₹${product.price}</p>
                        <p><strong>Stock:</strong> ${product.stock || 0}</p>
                        <p><strong>Status:</strong> ${product.status}</p>
                        <p><strong>Added By:</strong> ${product.addedBy}</p>
                        <div class="description">
                            <strong>Description:</strong>
                            <div class="description-content">${product.description}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="edit-btn" onclick="editProduct('${product._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to load product details', 'error');
        modal.remove();
    });
}

async function editProduct(productId) {
    console.log('Edit product function called with ID:', productId);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Fetch all products
        console.log('Fetching all products...');
        const response = await fetch('http://localhost:5506/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        const product = data.products.find(p => p._id === productId);
        
        if (!product) {
            throw new Error('Product not found');
        }

        // Show edit modal
        const modal = document.getElementById('addProductModal');
        const form = document.getElementById('addProductForm');
        
        // Update modal title
        modal.querySelector('.modal-header h2').textContent = 'Edit Product';
        
        // Fill form with product details
        form.querySelector('#productName').value = product.name;
        form.querySelector('#productPrice').value = product.price;
        form.querySelector('#productQuantity').value = product.stock || 0;
        
        // Set category and load subcategories
        const categorySelect = form.querySelector('#productCategory');
        categorySelect.value = product.category;
        await loadSubcategories(product.category);
        
        // Set subcategory after loading subcategories
        const subcategorySelect = form.querySelector('#productSubcategory');
        subcategorySelect.value = product.subcategory || '';

        // Set description in CKEditor
        if (editor) {
            editor.setData(product.description);
        }

        // Show current image
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = `<img src="${product.image}" alt="Current Image">`;

        // Update form submission handler
        form.onsubmit = (e) => handleEditProduct(e, productId);

        // Show modal
        modal.style.display = 'block';
        initCKEditor();
        console.log('Edit modal created and displayed');

    } catch (error) {
        console.error('Error in editProduct:', error);
        showNotification(error.message, 'error');
    }
}

async function handleEditProduct(event, productId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Get the CKEditor content
        const description = editor ? editor.getData() : '';
        formData.set('description', description);

        const response = await fetch(`http://localhost:5506/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update product');
        }

        showNotification('Product updated successfully!', 'success');
        closeAddProductModal();
        await fetchAndDisplayProducts();
        
        // Reset form submission handler
        form.onsubmit = (e) => handleAddProduct(e);
        
        // Reset modal title
        document.querySelector('#addProductModal .modal-header h2').textContent = 'Add New Product';
        
    } catch (error) {
        console.error('Error in handleEditProduct:', error);
        showNotification(error.message, 'error');
    }
}

// Navigation Functions
async function showOrders() {
    try {
        // Hide all sections first
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });

        // Show orders section
        const ordersSection = document.getElementById('ordersSection');
        if (!ordersSection) {
            console.error('Orders section not found in the DOM');
            return;
        }
        ordersSection.style.display = 'block';

        // Fetch and display orders
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5000/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        const orders = await response.json();
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) {
            console.error('Orders list element not found');
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <tr>
                <td>${order.orderId}</td>
                <td>${order.customerName}</td>
                <td>${order.products.length} items</td>
                <td>$${order.totalAmount.toFixed(2)}</td>
                <td>${order.status}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                    <button onclick="viewOrderDetails('${order.orderId}')" class="btn-action">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="updateOrderStatus('${order.orderId}')" class="btn-action">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error in showOrders:', error);
        showNotification('Failed to load orders. Please try again.', 'error');
    }
}

async function showUsers() {
    try {
        // Hide all sections first
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });

        // Show users section
        const usersSection = document.getElementById('usersSection');
        if (!usersSection) {
            console.error('Users section not found in the DOM');
            return;
        }
        usersSection.style.display = 'block';

        // Fetch and display users
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const users = await response.json();
        const usersList = document.getElementById('usersList');
        if (!usersList) {
            console.error('Users list element not found');
            return;
        }

        usersList.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button onclick="viewUserDetails('${user._id}')" class="btn-action">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser('${user._id}')" class="btn-action">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error in showUsers:', error);
        showNotification('Failed to load users. Please try again.', 'error');
    }
}

// Add showCategories function
async function showCategories() {
    // Hide all sections first
    document.querySelectorAll('.content-section').forEach(section => {
        if (section) section.style.display = 'none';
    });

    const categoriesSection = document.getElementById('categoriesSection');
    if (!categoriesSection) {
        console.error('Categories section not found');
        return;
    }
    categoriesSection.style.display = 'block';

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5000/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();

        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) {
            console.error('Categories grid element not found');
            return;
        }

        // Process and display categories...
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to load categories', 'error');
    }
}

// Add the missing showAddCategoryModal function
function showAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add handleAddCategory function
async function handleAddCategory(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5000/api/categories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.get('name'),
                description: formData.get('description')
            })
        });

        if (!response.ok) throw new Error('Failed to add category');
        
        showNotification('Category added successfully', 'success');
        closeAddCategoryModal();
        showCategories(); // Refresh the categories list
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to add category', 'error');
    }
}

// Function to edit vendor
async function editVendor(vendorId) {
    console.log('Edit vendor function called with ID:', vendorId);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Fetch vendor details
        console.log('Fetching vendor details...');
        const response = await fetch('http://localhost:5506/api/admin/vendors', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch vendor details');
        }

        const data = await response.json();
        console.log('Vendor data received:', data);
        const vendor = data.vendors.find(v => v._id === vendorId);
        
        if (!vendor) {
            throw new Error('Vendor not found');
        }

        console.log('Creating edit modal for vendor:', vendor.businessName);
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        modal.innerHTML = `
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Edit Vendor</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="editVendorForm" onsubmit="handleEditVendor(event, '${vendorId}')">
                    <div class="form-group">
                        <label for="businessName">Business Name</label>
                        <input type="text" id="businessName" name="businessName" value="${vendor.businessName}" required>
                    </div>
                    <div class="form-group">
                        <label for="businessEmail">Business Email</label>
                        <input type="email" id="businessEmail" name="businessEmail" value="${vendor.businessEmail}" required>
                    </div>
                    <div class="form-group">
                        <label for="businessPhone">Business Phone</label>
                        <input type="tel" id="businessPhone" name="businessPhone" value="${vendor.businessPhone || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="businessCategory">Business Category</label>
                        <input type="text" id="businessCategory" name="businessCategory" value="${vendor.businessCategory || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Business Address</label>
                        <input type="text" name="street" placeholder="Street" value="${vendor.businessAddress?.street || ''}" required>
                        <input type="text" name="city" placeholder="City" value="${vendor.businessAddress?.city || ''}" required>
                        <input type="text" name="state" placeholder="State" value="${vendor.businessAddress?.state || ''}" required>
                        <input type="text" name="postalCode" placeholder="Postal Code" value="${vendor.businessAddress?.postalCode || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" name="status" required>
                            <option value="pending" ${vendor.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="approved" ${vendor.status === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="blocked" ${vendor.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="cancel-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="submit-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        `;

        // Add styles for the edit form
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }
            .modal-content {
                background-color: #fff;
                margin: 5% auto;
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                position: relative;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 8px;
            }
            .form-group input:focus,
            .form-group select:focus {
                border-color: #3182CE;
                outline: none;
                box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
            }
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .submit-btn {
                background-color: #3182CE;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .cancel-btn {
                background-color: #EDF2F7;
                color: #4A5568;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .submit-btn:hover {
                background-color: #2C5282;
            }
            .cancel-btn:hover {
                background-color: #E2E8F0;
            }
            .close-btn {
                position: absolute;
                right: 15px;
                top: 15px;
                font-size: 24px;
                cursor: pointer;
                background: none;
                border: none;
                color: #666;
            }
            .close-btn:hover {
                color: #000;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        console.log('Edit modal created and displayed');

    } catch (error) {
        console.error('Error in editVendor:', error);
        showNotification(error.message, 'error');
    }
}

// Function to handle vendor edit form submission
async function handleEditVendor(event, vendorId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Create vendor data object
        const vendorData = {
            businessName: formData.get('businessName'),
            businessEmail: formData.get('businessEmail'),
            businessPhone: formData.get('businessPhone'),
            businessCategory: formData.get('businessCategory'),
            status: formData.get('status'),
            businessAddress: {
                street: formData.get('street'),
                city: formData.get('city'),
                state: formData.get('state'),
                postalCode: formData.get('postalCode')
            }
        };

        const response = await fetch(`http://localhost:5506/api/admin/vendors/${vendorId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendorData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update vendor');
        }

        showNotification('Vendor updated successfully!', 'success');
        event.target.closest('.modal').remove();
        await showVendors(); // Refresh the vendors list
    } catch (error) {
        console.error('Error in handleEditVendor:', error);
        showNotification(error.message, 'error');
    }
} 