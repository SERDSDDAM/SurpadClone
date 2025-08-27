### Overview
"بنّاء اليمن" (Banna'a Al-Yaman) is a comprehensive digital transformation project for Yemen's construction sector. It aims to be an integrated digital platform offering over 30 government services related to construction and urban planning, serving over 30 million Yemeni citizens. The platform seeks to provide an advanced digital experience comparable to Saudi Arabia's "Balady" platform. It integrates a comprehensive government request and service management system, a sophisticated field surveying application utilizing GNSS and GIS technologies, and institutional integration with over 10 government entities. The system is designed to comply with all Yemeni laws and regulations. The strategic vision is for "Banna'a Al-Yaman" to become the leading model for digital transformation in the construction sector in the Arab region, serving as the sole destination for citizens, investors, and professionals to access all construction-related services efficiently and transparently. The project aims to reduce transaction times by 70%, achieve high customer satisfaction (4.5/5 stars), increase transparency and governance by 40%, boost construction investment by 20% annually, and maintain 99.9% system availability.

### User Preferences
Preferred communication style: Simple, everyday language.

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