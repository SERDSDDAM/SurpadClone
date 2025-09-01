### Overview
"بنّاء اليمن" (Banna'a Al-Yaman) is a comprehensive digital transformation project for Yemen's construction sector. It aims to be an integrated digital platform offering over 30 government services related to construction and urban planning, serving over 30 million Yemeni citizens. The platform seeks to provide an advanced digital experience comparable to Saudi Arabia's "Balady" platform. It integrates a comprehensive government request and service management system, a sophisticated field surveying application utilizing GNSS and GIS technologies, and institutional integration with over 10 government entities. The system is designed to comply with all Yemeni laws and regulations. The strategic vision is for "Banna'a Al-Yaman" to become the leading model for digital transformation in the construction sector in the Arab region, serving as the sole destination for citizens, investors, and professionals to access all construction-related services efficiently and transparently. The project aims to reduce transaction times by 70%, achieve high customer satisfaction (4.5/5 stars), increase transparency and governance by 40%, boost construction investment by 20% annually, and maintain 99.9% system availability.

### User Preferences
Preferred communication style: Simple, everyday language.
Strategic Focus: "إتقان الأساسيات قبل التوسع" - Master the basics before expansion approach.
Current Priority: Perfect the "القرار المساحي" (Survey Decision) service and field surveyor application as the foundation for all other services like construction permits.
Implementation Status: **RBAC System Enhancement Completed Successfully** - Advanced RBAC system with conditional permissions, temporary permissions, role hierarchy, contextual roles, smart workflow tasks, and intelligent monitoring fully implemented and working. Authentication system stable with JWT tokens. Enhanced admin dashboard with comprehensive RBAC management interface operational.
Development Approach: **Advanced RBAC Implementation Complete** - All three phases successfully implemented: (1) Conditional & temporal permissions with dynamic constraints, (2) Hierarchical roles with inheritance and contextual switching, (3) Smart task management with automated delegation and real-time security monitoring. System now features enterprise-grade permission management comparable to international government platforms.

### System Architecture
The platform is designed with a component-based architecture using React with TypeScript for the frontend, featuring a custom component library built on Radix UI primitives with Tailwind CSS. Wouter is used for routing and TanStack Query for state management. The design is mobile-first, responsive, and natively supports Arabic (RTL) layout, including specialized surveying components. The system includes an Admin Dashboard, a Citizen Portal, an interactive Field Surveyor Application, and interfaces for accredited engineering offices and contractors.

The backend is a REST API developed with Express.js and TypeScript, providing secure APIs with role-based access control, real-time communication via WebSockets, Zod for data validation, and centralized error handling. It supports high-precision GPS (centimeter-level accuracy) and professional surveying tools for points, lines, and polygons, with real-time visualization. Robust offline synchronization capabilities are included for field operations.

Key features include:
- A comprehensive GIS infrastructure with administrative hierarchy and digitization tools.
- **Enterprise-grade Advanced RBAC System** with conditional permissions, temporal access controls, role hierarchy inheritance, contextual role switching, smart workflow task management, and real-time security monitoring.
- **Intelligent Permission Management** featuring location-based access, time-restricted permissions, amount-limited transactions, automatic delegation, emergency access controls, and behavioral risk analysis.
- **Smart Security Monitoring** with real-time threat detection, automated alert generation, suspicious activity pattern recognition, and comprehensive audit logging.
- **Advanced Administrative Controls** including dynamic permission assignment, role-based inheritance, contextual access management, and intelligent task delegation with escalation chains.
- An advanced file processing pipeline with unified metadata and robust layer persistence.
- Interactive digitization and vectorization tools for converting raster images to vector features with real-time geometry calculations.
- A comprehensive visibility persistence system for map layers, tracking visibility, opacity, and zIndex.
- Integrated Building Permit System with Arabic UI, automatic fee calculation, and real-time statistics.
- Comprehensive Occupancy Certificates and Inspection Services with mobile field inspector applications and digital certificate templates.
- Advanced UI/UX with portal selection, enhanced dashboards (Citizen, Employee, Admin), and unified request details pages.

PostgreSQL with Drizzle ORM is used for type-safe database operations, storing survey requests, spatial data, permits, inspection reports, and user data. Key decisions include using real numbers for coordinates, JSON fields for flexible metadata, and proper foreign key relationships. The architecture supports comprehensive feature coding and export capabilities (CSV, GeoJSON, KML) and emphasizes high security with advanced authentication and authorization.

### External Dependencies
*   **Core Frameworks**: React 18, Vite, Express.js, PostgreSQL.
*   **Database & ORM**: Drizzle ORM, Neon Database (serverless PostgreSQL), Drizzle Kit.
*   **UI & Styling**: Radix UI, Tailwind CSS, Lucide React, Class Variance Authority.
*   **Data Management**: TanStack React Query, React Hook Form, Zod.
*   **Real-time & Communication**: WebSocket (ws), Date-fns.
*   **Development Tools**: TypeScript, ESBuild, PostCSS.