# Angular-Spring Boot Backend Integration

This document provides complete instructions for running the Angular frontend with the Spring Boot backend integration.

## Prerequisites

1. **Spring Boot Backend** running on `http://localhost:8080`
2. **Node.js** (version 18 or higher)
3. **Angular CLI** (version 19 or higher)

## Backend API Information

### Base URL
```
http://localhost:8080/api
```

### Authentication
- **Method**: HTTP Basic Authentication
- **Roles**: ADMIN, MEMBRE_STRUCTURE
- **Session**: Stateless (stored in sessionStorage)

### Available Endpoints

#### Public Endpoints (No Authentication)
- `GET /api/structures` - List all structures
- `GET /api/structures/type/{type}` - Get structures by type
- `GET /api/structures/search?name={name}` - Search structures by name
- `GET /api/structures/region/{region}` - Get structures by region
- `GET /api/structures/region/{region}/city/{city}` - Get structures by region and city
- `GET /api/structures/available_docs/{id}` - Get available documents for structure
- `GET /api/structures/filter?type={type}&region={region}&city={city}` - Filter structures
- `POST /api/structures` - Create structure
- `POST /api/membres_structures` - Create structure member
- `POST /api/admins` - Create admin account
- `POST /api/structures/{id}/document` - Add document to structure

#### Admin-Only Endpoints
- `GET /api/structures/{id}` - Get structure by ID
- `DELETE /api/structures/{id}` - Delete structure
- `GET /api/membres_structures` - List all members
- `GET /api/membres_structures/{id}` - Get member by ID
- `DELETE /api/membres_structures/{id}` - Delete member

#### Admin & Structure Member Endpoints
- `PUT /api/structures/{id}` - Update structure
- `PUT /api/membres_structures/{id}` - Update member

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application

#### With Backend Proxy (Recommended)
```bash
npm start
```
This will start the Angular dev server with proxy configuration to handle CORS issues.

#### Without Proxy
```bash
npm run start:no-proxy
```
Use this if you have CORS configured on your backend.

### 3. Access the Application
Open your browser and navigate to `http://localhost:4200`

## Features Implemented

### 🔐 Authentication & Authorization
- ✅ HTTP Basic Authentication
- ✅ Role-based access control (Admin vs Member)
- ✅ Session management with sessionStorage
- ✅ Auth guards for protected routes
- ✅ Automatic logout on 401 errors

### 🏢 Structure Management
- ✅ View all structures on interactive map
- ✅ Search structures by name
- ✅ Filter by type, region, and city
- ✅ Create new structures (authenticated users)
- ✅ Update structures (admin or structure owner)
- ✅ Delete structures (admin only)
- ✅ View structure details

### 👥 User Management
- ✅ User registration (Admin or Structure Member)
- ✅ User login with validation
- ✅ Profile management
- ✅ Role-based UI visibility

### 🗺️ Interactive Map
- ✅ Leaflet integration for Senegal
- ✅ Dynamic markers for structures
- ✅ Popup information windows
- ✅ Search and filter integration
- ✅ User geolocation

### 🔔 User Experience
- ✅ Real-time notifications
- ✅ Loading states
- ✅ Error handling with French messages
- ✅ Form validation
- ✅ Responsive design

## Architecture Overview

### Services
- **AuthService**: Authentication and user management
- **StructureService**: Structure CRUD operations
- **MemberService**: Member management
- **AdminService**: Admin account creation
- **NotificationService**: Toast notifications

### Guards
- **AuthGuard**: Protects authenticated routes
- **AdminGuard**: Protects admin-only routes

### Interceptors
- **AuthInterceptor**: Adds Basic Auth headers and handles errors

### Components
- **LoginComponent**: User authentication
- **RegisterComponent**: User registration (Admin/Member)
- **MapNavigationComponent**: Interactive map with structures
- **BuildingDetailsComponent**: Structure details view
- **AddBuildingComponent**: Create/edit structures
- **NotificationComponent**: Toast notifications

## Data Models

### Structure
```typescript
interface Structure {
  id: number;
  name: string;
  type: 'HOSPITAL' | 'CLINIC' | 'PHARMACY' | 'LABORATORY';
  description?: string;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  openingHours?: {
    monday?: string;
    tuesday?: string;
    // ... other days
  };
  availableDocs: AvailableDoc[];
}
```

### User Types
```typescript
interface MemberStructure {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  structure: Structure;
  roleInStructure: string;
}

interface Admin {
  id: number;
  email: string;
}
```

## Environment Configuration

### Development
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  enableLogging: true
};
```

### Production
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-domain.com/api',
  enableLogging: false
};
```

## Security Features

### ✅ Implemented
- HTTP Basic Authentication with secure credential storage
- Role-based access control
- Route guards for protected pages
- Automatic session cleanup on logout
- CSRF protection (disabled on backend)
- Input validation and sanitization

### 🔒 Security Best Practices
- Credentials stored in sessionStorage (not localStorage)
- Automatic logout on authentication errors
- Request/response logging in development only
- Error messages don't expose sensitive information

## Testing

### Run Unit Tests
```bash
npm test
```

### Test User Accounts
Create test accounts using the registration form:

#### Admin Account
- Navigate to `/register`
- Select "Administrateur"
- Fill in email and password
- Click "S'inscrire"

#### Member Account
- Navigate to `/register`
- Select "Membre de structure"
- Fill in all required fields including structure selection
- Click "S'inscrire"

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Ensure your Spring Boot backend has CORS configured
2. Use the proxy configuration: `npm start`
3. Check that backend is running on `http://localhost:8080`

### Authentication Issues
1. Check browser console for error messages
2. Verify backend endpoints are accessible
3. Ensure credentials are correct
4. Clear browser storage if needed

### Map Not Loading
1. Check internet connection (requires OpenStreetMap tiles)
2. Verify Leaflet is loading properly
3. Check browser console for JavaScript errors

## Development Notes

### Leaflet Integration
The map component dynamically imports Leaflet to support SSR:
```typescript
const L = await import('leaflet');
this.L = L.default || L;
```

### Coordinate Generation
Since the backend doesn't provide coordinates, the frontend generates them based on region data for demonstration purposes.

### File Uploads
File upload functionality is prepared but not fully implemented. The backend endpoint `/api/structures/{id}/document` is available for document uploads.

## Next Steps

### Potential Enhancements
1. **File Upload**: Complete document upload functionality
2. **Real Coordinates**: Add latitude/longitude fields to Structure model
3. **Advanced Search**: Implement full-text search
4. **Caching**: Add service worker for offline functionality
5. **Testing**: Add comprehensive unit and integration tests
6. **Internationalization**: Add multi-language support

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify backend is running and accessible
3. Review network tab for API call failures
4. Check authentication status and permissions

---

**Last Updated**: January 2025
**Angular Version**: 19.2.0
**Backend Compatibility**: Spring Boot with Basic Auth
