# NE-Commerce Platform

A full-stack e-commerce platform with multi-vendor support, built using Node.js, Express, and MongoDB.

## Features

### User Management
- Multi-role authentication (Admin, Vendor, Customer)
- Secure login and registration
- JWT-based authentication
- Password encryption

### Admin Dashboard
- Complete admin control panel
- User management
- Vendor management
- Product management
- Order tracking
- Analytics and statistics

### Vendor Features
- Vendor registration and profile management
- Product management
- Order management
- Sales analytics
- Business profile customization

### Customer Features
- User registration and profile management
- Product browsing and search
- Shopping cart functionality
- Order history
- Product reviews and ratings

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Encryption**: bcryptjs
- **Frontend**: HTML, CSS, JavaScript
- **API Testing**: Postman

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/necommerce.git
cd necommerce
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5506
```

4. Start the server:
```bash
node server.js
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/vendor/register` - Vendor registration

### Admin Routes
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/vendors` - Get all vendors
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Add new product

### Vendor Routes
- `GET /api/vendor/products` - Get vendor's products
- `POST /api/vendor/products` - Add new product
- `GET /api/vendor/stats` - Get vendor statistics
- `GET /api/vendor/profile` - Get vendor profile
- `PUT /api/vendor/profile` - Update vendor profile

### Product Routes
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add new product (Admin/Vendor)
- `PUT /api/products/:id` - Update product (Admin/Vendor)
- `DELETE /api/products/:id` - Delete product (Admin/Vendor)

## Security Features

- Password hashing using bcryptjs
- JWT-based authentication
- Protected routes with role-based access
- Input validation and sanitization
- CORS enabled
- Error handling middleware

## Project Structure

```
necommerce/
├── server.js           # Main application file
├── package.json        # Project dependencies
├── .env               # Environment variables
├── README.md          # Project documentation
└── public/            # Static files
    ├── admin-dashboard.html
    ├── admin-dashboard.css
    ├── profile.html
    └── vendor-dashboard.html
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Express.js team
- MongoDB team
- All contributors who helped with the project

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/yourusername/necommerce 