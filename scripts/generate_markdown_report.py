import os

MD_PATH = r"c:\portfolionew\smart-supermarket\SMART_SUPERMARKET_PROJECT_REPORT.md"

md_content = """# SMART SUPERMARKET MANAGEMENT SYSTEM
### FULL TECHNICAL PROJECT REPORT

---

<!-- [PAGE 1: TITLE PAGE - RESERVED FOR USER INSERTION] -->
<!-- [PAGE 2: BONAFIDE CERTIFICATE - RESERVED FOR USER INSERTION] -->

---

## TABLE OF CONTENTS

| CH NO | TITLE | PAGE NO |
| :---: | :--- | :---: |
| **1** | **INTRODUCTION** | 4 |
| **2** | **OBJECTIVES** | 5 |
| **3** | **DESCRIPTION** | 6 |
| **4** | **CLASS DIAGRAM** | 7 |
| **5** | **TABLE STRUCTURES** | 8 |
| **6** | **ER DIAGRAM** | 12 |
| **7** | **TECH STACK** | 13 |
| **8** | **MODULES** | 15 |
| 8.0 | &nbsp;&nbsp;&nbsp;&nbsp;Design Approach | 15 |
| 8.1 | &nbsp;&nbsp;&nbsp;&nbsp;Folder Structure | 17 |
| 8.2 | &nbsp;&nbsp;&nbsp;&nbsp;User Authentication & Role-Based Access Control | 19 |
| 8.3 | &nbsp;&nbsp;&nbsp;&nbsp;Product Catalog & Intelligent Inventory Management | 23 |
| 8.4 | &nbsp;&nbsp;&nbsp;&nbsp;Smart Scan & Go (In-Store Self-Checkout Engine) | 28 |
| 8.5 | &nbsp;&nbsp;&nbsp;&nbsp;Multi-Channel Order Lifecycle & Delivery Fleet Management | 33 |
| 8.6 | &nbsp;&nbsp;&nbsp;&nbsp;Point-of-Sale (POS) Billing & Physical Cashier Terminal | 39 |
| 8.7 | &nbsp;&nbsp;&nbsp;&nbsp;Smart Optical Exit Gate & Anti-Theft Verification | 44 |
| 8.8 | &nbsp;&nbsp;&nbsp;&nbsp;Multi-Channel Communications, AI Voice Telephony & Marketing Automation | 48 |
| 8.9 | &nbsp;&nbsp;&nbsp;&nbsp;Executive Store Dashboard & Manager Business Analytics | 53 |
| **9** | **CONCLUSION** | 59 |

---

## CHAPTER 1: INTRODUCTION

In the rapidly transforming retail landscape, the operational efficiency of supermarket store management directly determines customer satisfaction, inventory turnover, and profitability. Traditional retail paradigms rely on centralized checkouts with lengthy queues, manual barcode scanning by cashiers, disjointed stock-auditing logs, and paper-based exit passes. Such conventional mechanisms are inherently time-consuming, prone to human discrepancy, susceptible to inventory shrinkage, and lack the real-time traceability demanded by contemporary omnichannel commerce.

The **Smart Supermarket Management System** is an enterprise-grade, full-stack digital solution engineered to unify, automate, and elevate the entire lifecycle of physical and digital retail operations. Developed using the robust MERN architecture (MongoDB, Express.js, React.js with Vite, and Node.js), the platform orchestrates modern retail touchpoints: high-speed consumer self-checkout via camera-based barcode recognition ("Scan & Go"), anti-theft turnstile gate validation via cryptographic QR exit passes, cashier POS terminals, intelligent multi-channel order dispatch, dynamic delivery fleet tracking, and automated AI voice telephony broadcasting.

The application is structured into four primary operational domains:
- **Customer Experience Domain:** Equips physical shoppers with an in-store camera barcode scanner, live cart calculation with tare weight estimation, aisle-indexed product navigation, dietary preference filtering, AI shopping checklist synchronization, and instant digital payments.
- **Store Operations & Cashier Domain:** Provides store floor supervisors and counter cashiers with high-speed POS billing terminals, real-time stock threshold monitoring, purchase inwards, batch pricing management, and barcode generation.
- **Security & Gate Turnstile Domain:** Features an optical exit scanner that validates paid digital exit passes, compares recorded cart item weights against physical basket tare thresholds, and triggers electronic turnstile gate unlocking with comprehensive audit logging.
- **Fleet Dispatch & Executive Intelligence Domain:** Provides automated delivery partner allocation for takeaway and express grocery orders, live rider tracking, Twilio-powered automated voice call campaigns, and comprehensive managerial sales analytics.

This project report details the architectural design, database schemas, API contracts, low-level execution workflows, and UI implementations across all nine core functional modules of the Smart Supermarket Management System.

---

## CHAPTER 2: OBJECTIVES

The primary objective of the Smart Supermarket Management System is to eliminate friction in brick-and-mortar retail operations through modern web technologies, automated hardware-software interfaces, and intelligent communications. Specific objectives include:

- **To Automate In-Store Checkout via 'Scan & Go':** Empower in-store customers to scan product barcodes using their smartphone cameras, track live basket totals, apply automated promotional discounts, and complete digital payments without waiting in cashier lines.
- **To Mitigate Retail Theft with Turnstile Pass Validation:** Implement a cryptographic exit pass verification system (`PASS-ORD-xxxxx`) integrated with optical turnstile sensors and cart weight estimations to guarantee only verified, fully paid orders exit the premises.
- **To Centralize Omnichannel Inventory & Aisle Navigation:** Maintain single-source-of-truth stock balances across all aisles and shelves, triggering real-time low-stock alerts when inventory drops below configured reorder thresholds.
- **To Provide Dual-Mode Billing (POS & Self-Checkout):** Deliver a dedicated, high-speed Point-of-Sale (POS) terminal for counter cashiers while maintaining full synchronization with customer mobile self-checkouts.
- **To Automate Delivery Partner Dispatch:** Implement an intelligent auto-allocation algorithm that matches express delivery orders with available fleet drivers based on load balancing and trip performance.
- **To Enforce Role-Based Access Control (RBAC):** Secure customer, cashier, store manager, and delivery personnel endpoints through stateless JSON Web Tokens (JWT) and guarded React routes.
- **To Enable AI Voice Telephony & Customer Engagement:** Integrate Twilio Voice API and conversational AI modals to broadcast automated promotional voice calls, interactive voicemails, and personalized offer alerts.
- **To Deliver Live Executive Dashboards & Footfall Analytics:** Generate real-time business intelligence metrics, hourly store rush-hour distributions, and product gross margin calculations for store executives.

---

## CHAPTER 3: DESCRIPTION

The Smart Supermarket Management System is structured as a decoupled, full-stack micro-monolith web application that addresses the diverse needs of customers, floor staff, logistics riders, and store managers. The system is partitioned into six core functional areas:

### 1. Customer Self-Service & Scan & Go Engine
Shoppers entering the supermarket access the progressive web application without mandatory app-store installations. Using the HTML5 MediaDevices camera API and ZXing barcode decoding, customers scan barcodes on shelf items. The application continuously queries the MongoDB product catalog, displays rich dietary badges (Vegan, Gluten-Free, Organic), shelf/aisle locations, updates the digital basket with running weight calculations, and integrates the Razorpay payment gateway alongside Cash-on-Counter options. Upon payment completion, a cryptographically signed exit QR pass is instantly minted.

### 2. Intelligent Inventory & Spatial Aisle Management
The inventory engine indexes all retail stock with hierarchical aisle and shelf coordinates (e.g., Aisle 2, Shelf 3). Real-time stock decrementing occurs atomically on order placement. Automatic threshold comparisons (`stock <= reorderLevel`) generate visual replenishment alerts for floor staff, preventing out-of-stock scenarios.

### 3. Security Turnstile & Anti-Theft Verification
Positioned at the exit turnstiles, optical security scanners query the backend `/api/gate/verify` endpoint with the scanned QR pass code. The server cross-verifies the order's payment status, matches estimated basket weight with tare limits, and triggers an electronic turnstile unlock while logging an audit trail in the `GateLog` collection.

### 4. Point-of-Sale (POS) Cashier Terminal
For customers preferring traditional checkout, cashiers utilize a high-performance POS terminal supporting keyboard-driven SKU entry, barcode scanner gun inputs, customer loyalty point redemption, split payment tenders, and instant thermal receipt printing simulation.

### 5. Delivery Logistics & Rider Dispatch
Omnichannel takeaway and express delivery orders are handled by a dedicated delivery fleet management module. Store managers onboard riders with specific vehicle types (EV Scooter, Motorcycle, Van), monitor active delivery statuses, and utilize automated rider allocation algorithms.

### 6. Telephony Broadcast, AI Voice & Executive Analytics
The platform incorporates Twilio Voice API automation allowing store managers to broadcast personalized voice offers, dispatch order delivery voicemails, and send SMS alerts. In addition, store managers have access to real-time revenue velocity charts, category contribution breakdowns, and shift rosters.

---

## CHAPTER 4: CLASS DIAGRAM

The Class Diagram represents the object-oriented structure of the backend application models, encapsulating their internal attributes, data types, visibility, relationships, and associated controller methods.

![Fig 4.0: UML Class Diagram](report_assets/fig_4_0_class_diagram.png)  
*Fig 4.0: UML Class Diagram of the Smart Supermarket Backend System*

The architectural model is centered around six core entity classes:
- **User Class:** Encapsulates customer identity, authentication credentials, loyalty points, contact information, and delivery addresses.
- **Product Class:** Defines supermarket SKU specifications including barcode, unit price, MRP, stock on hand, reorder threshold, and spatial aisle/shelf coordinates.
- **Order Class:** Maintains the complete transaction state including customer ID, line item array, financial breakdown, payment mode, cart weight, and cryptographic exit pass code.
- **DeliveryPartner Class:** Represents delivery fleet personnel, vehicle registration, shifts, active order queues, and performance metrics.
- **StaffMember Class:** Manages store associates and managers, their departmental assignments, shifts, and role-based permissions.
- **GateLog Class:** Records hardware turnstile access transactions, optical verification timestamps, and security pass outcomes.

---

## CHAPTER 5: TABLE STRUCTURES

The persistence layer is implemented using MongoDB with Mongoose ODM schemas. Below are the physical table/collection structures, indexes, field types, nullability, and default values.

### 5.1 Users Collection (`users`)

| Field | Type | Null | Key / Index | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | String | NO | UNIQUE / INDEX | UUID string | Unique user identifier |
| `name` | String | NO | None | None | Full customer / staff name |
| `email` | String | NO | UNIQUE / INDEX | None | Normalized email address |
| `phone` | String | YES | SPARSE / INDEX | None | Verified mobile phone number |
| `role` | String | NO | None | `'CUSTOMER'` | Role: `CUSTOMER`, `STAFF`, `ADMIN` |
| `avatar` | String | YES | None | Unsplash URL | Profile photo avatar URL |
| `loyaltyPoints` | Number | NO | None | `100` | Accumulated loyalty points balance |
| `address` | String | YES | None | `''` | Primary delivery address |
| `landmark` | String | YES | None | `''` | Nearby location landmark |
| `savedAddresses` | Array | YES | None | `[]` | Array of saved delivery addresses |
| `createdAt` | Date | NO | None | `Date.now()` | Account creation timestamp |
| `updatedAt` | Date | NO | None | `Date.now()` | Last profile update timestamp |

### 5.2 Products Collection (`products`)

| Field | Type | Null | Key / Index | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | String | NO | INDEX | Auto string | Unique catalog SKU identifier |
| `productCode` | String | YES | INDEX | None | Store product code (e.g., `GRO001`) |
| `barcode` | String | NO | INDEX | None | EAN-13 / UPC barcode string |
| `name` | String | NO | TEXT INDEX | None | Product commercial title |
| `brand` | String | YES | TEXT INDEX | `'SmartMart'` | Manufacturer / brand name |
| `category` | String | NO | TEXT INDEX | None | Product department category |
| `price` | Number | NO | None | None | Retail selling price in INR |
| `mrp` | Number | YES | None | None | Maximum Retail Price in INR |
| `stock` | Number | NO | None | `100` | Physical inventory count |
| `reorderLevel` | Number | NO | None | `20` | Low-stock replenishment trigger |
| `unit` | String | YES | None | `'1 unit'` | Unit of measurement (e.g., 1kg, 500ml) |
| `aisle` | Number | NO | None | `1` | In-store physical aisle number |
| `shelf` | Number | NO | None | `1` | Shelf level coordinate on aisle |
| `image` | String | YES | None | Default URL | Product showcase image URL |
| `status` | String | NO | None | `'ACTIVE'` | Status: `ACTIVE`, `INACTIVE`, `DISCONTINUED` |
| `inStock` | Boolean | NO | None | `true` | Availability boolean flag |
| `rating` | Number | NO | None | `4.5` | Average customer rating (0-5) |
| `salesCount` | Number | NO | None | `0` | Cumulative units sold count |
| `createdAt` | Date | NO | None | `Date.now()` | Record creation timestamp |
| `updatedAt` | Date | NO | None | `Date.now()` | Record modification timestamp |

### 5.3 Orders Collection (`orders`)

| Field | Type | Null | Key / Index | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | String | NO | UNIQUE / INDEX | `ORD-xxxxx` | Unique order identifier |
| `type` | String | NO | None | `'SELF_CHECKOUT'` | Type: `SELF_CHECKOUT`, `DELIVERY`, `POS` |
| `status` | String | NO | None | `'COMPLETED'` | Status: `PLACED`, `CONFIRMED`, `COMPLETED` |
| `customerId` | String | YES | INDEX | `'cust_1'` | Associated customer ID |
| `customerName` | String | YES | None | `'Customer'` | Customer display name |
| `customerPhone` | String | YES | None | None | Delivery contact phone number |
| `deliveryAddress` | String | YES | None | None | Destination delivery address |
| `paymentMode` | String | NO | None | `'Razorpay'` | Tender: `Razorpay`, `Cash`, `UPI` |
| `transactionId` | String | YES | None | Auto string | Payment gateway transaction reference |
| `subtotal` | Number | NO | None | `0` | Cart subtotal before taxes/discounts |
| `discount` | Number | YES | None | `0` | Promotional coupon discount amount |
| `deliveryFee` | Number | YES | None | `0` | Logistics delivery charge |
| `tax` | Number | YES | None | `0` | Applicable GST tax amount |
| `grandTotal` | Number | NO | None | `0` | Final payable invoice amount |
| `exitPassCode` | String | YES | INDEX | `PASS-ORD-xxx` | Cryptographic turnstile exit pass |
| `cartWeight` | String | YES | None | `'0.90 kg'` | Estimated tare basket weight |
| `rider` | Object | YES | None | `null` | Allocated delivery partner details |
| `items` | Array | NO | None | `[]` | Subdocuments: `productId`, `name`, `price`, `qty` |
| `createdAt` | Date | NO | None | `Date.now()` | Order checkout timestamp |
| `updatedAt` | Date | NO | None | `Date.now()` | Order update timestamp |

### 5.4 Delivery Partners Collection (`deliverypartners`)

| Field | Type | Null | Key / Index | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | String | NO | UNIQUE / INDEX | `DLV_xxxxxx` | Unique delivery executive ID |
| `name` | String | NO | None | None | Rider full name |
| `email` | String | NO | UNIQUE / INDEX | None | Rider account email |
| `phone` | String | NO | UNIQUE / INDEX | None | Rider direct contact phone |
| `password` | String | NO | None | `'1234'` | Access PIN / password |
| `vehicleType` | String | NO | None | `'Electric Scooter'` | Type: EV Scooter, Motorcycle, Van |
| `vehicleNo` | String | NO | None | None | Vehicle registration plate number |
| `shift` | String | YES | None | `'Morning'` | Assigned duty shift time window |
| `status` | String | NO | INDEX | `'AVAILABLE'` | Status: `AVAILABLE`, `ON_DELIVERY`, `OFFLINE` |
| `rating` | Number | NO | None | `5.0` | Customer delivery rating (1.0 - 5.0) |
| `completedTrips` | Number | NO | None | `0` | Total successful deliveries completed |
| `activeOrders` | Number | NO | None | `0` | Current live orders under delivery |
| `avatar` | String | YES | None | Default URL | Rider profile picture URL |
| `createdAt` | Date | NO | None | `Date.now()` | Onboarding timestamp |

### 5.5 Staff Members Collection (`staffmembers`)

| Field | Type | Null | Key / Index | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | String | NO | UNIQUE / INDEX | `STF_xxxxxx` | Unique store staff identifier |
| `name` | String | NO | None | None | Staff member legal name |
| `email` | String | NO | UNIQUE / INDEX | None | Official login email |
| `phone` | String | NO | UNIQUE / INDEX | None | Direct phone number |
| `password` | String | NO | None | `'staff123'` | Authentication credential |
| `role` | String | NO | None | `'STAFF'` | System role: `STAFF`, `MANAGER`, `ADMIN` |
| `designation` | String | YES | None | `'Store Associate'` | Official job title |
| `department` | String | YES | None | `'Billing & Counter'` | Supermarket operations department |
| `shift` | String | YES | None | `'Morning'` | Assigned work shift |
| `status` | String | NO | INDEX | `'ACTIVE'` | Status: `ACTIVE`, `ON_LEAVE`, `INACTIVE` |
| `avatar` | String | YES | None | Default URL | Employee photo avatar URL |
| `createdAt` | Date | NO | None | `Date.now()` | Employee hire timestamp |

### 5.6 Gate Logs Collection (`gatelogs`)

| Field | Type | Null | Key / Index | Default | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | ObjectId | NO | PRIMARY KEY | Auto-generated | MongoDB document object identifier |
| `orderId` | String | NO | INDEX | None | Linked Order identifier (`ORD-xxxxx`) |
| `gateId` | String | NO | None | `'SmartGate 01'` | Physical turnstile gate hardware ID |
| `verifiedBy` | String | NO | None | `'Optical Sensor'` | Verification mechanism / staff scanner |
| `status` | String | NO | None | `'GRANTED'` | Turnstile outcome: `GRANTED`, `DENIED` |
| `createdAt` | Date | NO | None | `Date.now()` | Turnstile scan timestamp |
| `updatedAt` | Date | NO | None | `Date.now()` | Record update timestamp |

---

## CHAPTER 6: ER DIAGRAM

The Entity-Relationship (ER) Diagram models the structural relationships and cardinality constraints governing the Smart Supermarket ecosystem.

![Fig 6.0: ER Diagram](report_assets/fig_6_0_er_diagram.png)  
*Fig 6.0: Entity-Relationship (ER) Diagram of Smart Supermarket System*

Key cardinality and referential rules governing the schema include:
- **User to Order (1 : N):** A registered customer can generate multiple self-checkout, takeaway, or express delivery orders over time, while each order is linked to a single customer ID.
- **Order to Product (N : M):** An order contains an array of normalized order line items representing purchased products, and a single product can be included in thousands of independent customer orders.
- **Order to GateLog (1 : 1):** Every paid order with an active exit pass is validated at the optical turnstile, producing a corresponding verification record in the `GateLog` collection upon door unlocking.
- **DeliveryPartner to Order (1 : N):** An active delivery partner can be assigned to multiple delivery orders sequentially or batched during peak shifts.
- **StaffMember to Store Operations:** Staff and store managers maintain catalog records, oversee inventory reorder points, operate cashier POS billing terminals, and execute manual turnstile overrides.

---

## CHAPTER 7: TECH STACK

### 7.1 TECH STACK

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js 18 + Vite | High-performance SPA with fast hot module replacement |
| **Styling & UI System** | Tailwind CSS + Lucide Icons | Responsive utility-first design system with modern aesthetic |
| **Client State** | React Context API | Centralized SupermarketContext, LanguageContext, ThemeContext |
| **Camera & Barcode** | HTML5 MediaDevices + ZXing | Web-based camera barcode scanning without hardware guns |
| **Data Visualization** | Recharts 2.12 | Responsive SVG revenue charts, category pies, and heatmaps |
| **Backend Server** | Node.js + Express.js v4 | High-throughput asynchronous REST API web service |
| **Database Layer** | MongoDB Atlas + Mongoose 8 | Document-oriented cloud database with schema validation |
| **Authentication** | JWT + bcryptjs | Stateless token-based authentication and salted password hashing |
| **Payment Gateway** | Razorpay SDK + UPI | Secure online payment processing and signature verification |
| **AI & Telephony** | Twilio Voice & SMS API | Automated telephone voice calls, voicemail, and SMS campaigns |
| **Email Services** | Nodemailer (SMTP) | High-conversion responsive HTML receipt and dispatch emails |
| **Build Pipeline** | Vite Bundler + ESLint | Optimized production client bundling and code quality |

### 7.2 ARCHITECTURE OVERVIEW

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Model (M)** | Mongoose ODM + MongoDB Atlas | Enforces strict schemas, validation constraints, indexes, and atomic updates ($inc). |
| **View (V)** | React 18 + Tailwind CSS | Renders dynamic customer and staff interfaces, camera scanner overlays, and modals. |
| **Controller (C)** | Express Route Handlers | Processes incoming HTTP requests, enforces business rules, and coordinates responses. |

The application employs a decoupled client-server architecture. The React SPA communicates with the Express REST API via standard JSON payloads over HTTP/HTTPS. Cross-Origin Resource Sharing (CORS) is enabled to support distributed deployments, and JWT tokens passed in the `Authorization: Bearer <token>` header ensure secure stateless authentication across customer, staff, and delivery portals.

---

## CHAPTER 8: MODULES

### 8.0 Design Approach

Every module of the Smart Supermarket Management System is evaluated and documented following a standardized seven-step system design framework:

| Step | Question it answers | Presented in each module as |
| :--- | :--- | :--- |
| **1. Functional requirements** | What specific tasks must the module execute? | Section 8.x.1 |
| **2. Non-functional requirements** | What are the latency, security, integrity, and CAP bounds? | Section 8.x.2 |
| **3. Tech stack** | Which libraries and tools solve this specific problem? | Section 8.x.3 |
| **4. Back-of-the-envelope** | What are the expected user volumes, request rates, and storage? | Section 8.x.4 |
| **5. Low-level architecture** | Which software components interact and in what flow? | Section 8.x.5 (Flow Diagram + Request Flow) |
| **6. API design** | What is the exact HTTP REST contract between client and server? | Section 8.x.6 (Table) |
| **7. DB design** | Which MongoDB collections, indexes, and fields store the data? | Section 8.x.7 (Table) |
| **8. Screenshots & Walkthrough** | What does the live interface look like and how does it function? | Section 8.x.8 (Figures + In-depth Analysis) |

#### Shared Baseline for All Modules
Non-functional baseline: Every incoming request passes through CORS validation, `express.json()` payload parsing, and route-level JWT authentication middleware before invoking route handlers. All persistent state resides in MongoDB Atlas with replica set guarantees. In CAP theorem terms, the system emphasizes Consistency and Partition Tolerance (CP) for inventory balances and payment verification: stock cannot be oversold, and an invalid exit pass can never unlock the turnstile.

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Active Daily Shoppers** | ≈ 500 – 1,000 shoppers | Urban supermarket daily in-store footfall |
| **Total Catalog SKUs** | 100+ active items | Full supermarket department catalog |
| **Daily Transactions** | ≈ 1,200 orders / day | Combined Scan & Go, POS, and Deliveries |
| **Peak Transaction Rate** | ≈ 5 – 10 req/s | Rush hours: 08:30-10:00 & 18:00-20:30 |
| **Total Database Collections** | 6 core collections | `users`, `products`, `orders`, `deliverypartners`, `staffmembers`, `gatelogs` |

![Fig 8.0: Overall Request Flow](report_assets/fig_8_0_overall_flow.png)  
*Fig 8.0: Overall Request Flow of the Smart Supermarket Management System*

---

### 8.1 FOLDER STRUCTURE

![Fig 8.1.1: High-Level Monorepo Structure](report_assets/fig_8_1_1_highlevel_tree.png)  
*Fig 8.1.1: High-Level Monorepo Structure*

#### 8.1.1 Backend Folder Structure
![Fig 8.1.2: Backend Directory Hierarchy](report_assets/fig_8_1_2_backend_tree.png)  
*Fig 8.1.2: Backend Directory Hierarchy and Modular API Routes*

The backend repository follows a clean layered MVC structure. The application entry point `index.js` configures environment variables, boots the Express web server on port 5000, attaches CORS headers, connects asynchronously to MongoDB Atlas via `config/db.js`, and registers dedicated route controllers (`routes/auth.js`, `routes/products.js`, `routes/orders.js`, `routes/delivery.js`, `routes/staff.js`, `routes/gate.js`, `routes/payment.js`, `routes/voice.js`).

#### 8.1.2 Frontend Folder Structure
![Fig 8.1.3: Frontend Directory Organization](report_assets/fig_8_1_4_frontend_tree.png)  
*Fig 8.1.3: Frontend Directory Organization (Vite + React)*

The client application is organized into specialized domain subdirectories under `frontend/src/`. Domain pages are partitioned into `pages/customer/`, `pages/staff/`, `pages/delivery/`, and `pages/manager/`. Reusable UI widgets and dialog modals reside under `components/voice/` (Twilio campaigns, voicemail, offer alerts), `components/customer/` (AI chatbot, aisle map, phone registration), and `components/staff/` (route guards).

---

### 8.2 USER AUTHENTICATION & ACCESS CONTROL

#### 8.2.0 Purpose & Scope
Provides stateless tokenized authentication, credential security, role-based access control (RBAC), and session management across three separate user tiers: Customers, Store Staff / Managers, and Delivery Executives.

#### 8.2.1 Functional Requirements
- **Multi-Role Login:** Supports dedicated authentication for Customers (email/password or Google OAuth), Store Staff & Managers (email/phone with role validation), and Delivery Partners (phone/vehicle ID with numeric PIN).
- **Stateless Token Issuance:** Generates signed JSON Web Tokens (JWT) containing user ID, role, and email with configurable expiry (24 hours).
- **Role-Based Route Guarding:** React `StaffProtectedRoute` and `DeliveryProtectedRoute` components intercept unauthenticated attempts and redirect users to role-specific login views.
- **Phone Verification & Onboarding:** Allows customers to link verified phone numbers to enable automated voice deal calls and SMS order updates.

#### 8.2.2 Non-Functional Requirements
- **Password Security:** Client passwords stored using bcryptjs salt rounds, preventing plaintext credential leakage.
- **Low Latency:** Token verification handled synchronously in memory via `jwt.verify()`, adding < 1 ms overhead per request.
- **Session Resilience:** Stateless tokens permit seamless client re-hydration from `localStorage` without server-side session stores.

#### 8.2.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Tokenization** | jsonwebtoken (^9.0.2) | Standardized stateless JWT format containing user ID and role claims |
| **Password Encryption** | bcryptjs (^2.4.3) | Pure JavaScript salted cryptographic hashing |
| **Client Storage** | localStorage + React State | Preserves authentication sessions across browser refreshes |
| **Route Interception** | React Router v6 ProtectedRoute | Enforces client-side authorization before page mount |

#### 8.2.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Registered Shoppers** | ≈ 10,000 accounts | Supermarket loyalty customer base |
| **Daily Logins** | ≈ 1,200 logins / day | Customer checkouts + staff clock-ins |
| **Token Payload Size** | ≈ 250 bytes | Header + Claims (id, role, email) + Signature |
| **Peak Login Rate** | ≈ 2 – 4 logins / s | Opening shift and evening rush |

#### 8.2.5 Low-Level Architecture

![Fig 8.2.A: Low-Level Architecture](report_assets/fig_8_2_a_auth_arch.png)  
*Fig 8.2.A: Low-Level Architecture – User Authentication & RBAC*

**Request Flow:**
1. The user enters credentials on `/customer/login`, `/staff/login`, or `/delivery/login`.
2. The client dispatches a POST request to `/api/auth/login`, `/api/staff/login`, or `/api/delivery/login`.
3. The Express controller verifies the user document in MongoDB, verifies the password hash, and checks role permissions.
4. Upon validation, the server generates a signed JWT and returns the user profile.
5. The client stores the token in `localStorage` and initializes `SupermarketContext`.
6. Protected API calls attach `Authorization: Bearer <token>` in HTTP headers.

#### 8.2.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registers a new customer account (name, email, password, phone) |
| **POST** | `/api/auth/login` | Authenticates customer credentials; returns JWT token & user profile |
| **POST** | `/api/auth/google` | Google OAuth SSO callback and token issuance |
| **PATCH** | `/api/auth/phone` | Updates and verifies customer contact phone number |
| **POST** | `/api/staff/login` | Authenticates store staff and managers with role enforcement |
| **POST** | `/api/delivery/login` | Authenticates delivery fleet partners via phone/vehicle credentials |

#### 8.2.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `users` | PK: `id`, UNIQUE: `email`, INDEX: `phone` | `name`, `email`, `phone`, `role` ('CUSTOMER'), `loyaltyPoints`, `address` |
| `staffmembers` | PK: `id`, UNIQUE: `email`, `phone` | `name`, `email`, `phone`, `password`, `role` ('STAFF'\|'MANAGER'), `shift` |
| `deliverypartners` | PK: `id`, UNIQUE: `email`, `phone` | `name`, `email`, `phone`, `vehicleType`, `vehicleNo`, `shift`, `status` |

#### 8.2.8 Screenshots & Walkthrough

![Fig 8.2.1: Customer Authentication](report_assets/fig_8_2_1_customer_login.png)  
*Fig 8.2.1: Customer Authentication & Registration Interface*

The Customer Login interface offers a streamlined authentication experience for in-store and online shoppers. Shoppers can switch between Sign In and Sign Up tabs, input their email and password, or authenticate using Google OAuth SSO. Upon sign-in, the system loads the customer's loyalty point balance and saved addresses.

![Fig 8.2.2: Staff Login](report_assets/fig_8_2_2_staff_login.png)  
*Fig 8.2.2: Staff & Manager Role-Based Login Interface*

The Staff Login interface provides secure access for supermarket floor staff and store managers. The controller enforces strict role verification: accounts with standard staff privileges cannot access managerial analytics or team rosters, ensuring data separation.

![Fig 8.2.3: Delivery Login](report_assets/fig_8_2_3_delivery_login.png)  
*Fig 8.2.3: Delivery Partner Authentication Interface*

The Delivery Partner Login screen allows delivery riders to access their active trip manifests using their registered mobile phone number and 4-digit PIN, initiating their shift status to 'AVAILABLE'.

---

### 8.3 PRODUCT CATALOG & INTELLIGENT INVENTORY MANAGEMENT

#### 8.3.0 Purpose & Scope
Manages the central product catalog, barcode indexing, spatial aisle/shelf coordinates, real-time inventory balances, and automated reorder threshold triggers.

#### 8.3.1 Functional Requirements
- **Catalog Management:** CRUD operations for products including SKU code, barcode, brand, category, MRP, selling price, unit size, and product images.
- **Spatial Aisle Navigation:** Assigns each product an exact in-store Aisle Number (1-10) and Shelf Tier (1-5) to guide shoppers and picking staff.
- **Real-Time Inventory Tracking:** Live stock counts with automatic decrements upon order confirmation and increments upon supplier restocking.
- **Low-Stock Alerts:** Flags products whose current stock falls below configured `reorderLevel`, presenting restocking action badges.

#### 8.3.2 Non-Functional Requirements
- **Search Performance:** Text-indexed searches on `name`, `brand`, and `category` return product results in under 50 ms.
- **Stock Consistency:** Atomic decrement operations via `$inc` ensure no two concurrent shoppers can purchase the same inventory unit.
- **High Read Throughput:** Optimized compound indexing supports high-frequency barcode scans during peak shopping periods.

#### 8.3.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Data Storage** | MongoDB Product Collection | Flexible schema accommodating diverse grocery attributes and dietary flags |
| **Indexing** | Compound Text & Barcode Index | Instant sub-millisecond barcode lookups from scanner cameras |
| **Client Interface** | React Table & Filter Cards | Fast search, category switching, and real-time stock edits |

#### 8.3.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Catalog Size** | 100+ active items | Full supermarket department catalog |
| **Barcode Queries** | ≈ 5,000 / day | Customer scans + POS cashier scans |
| **Storage per Product** | ≈ 1.5 KB | Metadata, images, aisle coords, dietary flags |
| **Total Catalog Storage** | ≈ 1.5 MB in RAM | Readily cached in memory for zero disk latency |

#### 8.3.5 Low-Level Architecture

![Fig 8.3.A: Catalog Architecture](report_assets/fig_8_3_a_catalog_arch.png)  
*Fig 8.3.A: Low-Level Architecture – Catalog & Inventory Engine*

**Request Flow:**
1. The client loads the catalog or queries a barcode via `/api/products` or `/api/products/barcode/:barcode`.
2. The controller uses MongoDB indexed lookups to return matching SKU records.
3. When an order completes, the order controller issues atomic `$inc: { stock: -quantity }` updates.
4. If `stock <= reorderLevel`, the inventory dashboard highlights the low-stock status.

#### 8.3.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **GET** | `/api/products` | Fetches product catalog with optional query filters (category, search) |
| **GET** | `/api/products/barcode/:barcode` | Retrieves exact SKU by scanned EAN-13/UPC barcode string |
| **GET** | `/api/products/:id` | Fetches single product details including aisle location and ratings |
| **POST** | `/api/products` | Creates a new product record (Staff / Manager only) |
| **PUT** | `/api/products/:id` | Updates product details, pricing, or stock counts |
| **DELETE** | `/api/products/:id` | Soft-deletes or removes product from active catalog |

#### 8.3.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `products` | PK: `id`, INDEX: `barcode`, TEXT: `name`, `brand`, `category` | `productCode`, `barcode`, `name`, `price`, `mrp`, `stock`, `reorderLevel`, `aisle`, `shelf`, `status` |

#### 8.3.8 Screenshots & Walkthrough

![Fig 8.3.1: Product Catalog](report_assets/fig_8_3_1_products_catalog.png)  
*Fig 8.3.1: Product Catalog Management Interface*

The Product Catalog interface displays the supermarket inventory with detailed attributes including SKU code, barcode, selling price, MRP, stock count, and spatial location (Aisle/Shelf). Staff members can add new items, modify pricing, and update stock levels directly from this view.

![Fig 8.3.2: Inventory Levels](report_assets/fig_8_3_2_inventory_levels.png)  
*Fig 8.3.2: Real-time Inventory & Low-Stock Alert Interface*

The Inventory Levels dashboard tracks stock availability in real time. Items falling below their configured reorder threshold are visually flagged with amber warnings, allowing inventory managers to trigger purchase orders before stockouts occur.

![Fig 8.3.3: Customer Product Search](report_assets/fig_8_3_3_customer_product_search.png)  
*Fig 8.3.3: Product Search with Aisle & Shelf Navigation*

The Customer Product Search screen enables shoppers to browse products by department, apply price filters, and locate items within the physical store using exact aisle and shelf coordinates.

---

### 8.4 SMART SCAN & GO (IN-STORE SELF-CHECKOUT ENGINE)

#### 8.4.0 Purpose & Scope
Enables in-store supermarket customers to scan item barcodes using their smartphone camera, maintain an interactive digital cart with live weight tracking, apply promo coupons, complete payments, and generate cryptographic exit gate passes.

#### 8.4.1 Functional Requirements
- **Camera Barcode Scanner:** Integrates the HTML5 camera stream to scan EAN-13, UPC, and Code-128 barcodes directly from product packaging.
- **Dynamic Cart Calculations:** Calculates item subtotals, promotional discounts, and applicable GST taxes in real time as items are added.
- **Cart Weight Estimation:** Calculates estimated physical basket weight (in kg) based on item specifications to enable tare verification at the exit turnstile.
- **Digital Exit Pass Minting:** Upon payment completion, generates an encrypted QR exit pass (`PASS-ORD-xxxxx`) valid for single-use turnstile clearance.

#### 8.4.2 Non-Functional Requirements
- **Scanning Responsiveness:** Continuous video frame processing at 30 fps with sub-100 ms barcode recognition.
- **Financial Precision:** All calculations maintain 2 decimal places to ensure exact reconciliation with payment gateways.
- **Anti-Theft Integrity:** Exit passes are tied to verified paid orders, preventing fraudulent gate unlocks.

#### 8.4.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Camera Scanning** | HTML5 MediaDevices + BarcodeDetector API | Zero-install web camera scanning in browser |
| **Payment Processing** | Razorpay Checkout SDK | Supports UPI, Credit/Debit cards, Net Banking, and digital wallets |
| **QR Pass Generation** | qrcode.react | Generates high-contrast QR codes readable by optical gate scanners |

#### 8.4.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Daily Scan & Go Orders** | ≈ 400 orders / day | 40% of in-store shoppers adopting self-checkout |
| **Scans per Order** | ≈ 6 – 10 scans | Average grocery basket size |
| **Total Daily Camera Scans** | ≈ 3,500 scans / day | Derived from basket sizes |
| **Checkout Duration** | ≈ 45 seconds | Scan, review cart, pay via UPI, and receive exit pass |

#### 8.4.5 Low-Level Architecture

![Fig 8.4.A: Scan & Go Architecture](report_assets/fig_8_4_a_scan_go_arch.png)  
*Fig 8.4.A: Low-Level Architecture – Smart Scan & Go Engine*

**Request Flow:**
1. The shopper opens `/customer/scan` and grants camera permissions.
2. Scanning an item triggers a lookup to `/api/products/barcode/:barcode`.
3. The item is added to the local cart state with price and weight calculations.
4. The shopper proceeds to checkout and selects Razorpay or Cash.
5. Upon payment confirmation, POST `/api/orders` records the transaction.
6. The server decrements stock atomically and returns the unique `exitPassCode`.
7. The client renders the turnstile exit QR code.

#### 8.4.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **GET** | `/api/products/barcode/:barcode` | Validates scanned barcode and returns product details |
| **POST** | `/api/orders` | Creates completed self-checkout order, decrements stock, mints exit pass |
| **POST** | `/api/payment/razorpay/create-order` | Initializes Razorpay payment order with INR currency |
| **POST** | `/api/payment/razorpay/verify-signature` | Validates cryptographic Razorpay payment signature |

#### 8.4.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `orders` | PK: `id`, INDEX: `exitPassCode`, `customerId` | `type` ('SELF_CHECKOUT'), `status`, `grandTotal`, `exitPassCode`, `cartWeight`, `items` |

#### 8.4.8 Screenshots & Walkthrough

![Fig 8.4.1: Customer Scan & Go](report_assets/fig_8_4_1_customer_scan_go.png)  
*Fig 8.4.1: Customer Scan & Go Self-Checkout Interface*

The Scan & Go interface combines camera barcode scanning with manual entry options. The active cart displays itemized subtotals, quantity adjusters, estimated basket weight, and a direct checkout button.

![Fig 8.4.2: Customer Shopping List](report_assets/fig_8_4_2_customer_shopping_list.png)  
*Fig 8.4.2: Smart Shopping Checklist with Auto-Sync*

The Shopping List module allows customers to prepare checklists before visiting the store. As items are scanned during shopping, they are automatically checked off the list, optimizing the customer's route through store aisles.

---

### 8.5 MULTI-CHANNEL ORDER LIFECYCLE & DELIVERY FLEET MANAGEMENT

#### 8.5.0 Purpose & Scope
Manages omnichannel order fulfillment across Self-Checkout, Store Takeaway, and Express Home Delivery channels, incorporating automated rider dispatch and fleet tracking.

#### 8.5.1 Functional Requirements
- **Omnichannel Order States:** Tracks orders through progressive lifecycle states: PLACED → CONFIRMED → PACKING → OUT_FOR_DELIVERY → DELIVERED / COMPLETED.
- **Automated Rider Allocation:** Automatically assigns available delivery partners to express orders based on vehicle type, active order load, and shift status.
- **Delivery Partner Dashboard:** Provides riders with mobile-optimized views of assigned orders, customer addresses, phone contacts, and delivery status toggles.
- **Fleet Management:** Enables store managers to register delivery personnel, track vehicle numbers, and monitor driver ratings and trip counts.

#### 8.5.2 Non-Functional Requirements
- **Fulfillment Speed:** Auto-allocation algorithm completes rider assignment within 200 ms of order placement.
- **Concurrency Control:** MongoDB document locking ensures a rider's active order queue is updated reliably without race conditions.
- **Status Traceability:** Every state transition updates the order's `updatedAt` timestamp and triggers customer notification events.

#### 8.5.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Order Orchestration** | Express REST Controllers | Manages state transitions and auto-dispatch logic |
| **Persistence** | MongoDB Order & DeliveryPartner Collections | Maintains real-time order states and rider availability |
| **Rider Interface** | Mobile-Responsive React Dashboard | Enables one-touch status updates on mobile devices |

#### 8.5.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Daily Delivery Orders** | ≈ 200 – 300 orders / day | Express online grocery home deliveries |
| **Active Fleet Size** | 10 – 15 delivery riders | Electric scooters and motorcycle delivery team |
| **Average Delivery Time** | 15 – 25 minutes | Hyperlocal store radius (3-5 km) |
| **Trips per Rider per Day** | ≈ 15 – 20 completed trips | Calculated over an 8-hour shift |

#### 8.5.5 Low-Level Architecture

![Fig 8.5.A: Order Delivery Architecture](report_assets/fig_8_5_a_order_delivery_arch.png)  
*Fig 8.5.A: Low-Level Architecture – Order Lifecycle & Fleet Dispatch*

**Request Flow:**
1. A delivery order is submitted via POST `/api/orders` with `type: 'DELIVERY'`.
2. The server queries `DeliveryPartner` for available drivers with the lowest active load.
3. The selected rider's status updates to `ON_DELIVERY` and `activeOrders` increments.
4. Staff update order progress via PATCH `/api/orders/:id/status`.
5. The assigned rider views the order on `/delivery/dashboard` and marks it delivered.

#### 8.5.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **GET** | `/api/orders` | Lists all store orders or filters by customer ID and status |
| **GET** | `/api/orders/:id` | Retrieves comprehensive details of a single order |
| **PATCH** | `/api/orders/:id/status` | Advances order status (CONFIRMED, PACKING, OUT_FOR_DELIVERY) |
| **GET** | `/api/delivery/partners` | Lists all registered delivery fleet executives |
| **POST** | `/api/delivery/partners` | Onboards a new delivery partner (Manager only) |
| **PUT** | `/api/delivery/partners/:id/status` | Updates partner availability (AVAILABLE, ON_DELIVERY, OFFLINE) |
| **POST** | `/api/delivery/auto-allocate` | Executes automated dispatch algorithm for pending deliveries |

#### 8.5.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `orders` | PK: `id`, INDEX: `status`, `customerId` | `id`, `type`, `status`, `grandTotal`, `deliveryAddress`, `rider`, `items` |
| `deliverypartners` | PK: `id`, INDEX: `status` | `name`, `phone`, `vehicleType`, `vehicleNo`, `shift`, `status`, `activeOrders` |

#### 8.5.8 Screenshots & Walkthrough

![Fig 8.5.1: Customer Orders](report_assets/fig_8_5_1_customer_orders_gatepass.png)  
*Fig 8.5.1: Customer Live Order Tracking & Turnstile Gate Pass QR*

The Customer Orders screen displays real-time tracking for active purchases, including live status progress bars, delivery partner details, and high-resolution QR exit passes for in-store self-checkout orders.

![Fig 8.5.2: Staff Orders](report_assets/fig_8_5_2_staff_orders_dispatch.png)  
*Fig 8.5.2: Staff Orders Dispatch Board*

The Staff Orders Dispatch Board organizes orders by fulfillment status. Staff can view order details, advance statuses, assign delivery riders, and process cancellations from a single screen.

![Fig 8.5.3: Staff Delivery Fleet](report_assets/fig_8_5_3_staff_delivery_fleet.png)  
*Fig 8.5.3: Delivery Fleet Management & Driver Roster*

The Delivery Fleet Management screen allows managers to track all riders, view vehicle types and duty shifts, monitor ratings, and onboard new delivery executives.

![Fig 8.5.4: Delivery Dashboard](report_assets/fig_8_5_4_delivery_dashboard.png)  
*Fig 8.5.4: Delivery Partner Active Route Dashboard*

The Delivery Partner Dashboard gives riders quick access to assigned orders, delivery addresses, recipient phone numbers, and one-touch status updates.

---

### 8.6 POINT-OF-SALE (POS) BILLING & PHYSICAL CASHIER TERMINAL

#### 8.6.0 Purpose & Scope
Provides counter cashiers with a keyboard-optimized POS terminal for barcode scanning, SKU lookups, customer loyalty point redemption, payment tendering, and receipt generation.

#### 8.6.1 Functional Requirements
- **Rapid Item Entry:** Supports barcode scanner gun inputs and quick SKU keyboard searches with instant line-item addition.
- **Loyalty Points Integration:** Looks up customer profiles by phone number, allowing points to be earned or redeemed against invoice totals.
- **Multi-Tender Payments:** Processes payments via Cash, Card, and dynamic UPI QR codes with change calculation.
- **Thermal Receipt Printing:** Generates formatted 80mm thermal receipts with store details, GST breakdowns, and payment confirmation.

#### 8.6.2 Non-Functional Requirements
- **Checkout Speed:** Optimized keyboard shortcuts allow an 8-item transaction to be processed in under 30 seconds.
- **Offline Resilience:** Client-side state caching preserves active billing carts across temporary network drops.
- **Inventory Accuracy:** Completing a transaction immediately reduces stock counts via atomic database operations.

#### 8.6.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Keyboard Navigation** | React Hotkeys & Event Listeners | Fast cashier workflow without requiring mouse interaction |
| **Receipt Output** | HTML Thermal CSS Styles | Formatted for standard 80mm ESC/POS thermal printers |
| **Cart Management** | React Local State | Immediate UI feedback during fast scanning |

#### 8.6.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **POS Lanes** | 3 – 5 cashier counters | Physical supermarket cashier lanes |
| **Invoices per Lane per Day** | ≈ 150 – 200 bills | Standard retail lane volume |
| **Total Daily POS Revenue** | ≈ ₹1,50,000 – ₹2,50,000 | Average basket value ₹800 – ₹1,200 |
| **Receipt Print Payload** | ≈ 3.5 KB HTML | Compact thermal receipt data |

#### 8.6.5 Low-Level Architecture

![Fig 8.6.A: POS Architecture](report_assets/fig_8_6_a_pos_arch.png)  
*Fig 8.6.A: Low-Level Architecture – POS Billing Terminal*

**Request Flow:**
1. The cashier scans an item barcode or types a product name in `/staff/pos`.
2. The system fetches the matching SKU and adds it to the active ticket.
3. The cashier inputs the customer's phone number to retrieve loyalty points.
4. Payment tender is selected (Cash, Card, UPI) and completed.
5. The system submits POST `/api/orders` with `type: 'POS_COUNTER'`.
6. Inventory stock is decremented and a printable receipt is displayed.

#### 8.6.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **GET** | `/api/products/barcode/:barcode` | Instant barcode lookup for POS scanner guns |
| **GET** | `/api/auth/customers` | Retrieves customer profile and loyalty points by phone number |
| **POST** | `/api/orders` | Records completed POS transaction with tender details and stock updates |
| **GET** | `/api/orders?type=POS` | Retrieves historical POS sales registers and tender summaries |

#### 8.6.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `orders` | PK: `id`, INDEX: `type`, `createdAt` | `type` ('POS_COUNTER'), `paymentMode`, `grandTotal`, `items`, `customerName` |
| `products` | PK: `id`, INDEX: `barcode` | `barcode`, `name`, `price`, `stock`, `salesCount` |

#### 8.6.8 Screenshots & Walkthrough

![Fig 8.6.1: POS Billing](report_assets/fig_8_6_1_pos_billing_terminal.png)  
*Fig 8.6.1: High-Speed POS Billing Terminal for Store Cashiers*

The POS Billing Terminal features a large product selection area, barcode input field, active cart table, and tender calculator. Cashiers can complete checkouts, apply discounts, and print receipts quickly.

![Fig 8.6.2: Sales History](report_assets/fig_8_6_2_sales_history.png)  
*Fig 8.6.2: Historical Sales & Tender Breakdown*

The Sales History view provides a chronological record of completed POS transactions, showing payment modes, customer details, and total amounts for daily reconciliation.

---

### 8.7 SMART OPTICAL EXIT GATE & ANTI-THEFT VERIFICATION

#### 8.7.0 Purpose & Scope
Secures store exit points by validating digital exit pass QR codes against verified paid orders, checking cart weight limits, and logging security events.

#### 8.7.1 Functional Requirements
- **Optical QR Verification:** Scans the customer's digital exit pass (`PASS-ORD-xxxxx`) using optical turnstile sensors or staff inspection tablets.
- **Payment & Status Check:** Verifies that the order exists, has a status of `COMPLETED`, and has not been used previously.
- **Cart Weight Validation:** Compares the physical basket weight against the order's estimated tare weight (`cartWeight`) within a ±10% tolerance.
- **Audit Logging:** Records every turnstile pass attempt in the `GateLog` collection with timestamp, gate ID, and verification status.

#### 8.7.2 Non-Functional Requirements
- **Verification Latency:** Exit pass verification completes in under 200 ms to ensure smooth customer exit flow.
- **Anti-Passback Security:** Prevents reuse of exit passes after clearance through state-locked database validation.
- **Failure Safety:** If verification fails or the code is invalid, the turnstile remains securely locked.

#### 8.7.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Verification Engine** | Express Route /api/gate/verify | Low-latency verification endpoint |
| **Audit Persistence** | MongoDB GateLog Collection | Persistent log of all gate access attempts |
| **Inspector Interface** | React Security Verification Screen | Provides manual override controls for store security |

#### 8.7.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Daily Turnstile Passes** | ≈ 400 – 600 validations | Scan & Go shoppers clearing the exit gate |
| **Verification Time** | ≈ 150 ms | Sub-second database lookup and response |
| **Log Growth per Day** | ≈ 500 records (≈ 200 KB) | Compact access log footprint |
| **Turnstile Unlock Window** | 7 seconds | Standard pedestrian turnstile passage time |

#### 8.7.5 Low-Level Architecture

![Fig 8.7.A: Turnstile Security Architecture](report_assets/fig_8_7_a_gate_arch.png)  
*Fig 8.7.A: Low-Level Architecture – Optical Gate Security*

**Request Flow:**
1. The customer presents their exit pass QR code to the turnstile scanner.
2. The hardware sends a POST request to `/api/gate/verify` with `{ passCode, gateId }`.
3. The server locates the order using the pass code or order ID.
4. If valid and paid, the server logs a `GRANTED` record in `GateLog`.
5. The API returns `GATE_UNLOCKED`, triggering the physical turnstile mechanism.
6. If invalid or unpaid, the API returns `GATE_DENIED` and the turnstile stays locked.

#### 8.7.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **POST** | `/api/gate/verify` | Validates exit pass code, checks payment status, logs gate access event |

#### 8.7.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `gatelogs` | PK: `_id`, INDEX: `orderId`, `createdAt` | `orderId`, `gateId`, `verifiedBy`, `status` ('GRANTED'\|'DENIED'), `createdAt` |
| `orders` | PK: `id`, INDEX: `exitPassCode` | `exitPassCode`, `status`, `customerName`, `cartWeight`, `grandTotal` |

#### 8.7.8 Screenshots & Walkthrough

![Fig 8.7.1: Turnstile Verification](report_assets/fig_8_7_1_turnstile_verification.png)  
*Fig 8.7.1: Turnstile Security Verification Scanner*

The Turnstile Security Verification interface is used by security personnel and optical scanners to validate exit passes. It displays order details, paid amounts, and cart weights, and provides a manual override button when needed.

![Fig 8.7.2: Customer Settings](report_assets/fig_8_7_2_customer_profile_settings.png)  
*Fig 8.7.2: Customer Settings & Verified Digital ID*

The Customer Settings screen allows shoppers to manage their profile, dietary preferences (Vegan, Gluten-free, etc.), saved delivery addresses, and phone number verification for automated notifications.

---

### 8.8 MULTI-CHANNEL COMMUNICATIONS, AI VOICE TELEPHONY & MARKETING AUTOMATION

#### 8.8.0 Purpose & Scope
Provides customer engagement tools including an in-app AI conversational assistant, automated phone calls and voicemails via Twilio Voice API, SMS alerts, and promotional broadcasts.

#### 8.8.1 Functional Requirements
- **AI Shopping Assistant:** In-app conversational chatbot that helps customers find products, provides recipe ideas, and gives aisle directions.
- **Twilio Automated Voice Calls:** Initiates automated phone calls to notify customers of flash discounts, order dispatches, and store events.
- **Interactive Voicemail:** Dispatches voicemail audio messages with store promotions to customer phone numbers.
- **SMS & Email Notifications:** Sends order confirmation SMS messages and formatted HTML email receipts via Nodemailer.

#### 8.8.2 Non-Functional Requirements
- **Telephony Reliability:** Built-in fallback mode ensures notification requests succeed even during external API downtime.
- **Template Rendering:** Responsive HTML email templates compile in under 50 ms.
- **Spam Prevention:** Rate limiting prevents excessive call dispatches to the same phone number within a single day.

#### 8.8.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Telephony API** | Twilio Voice & SMS SDK (^6.1.1) | Automated phone call dispatch and TwiML generation |
| **Email Service** | Nodemailer (^10.0.16) | SMTP-based delivery of responsive HTML emails |
| **Chatbot UI** | React AIChatbotModal | In-app conversational assistant interface |

#### 8.8.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Daily AI Inquiries** | ≈ 300 – 500 conversations | Customer product questions and recipe requests |
| **Automated Voice Calls** | ≈ 50 – 100 calls / campaign | Weekly promotional deals broadcast |
| **SMS & Email Notifications** | ≈ 1,200 messages / day | Order confirmations and delivery updates |
| **Voice Call Duration** | ≈ 25 – 40 seconds | Short promotional audio announcements |

#### 8.8.5 Low-Level Architecture

![Fig 8.8.A: Voice Communications Architecture](report_assets/fig_8_8_a_voice_comm_arch.png)  
*Fig 8.8.A: Low-Level Architecture – AI Voice & Telephony Engine*

**Request Flow:**
1. A manager triggers a campaign or a customer asks a question in the AI chatbot.
2. The request is routed to `/api/voice/*` endpoints.
3. For voice campaigns, the server calls Twilio Voice API to initiate the call with dynamic TwiML.
4. For order notifications, Nodemailer dispatches an HTML email with order line items.
5. Dispatch outcomes are logged in system notification collections.

#### 8.8.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **POST** | `/api/voice/send-offer-alert` | Initiates automated phone call with promotional deals via Twilio |
| **POST** | `/api/voice/send-voicemail` | Dispatches promotional voicemail audio to customer phone |
| **POST** | `/api/voice/send-sms` | Sends order update or coupon code via SMS |
| **POST** | `/api/voice/send-email` | Dispatches responsive HTML email invoice and order status |
| **POST** | `/api/voice/broadcast-all` | Broadcasts promotional announcements to all registered customers |

#### 8.8.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `users` | PK: `id`, INDEX: `phone` | `name`, `email`, `phone`, `loyaltyPoints`, `preferences` |
| `orders` | PK: `id`, INDEX: `customerPhone` | `id`, `status`, `grandTotal`, `rider`, `customerPhone` |

#### 8.8.8 Screenshots & Walkthrough

![Fig 8.8.1: Campaigns & Broadcasts](report_assets/fig_8_8_1_staff_campaigns_broadcast.png)  
*Fig 8.8.1: Promotional Campaigns & Broadcast Management*

The Promotional Campaigns screen lets store managers configure automated outreach. Managers can create discount codes, select target customer segments, and launch automated voice calls, SMS, or email blasts.

![Fig 8.8.2: Customer CRM Registry](report_assets/fig_8_8_2_customer_crm_registry.png)  
*Fig 8.8.2: Customer CRM & Contact Registry*

The Customer CRM Registry provides a centralized directory of shoppers. Managers can view verified phone numbers, email addresses, loyalty point balances, and purchase history.

![Fig 8.8.3: Storefront Hub](report_assets/fig_8_8_3_customer_storefront_hub.png)  
*Fig 8.8.3: Customer Storefront & AI Supermarket Assistant Hub*

The Customer Storefront serves as the primary home screen for shoppers, showcasing featured deals, category navigation, the AI assistant modal launcher, and store announcements.

---

### 8.9 EXECUTIVE STORE DASHBOARD & MANAGER BUSINESS ANALYTICS

#### 8.9.0 Purpose & Scope
Delivers real-time business intelligence for store executives, including KPI cards, revenue charts, category performance breakdowns, rush-hour footfall analytics, and team management.

#### 8.9.1 Functional Requirements
- **Real-Time KPI Cards:** Displays live metrics for today's gross revenue, completed orders, active delivery riders, and out-of-stock SKU counts.
- **Sales Trends & Revenue Breakdown:** Interactive bar and line charts showing daily revenue trends and category sales distribution.
- **Hourly Footfall Heatmap:** Visualizes peak shopping hours to help store managers plan staffing and cashier lane openings.
- **Team Roster Management:** Tracks staff designations, duty shifts (Morning, Afternoon, Full Day), and attendance statuses.

#### 8.9.2 Non-Functional Requirements
- **Aggregation Performance:** Dashboard aggregation queries complete in under 300 ms across active collections.
- **Read-Only Safety:** Analytics endpoints are strictly read-only, preventing any accidental modification of transaction data.
- **Responsive Charting:** SVG-based Recharts components render smoothly across mobile and desktop displays.

#### 8.9.3 Tech Stack

| Concern | Choice | Why it fits this module |
| :--- | :--- | :--- |
| **Data Aggregation** | MongoDB Aggregation Pipeline | Performs real-time sums, averages, and group-by calculations |
| **Visualization** | Recharts (^2.12.2) | Responsive SVG charts integrated with React state |
| **Executive UI** | Tailwind CSS Grid & KPI Cards | Clean dashboard layout optimized for managerial monitoring |

#### 8.9.4 Back-of-the-Envelope Estimation

| Quantity | Estimate | Basis |
| :--- | :--- | :--- |
| **Dashboard Views** | ≈ 50 – 100 views / day | Periodic checks by store managers and supervisors |
| **Aggregation Load** | ≈ 4 queries per view | Revenue sum, order count, fleet status, low-stock count |
| **Response Payload** | ≈ 12 KB JSON | Aggregated daily totals and series points |
| **Report Refresh Interval** | On-demand / 60 seconds | Balances data freshness with low server load |

#### 8.9.5 Low-Level Architecture

![Fig 8.9.A: Dashboard Architecture](report_assets/fig_8_9_a_analytics_arch.png)  
*Fig 8.9.A: Low-Level Architecture – Dashboard & Business Analytics*

**Request Flow:**
1. The manager loads `/staff/dashboard` or `/staff/analytics`.
2. The client fetches metrics from `/api/orders`, `/api/products`, `/api/staff`, and `/api/delivery/partners`.
3. The controllers aggregate sales figures, count pending dispatches, and identify low-stock items.
4. The server returns JSON summary payloads.
5. Recharts renders the revenue trajectory, hourly distributions, and KPI cards.

#### 8.9.6 API Design

| Method | Endpoint | Purpose / Contract |
| :--- | :--- | :--- |
| **GET** | `/api/orders` | Retrieves store orders for revenue calculations and status counts |
| **GET** | `/api/products` | Retrieves inventory catalog to evaluate stock health and reorder flags |
| **GET** | `/api/staff` | Lists all staff members, shifts, and departmental assignments |
| **GET** | `/api/delivery/partners` | Fetches delivery fleet status, completed trips, and active workloads |

#### 8.9.7 DB Design

| Collection | Keys & Indexes | Key Columns |
| :--- | :--- | :--- |
| `orders` | PK: `id`, INDEX: `createdAt`, `status` | `grandTotal`, `status`, `type`, `createdAt` |
| `products` | PK: `id`, INDEX: `stock` | `stock`, `reorderLevel`, `salesCount`, `price` |
| `staffmembers` | PK: `id`, INDEX: `status` | `name`, `role`, `shift`, `status`, `department` |
| `deliverypartners` | PK: `id`, INDEX: `status` | `name`, `status`, `activeOrders`, `completedTrips` |

#### 8.9.8 Screenshots & Walkthrough

![Fig 8.9.1: Operational Dashboard](report_assets/fig_8_9_1_operational_dashboard.png)  
*Fig 8.9.1: Executive Store Operational Dashboard*

The Operational Dashboard presents a high-level summary of store performance, including KPI cards for today's revenue, active deliveries, and low-stock alerts, alongside recent orders and quick-action shortcuts.

![Fig 8.9.2: Manager Analytics](report_assets/fig_8_9_2_manager_analytics.png)  
*Fig 8.9.2: Advanced Manager Business Analytics & Footfall Heatmap*

The Manager Analytics screen provides in-depth business intelligence. Store executives can inspect revenue trajectories, category sales contributions, gross margins, and an hourly footfall heatmap that highlights peak store rush periods.

![Fig 8.9.3: Team Management](report_assets/fig_8_9_3_team_management.png)  
*Fig 8.9.3: Store Team Management & Shift Schedule*

The Team Management module organizes supermarket personnel by department and shift. Managers can view attendance status, assign roles (Cashier, Floor Associate, Inventory Supervisor), and onboard new staff members.

---

## CHAPTER 9: CONCLUSION

The **Smart Supermarket Management System** provides an end-to-end digital platform that unifies in-store self-checkout, cashier POS billing, inventory management, security turnstiles, delivery logistics, AI voice telephony, and executive analytics into a cohesive web application.

By replacing legacy queues and manual paper records with camera-driven Scan & Go barcode scanning and cryptographic QR exit passes, the system significantly reduces checkout wait times while maintaining anti-theft controls through cart weight verification. Cashiers benefit from a dedicated POS terminal, while delivery dispatch algorithms automate rider assignments for express grocery orders.

The application is built on modern web technologies—React.js with Vite, Tailwind CSS, Node.js, Express.js, and MongoDB Atlas—ensuring high performance, schema flexibility, and responsive user experiences across mobile and desktop devices. Stateless JWT authentication and role-based route guards secure customer, staff, and delivery portals.

In conclusion, the project successfully achieves its objective of delivering a modern, efficient, and scalable supermarket management platform that enhances the shopping experience for consumers while streamlining day-to-day operations and business oversight for store managers.
"""

with open(MD_PATH, 'w', encoding='utf-8') as f:
    f.write(md_content)

print(f"Markdown report generated successfully at: {MD_PATH}")
