# بنّاء اليمن - نظام القرار المساحي المتقدم

## Overview

This is a comprehensive survey system for Yemen's construction and land surveying sector. The platform provides an integrated solution for surveying decision processes, featuring a professional field application with advanced GNSS capabilities, CAD/GIS integration, and real-time collaboration tools. The system aims to digitize and streamline the entire surveying workflow from request submission to approval, while building a national geospatial database for Yemen.

The application combines a web-based management portal for administrators and reviewers with sophisticated surveying tools that rival professional solutions like SurPad. It supports high-precision GPS data collection, real-time collaboration, offline mapping capabilities, and compliance with Yemen's construction laws and regulations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Development Plan

The user has provided a comprehensive development plan to enhance the survey system with advanced features. The plan is divided into four phases:

### Phase 1: Core Application Development (Foundation & Core Functionality)
- Complete basic task management functionality
- Develop login screens and dynamic request lists from server
- Full activation of survey tools (points, lines, polygons)
- Implement intelligent feature coding system
- Support offline-first functionality with local data storage and sync

### Phase 2: Hardware Integration & Collaboration
- Bluetooth service for GNSS and laser measurement device integration
- Bluetooth management interface for connected devices
- Real-time collaboration using WebSocket infrastructure
- Collaboration dashboard with connected users and chat system
- Real-time synchronization of all survey actions across team members

### Phase 3: Field Experience Enhancement
- Offline maps service with satellite imagery and street maps
- Maps management interface for area selection, download, and deletion
- Augmented Reality (AR) integration (optional advanced feature)
- AR service to display surveyed points and boundaries through camera
- AR interface with measurement and documentation tools

### Phase 4: Data Management & Output
- Advanced CAD/GIS integration with DXF, GeoJSON, KML support
- CAD/GIS integration interface for import/export operations
- Custom advanced reporting system with PDF generation
- Report production interface with template selection and content customization

Current Status: Phase 1 development completed successfully! Advanced field application with smart survey tools now fully operational.

## Recent Changes (January 2025)

✓ **Advanced GPS Panel**: Real-time GNSS data with RTK support, accuracy indicators, and satellite tracking
✓ **Smart Toolbar**: Intelligent feature coding system with category-based classification
✓ **Interactive Canvas**: Professional surveying canvas with coordinate transformation and visualization
✓ **Survey Progress Tracking**: Real-time session monitoring with completion percentage
✓ **Offline Capability**: Network status monitoring and local data storage with sync
✓ **Bluetooth Integration**: Device management for GNSS receivers and laser measurement tools
✓ **WebSocket Connectivity**: Real-time collaboration infrastructure
✓ **Arabic UI**: Complete RTL interface with professional surveying terminology

## Technical Achievements

- **High-Precision GPS**: Centimeter-level accuracy with DOP monitoring and fix type indicators
- **Professional Survey Tools**: Point, line, and polygon creation with smart snapping
- **Feature Classification**: Comprehensive coding system for buildings, infrastructure, and utilities
- **Real-time Visualization**: Interactive canvas with zoom, pan, and coordinate display
- **Session Management**: Time tracking, progress monitoring, and data export capabilities
- **Hardware Ready**: Bluetooth integration framework for external surveying equipment

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