# PG Application - Complete Full Stack Solution

A comprehensive Paying Guest (PG) accommodation management system built with **Next.js** frontend and **FastAPI** backend.

## 🚀 Features

### For Tenants
- **Browse Properties**: Search and filter PG accommodations by location, price, amenities
- **Apply to Properties**: Submit applications with move-in preferences
- **Profile Management**: Maintain detailed tenant profile with preferences
- **Payment Tracking**: View payment history and due dates
- **Document Upload**: Upload required documents securely

### For Property Owners
- **Property Management**: Add, edit, and manage multiple properties
- **Room Management**: Configure individual rooms with pricing and amenities
- **Application Review**: Review and approve/reject tenant applications
- **Tenant Management**: Track current tenants and their details
- **Payment Management**: Create and track payment records
- **Analytics Dashboard**: View revenue, occupancy, and performance metrics

### For Administrators
- **User Management**: Manage all users (tenants and owners)
- **Property Verification**: Verify and approve property listings
- **System Analytics**: Monitor platform usage and performance
- **Payment Oversight**: Oversee all financial transactions

## 🛠 Tech Stack

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.8+
- **Database**: SQLAlchemy with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Upload**: Support for images and documents
- **API Documentation**: Auto-generated with Swagger/OpenAPI

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: Prisma ORM
- **UI Components**: Custom components with modern design

## 📁 Project Structure

```
PG-Application/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── core/              # Core functionality (config, database, security)
│   │   ├── models/            # Database models
│   │   └── schemas/           # Pydantic schemas
│   ├── uploads/               # File uploads directory
│   ├── main.py                # Application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── seed_db.py            # Database seeding script
│   └── .env                   # Environment variables
├── src/                       # Next.js Frontend
│   ├── app/                   # App router pages
│   ├── components/            # Reusable components
│   └── lib/                   # Utility libraries
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── Taskfile.yml              # Task automation
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+**
- **Node.js 18+**
- **npm or yarn**
- **Task** (optional, for task automation)

### 1. Clone Repository
```bash
git clone <repository-url>
cd PG-Application
```

### 2. Setup Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database
python seed_db.py

# Start development server
python run_dev.py
```

The backend will be available at `http://localhost:8000`

### 3. Setup Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Using Task (Recommended)
If you have [Task](https://taskfile.dev/) installed:

```bash
# Initial setup
task setup

# Run both frontend and backend
task dev

# Or run individually
task backend:dev
task frontend:dev
```

## 🔐 Default Users

After running the database seeding script, these users will be available:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@pgapp.com | admin123 | System administrator |
| Owner | owner@pgapp.com | owner123 | Property owner with sample properties |
| Tenant | tenant@pgapp.com | tenant123 | Sample tenant user |

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔧 Available Tasks

### Development
- `task dev` - Run both frontend and backend
- `task backend:dev` - Run backend only
- `task frontend:dev` - Run frontend only

### Database
- `task backend:init-db` - Initialize and seed database
- `task db:reset` - Reset database with fresh data
- `task db:backup` - Backup current database

### Testing
- `task test` - Run all tests
- `task backend:test` - Test API endpoints
- `task frontend:test` - Run frontend tests

### Building
- `task frontend:build` - Build frontend for production
- `task prod:build` - Build entire project for production

### Utilities
- `task clean` - Clean all build artifacts
- `task setup` - Initial project setup
- `task help` - Show all available tasks

## 🌟 Key API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Properties
- `GET /api/v1/properties/` - List properties
- `POST /api/v1/properties/` - Create property (Owner)
- `GET /api/v1/properties/search` - Search properties
- `GET /api/v1/properties/{id}` - Get property details

### Applications
- `POST /api/v1/applications/` - Submit application (Tenant)
- `GET /api/v1/applications/` - List applications
- `PUT /api/v1/applications/{id}` - Update application status

### Users
- `GET /api/v1/users/me` - Get user profile
- `PUT /api/v1/users/me` - Update user profile
- `POST /api/v1/users/tenant-profile` - Create tenant profile

### Payments
- `GET /api/v1/payments/` - List payments
- `POST /api/v1/payments/` - Create payment record
- `POST /api/v1/payments/{id}/mark-paid` - Mark payment as paid

### File Upload
- `POST /api/v1/upload/image` - Upload image
- `POST /api/v1/upload/document` - Upload document
- `GET /api/v1/upload/download/{type}/{filename}` - Download file

## 🔒 Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./pg_application.db
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
UPLOAD_DIR=./uploads
```

### Frontend (.env.local)
```env
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📱 Frontend Features

### Authentication Pages
- **Login/Signup**: `/auth` - User authentication with role selection
- **Dashboard**: `/dashboard` - User-specific dashboard
- **Owner Dashboard**: `/owner/dashboard` - Property management interface

### Property Pages
- **Search**: `/search` - Property search and filtering
- **Property Details**: `/property/[id]` - Detailed property view
- **Property Management**: Owner-specific property CRUD operations

### User Management
- **Profile**: User profile management with role-specific fields
- **Applications**: Tenant application tracking
- **Tenants**: Owner tenant management

## 🔄 Development Workflow

1. **Start Development Servers**:
   ```bash
   task dev
   ```

2. **Make Changes**: Edit backend or frontend code
   - Backend changes auto-reload
   - Frontend has hot-reload

3. **Test Changes**:
   ```bash
   task backend:test
   ```

4. **Database Changes**:
   ```bash
   task db:reset  # Reset with fresh data
   ```

## 🚀 Deployment

### Backend Deployment
```bash
# Production server
uvicorn main:app --host 0.0.0.0 --port 8000

# With Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend Deployment
```bash
npm run build
npm start
```

## 📊 Project Status

### ✅ Completed Features
- [x] **Backend Architecture**: Complete FastAPI setup with modular structure
- [x] **Database Models**: All entities (User, Property, Application, Payment, etc.)
- [x] **Authentication System**: JWT-based auth with role management
- [x] **API Endpoints**: All CRUD operations for core entities
- [x] **File Upload System**: Image and document upload functionality
- [x] **Database Seeding**: Sample data for testing
- [x] **API Documentation**: Auto-generated Swagger docs
- [x] **Task Automation**: Comprehensive Taskfile for development

### 🔄 In Progress
- [ ] **Frontend Integration**: Connecting Next.js frontend with FastAPI backend
- [ ] **Payment Gateway**: Integration with payment processors
- [ ] **Email Notifications**: User notifications for applications, payments
- [ ] **Advanced Search**: Geolocation-based property search

### 📋 Next Steps
1. **Frontend-Backend Integration**: Connect the existing Next.js frontend with the new FastAPI backend
2. **Payment Integration**: Implement Stripe/Razorpay for online payments
3. **Email System**: Set up email notifications for important events
4. **File Management**: Enhanced file upload with cloud storage (AWS S3)
5. **Real-time Features**: WebSocket integration for live notifications
6. **Mobile App**: React Native mobile application
7. **Advanced Analytics**: Detailed reporting and analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `task test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: support@pgapp.com

---

**Happy Coding! 🚀**
