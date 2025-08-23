# بنّاء اليمن - نظام القرار المساحي المتقدم

## Overview

This is a comprehensive survey system for Yemen's construction and land surveying sector. The platform provides an integrated solution for surveying decision processes, featuring a professional field application with advanced GNSS capabilities, CAD/GIS integration, and real-time collaboration tools. The system aims to digitize and streamline the entire surveying workflow from request submission to approval, while building a national geospatial database for Yemen.

The application combines a web-based management portal for administrators and reviewers with sophisticated surveying tools that rival professional solutions like SurPad. It supports high-precision GPS data collection, real-time collaboration, offline mapping capabilities, and compliance with Yemen's construction laws and regulations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using modern React with TypeScript, utilizing Vite as the build tool for optimal development experience and performance. The application follows a component-based architecture with:

- **UI Framework**: Custom component library built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Real-time Communication**: WebSocket integration for live updates and collaboration
- **Mobile-First Design**: Responsive design optimized for both desktop and mobile field use

The frontend supports Arabic (RTL) layout natively and includes specialized surveying components like GPS panels, interactive maps, and survey tools.

### Backend Architecture

The backend implements a REST API using Express.js with TypeScript, providing:

- **API Design**: RESTful endpoints following conventional patterns
- **Real-time Features**: WebSocket server for live collaboration and updates
- **Data Validation**: Zod schema validation for type-safe API contracts
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development Tools**: Hot reload with Vite integration and comprehensive logging

### Database Design

The system uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Survey Requests**: Central entity managing the survey workflow
- **Spatial Data**: Dedicated tables for points, lines, and polygons with precise coordinate storage
- **Review System**: Comment tracking and approval workflow management
- **Session Management**: Survey session tracking with real-time collaboration support

Key design decisions include using real numbers for coordinates to maintain precision, JSON fields for flexible metadata storage, and proper foreign key relationships for data integrity.

### Survey Data Management

The architecture supports professional surveying workflows with:

- **High-Precision GPS**: Support for centimeter-level accuracy with GNSS receivers
- **Feature Coding**: Comprehensive classification system for surveyed elements
- **Spatial Relationships**: Proper handling of points, lines, and polygon geometries
- **Export Capabilities**: Multiple format support (CSV, GeoJSON, KML) for interoperability

### Component Architecture

The UI follows a modular component structure with:

- **Survey Tools**: Interactive tools for point capture, line drawing, and polygon creation
- **GPS Integration**: Real-time GPS data display with accuracy indicators
- **Interactive Mapping**: Canvas-based mapping with survey overlay capabilities
- **Progress Tracking**: Real-time statistics and workflow progress indicators

## External Dependencies

### Core Framework Dependencies

- **React 18**: Modern React with hooks and concurrent features for optimal user experience
- **Vite**: Fast build tool with hot module replacement for development efficiency
- **Express.js**: Lightweight web framework for API development
- **PostgreSQL**: Primary database for reliable data storage and spatial data support

### Database and ORM

- **Drizzle ORM**: Type-safe ORM with excellent TypeScript integration for database operations
- **Neon Database**: Serverless PostgreSQL for scalable cloud deployment
- **Drizzle Kit**: Schema management and migration tools

### UI and Styling

- **Radix UI**: Accessible component primitives for professional UI development
- **Tailwind CSS**: Utility-first CSS framework for rapid styling and responsive design
- **Lucide React**: Consistent icon library with extensive surveying-related icons
- **Class Variance Authority**: Type-safe variant API for component styling

### Data Management

- **TanStack React Query**: Powerful data fetching and caching library for server state
- **React Hook Form**: Efficient form handling with validation support
- **Zod**: Runtime type validation for API contracts and form validation

### Real-time and Communication

- **WebSocket (ws)**: Real-time bidirectional communication for live collaboration
- **Date-fns**: Date manipulation library for timestamp handling

### Development and Build Tools

- **TypeScript**: Static type checking for improved code quality and developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS post-processing for optimization and vendor prefixing

The system is designed to be deployed on modern cloud platforms with support for both development and production environments, featuring comprehensive error handling, real-time capabilities, and professional surveying functionality.