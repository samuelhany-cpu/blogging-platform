# Blogging Platform

A full-stack blogging platform built with React.js, Node.js, Express.js, and MySQL. Features include user authentication, article management, comments, image uploads, and a modern responsive UI.

## 🚀 Features

### Core Features

- **User Authentication**: Register, login, and JWT-based session management
- **Article Management**: Create, read, update, and delete articles
- **Image Uploads**: Cover image support with file validation
- **Comments System**: Add, edit, and delete comments on articles
- **User Profiles**: View user profiles with their articles and comments
- **User Dashboard**: Personal dashboard for managing articles and comments

### UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Smooth loading indicators throughout the app
- **Error Handling**: Comprehensive error messages and user feedback
- **Toast Notifications**: Success and error notifications
- **Modern UI**: Clean, modern interface with Tailwind CSS
- **Image Fallbacks**: Placeholder images for missing cover images

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Protection**: Protected routes for authenticated users
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: File type and size validation
- **Authorization**: Role-based access control (user/admin)

## 📁 Project Structure

```
blogging-platform/
├── backend/                 # Node.js/Express.js backend
│   ├── config/             # Database and JWT configuration
│   ├── controllers/        # Business logic controllers
│   ├── middlewares/        # Authentication and validation
│   ├── models/             # Data models
│   ├── routes/             # API route definitions
│   ├── uploads/            # File upload storage
│   ├── utils/              # Utility functions
│   └── tests/              # Backend tests
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── api/            # API service functions
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (AuthContext)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── database/               # Database schema and migrations
```

## 🛠️ Technology Stack

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **Jest** - Testing framework

### Frontend

- **React.js** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Icons** - Icon library
- **Framer Motion** - Animations

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blogging-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=blog_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Create the database
mysql -u root -p
CREATE DATABASE blog_db;
USE blog_db;

# Run the initialization script
source database/init.sql;
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Start the Application

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Article Endpoints

- `GET /api/articles` - Get all articles (with search/filter)
- `POST /api/articles` - Create article (requires auth)
- `GET /api/articles/:id` - Get specific article
- `PUT /api/articles/:id` - Update article (requires auth)
- `DELETE /api/articles/:id` - Delete article (requires auth)

### Comment Endpoints

- `POST /api/articles/:id/comments` - Add comment (requires auth)
- `GET /api/articles/:id/comments` - Get article comments
- `PUT /api/comments/:id` - Edit comment (requires auth)
- `DELETE /api/comments/:id` - Delete comment (requires auth)

### User Endpoints

- `GET /api/users/:id/profile` - Get user profile (requires auth)
- `GET /api/users/:id/articles` - Get user's articles (requires auth)

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set up environment variables for production in `.env`:
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_USER=your_production_db_user
   DB_PASS=your_production_db_password
   DB_NAME=your_production_db_name
   JWT_SECRET=your_production_jwt_secret
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.com
   ```
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`

### Frontend Deployment

1. Create `.env` file with production API URL:
   ```env
   REACT_APP_API_URL=https://your-api-domain.com/api
   ```
2. Build the application: `npm run build`
3. Deploy the `build` folder to your hosting service (Netlify, Vercel, etc.)

### Same-Domain Deployment (Recommended)

For better security and performance, deploy both frontend and backend on the same domain:

1. Backend serves API at `/api/*`
2. Frontend serves static files at root
3. Use relative URLs: `REACT_APP_API_URL=/api`

## 🔒 Security Considerations

- JWT tokens expire after 24 hours
- Passwords are hashed using bcrypt
- File uploads are validated for type and size
- CORS is configured for security
- Input validation on both frontend and backend
- SQL injection protection through parameterized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- None currently reported

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Rich text editor for articles
- [ ] Image optimization and compression
- [ ] Social media sharing
- [ ] Article categories and tags management
- [ ] User roles and permissions
- [ ] Search functionality with filters
- [ ] Pagination for articles and comments
- [ ] Email notifications
- [ ] Dark mode theme

## 📞 Support

For support and questions, please open an issue in the repository.
