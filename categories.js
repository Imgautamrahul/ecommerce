// Predefined categories and subcategories
const PREDEFINED_CATEGORIES = {
    'Electronics': [
        'Smartphones',
        'Laptops',
        'Tablets',
        'Cameras',
        'Audio Devices',
        'Gaming',
        'Accessories'
    ],
    'Fashion': [
        'Men\'s Clothing',
        'Women\'s Clothing',
        'Kids\' Clothing',
        'Footwear',
        'Watches',
        'Jewelry',
        'Bags & Luggage'
    ],
    'Home & Living': [
        'Furniture',
        'Home Decor',
        'Kitchen & Dining',
        'Bedding',
        'Lighting',
        'Storage & Organization',
        'Garden & Outdoor'
    ],
    'Beauty & Personal Care': [
        'Skincare',
        'Makeup',
        'Hair Care',
        'Fragrances',
        'Personal Hygiene',
        'Men\'s Grooming',
        'Health Care'
    ],
    'Sports & Fitness': [
        'Exercise Equipment',
        'Sports Gear',
        'Athletic Clothing',
        'Outdoor Recreation',
        'Yoga & Fitness',
        'Team Sports',
        'Supplements'
    ],
    'Books & Stationery': [
        'Fiction',
        'Non-Fiction',
        'Academic',
        'Children\'s Books',
        'Office Supplies',
        'Art Supplies',
        'Journals & Planners'
    ],
    'Toys & Games': [
        'Action Figures',
        'Board Games',
        'Educational Toys',
        'Outdoor Toys',
        'Puzzles',
        'Remote Control Toys',
        'Arts & Crafts'
    ],
    'Automotive': [
        'Car Accessories',
        'Motorcycle Parts',
        'Car Care',
        'Tools & Equipment',
        'GPS & Navigation',
        'Safety & Security',
        'Spare Parts'
    ]
};

// Global state for category management
window.activeCategory = null;
window.activeSubcategory = null;

// Function to fetch categories and subcategories from products
window.fetchCategories = async function() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        const products = data.products;
        
        // Convert predefined categories to the format we need
        const categories = Object.entries(PREDEFINED_CATEGORIES).map(([category, subcategories]) => ({
            name: category,
            subcategories: subcategories
        }));
        
        renderCategoryButtons(categories);
        filterProducts(products);
        
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Function to render category buttons with subcategories
window.renderCategoryButtons = function(categories) {
    const container = document.querySelector('.category-container');
    if (!container) return;
    
    // Add "All" category button
    const allCategoryHtml = `
        <div class="category-button-wrapper">
            <button class="category-button ${!window.activeCategory ? 'active' : ''}" 
                    onclick="window.filterByCategory(null)">
                All
            </button>
        </div>
    `;
    
    // Generate HTML for each category and its subcategories
    const categoryButtonsHtml = categories.map(category => `
        <div class="category-button-wrapper">
            <button class="category-button ${window.activeCategory === category.name ? 'active' : ''}"
                    onclick="window.filterByCategory('${category.name}')">
                ${category.name}
            </button>
            ${category.subcategories.length > 0 ? `
                <div class="subcategories-dropdown">
                    ${category.subcategories.map(subcategory => `
                        <button class="subcategory-button ${window.activeSubcategory === subcategory ? 'active' : ''}"
                                onclick="window.filterBySubcategory('${category.name}', '${subcategory}')">
                            ${subcategory}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    container.innerHTML = allCategoryHtml + categoryButtonsHtml;
}

// Function to filter products by category
window.filterByCategory = function(categoryName) {
    window.activeCategory = categoryName;
    window.activeSubcategory = null;
    window.fetchCategories(); // This will re-render everything with the new filters
}

// Function to filter products by subcategory
window.filterBySubcategory = function(categoryName, subcategoryName) {
    window.activeCategory = categoryName;
    window.activeSubcategory = subcategoryName;
    window.fetchCategories(); // This will re-render everything with the new filters
}

// Function to filter and render products
window.filterProducts = function(products) {
    const container = document.querySelector('.products-grid');
    if (!container) return;
    
    let filteredProducts = products;
    
    if (window.activeCategory) {
        filteredProducts = filteredProducts.filter(product => product.category === window.activeCategory);
        if (window.activeSubcategory) {
            filteredProducts = filteredProducts.filter(product => product.subcategory === window.activeSubcategory);
        }
    }
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>No products found in this category</p>
            </div>
        `;
        return;
    }
    
    const productsHtml = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image || 'placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='placeholder.jpg'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}${product.subcategory ? ` > ${product.subcategory}` : ''}</p>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" onclick="addToCart('${product._id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = productsHtml;
}

// Initialize categories when the page loads
document.addEventListener('DOMContentLoaded', window.fetchCategories); 