const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../report_assets');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateDiagrams() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Helper function to render HTML snippet to image
  const renderHtml = async (html, outFilename, width = 950, height = 700) => {
    await page.setViewport({ width, height });
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
          body { background: #ffffff; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .flow-container { display: flex; flex-direction: column; align-items: center; gap: 14px; width: 100%; max-width: 820px; }
          .flow-box { width: 100%; border: 1.5px solid #334155; border-radius: 8px; padding: 12px 18px; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
          .flow-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .flow-desc { font-size: 12px; color: #334155; line-height: 1.4; font-family: monospace; }
          .arrow { font-size: 18px; font-weight: 900; color: #475569; text-align: center; }
          .box-client { background-color: #dbeafe; border-color: #3b82f6; }
          .box-http { background-color: #e0e7ff; border-color: #6366f1; }
          .box-mw { background-color: #fef3c7; border-color: #f59e0b; }
          .box-ctrl { background-color: #dcfce7; border-color: #10b981; }
          .box-orm { background-color: #fce7f3; border-color: #ec4899; }
          .box-db { background-color: #f1f5f9; border-color: #64748b; }
          
          /* Tree container */
          .tree-card { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 20px; width: 100%; font-family: Consolas, monospace; font-size: 13px; line-height: 1.6; color: #1e293b; }
          .tree-item { margin-left: 20px; }
          .tree-folder { font-weight: 700; color: #2563eb; }
          .tree-file { color: #475569; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
    const contentHandle = await page.$('body');
    const boundingBox = await contentHandle.boundingBox();
    const outPath = path.join(OUT_DIR, outFilename);
    await page.screenshot({
      path: outPath,
      clip: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: Math.ceil(boundingBox.width),
        height: Math.ceil(boundingBox.height)
      }
    });
    console.log(`Rendered diagram: ${outFilename}`);
  };

  // 1. Overall Flow (Fig 8.0)
  await renderHtml(`
    <div class="flow-container">
      <div class="flow-box box-client">
        <div class="flow-title">Client (React 18 + Vite SPA)</div>
        <div class="flow-desc">CustomerPortal (Scan & Go, ShoppingList) | StaffPortal (POS, Inventory, Orders) | DeliveryDashboard</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-http">
        <div class="flow-title">HTTP Layer (Fetch API / REST + JWT)</div>
        <div class="flow-desc">Authorization: Bearer &lt;JWT&gt; | Content-Type: application/json | Auto redirect on 401 Unauthorized</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-mw">
        <div class="flow-title">Express Middleware Stack</div>
        <div class="flow-desc">cors(), express.json(), authMiddleware (JWT verification, role check: CUSTOMER / STAFF / MANAGER / DELIVERY)</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-ctrl">
        <div class="flow-title">REST Route Controllers (/api/*)</div>
        <div class="flow-desc">auth.js, products.js, orders.js, delivery.js, staff.js, gate.js, payment.js, voice.js</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-orm">
        <div class="flow-title">Mongoose ODM Models (backend/models)</div>
        <div class="flow-desc">User.js, Product.js, Order.js, DeliveryPartner.js, StaffMember.js, GateLog.js</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-db">
        <div class="flow-title">MongoDB Database Layer (Atlas Replica Set)</div>
        <div class="flow-desc">Collections: users, products, orders, deliverypartners, staffmembers, gatelogs</div>
      </div>
    </div>
  `, 'fig_8_0_overall_flow.png');

  // Low-level architecture for each module
  const makeArch = (title, clientDesc, httpDesc, mwDesc, ctrlDesc, modelDesc, dbDesc) => `
    <div class="flow-container">
      <div class="flow-box box-client">
        <div class="flow-title">Client (React)</div>
        <div class="flow-desc">${clientDesc}</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-http">
        <div class="flow-title">HTTP (Fetch / REST + JWT)</div>
        <div class="flow-desc">${httpDesc}</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-mw">
        <div class="flow-title">Express Middleware</div>
        <div class="flow-desc">${mwDesc}</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-ctrl">
        <div class="flow-title">Route Handlers / Controllers</div>
        <div class="flow-desc">${ctrlDesc}</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-orm">
        <div class="flow-title">Mongoose Models</div>
        <div class="flow-desc">${modelDesc}</div>
      </div>
      <div class="arrow">↓</div>
      <div class="flow-box box-db">
        <div class="flow-title">MongoDB Collections</div>
        <div class="flow-desc">${dbDesc}</div>
      </div>
    </div>
  `;

  await renderHtml(makeArch(
    'Auth Arch',
    'CustomerLogin.jsx | StaffLogin.jsx | ManagerLogin.jsx | DeliveryLogin.jsx | StaffProtectedRoute.jsx',
    'POST /api/auth/login | POST /api/auth/register | POST /api/delivery/login | POST /api/staff/login',
    'cors(), express.json(), auth.js (JWT sign & verify)',
    'routes/auth.js, routes/staff.js, routes/delivery.js',
    'User.js (bcrypt hash, role: CUSTOMER/STAFF/ADMIN), StaffMember.js, DeliveryPartner.js',
    'users, staffmembers, deliverypartners'
  ), 'fig_8_2_a_auth_arch.png');

  await renderHtml(makeArch(
    'Catalog Arch',
    'Products.jsx | Inventory.jsx | ProductSearch.jsx | ProductDetails.jsx',
    'GET /api/products | GET /api/products/barcode/:barcode | POST/PUT/DELETE /api/products',
    'cors(), express.json(), auth check for Manager/Staff write endpoints',
    'routes/products.js (text search query, category filter, barcode lookup)',
    'Product.js (barcode, name, price, stock, reorderLevel, aisle, shelf, status)',
    'products (indexes: barcode unique, text index on name/brand/category)'
  ), 'fig_8_3_a_catalog_arch.png');

  await renderHtml(makeArch(
    'Scan & Go Arch',
    'CustomerScanGo.jsx | BarcodeScanner | CartDrawer | ShoppingList.jsx',
    'GET /api/products/barcode/:code | POST /api/orders | POST /api/payment/razorpay/create-order',
    'express.json(), store operating hours verification middleware',
    'routes/orders.js, routes/payment.js (Razorpay signature verification)',
    'Order.js (cartWeight, exitPassCode, items array), Product.js ($inc stock: -quantity)',
    'orders, products'
  ), 'fig_8_4_a_scan_go_arch.png');

  await renderHtml(makeArch(
    'Order & Delivery Arch',
    'CustomerOrders.jsx | StaffOrders.jsx | StaffDeliveryFleet.jsx | DeliveryDashboard.jsx',
    'POST /api/orders | PATCH /api/orders/:id/status | POST /api/delivery/auto-allocate',
    'authMiddleware, delivery auto-allocation trigger',
    'routes/orders.js, routes/delivery.js (find least-loaded rider, calculate delivery metrics)',
    'Order.js (status, rider details), DeliveryPartner.js (status: AVAILABLE/ON_DELIVERY, activeOrders)',
    'orders, deliverypartners'
  ), 'fig_8_5_a_order_delivery_arch.png');

  await renderHtml(makeArch(
    'POS Arch',
    'POSBilling.jsx | SalesHistory.jsx | BarcodeScannerInput | ReceiptPrinter',
    'GET /api/products/barcode/:code | POST /api/orders (type: POS_COUNTER)',
    'Staff role authentication, express.json()',
    'routes/products.js, routes/orders.js, routes/payment.js',
    'Order.js, Product.js ($inc: { salesCount: +qty, stock: -qty })',
    'orders, products'
  ), 'fig_8_6_a_pos_arch.png');

  await renderHtml(makeArch(
    'Turnstile Arch',
    'StaffVerification.jsx | OpticalGatePassScanner | ExitTurnstileHardware',
    'POST /api/gate/verify (body: { passCode, gateId, verifiedBy })',
    'cors(), express.json()',
    'routes/gate.js (Order exitPassCode verification & weight match check)',
    'Order.js, GateLog.js (orderId, gateId, verifiedBy, status: GRANTED/DENIED)',
    'orders, gatelogs'
  ), 'fig_8_7_a_gate_arch.png');

  await renderHtml(makeArch(
    'Voice & Comm Arch',
    'AIChatbotModal.jsx | VoicemailModal.jsx | MassBroadcastModal.jsx | StaffCampaigns.jsx',
    'POST /api/voice/send-sms | POST /api/voice/send-voicemail | POST /api/voice/send-offer-alert',
    'express.json(), Twilio Client / Nodemailer SMTP transporter resolution',
    'routes/voice.js (Twilio Voice API, TwiML generation, Nodemailer HTML dispatch, SMS)',
    'User.js (phone, email, preferences), Order.js',
    'users, orders'
  ), 'fig_8_8_a_voice_comm_arch.png');

  await renderHtml(makeArch(
    'Dashboard Arch',
    'Dashboard.jsx | ManagerAnalytics.jsx | StaffTeamManagement.jsx | Recharts',
    'GET /api/orders | GET /api/products | GET /api/staff | GET /api/delivery/partners',
    'Staff / Manager JWT verification middleware',
    'routes/orders.js, routes/products.js, routes/staff.js, routes/delivery.js',
    'Order.js, Product.js, StaffMember.js, DeliveryPartner.js',
    'orders, products, staffmembers, deliverypartners'
  ), 'fig_8_9_a_analytics_arch.png');

  // UML Class Diagram (Chapter 4)
  const classDiagramHtml = `
    <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; width: 100%; max-width: 950px; font-size: 11px;">
      
      <!-- User -->
      <div style="border: 1.5px solid #1e3a8a; border-radius: 6px; width: 270px; background: #f8fafc;">
        <div style="background: #1e3a8a; color: white; padding: 6px; font-weight: bold; text-align: center;">User</div>
        <div style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-family: monospace;">
          + id: String [PK]<br>
          + name: String<br>
          + email: String [UNIQUE]<br>
          + phone: String [SPARSE]<br>
          + role: Enum(CUSTOMER, STAFF, ADMIN)<br>
          + loyaltyPoints: Number = 100<br>
          + address: String<br>
          + landmark: String<br>
          + savedAddresses: Array
        </div>
        <div style="padding: 8px; font-family: monospace; background: #f1f5f9;">
          + register(req, res): JSON<br>
          + login(req, res): JSON<br>
          + googleAuth(req, res): JSON<br>
          + updateProfile(req, res): JSON
        </div>
      </div>

      <!-- Product -->
      <div style="border: 1.5px solid #065f46; border-radius: 6px; width: 290px; background: #f8fafc;">
        <div style="background: #065f46; color: white; padding: 6px; font-weight: bold; text-align: center;">Product</div>
        <div style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-family: monospace;">
          + id: String [PK]<br>
          + productCode: String<br>
          + barcode: String [INDEX]<br>
          + name: String<br>
          + brand: String<br>
          + category: String [INDEX]<br>
          + price: Number<br>
          + mrp: Number<br>
          + stock: Number<br>
          + reorderLevel: Number = 20<br>
          + aisle: Number<br>
          + shelf: Number<br>
          + status: Enum(ACTIVE, INACTIVE)
        </div>
        <div style="padding: 8px; font-family: monospace; background: #f1f5f9;">
          + getAll(filter, sort): JSON<br>
          + getByBarcode(barcode): JSON<br>
          + createProduct(data): JSON<br>
          + updateStock(id, delta): JSON
        </div>
      </div>

      <!-- Order -->
      <div style="border: 1.5px solid #991b1b; border-radius: 6px; width: 310px; background: #f8fafc;">
        <div style="background: #991b1b; color: white; padding: 6px; font-weight: bold; text-align: center;">Order</div>
        <div style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-family: monospace;">
          + id: String [PK]<br>
          + type: Enum(SELF_CHECKOUT, DELIVERY, POS)<br>
          + status: Enum(PENDING, COMPLETED, DISPATCHED)<br>
          + customerId: String [FK -> User.id]<br>
          + customerName: String<br>
          + paymentMode: String<br>
          + transactionId: String<br>
          + grandTotal: Number<br>
          + exitPassCode: String [INDEX]<br>
          + cartWeight: String<br>
          + items: Array&lt;OrderItem&gt;
        </div>
        <div style="padding: 8px; font-family: monospace; background: #f1f5f9;">
          + createOrder(data): JSON<br>
          + getOrders(query): JSON<br>
          + updateStatus(id, status): JSON
        </div>
      </div>

      <!-- DeliveryPartner -->
      <div style="border: 1.5px solid #4c1d95; border-radius: 6px; width: 280px; background: #f8fafc;">
        <div style="background: #4c1d95; color: white; padding: 6px; font-weight: bold; text-align: center;">DeliveryPartner</div>
        <div style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-family: monospace;">
          + id: String [PK]<br>
          + name: String<br>
          + email: String [UNIQUE]<br>
          + phone: String [UNIQUE]<br>
          + vehicleType: Enum(Electric Scooter, Motorcycle)<br>
          + vehicleNo: String<br>
          + shift: String<br>
          + status: Enum(AVAILABLE, ON_DELIVERY, OFFLINE)<br>
          + completedTrips: Number<br>
          + activeOrders: Number
        </div>
        <div style="padding: 8px; font-family: monospace; background: #f1f5f9;">
          + getPartners(): JSON<br>
          + autoAllocate(orderId): JSON<br>
          + updateStatus(id, status): JSON
        </div>
      </div>

      <!-- StaffMember -->
      <div style="border: 1.5px solid #854d0e; border-radius: 6px; width: 280px; background: #f8fafc;">
        <div style="background: #854d0e; color: white; padding: 6px; font-weight: bold; text-align: center;">StaffMember</div>
        <div style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-family: monospace;">
          + id: String [PK]<br>
          + name: String<br>
          + email: String [UNIQUE]<br>
          + phone: String [UNIQUE]<br>
          + role: Enum(STAFF, MANAGER, ADMIN)<br>
          + designation: String<br>
          + department: String<br>
          + shift: String<br>
          + status: Enum(ACTIVE, ON_LEAVE, INACTIVE)
        </div>
        <div style="padding: 8px; font-family: monospace; background: #f1f5f9;">
          + getStaff(): JSON<br>
          + addStaff(data): JSON<br>
          + login(credentials): JSON
        </div>
      </div>

      <!-- GateLog -->
      <div style="border: 1.5px solid #334155; border-radius: 6px; width: 280px; background: #f8fafc;">
        <div style="background: #334155; color: white; padding: 6px; font-weight: bold; text-align: center;">GateLog</div>
        <div style="padding: 8px; border-bottom: 1px solid #cbd5e1; font-family: monospace;">
          + _id: ObjectId [PK]<br>
          + orderId: String [FK -> Order.id]<br>
          + gateId: String = "SmartGate 01"<br>
          + verifiedBy: String = "Optical Sensor"<br>
          + status: Enum(GRANTED, DENIED)<br>
          + createdAt: Date<br>
          + updatedAt: Date
        </div>
        <div style="padding: 8px; font-family: monospace; background: #f1f5f9;">
          + verifyTurnstilePass(passCode): JSON<br>
          + getGateHistory(): JSON
        </div>
      </div>

    </div>
  `;
  await renderHtml(classDiagramHtml, 'fig_4_0_class_diagram.png', 1050, 750);

  // ER Diagram (Chapter 6)
  const erDiagramHtml = `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 950px; font-size: 11px;">
      <div style="display: flex; justify-content: space-around; width: 100%;">
        
        <div style="border: 2px solid #2563eb; border-radius: 6px; padding: 10px; width: 220px; background: #eff6ff;">
          <div style="font-weight: bold; color: #1e40af; border-bottom: 1px solid #93c5fd; padding-bottom: 4px; margin-bottom: 6px;">USER (users)</div>
          <div style="font-family: monospace;">
            <b>PK: id</b><br>
            name, email<br>
            phone, role<br>
            loyaltyPoints<br>
            address
          </div>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <span style="font-weight: bold; color: #64748b; font-size: 12px;">1 : N (places)</span>
          <span style="font-size: 24px; color: #64748b;">──────────►</span>
        </div>

        <div style="border: 2px solid #dc2626; border-radius: 6px; padding: 10px; width: 260px; background: #fef2f2;">
          <div style="font-weight: bold; color: #991b1b; border-bottom: 1px solid #fca5a5; padding-bottom: 4px; margin-bottom: 6px;">ORDER (orders)</div>
          <div style="font-family: monospace;">
            <b>PK: id</b><br>
            <b>FK: customerId</b><br>
            type, status<br>
            paymentMode, grandTotal<br>
            <b>exitPassCode</b>, cartWeight<br>
            items: [ { productId, qty, price } ]
          </div>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <span style="font-weight: bold; color: #64748b; font-size: 12px;">1 : 1 (unlocked by)</span>
          <span style="font-size: 24px; color: #64748b;">──────────►</span>
        </div>

        <div style="border: 2px solid #475569; border-radius: 6px; padding: 10px; width: 220px; background: #f8fafc;">
          <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">GATE_LOG (gatelogs)</div>
          <div style="font-family: monospace;">
            <b>PK: _id</b><br>
            <b>FK: orderId</b><br>
            gateId, verifiedBy<br>
            status (GRANTED/DENIED)<br>
            createdAt
          </div>
        </div>

      </div>

      <div style="display: flex; justify-content: space-around; width: 100%; margin-top: 20px;">
        
        <div style="border: 2px solid #059669; border-radius: 6px; padding: 10px; width: 240px; background: #ecfdf5;">
          <div style="font-weight: bold; color: #065f46; border-bottom: 1px solid #a7f3d0; padding-bottom: 4px; margin-bottom: 6px;">PRODUCT (products)</div>
          <div style="font-family: monospace;">
            <b>PK: id</b><br>
            barcode, name, category<br>
            price, mrp, stock<br>
            reorderLevel, aisle, shelf<br>
            salesCount
          </div>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <span style="font-weight: bold; color: #64748b; font-size: 12px;">N : M (embedded line items)</span>
          <span style="font-size: 20px; color: #64748b;">◄──────────►</span>
        </div>

        <div style="border: 2px solid #7c3aed; border-radius: 6px; padding: 10px; width: 240px; background: #f5f3ff;">
          <div style="font-weight: bold; color: #5b21b6; border-bottom: 1px solid #ddd6fe; padding-bottom: 4px; margin-bottom: 6px;">DELIVERY_PARTNER (deliverypartners)</div>
          <div style="font-family: monospace;">
            <b>PK: id</b><br>
            name, phone, email<br>
            vehicleType, vehicleNo<br>
            status, completedTrips<br>
            activeOrders
          </div>
        </div>

        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <span style="font-weight: bold; color: #64748b; font-size: 12px;">operates</span>
          <span style="font-size: 20px; color: #64748b;">◄──────────</span>
        </div>

        <div style="border: 2px solid #d97706; border-radius: 6px; padding: 10px; width: 220px; background: #fffbeb;">
          <div style="font-weight: bold; color: #92400e; border-bottom: 1px solid #fde68a; padding-bottom: 4px; margin-bottom: 6px;">STAFF_MEMBER (staffmembers)</div>
          <div style="font-family: monospace;">
            <b>PK: id</b><br>
            name, email, phone<br>
            role (STAFF/MANAGER)<br>
            designation, shift<br>
            status
          </div>
        </div>

      </div>
    </div>
  `;
  await renderHtml(erDiagramHtml, 'fig_6_0_er_diagram.png', 1050, 600);

  // Folder Structure Diagrams (8.1)
  await renderHtml(`
    <div class="tree-card" style="width: 700px;">
      <div class="tree-folder">📁 smart-supermarket/</div>
      <div class="tree-item tree-folder">📁 backend/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 index.js</span> (Express app entry point)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 seed.js</span> (MongoDB initial catalog seeder)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 package.json</span> (Backend dependencies)</div>
      <div class="tree-item tree-folder">📁 frontend/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 index.html</span> (Vite SPA template)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 vite.config.js</span> (Vite build configuration)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 tailwind.config.js</span> (Tailwind styling system)</div>
      <div class="tree-item tree-file">📄 README.md</div>
    </div>
  `, 'fig_8_1_1_highlevel_tree.png');

  await renderHtml(`
    <div class="tree-card" style="width: 700px;">
      <div class="tree-folder">📁 backend/</div>
      <div class="tree-item tree-folder">📁 config/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 db.js</span> (Mongoose connection & DNS fallbacks)</div>
      <div class="tree-item tree-folder">📁 middleware/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 auth.js</span> (JWT generation & role validation)</div>
      <div class="tree-item tree-folder">📁 models/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 User.js</span> (Customer & user accounts)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 Product.js</span> (Supermarket catalog & inventory)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 Order.js</span> (Orders, items, exit pass, cart weight)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 DeliveryPartner.js</span> (Delivery fleet personnel)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 StaffMember.js</span> (Cashiers, floor staff, managers)</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 GateLog.js</span> (Optical sensor turnstile gate events)</div>
      <div class="tree-item tree-folder">📁 routes/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 auth.js</span>, <span class="tree-file">products.js</span>, <span class="tree-file">orders.js</span>, <span class="tree-file">delivery.js</span></div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">📄 staff.js</span>, <span class="tree-file">gate.js</span>, <span class="tree-file">payment.js</span>, <span class="tree-file">voice.js</span></div>
    </div>
  `, 'fig_8_1_2_backend_tree.png');

  await renderHtml(`
    <div class="tree-card" style="width: 700px;">
      <div class="tree-folder">📁 frontend/src/</div>
      <div class="tree-item tree-folder">📁 pages/customer/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">CustomerHome.jsx</span>, <span class="tree-file">CustomerScanGo.jsx</span>, <span class="tree-file">ProductSearch.jsx</span></div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">ShoppingList.jsx</span>, <span class="tree-file">CustomerOrders.jsx</span>, <span class="tree-file">CustomerSettings.jsx</span></div>
      <div class="tree-item tree-folder">📁 pages/staff/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">Dashboard.jsx</span>, <span class="tree-file">POSBilling.jsx</span>, <span class="tree-file">Inventory.jsx</span>, <span class="tree-file">Products.jsx</span></div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">StaffOrders.jsx</span>, <span class="tree-file">StaffVerification.jsx</span>, <span class="tree-file">StaffDeliveryFleet.jsx</span></div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">StaffTeamManagement.jsx</span>, <span class="tree-file">ManagerAnalytics.jsx</span>, <span class="tree-file">StaffCampaigns.jsx</span></div>
      <div class="tree-item tree-folder">📁 pages/delivery/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">DeliveryLogin.jsx</span>, <span class="tree-file">DeliveryDashboard.jsx</span></div>
      <div class="tree-item tree-folder">📁 components/</div>
      <div class="tree-item" style="margin-left: 40px;"><span class="tree-file">voice/</span>, <span class="tree-file">customer/</span>, <span class="tree-file">staff/</span>, <span class="tree-file">delivery/</span>, <span class="tree-file">ui/</span></div>
    </div>
  `, 'fig_8_1_4_frontend_tree.png');

  await browser.close();
  console.log('🎉 All architecture diagrams rendered!');
}

generateDiagrams().catch(e => {
  console.error(e);
  process.exit(1);
});
