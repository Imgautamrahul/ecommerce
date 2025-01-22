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

        const response = await fetch('http://localhost:5506/api/admin/stats', {  // Updated port
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
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

// Initialize dashboard with loading states
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        window.location.href = 'profile.html';
        return;
    }
    
    // Initial fetch
    fetchAdminStats();
    
    // Add refresh button functionality
    document.getElementById('refreshStats')?.addEventListener('click', () => {
        fetchAdminStats();
    });
});

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

// Add event listener for Customers nav item
document.addEventListener('DOMContentLoaded', () => {
    const customersLink = document.querySelector('.nav-item i.fa-users').parentElement;
    customersLink.addEventListener('click', (e) => {
        e.preventDefault();
        showCustomers();
    });
});

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
        const response = await fetch('http://localhost:5506/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            productsList.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>No products found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        productsList.innerHTML = data.products.map(product => `
            <tr>
                <td>
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                </td>
                <td>
                    <div class="product-name">${product.name}</div>
                </td>
                <td>
                    <span class="product-category">${product.category}</span>
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

    try {
        const response = await fetch('http://localhost:5506/api/admin/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('Failed to add product');

        await fetchAndDisplayProducts();
        closeAddProductModal();
        // Show success message
        showNotification('Product added successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to add product', 'error');
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