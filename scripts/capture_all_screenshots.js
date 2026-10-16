const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../report_assets');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const shot = async (url, filename, setupFn = null) => {
    try {
      console.log(`📸 Navigating to ${url} for ${filename}...`);
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
      if (setupFn) {
        await page.evaluate(setupFn);
      }
      await page.goto(`http://localhost:5173${url}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1500)); // wait for transitions/charts
      const outPath = path.join(OUT_DIR, filename);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`✅ Saved ${filename}`);
    } catch (err) {
      console.error(`❌ Failed capturing ${filename}:`, err.message);
    }
  };

  const staffAuthSetup = () => {
    localStorage.setItem('sm_staff_session', JSON.stringify({
      id: 'MGR_001',
      name: 'Rohan Mehra',
      email: 'manager@smartmart.com',
      role: 'MANAGER',
      designation: 'Store General Manager',
      department: 'Store Operations & Administration',
      shift: 'General (09:00 - 19:00)'
    }));
  };

  const deliveryAuthSetup = () => {
    localStorage.setItem('sm_delivery_session', JSON.stringify({
      id: 'DLV_001',
      name: 'Rajesh Kumar',
      email: 'rajesh@smartmart.com',
      phone: '+91 98765 43210',
      vehicleType: 'Electric Scooter',
      vehicleNo: 'KA 05 MN 4821',
      shift: 'Morning (07:00 - 15:00)'
    }));
  };

  const customerAuthSetup = () => {
    localStorage.setItem('sm_current_user', JSON.stringify({
      id: 'cust_1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      phone: '+91 98765 43210',
      loyaltyPoints: 350
    }));
  };

  // 1. Auth Interfaces
  await shot('/customer/login', 'fig_8_2_1_customer_login.png');
  await shot('/staff/login', 'fig_8_2_2_staff_login.png');
  await shot('/delivery/login', 'fig_8_2_3_delivery_login.png');

  // 2. Product & Inventory Management
  await shot('/staff/products', 'fig_8_3_1_products_catalog.png', staffAuthSetup);
  await shot('/staff/inventory', 'fig_8_3_2_inventory_levels.png', staffAuthSetup);
  await shot('/customer/products', 'fig_8_3_3_customer_product_search.png');

  // 3. Scan & Go Self Checkout
  await shot('/customer/scan', 'fig_8_4_1_customer_scan_go.png', customerAuthSetup);
  await shot('/customer/list', 'fig_8_4_2_customer_shopping_list.png', customerAuthSetup);

  // 4. Order Lifecycle & Delivery Fleet
  await shot('/customer/orders', 'fig_8_5_1_customer_orders_gatepass.png', customerAuthSetup);
  await shot('/staff/orders', 'fig_8_5_2_staff_orders_dispatch.png', staffAuthSetup);
  await shot('/staff/delivery', 'fig_8_5_3_staff_delivery_fleet.png', staffAuthSetup);
  await shot('/delivery/dashboard', 'fig_8_5_4_delivery_dashboard.png', deliveryAuthSetup);

  // 5. POS Billing
  await shot('/staff/pos', 'fig_8_6_1_pos_billing_terminal.png', staffAuthSetup);
  await shot('/staff/sales', 'fig_8_6_2_sales_history.png', staffAuthSetup);

  // 6. Security Gate Verification
  await shot('/staff/verify', 'fig_8_7_1_turnstile_verification.png', staffAuthSetup);
  await shot('/customer/settings', 'fig_8_7_2_customer_profile_settings.png', customerAuthSetup);

  // 7. Communications & AI Assistant
  await shot('/staff/campaigns', 'fig_8_8_1_staff_campaigns_broadcast.png', staffAuthSetup);
  await shot('/staff/customers', 'fig_8_8_2_customer_crm_registry.png', staffAuthSetup);
  await shot('/customer', 'fig_8_8_3_customer_storefront_hub.png', customerAuthSetup);

  // 8. Dashboard & Analytics
  await shot('/staff/dashboard', 'fig_8_9_1_operational_dashboard.png', staffAuthSetup);
  await shot('/staff/analytics', 'fig_8_9_2_manager_analytics.png', staffAuthSetup);
  await shot('/staff/team', 'fig_8_9_3_team_management.png', staffAuthSetup);

  await browser.close();
  console.log('🎉 All screenshots successfully captured!');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
