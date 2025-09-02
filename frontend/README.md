# Nexus Platform Frontend

Modern React/TypeScript dashboard for the Nexus ERP platform with tenant management, user administration, and payroll features.

## Features

- 🔐 **Authentication**: Secure login with JWT tokens
- 🏢 **Multi-tenant**: Full tenant management interface
- 👥 **User Management**: Role-based user administration
- 📊 **Dashboard**: Real-time analytics and metrics
- 🎨 **Modern UI**: Built with Tailwind CSS and Heroicons
- 📱 **Responsive**: Mobile-first design
- ⚡ **Fast**: Vite build system with hot reload

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling with validation
- **Axios** - HTTP client with interceptors
- **React Hot Toast** - Beautiful notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API Gateway running on http://localhost:3000

### Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/Theekshana-Gimhan/nexus.git
cd nexus/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3003

## Demo Credentials

Use these credentials to log in when the backend services are running:

- **Email**: admin@nexus.lk
- **Password**: admin123

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── layouts/         # Layout components (Auth, Dashboard)
│   └── Button.tsx       # Common components
├── pages/               # Page components
│   ├── DashboardPage.tsx    # Main dashboard
│   ├── LoginPage.tsx        # Authentication
│   ├── TenantsPage.tsx      # Tenant management
│   ├── UsersPage.tsx        # User management
│   └── SettingsPage.tsx     # Application settings
├── services/            # API integration
│   └── api.ts          # Axios configuration
├── store/              # State management
│   └── authStore.ts    # Authentication state
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles
```

## API Integration

The frontend integrates with the Nexus API Gateway:

- **Base URL**: http://localhost:3000
- **Authentication**: Bearer token in Authorization header
- **Endpoints**:
  - `POST /api/v1/auth/login` - User authentication
  - `GET /api/v1/tenants` - List tenants
  - `POST /api/v1/tenants` - Create tenant
  - `DELETE /api/v1/tenants/:id` - Delete tenant

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run tests
npm run test:ui         # Run tests with UI
npm run test:run        # Run tests once
```

## Environment Variables

Create `.env.development` or `.env.production`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Nexus Platform
VITE_APP_VERSION=1.0.0
```

## Key Features

### Dashboard
- Real-time tenant statistics
- Active tenant overview
- Recent tenant table with search
- Quick actions for tenant creation

### Tenant Management
- Full CRUD operations for tenants
- Search and filter capabilities
- Status management (active/inactive)
- Plan selection (Professional/Enterprise)
- User limits and currency settings

### Authentication
- Secure JWT-based authentication
- Persistent login state
- Auto-logout on token expiration
- Demo mode for development

### Responsive Design
- Mobile-first approach
- Collapsible sidebar navigation
- Touch-friendly interface
- Adaptive layouts

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React hooks patterns
- Use functional components
- Implement proper error handling

### Component Structure
```tsx
// Standard component structure
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface ComponentProps {
  // Define props
}

export default function Component({ }: ComponentProps) {
  // State and effects
  // Event handlers
  // Render
}
```

### State Management
- Use Zustand for global state
- Use useState for local component state
- Persist authentication state
- Handle loading and error states

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The `dist/` folder contains the built application ready for deployment to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file server

### Environment Configuration
Ensure production environment variables are set:
- `VITE_API_BASE_URL` - Production API Gateway URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Version number

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure API Gateway is running on correct port
   - Check CORS configuration
   - Verify authentication tokens

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all imports are correct

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting styles
   - Verify responsive breakpoints

### Debug Mode
```bash
# Enable debug logging
VITE_DEBUG=true npm run dev
```

## Contributing

1. Follow the existing code style
2. Add TypeScript types for all new features
3. Test components in both mobile and desktop views
4. Update documentation for new features
5. Ensure all linting passes

## License

Private - Nexus Platform Team
