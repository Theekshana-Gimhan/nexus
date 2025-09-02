# **Technical Design Document (TDD): "Nexus" Core ERP Platform**

* **Document Name:** Nexus Core Platform \- Technical Design  
* **Version:** 1.0  
* **Status:** Draft  
* **Date:** 01 September 2025  
* **Authors/Contributors:** Lead Engineering Team  
* **Related PRD:** nexus\_platform\_prd.md (Version 1.0)

## **1\. Introduction & Overview**

### **1.1. Purpose**

This document outlines the technical architecture, design choices, and implementation plan for the Nexus Core Platform and its first module, "PayDay Pro." It is intended for the engineering, DevOps, and quality assurance teams to guide the development process.

### **1.2. Scope**

This TDD covers the foundational components of the Nexus Platform (V1.0) and the specific microservices required to deliver the "PayDay Pro" (HR & Payroll) MVP. It defines the technology stack, database schemas, API contracts, infrastructure, and security protocols.

### **1.3. Assumptions**

* The system will be developed as a cloud-native application.  
* Development will follow an Agile/Scrum methodology.  
* Initial deployment will target the Sri Lankan market.

## **2\. System Architecture**

### **2.1. Architectural Approach**

We will implement a **Microservices Architecture**. This approach provides the flexibility, scalability, and development agility required to meet the product vision. Each core business capability will be a separate, independently deployable service that communicates over well-defined APIs.

### **2.2. High-Level Architecture Diagram**

\+-------------------------------------------------------------------------+  
|                              END USERS (Web Browser)                    |  
\+---------------------------------|---------------------------------------+  
                                  |  
\+---------------------------------v---------------------------------------+  
|                       FRONTEND APPLICATION (React.js)                     |  
|                   (Unified UI Shell \+ Module Components)                  |  
\+---------------------------------|---------------------------------------+  
                                  | (HTTPS/REST API Calls)  
\+---------------------------------v---------------------------------------+  
|                            API GATEWAY (e.g., Kong, AWS API Gateway)      |  
|              (Authentication, Rate Limiting, Request Routing)             |  
\+-----------------|-----------------|-----------------|-------------------+  
                  |                 |                 |  
                  | (gRPC / REST)   | (gRPC / REST)   | (gRPC / REST)  
      \+-----------v----------+  \+---v----+----------+  \+---v-----+---------+  
      |  IDENTITY SERVICE    |  | TENANT SERVICE    |  | PAYROLL SERVICE   |  
      | (IAM \- Users, Roles) |  | (Manages Tenants) |  | ("PayDay Pro")    |  
      | \[PostgreSQL DB\]      |  | \[PostgreSQL DB\]   |  | \[PostgreSQL DB\]   |  
      \+----------------------+  \+-------------------+  \+-------------------+  
                  |                 ^                 ^  
                  |                 |                 |  
      \+-----------v-----------------v-----------------v-------------------+  
      |                       EVENT BUS (e.g., RabbitMQ, Kafka)           |  
      |                  (For Asynchronous Communication)                 |  
      \+-------------------------------------------------------------------+

### **2.3. Microservice Definitions (V1.0)**

* **Identity Service (IAM):**  
  * **Responsibility:** Manages all aspects of user identity. Handles user registration, login (authentication), password management, role definitions, and permissions. It will be the single source of truth for "who" a user is.  
* **Tenant Service:**  
  * **Responsibility:** Manages customer accounts (tenants). Handles tenant creation, subscription status, module activation, and stores tenant-specific configurations (e.g., company name, branding).  
* **Payroll Service ("PayDay Pro"):**  
  * **Responsibility:** Contains all business logic for the HR & Payroll module. Manages employee records, processes payroll calculations, handles Sri Lankan statutory requirements (EPF/ETF/PAYE), and generates payslips. It relies on the Identity Service for user authentication and authorization.

## **3\. Data Schema & Persistence**

### **3.1. Database Technology**

* **Primary Database:** **PostgreSQL**. Chosen for its robustness, reliability, strong support for relational data integrity (critical for financial and HR data), and excellent JSONB support for flexible fields.  
* **Caching:** **Redis**. To be used for session management and caching frequently accessed, non-critical data to improve performance.

### **3.2. Initial Database Schemas (Simplified)**

* **Identity Service DB:**  
  * users (id, tenant\_id, email, password\_hash, first\_name, last\_name, created\_at)  
  * roles (id, tenant\_id, name)  
  * user\_roles (user\_id, role\_id)  
  * permissions (id, name, description)  
  * role\_permissions (role\_id, permission\_id)  
* **Tenant Service DB:**  
  * tenants (id, company\_name, status, created\_at)  
  * subscriptions (id, tenant\_id, module\_id, start\_date, end\_date)  
  * modules (id, name, description)  
* **Payroll Service DB:**  
  * employees (id, user\_id, tenant\_id, employee\_number, basic\_salary, joined\_date)  
  * pay\_cycles (id, tenant\_id, start\_date, end\_date, status)  
  * payslips (id, employee\_id, pay\_cycle\_id, gross\_pay, net\_pay, epf\_deduction, paye\_tax)

## **4\. API Architecture & Design**

### **4.1. API Standard**

All inter-service and client-server communication will be done via **RESTful APIs**. APIs will be formally defined using the **OpenAPI 3.0 (Swagger)** specification.

### **4.2. Authentication**

Authentication will be handled using **JSON Web Tokens (JWT)**.

1. User sends credentials to the Identity Service.  
2. Identity Service validates and returns a short-lived JWT containing user ID, tenant ID, and roles.  
3. The Frontend Application includes this JWT in the Authorization header of all subsequent requests to the API Gateway.  
4. The API Gateway validates the JWT before routing the request to the appropriate microservice.

### **4.3. Example API Endpoint Definitions**

* **Identity Service:**  
  * POST /auth/login \- Authenticate a user, returns JWT.  
  * POST /users \- Create a new user.  
  * GET /users/{userId}/roles \- Get roles for a specific user.  
* **Payroll Service:**  
  * POST /employees \- Add a new employee record.  
  * GET /employees/{employeeId} \- Get details of a specific employee.  
  * POST /pay-cycles/run \- Initiate a new payroll run.

## **5\. Technology Stack**

* **Backend Microservices:** **Node.js with Express.js/Fastify**. Chosen for its rapid development speed, strong ecosystem (NPM), and large pool of available talent in Sri Lanka. It's excellent for building I/O-bound API services.  
* **Frontend Application:** **React.js** (with Vite). Chosen for its component-based architecture, which fits well with our design system goal, and its dominant position in the front-end development community.  
* **Service Communication:**  
  * **Synchronous:** REST over HTTPS for client-gateway and gateway-service communication.  
  * **Asynchronous:** **RabbitMQ**. To be used for events like "User Created" or "Payroll Run Complete" to decouple services.  
* **Containerization:** **Docker**. All microservices will be containerized for consistency across development, testing, and production environments.

## **6\. Cloud Infrastructure & DevOps**

* **Cloud Provider:** **Google Cloud Platform (GCP)**. Chosen for its mature services, strong presence in the region (Mumbai/Singapore regions), excellent Kubernetes support, and comprehensive offerings.  
* **Container Orchestration:** **Google Kubernetes Engine (GKE)**. Kubernetes will be used to manage, deploy, and scale our containerized microservices.  
* **Databases:** **Cloud SQL for PostgreSQL** and **Cloud Memorystore for Redis**. Using managed services reduces our operational overhead.  
* **CI/CD Pipeline:** **GitHub Actions**. A pipeline will be configured to automatically build, test, and deploy services to a staging environment on every push to the main branch, with manual promotion to production.

## **7\. Security & Compliance**

* **Authentication:** JWT-based as described above.  
* **Authorization:** Role-Based Access Control (RBAC) will be enforced at the API Gateway and within each service.  
* **Data Security:**  
  * All data in transit will be encrypted using TLS 1.2+.  
  * All data at rest (databases, backups) will be encrypted.  
  * Sensitive information (like passwords) will be hashed using a strong, salted algorithm (e.g., bcrypt).  
* **Compliance:** The architecture will be designed to comply with Sri Lanka's Personal Data Protection Act (PDPA). All PII (Personally Identifiable Information) will be carefully managed.

## **8\. Logging, Monitoring & Alerting**

* **Logging:** A centralized logging solution like the **ELK Stack (Elasticsearch, Logstash, Kibana)** or a cloud service like Google Cloud Logging will be implemented.  
* **Monitoring:** **Prometheus** for metrics collection and **Grafana** for creating dashboards to monitor system health, API latency, and resource utilization.  
* **Alerting:** **Alertmanager** (part of Prometheus) or Google Cloud Monitoring will be configured to notify the engineering team of critical system failures or performance degradation.

## **9\. Future Considerations & Open Questions**

* **Data Warehousing Strategy:** For complex cross-module reporting, a dedicated data warehouse (e.g., Google BigQuery) will be needed post-MVP. How and when will we sync data to it?  
* **Third-Party Integrations:** The API Gateway will be the entry point for third-party developers. A formal developer portal and API key management system will be required for the public API.  
* **Disaster Recovery:** A formal disaster recovery plan needs to be developed, including regular, automated backups and a documented restoration process.