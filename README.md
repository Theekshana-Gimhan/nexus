# Nexus Core ERP Platform

A modular, API-first ERP platform designed for Sri Lankan SMBs (Small and Medium-sized Businesses).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Development Setup

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Start development environment:**
```bash
npm run docker:up
npm run dev
```

3. **Access the application:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Identity Service: http://localhost:3001
- Tenant Service: http://localhost:3002
- Payroll Service: http://localhost:3003

## 🏗️ Architecture

### Microservices
- **Identity Service** (Port 3001): User authentication, authorization, and role management
- **Tenant Service** (Port 3002): Multi-tenant management and subscriptions
- **Payroll Service** (Port 3003): HR & Payroll module ("PayDay Pro")

### Infrastructure
- **API Gateway** (Kong): Request routing, authentication, rate limiting
- **Frontend** (React + Vite): Unified UI shell and components
- **Database** (PostgreSQL): Per-service databases
- **Cache** (Redis): Session management and caching
- **Message Queue** (RabbitMQ): Asynchronous service communication

## 📁 Project Structure

```
nexus/
├── services/                 # Microservices
│   ├── identity-service/     # User management & auth
│   ├── tenant-service/       # Multi-tenant management
│   └── payroll-service/      # HR & Payroll module
├── frontend/                 # React frontend application
├── infrastructure/           # Kong, Kubernetes configs
├── shared/                   # Shared libraries
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── design-system/       # UI components
├── scripts/                 # Development scripts
└── doc/                     # Documentation
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                   # Start all services in development mode
npm run dev:identity         # Start identity service only
npm run dev:tenant           # Start tenant service only
npm run dev:payroll          # Start payroll service only
npm run dev:frontend         # Start frontend only

# Docker
npm run docker:build        # Build all Docker images
npm run docker:up           # Start all services with Docker
npm run docker:down         # Stop all Docker services

# Testing & Quality
npm run test                # Run tests for all services
npm run lint                # Lint all services
npm run build               # Build all services
```

### Database Setup

The development environment uses PostgreSQL with separate databases for each service:
- `nexus_identity` - Identity Service
- `nexus_tenant` - Tenant Service  
- `nexus_payroll` - Payroll Service

Databases are automatically created when running `docker-compose up`.

## 🔧 Configuration

### Environment Variables

Each service uses environment variables for configuration. See individual service README files for detailed configuration options.

### Common Environment Variables
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT token signing
- `RABBITMQ_URL` - RabbitMQ connection string

## 📊 Features

### Core Platform (V1.0)
- ✅ Multi-tenant architecture
- ✅ Unified identity and access management (IAM)
- ✅ Role-based access control (RBAC)
- ✅ API Gateway with authentication
- ✅ Event-driven microservices architecture

### PayDay Pro (HR & Payroll Module)
- ✅ Employee management
- ✅ Payroll processing
- ✅ Sri Lankan statutory compliance (EPF, ETF, PAYE)
- ✅ Payslip generation
- ✅ Pay cycle management

## 🌍 Sri Lankan Compliance

The platform includes built-in support for Sri Lankan business requirements:
- **EPF (Employees' Provident Fund)** calculations
- **ETF (Employees' Trust Fund)** calculations  
- **PAYE (Pay As You Earn)** tax calculations
- **C-Form** generation for EPF payments
- **IRD compliance** for tax reporting

## 🚀 Deployment

### Production Deployment (GCP)
- **Kubernetes**: Google Kubernetes Engine (GKE)
- **Database**: Cloud SQL for PostgreSQL
- **Cache**: Cloud Memorystore for Redis
- **Messaging**: Cloud Pub/Sub
- **CDN**: Google Cloud CDN

### CI/CD
- **Pipeline**: GitHub Actions
- **Testing**: Automated unit and integration tests
- **Security**: Vulnerability scanning and compliance checks

## 📚 Documentation

- [Product Requirements Document](./doc/Nexus%20PRD.md)
- [Technical Design Document](./doc/Nexus%20TDD.md)
- [Architecture Design Document](./doc/Nexus%20ADD.md)
- [API Documentation](./doc/Nexus%20API.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for Sri Lankan SMBs**
