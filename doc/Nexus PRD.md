# **Product Requirements Document (PRD): "Nexus" Core ERP Platform**

* **Product Name:** Nexus Core Platform (Working Title)  
* **Version:** 1.0  
* **Status:** Draft  
* **Date:** 01 September 2025  
* **Author:** \[Your Company Name\]

## **1\. Introduction & Vision**

### **1.1. Vision**

To become the definitive, flexible, and integrated business operating system for Small and Medium-sized Businesses (SMBs) in Sri Lanka, expanding into South Asia. We will achieve this by providing a robust core platform that unifies disparate software applications and offers a suite of best-in-class, locally-focused business modules.

### **1.2. Problem Statement**

Sri Lankan SMBs currently operate in a fragmented software environment. They use a mix of legacy accounting software, generic international SaaS tools, and manual spreadsheet-based processes. This creates data silos, operational inefficiencies, compliance risks, and prevents a unified view of the business. Existing ERPs are often too rigid, expensive, and not tailored to local business nuances.

### **1.3. Our Solution**

The Nexus Core Platform is an API-first, microservices-based platform that acts as a central hub. It allows businesses to:

1. Connect their existing software into a single, cohesive dashboard.  
2. Add powerful, Sri Lanka-specific business modules (like Payroll, Inventory, etc.) as their needs grow.  
3. Gain a unified, real-time view of their entire operation.

### **1.4. Target Market (Initial)**

Sri Lankan SMBs in the service sector (e.g., IT services, consulting, private education) with 20-200 employees who have outgrown basic tools like Excel and are struggling with multiple, disconnected software subscriptions.

## **2\. Product Goals & Objectives**

### **2.1. Business Goals**

* Acquire 20 paying customers for our first niche module within 12 months of launch.  
* Establish the Nexus Platform as the foundation for at least 3 distinct business modules within 24 months.  
* Achieve a 95% customer retention rate by providing exceptional value and support.

### **2.2. User Goals**

* Reduce time spent on manual data entry between systems by 50%.  
* Enable business owners to view a unified dashboard of key business metrics in real-time.  
* Simplify user management across all their business applications.

## **3\. Core Platform Features & Requirements (MVP V1.0)**

The Core Platform is the foundation. It must be built before any customer-facing business modules.

### **3.1. P1: Unified Identity & Access Management (IAM)**

* **Description:** A single, secure system for user authentication and authorization across all connected modules.  
* **User Stories:**  
  * As an Admin, I can create a new employee user account once and grant them access to both the Payroll and CRM modules.  
  * As an Admin, I can define roles (e.g., "Sales Rep," "HR Manager," "Accountant") with specific permissions for each module.  
  * As a User, I can log in once with Single Sign-On (SSO) to access all the applications I have permission for.  
* **Requirements:** Support for email/password login, role-based access control (RBAC), user profile management.

### **3.2. P1: Multi-Tenant Architecture**

* **Description:** The platform must be able to serve multiple customer companies (tenants) from a single software instance, ensuring each tenant's data is completely isolated and secure.  
* **Requirements:** Logical data separation at the database level, tenant-specific configurations, and custom domains/branding for each tenant.

### **3.3. P1: Centralized Admin Console**

* **Description:** A single interface for company administrators to manage platform-level settings.  
* **Requirements:**  
  * User and role management (linking to IAM).  
  * Module management (activating/deactivating purchased modules).  
  * Billing and subscription management.  
  * Company profile and branding settings.

### **3.4. P1: Unified UI Shell & Design System**

* **Description:** A consistent front-end framework to ensure all modules, whether built by us or third parties, feel like part of a single, cohesive application.  
* **Requirements:**  
  * A shared component library (buttons, forms, tables, etc.).  
  * A primary navigation shell (sidebar/top bar) where modules are listed.  
  * A standardized design language (colors, fonts, spacing).

### **3.5. P2: Core API Gateway**

* **Description:** A central gateway that manages all API requests between the front-end, the various microservices (modules), and external applications.  
* **Requirements:** Secure API key management, request routing, rate limiting, and a unified point for logging and monitoring.

### **3.6. P2: Centralized Data & Reporting Engine (Basic)**

* **Description:** A foundational service to pull data from different modules for unified reporting.  
* **Requirements (V1.0):**  
  * A simple dashboard builder allowing users to select key metrics from activated modules.  
  * Ability to create a basic "Company Health" dashboard showing data from 2-3 different modules (e.g., revenue from Finance, new leads from CRM).

## **4\. First Niche Application (MVP): "PayDay Pro" \- HR & Payroll Module**

This is the first product we will build *on top of* the Nexus Core Platform to take to market.

### **4.1. Module Vision**

To provide the simplest, most compliant payroll and HR management solution for service-sector SMBs in Sri Lanka.

### **4.2. Features**

* **Employee Management:** Core employee database with personal details, salary information, and document storage. (Leverages Core IAM).  
* **Payroll Processing:** Automated calculation of monthly salaries, including allowances, deductions, overtime.  
* **Statutory Compliance (Sri Lanka Focus):**  
  * Automated calculation and report generation for EPF (Employees' Provident Fund) and ETF (Employees' Trust Fund).  
  * Automated calculation for PAYE (Pay As You Earn) tax based on current IRD regulations.  
  * Generation of C-Forms for EPF payments.  
* **Payslip Generation:** Ability to generate and email digital payslips to employees.  
* **Integration with Core Platform:** All user management is handled by the Nexus Core. Key payroll data (e.g., total salary cost) is exposed to the Nexus Reporting Engine.

## **5\. Technical Considerations**

* **Architecture:** Must be built on a Microservices Architecture.  
* **Security:** End-to-end encryption, data-at-rest encryption, regular security audits.  
* **Data Localization:** All customer data must be hosted within data centers that comply with Sri Lanka's upcoming data protection regulations.  
* **Scalability:** The platform must be able to scale horizontally to accommodate user growth.

## **6\. Success Metrics**

* **Platform Adoption:** Number of active tenants (companies).  
* **Module Adoption:** Activation rate of the "PayDay Pro" module by new customers.  
* **User Engagement:** Daily Active Users (DAU) / Monthly Active Users (MAU).  
* **System Performance:** API response times, system uptime (\>99.9%).  
* **Customer Satisfaction:** Net Promoter Score (NPS) from post-onboarding surveys.

## **7\. Future Scope (Post V1.0)**

* Third-Party App Marketplace & Public API.  
* Advanced low-code workflow automation builder.  
* AI-powered predictive analytics on the reporting engine.  
* Additional modules: CRM, Inventory, Finance & Accounting.