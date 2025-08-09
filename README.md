# 🏠 PG Application - Complete Full-Stack Platform

A modern paying guest accommodation platform connecting tenants with property owners.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (for FastAPI backend)
- Node.js 18+ (for Next.js frontend)

### 1. Start the Application
```bash
# Clone and navigate to project
cd /workspaces/PG-Application

# Install frontend dependencies
npm install

# Start both frontend and backend
npm run dev:all
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 3. Test Login Accounts
```
Admin: admin@pgapp.com / admin123
Owner: owner@pgapp.com / owner123  
Tenant: tenant@pgapp.com / tenant123
```

## 📱 Key Features

### For Tenants
- Search and filter PG accommodations
- View detailed property information
- Submit applications to properties
- Manage application status

### For Property Owners  
- List and manage properties
- Review tenant applications
- Track payments and occupancy
- Dashboard with analytics

### For Admins
- User and property management
- Verification system
- System monitoring

## 🛠 Technology Stack

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.8+
- **Database**: SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT tokens with bcrypt
- **API Docs**: Auto-generated OpenAPI/Swagger

### Frontend (Next.js)
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: React Context API

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Properties
- `GET /api/v1/properties/` - List properties (with filters)
- `POST /api/v1/properties/` - Create property
- `GET /api/v1/properties/{id}` - Get property details
- `PUT /api/v1/properties/{id}` - Update property
- `DELETE /api/v1/properties/{id}` - Delete property

### Applications
- `GET /api/v1/applications/` - List applications
- `POST /api/v1/applications/` - Submit application
- `PUT /api/v1/applications/{id}/status` - Update status

### More endpoints available at http://localhost:8000/docs

## 📂 Project Structure

```
/workspaces/PG-Application/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   └── schemas/        # Pydantic schemas
│   ├── main.py             # FastAPI app
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   └── lib/                # Utilities
├── package.json            # Node.js dependencies
└── .env.local             # Environment variables
```

## 🧪 Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python run_dev.py
```

### Frontend Development  
```bash
npm install
npm run dev
```

### Database Operations
```bash
# Seed sample data
cd backend && python seed_db.py

# Test API endpoints
cd backend && python test_api.py
```

## 🔧 Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

## 📖 Documentation

- **API Documentation**: http://localhost:8000/docs (auto-generated)
- **Integration Guide**: `INTEGRATION_SUMMARY.md`
- **Completion Status**: `COMPLETION_SUMMARY.md`
- **Final Summary**: `FINAL_SUCCESS_SUMMARY.md`

## 🚀 Deployment

### Development
```bash
npm run dev:all  # Starts both frontend and backend
```

### Production (recommended setup)
- **Backend**: Deploy FastAPI with Gunicorn/Uvicorn
- **Frontend**: Deploy Next.js with Vercel/Netlify  
- **Database**: PostgreSQL
- **Files**: AWS S3 or similar for uploads

## 🎯 Sample Data

The application comes with pre-seeded sample data:
- 3 users (admin, owner, tenant)
- 2 sample properties in Bangalore
- Realistic amenities and pricing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the API documentation at http://localhost:8000/docs
2. Review the integration guides in the docs/ folder
3. Test with sample accounts provided above

---

**Built with ❤️ using FastAPI + Next.js**
