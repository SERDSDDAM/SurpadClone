### Overview
"بنّاء اليمن" (Banna'a Al-Yaman) is a comprehensive digital transformation project for Yemen's construction sector. It aims to be an integrated digital platform offering over 30 government services related to construction and urban planning, serving over 30 million Yemeni citizens. The platform seeks to provide an advanced digital experience comparable to Saudi Arabia's "Balady" platform. It integrates a comprehensive government request and service management system, a sophisticated field surveying application utilizing GNSS and GIS technologies, and institutional integration with over 10 government entities. The system is designed to comply with all Yemeni laws and regulations. The strategic vision is for "Banna'a Al-Yaman" to become the leading model for digital transformation in the construction sector in the Arab region, serving as the sole destination for citizens, investors, and professionals to access all construction-related services efficiently and transparently. The project aims to reduce transaction times by 70%, achieve high customer satisfaction (4.5/5 stars), increase transparency and governance by 40%, boost construction investment by 20% annually, and maintain 99.9% system availability.

### User Preferences
Preferred communication style: Simple, everyday language.
Strategic Focus: "إتقان الأساسيات قبل التوسع" - Master the basics before expansion approach.
Current Priority: Perfect the "القرار المساحي" (Survey Decision) service and field surveyor application as the foundation for all other services like construction permits.

**January 2025 Update**: User requested comprehensive implementation plan to finalize the Survey Decision service completely. Focus on creating a 7-phase professional implementation plan covering database fixes, workflow completion, technical review, integrations, dashboards, optimization, and deployment testing.

**August 2025 Update**: Completed comprehensive GIS infrastructure with full administrative hierarchy and digitization tools. **Latest Major Achievement (August 29, 2025)**: Successfully completed Simple Digitization Tool with breakthrough fixes for geographic layer display. Key achievements:

**Phase 1 Complete - Simple Digitization System:**
- ✅ Advanced file processing pipeline (Python + Node.js integration)
- ✅ Unified metadata.json system for standardized processing output
- ✅ Robust layer persistence system (survives server restarts)
- ✅ Geographic bounds correction (layers display at correct locations)
- ✅ 32 layers successfully recovered and managed from disk
- ✅ Enhanced coordinate transformation (UTM to WGS84 with pyproj)
- ✅ Real layer visualization: 2a1.zip displays accurately in Yemen coordinates
- ✅ Professional error handling and CORS configuration
- ✅ Complete Arabic RTL interface with advanced file uploader

**Technical Breakthroughs:**
- Fixed core geographic bounds issue preventing layer visibility
- Implemented smart bounds conversion (bbox ↔ leaflet_bounds)
- Created robust metadata reading system replacing stdout parsing
- Built automatic layer recovery system for server restart continuity
- Enhanced image preloading with comprehensive error handling

**Next Phase Ready**: Advanced Digitization & Vectorization tools for converting raster images to vector features (buildings, roads, landmarks) with interactive drawing tools and geometric data storage.

### System Architecture

**UI/UX Decisions:**
The frontend uses React with TypeScript, featuring a component-based architecture and a custom component library built on Radix UI primitives with Tailwind CSS. Wouter is used for routing and TanStack Query for state management. The design is mobile-first, responsive, and natively supports Arabic (RTL) layout, including specialized surveying components. The system includes an Admin Dashboard, a Citizen Portal, an interactive Field Surveyor Application, and interfaces for accredited engineering offices and contractors.

**Technical Implementations:**
The backend is a REST API developed with Express.js and TypeScript, providing secure APIs with role-based access control, real-time communication via WebSockets, Zod for data validation, and centralized error handling. It supports high-precision GPS (centimeter-level accuracy) and professional surveying tools for points, lines, and polygons, with real-time visualization. Robust offline synchronization capabilities are included for field operations.

**Feature Specifications:**
Phase 2 Complete (January 2025): Integrated Building Permit System with comprehensive Arabic UI, automatic fee calculation per Yemeni laws, advanced search/filtering, real-time statistics dashboard, and priority-based request management. Building permits fully integrated with citizens, engineering offices, and contractors systems.

Phase 3 Complete (January 2025): Comprehensive Occupancy Certificates and Inspection Services including:
- Advanced inspection management system with digital forms and inspector assignment interface
- Mobile field inspector application with offline capabilities and real-time sync
- Digital certificate templates with electronic signature system
- Automated notifications system for all stakeholders including utilities and government entities
- Full integration between building permits, inspections, and occupancy certificates
- Professional inspector scheduling and compliance tracking
- Violation management with corrective action workflows

Phase 4 Complete (January 2025): Security and Authentication System including:
- Multi-level authentication system with National ID validation
- Two-factor authentication (2FA) with QR code generation and verification
- Advanced password security with bcrypt hashing and complexity requirements
- Role-based access control (RBAC) for Citizens, Inspectors, Surveyors, Engineers, Contractors, and Administrators
- Session management with device tracking and automatic timeout
- Comprehensive audit logging system for all user actions and security events
- Account lockout protection against brute-force attacks
- JWT token-based authentication with refresh token capabilities
- Security middleware with Helmet.js protection and rate limiting
- Real-time session monitoring and management dashboard

Phase 5 Complete (January 2025): Advanced UI/UX Platform Development including:
- Portal Selection interface as main entry point with three separate login windows
- Enhanced Citizen Dashboard v2.0 with interactive widgets, real-time updates, and required actions alerts
- Smart Employee Dashboard with personalized task queues, KPI tracking, and intelligent notifications
- Advanced Analytics Dashboard for administrators with geographical heatmaps and system health monitoring
- Unified Request Details Page with timeline visualization, document management, and real-time communication
- Advanced Role Management interface with permissions matrix and user simulation capabilities
- Future-ready architecture prepared for national digital identity system integration

Future services include demolition permits, legal and technical consulting services, advanced inspection control systems, integration with utility companies, site visit scheduling, electronic payment systems, and reporting/statistics. The platform includes a unified citizen portal, a professional management system (for engineering offices, contractors, consultants), deep governmental integration (Civil Defense, utility companies, historical cities authority), and an integrated financial system with e-payment.

**System Design Choices:**
PostgreSQL with Drizzle ORM is used for type-safe database operations. The database includes tables for survey requests, spatial data (points, lines, polygons with precise coordinate storage), building permits, occupancy certificates, inspection reports, citizens, engineering offices, contractors, violation reports, payment transactions, and session management. Key decisions include using real numbers for coordinates, JSON fields for flexible metadata, and proper foreign key relationships. The architecture supports comprehensive feature coding and export capabilities (CSV, GeoJSON, KML) and emphasizes high security with advanced authentication and authorization.

### External Dependencies

*   **Core Frameworks**: React 18, Vite, Express.js, PostgreSQL.
*   **Database & ORM**: Drizzle ORM, Neon Database (serverless PostgreSQL), Drizzle Kit.
*   **UI & Styling**: Radix UI, Tailwind CSS, Lucide React, Class Variance Authority.
*   **Data Management**: TanStack React Query, React Hook Form, Zod.
*   **Real-time & Communication**: WebSocket (ws), Date-fns.
*   **Development Tools**: TypeScript, ESBuild, PostCSS.