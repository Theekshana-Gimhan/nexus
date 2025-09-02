# **Architecture Design Document (ADD): "Nexus" Core ERP Platform**

* **Document Name:** Nexus Platform \- Architecture Design  
* **Version:** 1.0  
* **Status:** Ratified  
* **Date:** 01 September 2025  
* **Author:** Chief Architect / Lead Engineering Team  
* **Related Documents:** PRD (nexus\_platform\_prd.md), TDD (nexus\_platform\_tdd.md)

## **1\. Introduction**

### **1.1. Purpose**

This document provides a comprehensive architectural overview of the "Nexus" Core ERP Platform. It describes the high-level structure of the system, its components, their inter-relationships, and the guiding principles behind the design. The purpose is to ensure all technical stakeholders have a unified understanding of the system's blueprint.

### **1.2. Scope**

This ADD covers the logical and physical architecture for the Nexus Platform's Minimum Viable Product (MVP). This includes the core services (Identity, Tenancy), the first business module ("PayDay Pro"), shared infrastructure, and the cross-cutting concerns that affect the entire system. Low-level implementation details are covered in the associated Technical Design Document (TDD).

### **1.3. Audience**

This document is intended for System Architects, Senior Software Engineers, DevOps Engineers, and technical management.

## **2\. Architectural Goals and Constraints**

The architecture is designed to meet the following key goals (non-functional requirements) and adhere to specific constraints.

### **2.1. Architectural Goals**

* **Scalability:** The system must scale horizontally to support a growing number of tenants and users without significant performance degradation.  
* **Reliability & High Availability:** The platform must be highly available (target \>99.9% uptime) and resilient to individual component failures.  
* **Security:** Security must be a primary design principle, ensuring tenant data isolation, protection against common threats, and compliance with local regulations.  
* **Flexibility & Extensibility:** The architecture must be modular to allow for the easy addition of new business modules and third-party integrations in the future.  
* **Maintainability:** Services should be independently maintainable and deployable to support agile development and rapid iteration.  
* **Cost-Effectiveness:** The architecture should leverage cloud-native services and automation to optimize operational costs.

### **2.2. Constraints**

* The platform must be built as a cloud-native application on a major public cloud provider (GCP is the initial choice).  
* The system must be designed for multi-tenancy from the ground up.  
* All data must be stored and processed in a manner that complies with Sri Lanka's Personal Data Protection Act (PDPA).

## **3\. System Overview & Logical Architecture**

The Nexus Platform follows a distributed, service-oriented architecture.

### **3.1. System Context Diagram**

This diagram shows the Nexus Platform as a single system and its interaction with users and the external environment.

\+------------------+       \+----------------------+       \+------------------+  
|                  |       |                      |       |                  |  
|  Business User   |------\>|                      |------\>|   Payment        |  
| (Admin, Employee)|       |   Nexus ERP Platform |       |   Gateway        |  
|                  |\<------|                      |\<------|   (Future)       |  
\+------------------+       |                      |       \+------------------+  
                           |                      |  
                           |                      |------\>+------------------+  
                           |                      |       | Email Service    |  
                           \+----------------------+       | (e.g., AWS SES)  |  
                                                          \+------------------+

### **3.2. Container (Component) Diagram**

This diagram breaks down the Nexus Platform into its major running components (microservices and data stores).

\+---------------------------------------------------------------------------------+  
|                               Nexus ERP Platform                                |  
|                                                                                 |  
|  \+------------------------+       \+-------------------+       \+-----------------+  
|  | Frontend Application   |------\>|    API Gateway    |\<-----\>| Identity Service|  
|  | (React SPA)            |       | (Kong / AWS GW)   |       |   \[PostgreSQL\]  |  
|  \+------------------------+       \+--------^----------+       \+-----------------+  
|                                            |  
|                                            |  
|  \+------------------------+       \+--------v----------+       \+-----------------+  
|  | Tenant Service         |\<-----\>|    Event Bus      |\<-----\>| Payroll Service |  
|  |    \[PostgreSQL\]        |       |   (RabbitMQ)      |       |   \[PostgreSQL\]  |  
|  \+------------------------+       \+-------------------+       \+-----------------+  
|                                                                                 |  
\+---------------------------------------------------------------------------------+

## **4\. Component Deep Dive**

### **4.1. Frontend Application**

A Single Page Application (SPA) built with React. It provides the unified user interface shell and renders the components for each activated module. It is a "dumb" client, containing only presentation logic, with all business logic residing in the backend microservices.

### **4.2. API Gateway**

This is the single entry point for all client requests. Its responsibilities are:

* **Request Routing:** Directs incoming API calls to the appropriate microservice.  
* **Authentication:** Validates the JWT token on every request.  
* **Security:** Applies cross-cutting security policies like rate limiting and IP whitelisting.  
* **Decoupling:** Hides the internal service topology from the client.

### **4.3. Core Microservices**

Each service is an independent unit with its own data store.

* **Identity Service:** The authority for all user-related concerns. It publishes events (e.g., UserCreated) to the event bus for other services to consume.  
* **Tenant Service:** Manages the lifecycle of customer accounts.  
* **Payroll Service:** An example of a business module. It encapsulates all logic related to payroll and subscribes to events from the Identity Service (e.g., to create a corresponding employee record when a new user is created).

### **4.4. Shared Services**

* **Event Bus (RabbitMQ):** Facilitates asynchronous, event-driven communication between microservices. This decouples services, improves resilience, and is essential for workflows that span multiple services.  
* **Caching Layer (Redis):** Used for storing session data and caching frequently requested, non-volatile data to reduce database load and improve API response times.

## **5\. Cross-Cutting Concerns**

### **5.1. Security**

* **Authentication & Authorization:** Handled centrally by the Identity Service (authentication) and enforced at the API Gateway (authorization token validation) and within each service (role-based permission checks).  
* **Network Security:** The entire system will be deployed within a Virtual Private Cloud (VPC) on GCP. Services will be placed in private subnets with no direct public internet access. Only the API Gateway and the Frontend application (served via a CDN like Cloud CDN) will be exposed. Communication between services will be restricted via firewall rules.

### **5.2. Data Management**

* **Persistence Strategy:** Each microservice owns and manages its own database (**Database-per-Service pattern**). This ensures loose coupling and independent scalability.  
* **Data Consistency:** We will accept **eventual consistency** for non-atomic operations. For distributed transactions (e.g., an order process), the **Saga pattern** will be implemented using the event bus to coordinate a series of local transactions across services.  
* **Cross-Service Reporting:** For the MVP, a basic reporting service will make direct, read-only API calls to other services to aggregate data. For post-MVP, a dedicated Data Warehouse will be implemented, populated by services publishing events to the event bus.

### **5.3. Scalability & Performance**

* **Compute:** All microservices are containerized with Docker and will be deployed on a Kubernetes cluster (Google GKE), allowing for automated horizontal scaling (adding more instances of a service) based on CPU or memory load.  
* **Database:** Cloud SQL will be used, which can be scaled vertically (increasing instance size) or by adding read replicas.  
* **Frontend:** The React SPA will be deployed as static assets to a CDN (Google Cloud CDN) for low-latency delivery to users globally.

## **6\. Deployment & Infrastructure View**

The platform will be deployed entirely on GCP, leveraging managed services to reduce operational overhead.

* **Orchestration:** Google GKE for Kubernetes.  
* **Databases:** Cloud SQL for PostgreSQL.  
* **Caching:** Cloud Memorystore for Redis.  
* **Messaging:** Cloud Pub/Sub or Google Cloud Tasks for message queuing.  
* **CI/CD:** GitHub Actions for automated build, test, and deployment pipelines.  
* **Networking:** Deployed within a VPC across multiple Zones for high availability.

## **7\. Glossary**

* **API Gateway:** A central server that acts as a front-end for backend services.  
* **Microservices:** An architectural style that structures an application as a collection of small, autonomous services.  
* **Multi-Tenancy:** A single instance of software serving multiple customers (tenants).  
* **Eventual Consistency:** A consistency model which guarantees that, if no new updates are made, all replicas will eventually converge.  
* **Saga Pattern:** A failure management pattern for distributed transactions.  
* **RBAC:** Role-Based Access Control.