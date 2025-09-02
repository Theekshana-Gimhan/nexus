# **Nexus Platform API Documentation (v1.0)**

* **Version:** 1.0  
* **Status:** Ratified  
* **Last Updated:** 01 September 2025  
* **Base URL:** https://api.nexus-erp.lk/v1

## **1\. Introduction**

Welcome to the Nexus Platform API. This is a RESTful API that allows you to interact with the Nexus ERP ecosystem. All API requests and responses, including errors, are in **JSON** format.

All requests must be made over **HTTPS**. Calls made over plain HTTP will be rejected.

## **2\. Authentication**

All API requests (except for the login endpoint) must be authenticated. The Nexus API uses **JSON Web Tokens (JWT)** for authentication.

### **Authentication Flow:**

1. The client sends the user's credentials (email and password) to the POST /auth/login endpoint.  
2. If the credentials are valid, the Identity Service returns a JWT accessToken.  
3. The client must include this token in the Authorization header for all subsequent requests to the API. The header must use the Bearer scheme.

Example Header:  
Authorization: Bearer \<your\_jwt\_token\>  
Requests without a valid JWT will receive a 401 Unauthorized error.

## **3\. General Concepts**

### **Error Responses**

The API uses standard HTTP status codes to indicate the success or failure of a request. In case of an error (4xx or 5xx), the response body will contain a JSON object with a standardized error structure:

{  
  "statusCode": 404,  
  "message": "The requested resource was not found.",  
  "error": "Not Found"  
}

### **Pagination**

Endpoints that return a list of resources are paginated. You can control the pagination using the limit and offset query parameters.

* limit: The number of items to return (Default: 20, Max: 100).  
* offset: The number of items to skip from the beginning (Default: 0).

Paginated responses will have the following structure:

{  
  "data": \[  
    { ...resource object 1... },  
    { ...resource object 2... }  
  \],  
  "total": 150,  
  "limit": 20,  
  "offset": 0  
}

## **4\. Identity Service API**

**Base Path:** /

This service manages users, roles, permissions, and authentication.

### **Authentication Endpoints**

#### **POST /auth/login**

Authenticates a user and returns a JWT access token.

* **Permissions:** Public  
* **Request Body:**  
  {  
    "email": "admin@customer.com",  
    "password": "strongpassword123"  
  }

* **Success Response (200 OK):**  
  {  
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  
  }

### **User Management Endpoints**

#### **POST /users**

Creates a new user within the current tenant.

* **Permissions:** Admin  
* **Request Body:**  
  {  
    "email": "new.employee@customer.com",  
    "password": "newsecurepassword",  
    "firstName": "John",  
    "lastName": "Doe",  
    "roleId": "c4a7e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a"  
  }

* **Success Response (201 Created):**  
  {  
    "id": "f8a4e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a",  
    "tenantId": "e1a4e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a",  
    "email": "new.employee@customer.com",  
    "firstName": "John",  
    "lastName": "Doe",  
    "createdAt": "2025-09-01T12:00:00Z"  
  }

#### **GET /me**

Retrieves the profile of the currently authenticated user.

* **Permissions:** Authenticated User  
* **Success Response (200 OK):**  
  {  
    "id": "f8a4e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a",  
    "tenantId": "e1a4e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a",  
    "email": "new.employee@customer.com",  
    "firstName": "John",  
    "lastName": "Doe",  
    "roles": \["HR Manager"\]  
  }

## **5\. Payroll Service API ("PayDay Pro")**

**Base Path:** /payroll

This service manages all HR and payroll-related resources and processes.

**Note:** A User (from the Identity Service) is an account for logging in. An Employee (from the Payroll Service) is an HR record linked to a User.

### **Employee Endpoints**

#### **POST /payroll/employees**

Creates a new employee HR record and links it to an existing user.

* **Permissions:** HR Manager, Admin  
* **Request Body:**  
  {  
    "userId": "f8a4e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a",  
    "employeeNumber": "EMP1001",  
    "basicSalary": 100000.00,  
    "joinedDate": "2025-08-15"  
  }

* **Success Response (201 Created):**  
  {  
    "id": "a9b4e3d9-c2c4-4f9e-b83b-4e1b3a3c2b1a",  
    "userId": "f8a4e3d9-a2a4-4f9e-b83b-4e1b3a3c2b1a",  
    "employeeNumber": "EMP1001",  
    "basicSalary": 100000.00,  
    "joinedDate": "2025-08-15",  
    "isActive": true  
  }

#### **GET /payroll/employees**

Retrieves a paginated list of all employees in the tenant.

* **Permissions:** HR Manager, Admin  
* **Query Parameters:** limit (optional), offset (optional)  
* **Success Response (200 OK):** Returns a paginated list of employee objects.

#### **GET /payroll/employees/{employeeId}**

Retrieves the details of a specific employee.

* **Permissions:** HR Manager, Admin, or the employee themselves.  
* **URL Parameters:**  
  * employeeId (string, required): The unique identifier of the employee.  
* **Success Response (200 OK):** Returns the full employee object.

### **Pay Cycle Endpoints**

#### **POST /payroll/pay-cycles/run**

Initiates a new payroll processing cycle for a given period. This is an asynchronous operation.

* **Permissions:** HR Manager, Admin  
* **Request Body:**  
  {  
    "startDate": "2025-09-01",  
    "endDate": "2025-09-30"  
  }

* **Success Response (202 Accepted):**  
  {  
    "payCycleId": "d1c4e3d9-d2d4-4f9e-b83b-4e1b3a3c2b1a",  
    "status": "PROCESSING",  
    "message": "Payroll run for September 2025 has been initiated."  
  }

## **6\. Versioning**

The Nexus API is versioned. The current version is v1. The version is specified in the URL path. Breaking changes will result in a new API version. We will provide a migration path and ample notice before deprecating older versions.