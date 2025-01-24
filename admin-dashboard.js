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

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5506/api/admin/stats', {
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

        const response = await fetch('http://localhost:5506/api/admin/vendors', {
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
    // Hide all other content first
    const allContent = document.querySelectorAll('.dashboard-content > div');
    allContent.forEach(content => {
        if (content.id !== 'customersSection') {
            content.style.display = 'none';
        }
    });

    // Show customers section
    const customersSection = document.getElementById('customersSection');
    customersSection.style.display = 'block';

    // Update active nav state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item i.fa-users').parentElement.classList.add('active');

    // Show loading state
    const customersList = document.getElementById('customersList');
    customersList.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading customer data...</p>
                </div>
            </td>
        </tr>
    `;

    try {
        const response = await fetch('http://localhost:5506/api/admin/customers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch customers');

        const data = await response.json();
        console.log('Customer data:', data);

        // Update customer count in stats
        const userCountElement = document.querySelector('[data-stat="users"] .stat-value');
        if (userCountElement) {
            userCountElement.textContent = data.total;
        }

        if (!data.customers || data.customers.length === 0) {
            customersList.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>No customers registered yet</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Render customer table
        customersList.innerHTML = data.customers.map(customer => `
            <tr>
                <td>
                    <div class="customer-name">
                        <i class="fas fa-user-circle"></i>
                        ${customer.name || 'N/A'}
                    </div>
                </td>
                <td>
                    <a href="mailto:${customer.email}" class="customer-email">
                        <i class="fas fa-envelope"></i>
                        ${customer.email || 'N/A'}
                    </a>
                </td>
                <td>
                    ${customer.phone ? `
                        <a href="tel:${customer.phone}" class="customer-phone">
                            <i class="fas fa-phone"></i>
                            ${customer.phone}
                        </a>
                    ` : '<span class="not-provided">Not provided</span>'}
                </td>
                <td>
                    ${customer.address ? `
                        <div class="customer-address" title="${customer.address}">
                            <i class="fas fa-map-marker-alt"></i>
                            ${customer.address}
                        </div>
                    ` : '<span class="not-provided">Not provided</span>'}
                </td>
                <td>
                    <div class="join-date">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(customer.createdAt)}
                    </div>
                </td>
                <td class="action-buttons">
                    <button class="action-btn view-btn" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Edit Customer">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        customersList.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load customers: ${error.message}</p>
                        <button onclick="showCustomers()" class="retry-btn">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
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

        const response = await fetch('http://localhost:5506/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch products');
        }

        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            productsList.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
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
                    <img src="${product.image || 'placeholder.jpg'}" alt="${product.name}" class="product-image" onerror="this.src='placeholder.jpg'">
                </td>
                <td>
                    <div class="product-name">${product.name}</div>
                    <small class="product-description">${product.description || ''}</small>
                </td>
                <td>
                    <span class="product-category">${product.category}</span>
                    <small class="product-subcategory">${product.subcategory || ''}</small>
                </td>
                <td>
                    <div class="product-price">₹${product.price.toLocaleString()}</div>
                </td>
                <td>
                    <span class="stock-status ${getStockStatusClass(product.stock)}">
                        ${getStockStatusText(product.stock)}
                    </span>
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

// Modal functions
function showAddProductModal() {
    document.getElementById('addProductModal').style.display = 'block';
}

function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
    document.getElementById('addProductForm').reset();
}

// Handle add product form submission
async function handleAddProduct(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const productData = Object.fromEntries(formData);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Validate required fields
        if (!productData.category || !productData.subcategory) {
            throw new Error('Category and subcategory are required');
        }

        const response = await fetch('http://localhost:5506/api/admin/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add product');
        }

        const data = await response.json();
        showNotification('Product added successfully!', 'success');
        closeAddProductModal();
        await fetchAndDisplayProducts();
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Add event listener for Products nav item
document.addEventListener('DOMContentLoaded', () => {
    const productsLink = document.querySelector('.nav-item i.fa-box').parentElement;
    productsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showProducts();
    });
});

// Function to show vendors section
async function showVendors() {
    // Hide other sections
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

    // Fetch and display vendors
    await fetchVendors();
}

// Function to render vendors
function renderVendors(vendors) {
    const vendorsList = document.getElementById('vendorsList');
    if (!vendors || vendors.length === 0) {
        vendorsList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-store"></i>
                        <p>No vendors registered yet</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    vendorsList.innerHTML = vendors.map(vendor => `
        <tr>
            <td>
                <div class="vendor-info">
                    <span class="vendor-name">${vendor.businessName}</span>
                    <span class="vendor-owner">${vendor.userId.name}</span>
                </div>
            </td>
            <td>
                <a href="mailto:${vendor.businessEmail}" class="vendor-email">
                    ${vendor.businessEmail}
                </a>
            </td>
            <td>${vendor.businessPhone}</td>
            <td>${vendor.businessCategory}</td>
            <td>
                <span class="status-badge ${vendor.isVerified ? 'status-active' : 'status-pending'}">
                    ${vendor.isVerified ? 'Active' : 'Pending'}
                </span>
            </td>
            <td class="action-buttons">
                <button onclick="viewVendorDetails('${vendor._id}')" class="action-btn view-btn" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="viewVendorOrders('${vendor._id}', '${vendor.businessName}')" class="action-btn orders-btn" title="View Orders">
                    <i class="fas fa-shopping-cart"></i>
                </button>
                ${!vendor.isVerified ? `
                    <button onclick="handleVendorAction('${vendor._id}', 'approve')" class="action-btn approve-btn" title="Approve Vendor">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Function to display vendor details
function displayVendorDetails(vendor) {
    document.getElementById('vBusinessName').textContent = vendor.businessName;
    document.getElementById('vOwnerName').textContent = vendor.userId.name;
    document.getElementById('vEmail').textContent = vendor.businessEmail;
    document.getElementById('vPhone').textContent = vendor.businessPhone;
    document.getElementById('vCategory').textContent = vendor.businessCategory;
    document.getElementById('vDescription').textContent = vendor.businessDescription;
    
    // Address
    document.getElementById('vStreet').textContent = vendor.businessAddress.street;
    document.getElementById('vCity').textContent = vendor.businessAddress.city;
    document.getElementById('vState').textContent = vendor.businessAddress.state;
    document.getElementById('vPostalCode').textContent = vendor.businessAddress.postalCode;
    
    // Performance metrics
    document.getElementById('vTotalProducts').textContent = vendor.products.length;
    document.getElementById('vRating').textContent = `${vendor.rating.toFixed(1)} ★`;
    document.getElementById('vMemberSince').textContent = new Date(vendor.createdAt).toLocaleDateString();
} 