import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_PATH = r"c:\portfolionew\smart-supermarket\SMART_SUPERMARKET_PROJECT_REPORT.docx"
ASSETS_DIR = r"c:\portfolionew\smart-supermarket\report_assets"

def create_report():
    doc = Document()
    
    # Configure 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_table_borders(table, color="B0C4DE", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="none"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_ch_title(title_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(24)
        p.paragraph_format.space_after = Pt(14)
        r = p.add_run(title_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(16)
        r.bold = True
        return p

    def add_sec_title(title_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(title_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.bold = True
        return p

    def add_subsec_title(title_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)
        r.bold = True
        return p

    def add_body_p(text, bold_prefix="", space_after=6, italic=False):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(11)
            rb.bold = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        r.italic = italic
        return p

    def add_bullet_p(bold_prefix="", text=""):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(11)
            rb.bold = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        return p

    def add_styled_table(headers, rows, col_widths=None):
        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, color="CBD5E1", sz="4")
        
        # Header Row
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            set_cell_background(hdr_cells[i], "E6EDF5")
            set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10)
                run.bold = True
                
        # Data Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                row_cells[c_idx].text = str(val)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=120, right=120)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(9.5)
                    
        if col_widths:
            for row in table.rows:
                for idx, w in enumerate(col_widths):
                    row.cells[idx].width = Inches(w)
                    
        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(0)
        p_after.paragraph_format.space_after = Pt(6)
        return table

    def add_image_figure(img_filename, caption_text, width=Inches(5.8)):
        img_path = os.path.join(ASSETS_DIR, img_filename)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(4)
            run = p_img.add_run()
            run.add_picture(img_path, width=width)
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(10)
            rc = p_cap.add_run(caption_text)
            rc.font.name = 'Times New Roman'
            rc.font.size = Pt(10)
            rc.italic = True
        else:
            p_err = doc.add_paragraph()
            p_err.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rc = p_err.add_run(f"[{caption_text}]")
            rc.font.name = 'Times New Roman'
            rc.font.size = Pt(10)
            rc.bold = True

    # =========================================================================
    # PAGE 1 & 2: LEAVE AS REQUESTED BY USER
    # =========================================================================
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_before = Pt(200)
    r1 = p1.add_run("[PAGE 1: TITLE PAGE - TO BE INSERTED BY USER]")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(14)
    r1.italic = True
    doc.add_page_break()

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(200)
    r2 = p2.add_run("[PAGE 2: BONAFIDE CERTIFICATE - TO BE INSERTED BY USER]")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(14)
    r2.italic = True
    doc.add_page_break()

    # =========================================================================
    # PAGE 3: TABLE OF CONTENTS
    # =========================================================================
    add_ch_title("TABLE OF CONTENTS")
    
    toc_headers = ["CH NO", "TITLE", "PAGE NO"]
    toc_rows = [
        ["1", "INTRODUCTION", "4"],
        ["2", "OBJECTIVES", "5"],
        ["3", "DESCRIPTION", "6"],
        ["4", "CLASS DIAGRAM", "7"],
        ["5", "TABLE STRUCTURES", "8"],
        ["6", "ER DIAGRAM", "12"],
        ["7", "TECH STACK", "13"],
        ["8", "MODULES", "15"],
        ["8.0", "  Design Approach", "15"],
        ["8.1", "  Folder Structure", "17"],
        ["8.2", "  User Authentication & Access Control", "19"],
        ["8.3", "  Product Catalog & Intelligent Inventory Management", "23"],
        ["8.4", "  Smart Scan & Go (In-Store Self-Checkout Engine)", "28"],
        ["8.5", "  Multi-Channel Order Lifecycle & Delivery Fleet Management", "33"],
        ["8.6", "  Point-of-Sale (POS) Billing & Physical Cashier Terminal", "39"],
        ["8.7", "  Smart Optical Exit Gate & Anti-Theft Verification", "44"],
        ["8.8", "  Multi-Channel Communications, AI Voice & Marketing Automation", "48"],
        ["8.9", "  Executive Store Dashboard & Manager Business Analytics", "53"],
        ["9", "CONCLUSION", "59"]
    ]
    add_styled_table(toc_headers, toc_rows, col_widths=[0.8, 4.8, 0.9])
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 1: INTRODUCTION
    # =========================================================================
    add_ch_title("CHAPTER 1\nINTRODUCTION")
    add_body_p(
        "In the rapidly transforming retail landscape, the operational efficiency of supermarket store management directly determines customer satisfaction, inventory turnover, and profitability. Traditional retail paradigms rely on centralized checkouts with lengthy queues, manual barcode scanning by cashiers, disjointed stock-auditing logs, and paper-based exit passes. Such conventional mechanisms are inherently time-consuming, prone to human discrepancy, susceptible to inventory shrinkage, and lack the real-time traceability demanded by contemporary omnichannel commerce."
    )
    add_body_p(
        "The Smart Supermarket Management System is an enterprise-grade, full-stack digital solution engineered to unify, automate, and elevate the entire lifecycle of physical and digital retail operations. Developed using the robust MERN architecture (MongoDB, Express.js, React.js with Vite, and Node.js), the platform orchestrates modern retail touchpoints: high-speed consumer self-checkout via camera-based barcode recognition ('Scan & Go'), anti-theft turnstile gate validation via cryptographic QR exit passes, cashier POS terminals, intelligent multi-channel order dispatch, dynamic delivery fleet tracking, and automated AI voice telephony broadcasting."
    )
    add_body_p(
        "The application is structured into four primary operational domains:",
        space_after=4
    )
    add_bullet_p(
        "Customer Experience Domain: ",
        "Equips physical shoppers with an in-store camera barcode scanner, live cart calculation with tare weight estimation, aisle-indexed product navigation, dietary preference filtering, AI shopping checklist synchronization, and instant digital payments."
    )
    add_bullet_p(
        "Store Operations & Cashier Domain: ",
        "Provides store floor supervisors and counter cashiers with high-speed POS billing terminals, real-time stock threshold monitoring, purchase inwards, batch pricing management, and barcode generation."
    )
    add_bullet_p(
        "Security & Gate Turnstile Domain: ",
        "Features an optical exit scanner that validates paid digital exit passes, compares recorded cart item weights against physical basket tare thresholds, and triggers electronic turnstile gate unlocking with comprehensive audit logging."
    )
    add_bullet_p(
        "Fleet Dispatch & Executive Intelligence Domain: ",
        "Provides automated delivery partner allocation for takeaway and express grocery orders, live rider tracking, Twilio-powered automated voice call campaigns, and comprehensive managerial sales analytics."
    )
    add_body_p(
        "This project report details the architectural design, database schemas, API contracts, low-level execution workflows, and UI implementations across all nine core functional modules of the Smart Supermarket Management System."
    )
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 2: OBJECTIVES
    # =========================================================================
    add_ch_title("CHAPTER 2\nOBJECTIVES")
    add_body_p(
        "The primary objective of the Smart Supermarket Management System is to eliminate friction in brick-and-mortar retail operations through modern web technologies, automated hardware-software interfaces, and intelligent communications. Specific objectives include:"
    )
    add_bullet_p(
        "To Automate In-Store Checkout via 'Scan & Go': ",
        "Empower in-store customers to scan product barcodes using their smartphone cameras, track live basket totals, apply automated promotional discounts, and complete digital payments without waiting in cashier lines."
    )
    add_bullet_p(
        "To Mitigate Retail Theft with Turnstile Pass Validation: ",
        "Implement a cryptographic exit pass verification system (`PASS-ORD-xxxxx`) integrated with optical turnstile sensors and cart weight estimations to guarantee only verified, fully paid orders exit the premises."
    )
    add_bullet_p(
        "To Centralize Omnichannel Inventory & Aisle Navigation: ",
        "Maintain single-source-of-truth stock balances across all aisles and shelves, triggering real-time low-stock alerts when inventory drops below configured reorder thresholds."
    )
    add_bullet_p(
        "To Provide Dual-Mode Billing (POS & Self-Checkout): ",
        "Deliver a dedicated, high-speed Point-of-Sale (POS) terminal for counter cashiers while maintaining full synchronization with customer mobile self-checkouts."
    )
    add_bullet_p(
        "To Automate Delivery Partner Dispatch: ",
        "Implement an intelligent auto-allocation algorithm that matches express delivery orders with available fleet drivers based on load balancing and trip performance."
    )
    add_bullet_p(
        "To Enforce Role-Based Access Control (RBAC): ",
        "Secure customer, cashier, store manager, and delivery personnel endpoints through stateless JSON Web Tokens (JWT) and guarded React routes."
    )
    add_bullet_p(
        "To Enable AI Voice Telephony & Customer Engagement: ",
        "Integrate Twilio Voice API and conversational AI modals to broadcast automated promotional voice calls, interactive voicemails, and personalized offer alerts."
    )
    add_bullet_p(
        "To Deliver Live Executive Dashboards & Footfall Analytics: ",
        "Generate real-time business intelligence metrics, hourly store rush-hour distributions, and product gross margin calculations for store executives."
    )
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 3: DESCRIPTION
    # =========================================================================
    add_ch_title("CHAPTER 3\nDESCRIPTION")
    add_body_p(
        "The Smart Supermarket Management System is structured as a decoupled, full-stack micro-monolith web application that addresses the diverse needs of customers, floor staff, logistics riders, and store managers. The system is partitioned into six core functional areas:"
    )
    add_sec_title("1. Customer Self-Service & Scan & Go Engine")
    add_body_p(
        "Shoppers entering the supermarket access the progressive web application without mandatory app-store installations. Using the HTML5 MediaDevices camera API and ZXing barcode decoding, customers scan barcodes on shelf items. The application continuously queries the MongoDB product catalog, displays rich dietary badges (Vegan, Gluten-Free, Organic), shelf/aisle locations, updates the digital basket with running weight calculations, and integrates the Razorpay payment gateway alongside Cash-on-Counter options. Upon payment completion, a cryptographically signed exit QR pass is instantly minted."
    )
    add_sec_title("2. Intelligent Inventory & Spatial Aisle Management")
    add_body_p(
        "The inventory engine indexes all retail stock with hierarchical aisle and shelf coordinates (e.g., Aisle 2, Shelf 3). Real-time stock decrementing occurs atomically on order placement. Automatic threshold comparisons (`stock <= reorderLevel`) generate visual replenishment alerts for floor staff, preventing out-of-stock scenarios."
    )
    add_sec_title("3. Security Turnstile & Anti-Theft Verification")
    add_body_p(
        "Positioned at the exit turnstiles, optical security scanners query the backend `/api/gate/verify` endpoint with the scanned QR pass code. The server cross-verifies the order's payment status, matches estimated basket weight with tare limits, and triggers an electronic turnstile unlock while logging an audit trail in the `GateLog` collection."
    )
    add_sec_title("4. Point-of-Sale (POS) Cashier Terminal")
    add_body_p(
        "For customers preferring traditional checkout, cashiers utilize a high-performance POS terminal supporting keyboard-driven SKU entry, barcode scanner gun inputs, customer loyalty point redemption, split payment tenders, and instant thermal receipt printing simulation."
    )
    add_sec_title("5. Delivery Logistics & Rider Dispatch")
    add_body_p(
        "Omnichannel takeaway and express delivery orders are handled by a dedicated delivery fleet management module. Store managers onboard riders with specific vehicle types (EV Scooter, Motorcycle, Van), monitor active delivery statuses, and utilize automated rider allocation algorithms."
    )
    add_sec_title("6. Telephony Broadcast, AI Voice & Executive Analytics")
    add_body_p(
        "The platform incorporates Twilio Voice API automation allowing store managers to broadcast personalized voice offers, dispatch order delivery voicemails, and send SMS alerts. In addition, store managers have access to real-time revenue velocity charts, category contribution breakdowns, and shift rosters."
    )
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 4: CLASS DIAGRAM
    # =========================================================================
    add_ch_title("CHAPTER 4\nCLASS DIAGRAM")
    add_body_p(
        "The Class Diagram represents the object-oriented structure of the backend application models, encapsulating their internal attributes, data types, visibility, relationships, and associated controller methods."
    )
    add_image_figure("fig_4_0_class_diagram.png", "Fig 4.0: UML Class Diagram of the Smart Supermarket Backend System", width=Inches(6.2))
    add_body_p(
        "The architectural model is centered around six core entity classes:",
        space_after=4
    )
    add_bullet_p("User Class: ", "Encapsulates customer identity, authentication credentials, loyalty points, contact information, and delivery addresses.")
    add_bullet_p("Product Class: ", "Defines supermarket SKU specifications including barcode, unit price, MRP, stock on hand, reorder threshold, and spatial aisle/shelf coordinates.")
    add_bullet_p("Order Class: ", "Maintains the complete transaction state including customer ID, line item array, financial breakdown, payment mode, cart weight, and cryptographic exit pass code.")
    add_bullet_p("DeliveryPartner Class: ", "Represents delivery fleet personnel, vehicle registration, shifts, active order queues, and performance metrics.")
    add_bullet_p("StaffMember Class: ", "Manages store associates and managers, their departmental assignments, shifts, and role-based permissions.")
    add_bullet_p("GateLog Class: ", "Records hardware turnstile access transactions, optical verification timestamps, and security pass outcomes.")
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 5: TABLE STRUCTURES
    # =========================================================================
    add_ch_title("CHAPTER 5\nTABLE STRUCTURES")
    add_body_p(
        "The persistence layer is implemented using MongoDB with Mongoose ODM schemas. Below are the physical table/collection structures, indexes, field types, nullability, and default values."
    )
    
    # 5.1 User Table
    add_sec_title("5.1 Users Collection (users)")
    user_headers = ["Field", "Type", "Null", "Key / Index", "Default", "Description"]
    user_rows = [
        ["id", "String", "NO", "UNIQUE / INDEX", "UUID string", "Unique user identifier"],
        ["name", "String", "NO", "None", "None", "Full customer / staff name"],
        ["email", "String", "NO", "UNIQUE / INDEX", "None", "Normalized email address"],
        ["phone", "String", "YES", "SPARSE / INDEX", "None", "Verified mobile phone number"],
        ["role", "String", "NO", "None", "'CUSTOMER'", "Role: CUSTOMER, STAFF, ADMIN"],
        ["avatar", "String", "YES", "None", "Unsplash URL", "Profile photo avatar URL"],
        ["loyaltyPoints", "Number", "NO", "None", "100", "Accumulated loyalty points balance"],
        ["address", "String", "YES", "None", "''", "Primary delivery address"],
        ["landmark", "String", "YES", "None", "''", "Nearby location landmark"],
        ["savedAddresses", "Array", "YES", "None", "[]", "Array of saved delivery addresses"],
        ["createdAt", "Date", "NO", "None", "Date.now()", "Account creation timestamp"],
        ["updatedAt", "Date", "NO", "None", "Date.now()", "Last profile update timestamp"]
    ]
    add_styled_table(user_headers, user_rows, col_widths=[1.1, 0.9, 0.6, 1.2, 1.0, 1.7])

    # 5.2 Product Table
    add_sec_title("5.2 Products Collection (products)")
    prod_headers = ["Field", "Type", "Null", "Key / Index", "Default", "Description"]
    prod_rows = [
        ["id", "String", "NO", "INDEX", "Auto-generated", "Unique catalog SKU identifier"],
        ["productCode", "String", "YES", "INDEX", "None", "Store product code (e.g., GRO001)"],
        ["barcode", "String", "NO", "INDEX", "None", "EAN-13 / UPC barcode string"],
        ["name", "String", "NO", "TEXT INDEX", "None", "Product commercial title"],
        ["brand", "String", "YES", "TEXT INDEX", "'SmartMart'", "Manufacturer / brand name"],
        ["category", "String", "NO", "TEXT INDEX", "None", "Product department category"],
        ["price", "Number", "NO", "None", "None", "Retail selling price in INR"],
        ["mrp", "Number", "YES", "None", "None", "Maximum Retail Price in INR"],
        ["stock", "Number", "NO", "None", "100", "Physical inventory count"],
        ["reorderLevel", "Number", "NO", "None", "20", "Low-stock replenishment trigger"],
        ["unit", "String", "YES", "None", "'1 unit'", "Unit of measurement (e.g., 1kg, 500ml)"],
        ["aisle", "Number", "NO", "None", "1", "In-store physical aisle number"],
        ["shelf", "Number", "NO", "None", "1", "Shelf level coordinate on aisle"],
        ["image", "String", "YES", "None", "Default URL", "Product showcase image URL"],
        ["status", "String", "NO", "None", "'ACTIVE'", "Status: ACTIVE, INACTIVE, DISCONTINUED"],
        ["inStock", "Boolean", "NO", "None", "true", "Availability boolean flag"],
        ["rating", "Number", "NO", "None", "4.5", "Average customer rating (0-5)"],
        ["salesCount", "Number", "NO", "None", "0", "Cumulative units sold count"],
        ["createdAt", "Date", "NO", "None", "Date.now()", "Record creation timestamp"],
        ["updatedAt", "Date", "NO", "None", "Date.now()", "Record modification timestamp"]
    ]
    add_styled_table(prod_headers, prod_rows, col_widths=[1.1, 0.8, 0.5, 1.2, 0.9, 2.0])

    # 5.3 Order Table
    add_sec_title("5.3 Orders Collection (orders)")
    order_headers = ["Field", "Type", "Null", "Key / Index", "Default", "Description"]
    order_rows = [
        ["id", "String", "NO", "UNIQUE / INDEX", "ORD-xxxxx", "Unique order identifier"],
        ["type", "String", "NO", "None", "'SELF_CHECKOUT'", "Type: SELF_CHECKOUT, DELIVERY, POS"],
        ["status", "String", "NO", "None", "'COMPLETED'", "Status: PLACED, CONFIRMED, COMPLETED"],
        ["customerId", "String", "YES", "INDEX", "'cust_1'", "Associated customer ID"],
        ["customerName", "String", "YES", "None", "'Customer'", "Customer display name"],
        ["customerPhone", "String", "YES", "None", "None", "Delivery contact phone number"],
        ["deliveryAddress", "String", "YES", "None", "None", "Destination delivery address"],
        ["paymentMode", "String", "NO", "None", "'Razorpay'", "Tender: Razorpay, Cash, UPI"],
        ["transactionId", "String", "YES", "None", "Auto string", "Payment gateway transaction reference"],
        ["subtotal", "Number", "NO", "None", "0", "Cart subtotal before taxes/discounts"],
        ["discount", "Number", "YES", "None", "0", "Promotional coupon discount amount"],
        ["deliveryFee", "Number", "YES", "None", "0", "Logistics delivery charge"],
        ["tax", "Number", "YES", "None", "0", "Applicable GST tax amount"],
        ["grandTotal", "Number", "NO", "None", "0", "Final payable invoice amount"],
        ["exitPassCode", "String", "YES", "INDEX", "PASS-ORD-xxx", "Cryptographic turnstile exit pass"],
        ["cartWeight", "String", "YES", "None", "'0.90 kg'", "Estimated tare basket weight"],
        ["rider", "Object", "YES", "None", "null", "Allocated delivery partner details"],
        ["items", "Array", "NO", "None", "[]", "Subdocuments: productId, name, price, qty"],
        ["createdAt", "Date", "NO", "None", "Date.now()", "Order checkout timestamp"],
        ["updatedAt", "Date", "NO", "None", "Date.now()", "Order update timestamp"]
    ]
    add_styled_table(order_headers, order_rows, col_widths=[1.1, 0.8, 0.5, 1.2, 0.9, 2.0])

    # 5.4 DeliveryPartner Table
    add_sec_title("5.4 Delivery Partners Collection (deliverypartners)")
    dlv_headers = ["Field", "Type", "Null", "Key / Index", "Default", "Description"]
    dlv_rows = [
        ["id", "String", "NO", "UNIQUE / INDEX", "DLV_xxxxxx", "Unique delivery executive ID"],
        ["name", "String", "NO", "None", "None", "Rider full name"],
        ["email", "String", "NO", "UNIQUE / INDEX", "None", "Rider account email"],
        ["phone", "String", "NO", "UNIQUE / INDEX", "None", "Rider direct contact phone"],
        ["password", "String", "NO", "None", "'1234'", "Access PIN / password"],
        ["vehicleType", "String", "NO", "None", "'Electric Scooter'", "Type: EV Scooter, Motorcycle, Van"],
        ["vehicleNo", "String", "NO", "None", "None", "Vehicle registration plate number"],
        ["shift", "String", "YES", "None", "'Morning'", "Assigned duty shift time window"],
        ["status", "String", "NO", "INDEX", "'AVAILABLE'", "Status: AVAILABLE, ON_DELIVERY, OFFLINE"],
        ["rating", "Number", "NO", "None", "5.0", "Customer delivery rating (1.0 - 5.0)"],
        ["completedTrips", "Number", "NO", "None", "0", "Total successful deliveries completed"],
        ["activeOrders", "Number", "NO", "None", "0", "Current live orders under delivery"],
        ["avatar", "String", "YES", "None", "Default URL", "Rider profile picture URL"],
        ["createdAt", "Date", "NO", "None", "Date.now()", "Onboarding timestamp"]
    ]
    add_styled_table(dlv_headers, dlv_rows, col_widths=[1.1, 0.8, 0.5, 1.2, 0.9, 2.0])

    # 5.5 StaffMember Table
    add_sec_title("5.5 Staff Members Collection (staffmembers)")
    stf_headers = ["Field", "Type", "Null", "Key / Index", "Default", "Description"]
    stf_rows = [
        ["id", "String", "NO", "UNIQUE / INDEX", "STF_xxxxxx", "Unique store staff identifier"],
        ["name", "String", "NO", "None", "None", "Staff member legal name"],
        ["email", "String", "NO", "UNIQUE / INDEX", "None", "Official login email"],
        ["phone", "String", "NO", "UNIQUE / INDEX", "None", "Direct phone number"],
        ["password", "String", "NO", "None", "'staff123'", "Authentication credential"],
        ["role", "String", "NO", "None", "'STAFF'", "System role: STAFF, MANAGER, ADMIN"],
        ["designation", "String", "YES", "None", "'Store Associate'", "Official job title"],
        ["department", "String", "YES", "None", "'Billing & Counter'", "Supermarket operations department"],
        ["shift", "String", "YES", "None", "'Morning'", "Assigned work shift"],
        ["status", "String", "NO", "INDEX", "'ACTIVE'", "Status: ACTIVE, ON_LEAVE, INACTIVE"],
        ["avatar", "String", "YES", "None", "Default URL", "Employee photo avatar URL"],
        ["createdAt", "Date", "NO", "None", "Date.now()", "Employee hire timestamp"]
    ]
    add_styled_table(stf_headers, stf_rows, col_widths=[1.1, 0.8, 0.5, 1.2, 0.9, 2.0])

    # 5.6 GateLog Table
    add_sec_title("5.6 Gate Logs Collection (gatelogs)")
    gate_headers = ["Field", "Type", "Null", "Key / Index", "Default", "Description"]
    gate_rows = [
        ["_id", "ObjectId", "NO", "PRIMARY KEY", "Auto-generated", "MongoDB document object identifier"],
        ["orderId", "String", "NO", "INDEX", "None", "Linked Order identifier (ORD-xxxxx)"],
        ["gateId", "String", "NO", "None", "'SmartGate 01'", "Physical turnstile gate hardware ID"],
        ["verifiedBy", "String", "NO", "None", "'Optical Sensor'", "Verification mechanism / staff scanner"],
        ["status", "String", "NO", "None", "'GRANTED'", "Turnstile outcome: GRANTED, DENIED"],
        ["createdAt", "Date", "NO", "None", "Date.now()", "Turnstile scan timestamp"],
        ["updatedAt", "Date", "NO", "None", "Date.now()", "Record update timestamp"]
    ]
    add_styled_table(gate_headers, gate_rows, col_widths=[1.1, 0.8, 0.5, 1.2, 0.9, 2.0])
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 6: ER DIAGRAM
    # =========================================================================
    add_ch_title("CHAPTER 6\nER DIAGRAM")
    add_body_p(
        "The Entity-Relationship (ER) Diagram models the structural relationships and cardinality constraints governing the Smart Supermarket ecosystem. It depicts how customer orders link to embedded line items, delivery riders, gate verification logs, and catalog inventory."
    )
    add_image_figure("fig_6_0_er_diagram.png", "Fig 6.0: Entity-Relationship (ER) Diagram of Smart Supermarket System", width=Inches(6.2))
    add_body_p(
        "Key cardinality and referential rules governing the schema include:",
        space_after=4
    )
    add_bullet_p("User to Order (1 : N): ", "A registered customer can generate multiple self-checkout, takeaway, or express delivery orders over time, while each order is linked to a single customer ID.")
    add_bullet_p("Order to Product (N : M): ", "An order contains an array of normalized order line items representing purchased products, and a single product can be included in thousands of independent customer orders.")
    add_bullet_p("Order to GateLog (1 : 1): ", "Every paid order with an active exit pass is validated at the optical turnstile, producing a corresponding verification record in the `GateLog` collection upon door unlocking.")
    add_bullet_p("DeliveryPartner to Order (1 : N): ", "An active delivery partner can be assigned to multiple delivery orders sequentially or batched during peak shifts.")
    add_bullet_p("StaffMember to Store Operations: ", "Staff and store managers maintain catalog records, oversee inventory reorder points, operate cashier POS billing terminals, and execute manual turnstile overrides.")
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 7: TECH STACK
    # =========================================================================
    add_ch_title("CHAPTER 7\nTECH STACK")
    add_sec_title("7.1 TECH STACK")
    tech_headers = ["Layer", "Technology", "Purpose"]
    tech_rows = [
        ["Frontend Framework", "React.js 18 + Vite", "High-performance SPA with fast hot module replacement"],
        ["Styling & UI System", "Tailwind CSS + Lucide Icons", "Responsive utility-first design system with modern aesthetic"],
        ["Client State", "React Context API", "Centralized SupermarketContext, LanguageContext, ThemeContext"],
        ["Camera & Barcode", "HTML5 MediaDevices + ZXing", "Web-based camera barcode scanning without hardware guns"],
        ["Data Visualization", "Recharts 2.12", "Responsive SVG revenue charts, category pies, and heatmaps"],
        ["Backend Server", "Node.js + Express.js v4", "High-throughput asynchronous REST API web service"],
        ["Database Layer", "MongoDB Atlas + Mongoose 8", "Document-oriented cloud database with schema validation"],
        ["Authentication", "JWT + bcryptjs", "Stateless token-based authentication and salted password hashing"],
        ["Payment Gateway", "Razorpay SDK + UPI", "Secure online payment processing and signature verification"],
        ["AI & Telephony", "Twilio Voice & SMS API", "Automated telephone voice calls, voicemail, and SMS campaigns"],
        ["Email Services", "Nodemailer (SMTP)", "High-conversion responsive HTML receipt and dispatch emails"],
        ["Build Pipeline", "Vite Bundler + ESLint", "Optimized production client bundling and code quality"]
    ]
    add_styled_table(tech_headers, tech_rows, col_widths=[1.5, 1.8, 3.2])

    add_sec_title("7.2 ARCHITECTURE OVERVIEW")
    arch_headers = ["Layer", "Technology", "Purpose"]
    arch_rows = [
        ["Model (M)", "Mongoose ODM + MongoDB Atlas", "Enforces strict schemas, validation constraints, indexes, and atomic updates ($inc)."],
        ["View (V)", "React 18 + Tailwind CSS", "Renders dynamic customer and staff interfaces, camera scanner overlays, and modals."],
        ["Controller (C)", "Express Route Handlers", "Processes incoming HTTP requests, enforces business rules, and coordinates responses."]
    ]
    add_styled_table(arch_headers, arch_rows, col_widths=[1.2, 2.0, 3.3])
    add_body_p(
        "The application employs a decoupled client-server architecture. The React SPA communicates with the Express REST API via standard JSON payloads over HTTP/HTTPS. Cross-Origin Resource Sharing (CORS) is enabled to support distributed deployments, and JWT tokens passed in the `Authorization: Bearer <token>` header ensure secure stateless authentication across customer, staff, and delivery portals."
    )
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 8: MODULES
    # =========================================================================
    add_ch_title("CHAPTER 8\nMODULES")
    add_sec_title("8.0 Design Approach")
    add_body_p(
        "Every module of the Smart Supermarket Management System is evaluated and documented following a standardized seven-step system design framework. This ensures that every component is described comprehensively and comparably, detailing not only visual interfaces but the underlying architectural decisions, concurrency safety, API contracts, and storage footprints."
    )
    
    design_steps = [
        ["Step", "Question it answers", "Presented in each module as"],
        ["1. Functional requirements", "What specific tasks must the module execute?", "Section 8.x.1"],
        ["2. Non-functional requirements", "What are the latency, security, integrity, and CAP bounds?", "Section 8.x.2"],
        ["3. Tech stack", "Which libraries and tools solve this specific problem?", "Section 8.x.3"],
        ["4. Back-of-the-envelope", "What are the expected user volumes, request rates, and storage?", "Section 8.x.4"],
        ["5. Low-level architecture", "Which software components interact and in what flow?", "Section 8.x.5 (Flow Diagram + Request Flow)"],
        ["6. API design", "What is the exact HTTP REST contract between client and server?", "Section 8.x.6 (Table)"],
        ["7. DB design", "Which MongoDB collections, indexes, and fields store the data?", "Section 8.x.7 (Table)"],
        ["8. Screenshots & Walkthrough", "What does the live interface look like and how does it function?", "Section 8.x.8 (Figures + In-depth Analysis)"]
    ]
    add_styled_table(design_steps[0], design_steps[1:], col_widths=[1.4, 2.8, 2.3])

    add_subsec_title("Shared Baseline for All Modules")
    add_body_p(
        "Non-functional baseline: Every incoming request passes through CORS validation, `express.json()` payload parsing, and route-level JWT authentication middleware before invoking route handlers. All persistent state resides in MongoDB Atlas with replica set guarantees. In CAP theorem terms, the system emphasizes Consistency and Partition Tolerance (CP) for inventory balances and payment verification: stock cannot be oversold, and an invalid exit pass can never unlock the turnstile."
    )
    
    sizing_headers = ["Quantity", "Estimate", "Basis"]
    sizing_rows = [
        ["Active Daily Shoppers", "≈ 500 – 1,000 shoppers", "Urban supermarket daily in-store footfall"],
        ["Total Catalog SKUs", "100+ active items", "Full supermarket department catalog"],
        ["Daily Transactions", "≈ 1,200 orders / day", "Combined Scan & Go, POS, and Deliveries"],
        ["Peak Transaction Rate", "≈ 5 – 10 req/s", "Rush hours: 08:30-10:00 & 18:00-20:30"],
        ["Total Database Collections", "6 core collections", "users, products, orders, deliverypartners, staffmembers, gatelogs"]
    ]
    add_styled_table(sizing_headers, sizing_rows, col_widths=[1.8, 1.8, 2.9])

    add_image_figure("fig_8_0_overall_flow.png", "Fig 8.0: Overall Request Flow of the Smart Supermarket Management System", width=Inches(6.0))
    doc.add_page_break()

    # 8.1 FOLDER STRUCTURE
    add_sec_title("8.1 FOLDER STRUCTURE")
    add_image_figure("fig_8_1_1_highlevel_tree.png", "Fig 8.1.1: High-Level Monorepo Structure", width=Inches(5.5))
    
    add_subsec_title("8.1.1 Backend Folder Structure")
    add_image_figure("fig_8_1_2_backend_tree.png", "Fig 8.1.2: Backend Directory Hierarchy and Modular API Routes", width=Inches(5.5))
    add_body_p(
        "The backend repository follows a clean layered MVC structure. The application entry point `index.js` configures environment variables, boots the Express web server on port 5000, attaches CORS headers, connects asynchronously to MongoDB Atlas via `config/db.js`, and registers dedicated route controllers (`routes/auth.js`, `routes/products.js`, `routes/orders.js`, `routes/delivery.js`, `routes/staff.js`, `routes/gate.js`, `routes/payment.js`, `routes/voice.js`)."
    )

    add_subsec_title("8.1.2 Frontend Folder Structure")
    add_image_figure("fig_8_1_4_frontend_tree.png", "Fig 8.1.3: Frontend Directory Organization (Vite + React)", width=Inches(5.5))
    add_body_p(
        "The client application is organized into specialized domain subdirectories under `frontend/src/`. Domain pages are partitioned into `pages/customer/`, `pages/staff/`, `pages/delivery/`, and `pages/manager/`. Reusable UI widgets and dialog modals reside under `components/voice/` (Twilio campaigns, voicemail, offer alerts), `components/customer/` (AI chatbot, aisle map, phone registration), and `components/staff/` (route guards)."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.2: USER AUTHENTICATION & ACCESS CONTROL
    # =========================================================================
    add_sec_title("8.2 USER AUTHENTICATION & ACCESS CONTROL")
    add_subsec_title("8.2.0 Purpose & Scope")
    add_body_p(
        "Provides stateless tokenized authentication, credential security, role-based access control (RBAC), and session management across three separate user tiers: Customers, Store Staff / Managers, and Delivery Executives."
    )

    add_subsec_title("8.2.1 Functional Requirements")
    add_bullet_p("Multi-Role Login: ", "Supports dedicated authentication for Customers (email/password or Google OAuth), Store Staff & Managers (email/phone with role validation), and Delivery Partners (phone/vehicle ID with numeric PIN).")
    add_bullet_p("Stateless Token Issuance: ", "Generates signed JSON Web Tokens (JWT) containing user ID, role, and email with configurable expiry (24 hours).")
    add_bullet_p("Role-Based Route Guarding: ", "React `StaffProtectedRoute` and `DeliveryProtectedRoute` components intercept unauthenticated attempts and redirect users to role-specific login views.")
    add_bullet_p("Phone Verification & Onboarding: ", "Allows customers to link verified phone numbers to enable automated voice deal calls and SMS order updates.")

    add_subsec_title("8.2.2 Non-Functional Requirements")
    add_bullet_p("Password Security: ", "Client passwords stored using bcryptjs salt rounds, preventing plaintext credential leakage.")
    add_bullet_p("Low Latency: ", "Token verification handled synchronously in memory via `jwt.verify()`, adding < 1 ms overhead per request.")
    add_bullet_p("Session Resilience: ", "Stateless tokens permit seamless client re-hydration from `localStorage` without server-side session stores.")

    add_subsec_title("8.2.3 Tech Stack")
    auth_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Tokenization", "jsonwebtoken (^9.0.2)", "Standardized stateless JWT format containing user ID and role claims"],
        ["Password Encryption", "bcryptjs (^2.4.3)", "Pure JavaScript salted cryptographic hashing"],
        ["Client Storage", "localStorage + React State", "Preserves authentication sessions across browser refreshes"],
        ["Route Interception", "React Router v6 ProtectedRoute", "Enforces client-side authorization before page mount"]
    ]
    add_styled_table(auth_tech[0], auth_tech[1:], col_widths=[1.5, 2.0, 3.0])

    add_subsec_title("8.2.4 Back-of-the-Envelope Estimation")
    auth_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Registered Shoppers", "≈ 10,000 accounts", "Supermarket loyalty customer base"],
        ["Daily Logins", "≈ 1,200 logins / day", "Customer checkouts + staff clock-ins"],
        ["Token Payload Size", "≈ 250 bytes", "Header + Claims (id, role, email) + Signature"],
        ["Peak Login Rate", "≈ 2 – 4 logins / s", "Opening shift and evening rush"]
    ]
    add_styled_table(auth_boe[0], auth_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.2.5 Low-Level Architecture")
    add_image_figure("fig_8_2_a_auth_arch.png", "Fig 8.2.A: Low-Level Architecture – User Authentication & RBAC", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. The user enters credentials on `/customer/login`, `/staff/login`, or `/delivery/login`.\n2. The client dispatches a POST request to `/api/auth/login`, `/api/staff/login`, or `/api/delivery/login`.\n3. The Express controller verifies the user document in MongoDB, verifies the password hash, and checks role permissions.\n4. Upon validation, the server generates a signed JWT and returns the user profile.\n5. The client stores the token in `localStorage` and initializes `SupermarketContext`.\n6. Protected API calls attach `Authorization: Bearer <token>` in HTTP headers."
    )

    add_subsec_title("8.2.6 API Design")
    auth_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["POST", "/api/auth/register", "Registers a new customer account (name, email, password, phone)"],
        ["POST", "/api/auth/login", "Authenticates customer credentials; returns JWT token & user profile"],
        ["POST", "/api/auth/google", "Google OAuth SSO callback and token issuance"],
        ["PATCH", "/api/auth/phone", "Updates and verifies customer contact phone number"],
        ["POST", "/api/staff/login", "Authenticates store staff and managers with role enforcement"],
        ["POST", "/api/delivery/login", "Authenticates delivery fleet partners via phone/vehicle credentials"]
    ]
    add_styled_table(auth_apis[0], auth_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.2.7 DB Design")
    auth_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["users", "PK: id, UNIQUE: email, INDEX: phone", "name, email, phone, role ('CUSTOMER'), loyaltyPoints, address"],
        ["staffmembers", "PK: id, UNIQUE: email, phone", "name, email, phone, password, role ('STAFF'|'MANAGER'), shift"],
        ["deliverypartners", "PK: id, UNIQUE: email, phone", "name, email, phone, vehicleType, vehicleNo, shift, status"]
    ]
    add_styled_table(auth_db[0], auth_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.2.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_2_1_customer_login.png", "Fig 8.2.1: Customer Authentication & Registration Interface")
    add_body_p(
        "The Customer Login interface offers a streamlined authentication experience for in-store and online shoppers. Shoppers can switch between Sign In and Sign Up tabs, input their email and password, or authenticate using Google OAuth SSO. Upon sign-in, the system loads the customer's loyalty point balance and saved addresses."
    )
    add_image_figure("fig_8_2_2_staff_login.png", "Fig 8.2.2: Staff & Manager Role-Based Login Interface")
    add_body_p(
        "The Staff Login interface provides secure access for supermarket floor staff and store managers. The controller enforces strict role verification: accounts with standard staff privileges cannot access managerial analytics or team rosters, ensuring data separation."
    )
    add_image_figure("fig_8_2_3_delivery_login.png", "Fig 8.2.3: Delivery Partner Authentication Interface")
    add_body_p(
        "The Delivery Partner Login screen allows delivery riders to access their active trip manifests using their registered mobile phone number and 4-digit PIN, initiating their shift status to 'AVAILABLE'."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.3: PRODUCT CATALOG & INTELLIGENT INVENTORY MANAGEMENT
    # =========================================================================
    add_sec_title("8.3 PRODUCT CATALOG & INTELLIGENT INVENTORY MANAGEMENT")
    add_subsec_title("8.3.0 Purpose & Scope")
    add_body_p(
        "Manages the central product catalog, barcode indexing, spatial aisle/shelf coordinates, real-time inventory balances, and automated reorder threshold triggers."
    )

    add_subsec_title("8.3.1 Functional Requirements")
    add_bullet_p("Catalog Management: ", "CRUD operations for products including SKU code, barcode, brand, category, MRP, selling price, unit size, and product images.")
    add_bullet_p("Spatial Aisle Navigation: ", "Assigns each product an exact in-store Aisle Number (1-10) and Shelf Tier (1-5) to guide shoppers and picking staff.")
    add_bullet_p("Real-Time Inventory Tracking: ", "Live stock counts with automatic decrements upon order confirmation and increments upon supplier restocking.")
    add_bullet_p("Low-Stock Alerts: ", "Flags products whose current stock falls below configured `reorderLevel`, presenting restocking action badges.")

    add_subsec_title("8.3.2 Non-Functional Requirements")
    add_bullet_p("Search Performance: ", "Text-indexed searches on `name`, `brand`, and `category` return product results in under 50 ms.")
    add_bullet_p("Stock Consistency: ", "Atomic decrement operations via `$inc` ensure no two concurrent shoppers can purchase the same inventory unit.")
    add_bullet_p("High Read Throughput: ", "Optimized compound indexing supports high-frequency barcode scans during peak shopping periods.")

    add_subsec_title("8.3.3 Tech Stack")
    catalog_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Data Storage", "MongoDB Product Collection", "Flexible schema accommodating diverse grocery attributes and dietary flags"],
        ["Indexing", "Compound Text & Barcode Index", "Instant sub-millisecond barcode lookups from scanner cameras"],
        ["Client Interface", "React Table & Filter Cards", "Fast search, category switching, and real-time stock edits"]
    ]
    add_styled_table(catalog_tech[0], catalog_tech[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.3.4 Back-of-the-Envelope Estimation")
    catalog_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Catalog Size", "100+ active items", "Full supermarket department catalog"],
        ["Barcode Queries", "≈ 5,000 / day", "Customer scans + POS cashier scans"],
        ["Storage per Product", "≈ 1.5 KB", "Metadata, images, aisle coords, dietary flags"],
        ["Total Catalog Storage", "≈ 1.5 MB in RAM", "Readily cached in memory for zero disk latency"]
    ]
    add_styled_table(catalog_boe[0], catalog_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.3.5 Low-Level Architecture")
    add_image_figure("fig_8_3_a_catalog_arch.png", "Fig 8.3.A: Low-Level Architecture – Catalog & Inventory Engine", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. The client loads the catalog or queries a barcode via `/api/products` or `/api/products/barcode/:barcode`.\n2. The controller uses MongoDB indexed lookups to return matching SKU records.\n3. When an order completes, the order controller issues atomic `$inc: { stock: -quantity }` updates.\n4. If `stock <= reorderLevel`, the inventory dashboard highlights the low-stock status."
    )

    add_subsec_title("8.3.6 API Design")
    cat_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["GET", "/api/products", "Fetches product catalog with optional query filters (category, search)"],
        ["GET", "/api/products/barcode/:barcode", "Retrieves exact SKU by scanned EAN-13/UPC barcode string"],
        ["GET", "/api/products/:id", "Fetches single product details including aisle location and ratings"],
        ["POST", "/api/products", "Creates a new product record (Staff / Manager only)"],
        ["PUT", "/api/products/:id", "Updates product details, pricing, or stock counts"],
        ["DELETE", "/api/products/:id", "Soft-deletes or removes product from active catalog"]
    ]
    add_styled_table(cat_apis[0], cat_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.3.7 DB Design")
    cat_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["products", "PK: id, INDEX: barcode, TEXT: name, brand, category", "productCode, barcode, name, price, mrp, stock, reorderLevel, aisle, shelf, status"]
    ]
    add_styled_table(cat_db[0], cat_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.3.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_3_1_products_catalog.png", "Fig 8.3.1: Product Catalog Management Interface")
    add_body_p(
        "The Product Catalog interface displays the supermarket inventory with detailed attributes including SKU code, barcode, selling price, MRP, stock count, and spatial location (Aisle/Shelf). Staff members can add new items, modify pricing, and update stock levels directly from this view."
    )
    add_image_figure("fig_8_3_2_inventory_levels.png", "Fig 8.3.2: Real-time Inventory & Low-Stock Alert Interface")
    add_body_p(
        "The Inventory Levels dashboard tracks stock availability in real time. Items falling below their configured reorder threshold are visually flagged with amber warnings, allowing inventory managers to trigger purchase orders before stockouts occur."
    )
    add_image_figure("fig_8_3_3_customer_product_search.png", "Fig 8.3.3: Product Search with Aisle & Shelf Navigation")
    add_body_p(
        "The Customer Product Search screen enables shoppers to browse products by department, apply price filters, and locate items within the physical store using exact aisle and shelf coordinates."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.4: SMART SCAN & GO (IN-STORE SELF-CHECKOUT ENGINE)
    # =========================================================================
    add_sec_title("8.4 SMART SCAN & GO (IN-STORE SELF-CHECKOUT ENGINE)")
    add_subsec_title("8.4.0 Purpose & Scope")
    add_body_p(
        "Enables in-store supermarket customers to scan item barcodes using their smartphone camera, maintain an interactive digital cart with live weight tracking, apply promo coupons, complete payments, and generate cryptographic exit gate passes."
    )

    add_subsec_title("8.4.1 Functional Requirements")
    add_bullet_p("Camera Barcode Scanner: ", "Integrates the HTML5 camera stream to scan EAN-13, UPC, and Code-128 barcodes directly from product packaging.")
    add_bullet_p("Dynamic Cart Calculations: ", "Calculates item subtotals, promotional discounts, and applicable GST taxes in real time as items are added.")
    add_bullet_p("Cart Weight Estimation: ", "Calculates estimated physical basket weight (in kg) based on item specifications to enable tare verification at the exit turnstile.")
    add_bullet_p("Digital Exit Pass Minting: ", "Upon payment completion, generates an encrypted QR exit pass (`PASS-ORD-xxxxx`) valid for single-use turnstile clearance.")

    add_subsec_title("8.4.2 Non-Functional Requirements")
    add_bullet_p("Scanning Responsiveness: ", "Continuous video frame processing at 30 fps with sub-100 ms barcode recognition.")
    add_bullet_p("Financial Precision: ", "All calculations maintain 2 decimal places to ensure exact reconciliation with payment gateways.")
    add_bullet_p("Anti-Theft Integrity: ", "Exit passes are tied to verified paid orders, preventing fraudulent gate unlocks.")

    add_subsec_title("8.4.3 Tech Stack")
    scango_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Camera Scanning", "HTML5 MediaDevices + BarcodeDetector API", "Zero-install web camera scanning in browser"],
        ["Payment Processing", "Razorpay Checkout SDK", "Supports UPI, Credit/Debit cards, Net Banking, and digital wallets"],
        ["QR Pass Generation", "qrcode.react", "Generates high-contrast QR codes readable by optical gate scanners"]
    ]
    add_styled_table(scango_tech[0], scango_tech[1:], col_widths=[1.5, 2.0, 3.0])

    add_subsec_title("8.4.4 Back-of-the-Envelope Estimation")
    scango_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Daily Scan & Go Orders", "≈ 400 orders / day", "40% of in-store shoppers adopting self-checkout"],
        ["Scans per Order", "≈ 6 – 10 scans", "Average grocery basket size"],
        ["Total Daily Camera Scans", "≈ 3,500 scans / day", "Derived from basket sizes"],
        ["Checkout Duration", "≈ 45 seconds", "Scan, review cart, pay via UPI, and receive exit pass"]
    ]
    add_styled_table(scango_boe[0], scango_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.4.5 Low-Level Architecture")
    add_image_figure("fig_8_4_a_scan_go_arch.png", "Fig 8.4.A: Low-Level Architecture – Smart Scan & Go Engine", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. The shopper opens `/customer/scan` and grants camera permissions.\n2. Scanning an item triggers a lookup to `/api/products/barcode/:barcode`.\n3. The item is added to the local cart state with price and weight calculations.\n4. The shopper proceeds to checkout and selects Razorpay or Cash.\n5. Upon payment confirmation, POST `/api/orders` records the transaction.\n6. The server decrements stock atomically and returns the unique `exitPassCode`.\n7. The client renders the turnstile exit QR code."
    )

    add_subsec_title("8.4.6 API Design")
    scango_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["GET", "/api/products/barcode/:barcode", "Validates scanned barcode and returns product details"],
        ["POST", "/api/orders", "Creates completed self-checkout order, decrements stock, mints exit pass"],
        ["POST", "/api/payment/razorpay/create-order", "Initializes Razorpay payment order with INR currency"],
        ["POST", "/api/payment/razorpay/verify-signature", "Validates cryptographic Razorpay payment signature"]
    ]
    add_styled_table(scango_apis[0], scango_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.4.7 DB Design")
    scango_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["orders", "PK: id, INDEX: exitPassCode, customerId", "type ('SELF_CHECKOUT'), status, grandTotal, exitPassCode, cartWeight, items"]
    ]
    add_styled_table(scango_db[0], scango_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.4.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_4_1_customer_scan_go.png", "Fig 8.4.1: Customer Scan & Go Self-Checkout Interface")
    add_body_p(
        "The Scan & Go interface combines camera barcode scanning with manual entry options. The active cart displays itemized subtotals, quantity adjusters, estimated basket weight, and a direct checkout button."
    )
    add_image_figure("fig_8_4_2_customer_shopping_list.png", "Fig 8.4.2: Smart Shopping Checklist with Auto-Sync")
    add_body_p(
        "The Shopping List module allows customers to prepare checklists before visiting the store. As items are scanned during shopping, they are automatically checked off the list, optimizing the customer's route through store aisles."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.5: MULTI-CHANNEL ORDER LIFECYCLE & DELIVERY FLEET MANAGEMENT
    # =========================================================================
    add_sec_title("8.5 MULTI-CHANNEL ORDER LIFECYCLE & DELIVERY FLEET MANAGEMENT")
    add_subsec_title("8.5.0 Purpose & Scope")
    add_body_p(
        "Manages omnichannel order fulfillment across Self-Checkout, Store Takeaway, and Express Home Delivery channels, incorporating automated rider dispatch and fleet tracking."
    )

    add_subsec_title("8.5.1 Functional Requirements")
    add_bullet_p("Omnichannel Order States: ", "Tracks orders through progressive lifecycle states: PLACED → CONFIRMED → PACKING → OUT_FOR_DELIVERY → DELIVERED / COMPLETED.")
    add_bullet_p("Automated Rider Allocation: ", "Automatically assigns available delivery partners to express orders based on vehicle type, active order load, and shift status.")
    add_bullet_p("Delivery Partner Dashboard: ", "Provides riders with mobile-optimized views of assigned orders, customer addresses, phone contacts, and delivery status toggles.")
    add_bullet_p("Fleet Management: ", "Enables store managers to register delivery personnel, track vehicle numbers, and monitor driver ratings and trip counts.")

    add_subsec_title("8.5.2 Non-Functional Requirements")
    add_bullet_p("Fulfillment Speed: ", "Auto-allocation algorithm completes rider assignment within 200 ms of order placement.")
    add_bullet_p("Concurrency Control: ", "MongoDB document locking ensures a rider's active order queue is updated reliably without race conditions.")
    add_bullet_p("Status Traceability: ", "Every state transition updates the order's `updatedAt` timestamp and triggers customer notification events.")

    add_subsec_title("8.5.3 Tech Stack")
    order_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Order Orchestration", "Express REST Controllers", "Manages state transitions and auto-dispatch logic"],
        ["Persistence", "MongoDB Order & DeliveryPartner Collections", "Maintains real-time order states and rider availability"],
        ["Rider Interface", "Mobile-Responsive React Dashboard", "Enables one-touch status updates on mobile devices"]
    ]
    add_styled_table(order_tech[0], order_tech[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.5.4 Back-of-the-Envelope Estimation")
    order_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Daily Delivery Orders", "≈ 200 – 300 orders / day", "Express online grocery home deliveries"],
        ["Active Fleet Size", "10 – 15 delivery riders", "Electric scooters and motorcycle delivery team"],
        ["Average Delivery Time", "15 – 25 minutes", "Hyperlocal store radius (3-5 km)"],
        ["Trips per Rider per Day", "≈ 15 – 20 completed trips", "Calculated over an 8-hour shift"]
    ]
    add_styled_table(order_boe[0], order_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.5.5 Low-Level Architecture")
    add_image_figure("fig_8_5_a_order_delivery_arch.png", "Fig 8.5.A: Low-Level Architecture – Order Lifecycle & Fleet Dispatch", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. A delivery order is submitted via POST `/api/orders` with `type: 'DELIVERY'`.\n2. The server queries `DeliveryPartner` for available drivers with the lowest active load.\n3. The selected rider's status updates to `ON_DELIVERY` and `activeOrders` increments.\n4. Staff update order progress via PATCH `/api/orders/:id/status`.\n5. The assigned rider views the order on `/delivery/dashboard` and marks it delivered."
    )

    add_subsec_title("8.5.6 API Design")
    order_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["GET", "/api/orders", "Lists all store orders or filters by customer ID and status"],
        ["GET", "/api/orders/:id", "Retrieves comprehensive details of a single order"],
        ["PATCH", "/api/orders/:id/status", "Advances order status (CONFIRMED, PACKING, OUT_FOR_DELIVERY)"],
        ["GET", "/api/delivery/partners", "Lists all registered delivery fleet executives"],
        ["POST", "/api/delivery/partners", "Onboards a new delivery partner (Manager only)"],
        ["PUT", "/api/delivery/partners/:id/status", "Updates partner availability (AVAILABLE, ON_DELIVERY, OFFLINE)"],
        ["POST", "/api/delivery/auto-allocate", "Executes automated dispatch algorithm for pending deliveries"]
    ]
    add_styled_table(order_apis[0], order_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.5.7 DB Design")
    order_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["orders", "PK: id, INDEX: status, customerId", "id, type, status, grandTotal, deliveryAddress, rider, items"],
        ["deliverypartners", "PK: id, INDEX: status", "name, phone, vehicleType, vehicleNo, shift, status, activeOrders"]
    ]
    add_styled_table(order_db[0], order_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.5.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_5_1_customer_orders_gatepass.png", "Fig 8.5.1: Customer Live Order Tracking & Turnstile Gate Pass QR")
    add_body_p(
        "The Customer Orders screen displays real-time tracking for active purchases, including live status progress bars, delivery partner details, and high-resolution QR exit passes for in-store self-checkout orders."
    )
    add_image_figure("fig_8_5_2_staff_orders_dispatch.png", "Fig 8.5.2: Staff Orders Dispatch Board")
    add_body_p(
        "The Staff Orders Dispatch Board organizes orders by fulfillment status. Staff can view order details, advance statuses, assign delivery riders, and process cancellations from a single screen."
    )
    add_image_figure("fig_8_5_3_staff_delivery_fleet.png", "Fig 8.5.3: Delivery Fleet Management & Driver Roster")
    add_body_p(
        "The Delivery Fleet Management screen allows managers to track all riders, view vehicle types and duty shifts, monitor ratings, and onboard new delivery executives."
    )
    add_image_figure("fig_8_5_4_delivery_dashboard.png", "Fig 8.5.4: Delivery Partner Active Route Dashboard")
    add_body_p(
        "The Delivery Partner Dashboard gives riders quick access to assigned orders, delivery addresses, recipient phone numbers, and one-touch status updates."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.6: POINT-OF-SALE (POS) BILLING & PHYSICAL CASHIER TERMINAL
    # =========================================================================
    add_sec_title("8.6 POINT-OF-SALE (POS) BILLING & PHYSICAL CASHIER TERMINAL")
    add_subsec_title("8.6.0 Purpose & Scope")
    add_body_p(
        "Provides counter cashiers with a keyboard-optimized POS terminal for barcode scanning, SKU lookups, customer loyalty point redemption, payment tendering, and receipt generation."
    )

    add_subsec_title("8.6.1 Functional Requirements")
    add_bullet_p("Rapid Item Entry: ", "Supports barcode scanner gun inputs and quick SKU keyboard searches with instant line-item addition.")
    add_bullet_p("Loyalty Points Integration: ", "Looks up customer profiles by phone number, allowing points to be earned or redeemed against invoice totals.")
    add_bullet_p("Multi-Tender Payments: ", "Processes payments via Cash, Card, and dynamic UPI QR codes with change calculation.")
    add_bullet_p("Thermal Receipt Printing: ", "Generates formatted 80mm thermal receipts with store details, GST breakdowns, and payment confirmation.")

    add_subsec_title("8.6.2 Non-Functional Requirements")
    add_bullet_p("Checkout Speed: ", "Optimized keyboard shortcuts allow an 8-item transaction to be processed in under 30 seconds.")
    add_bullet_p("Offline Resilience: ", "Client-side state caching preserves active billing carts across temporary network drops.")
    add_bullet_p("Inventory Accuracy: ", "Completing a transaction immediately reduces stock counts via atomic database operations.")

    add_subsec_title("8.6.3 Tech Stack")
    pos_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Keyboard Navigation", "React Hotkeys & Event Listeners", "Fast cashier workflow without requiring mouse interaction"],
        ["Receipt Output", "HTML Thermal CSS Styles", "Formatted for standard 80mm ESC/POS thermal printers"],
        ["Cart Management", "React Local State", "Immediate UI feedback during fast scanning"]
    ]
    add_styled_table(pos_tech[0], pos_tech[1:], col_widths=[1.5, 2.0, 3.0])

    add_subsec_title("8.6.4 Back-of-the-Envelope Estimation")
    pos_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["POS Lanes", "3 – 5 cashier counters", "Physical supermarket cashier lanes"],
        ["Invoices per Lane per Day", "≈ 150 – 200 bills", "Standard retail lane volume"],
        ["Total Daily POS Revenue", "≈ ₹1,50,000 – ₹2,50,000", "Average basket value ₹800 – ₹1,200"],
        ["Receipt Print Payload", "≈ 3.5 KB HTML", "Compact thermal receipt data"]
    ]
    add_styled_table(pos_boe[0], pos_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.6.5 Low-Level Architecture")
    add_image_figure("fig_8_6_a_pos_arch.png", "Fig 8.6.A: Low-Level Architecture – POS Billing Terminal", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. The cashier scans an item barcode or types a product name in `/staff/pos`.\n2. The system fetches the matching SKU and adds it to the active ticket.\n3. The cashier inputs the customer's phone number to retrieve loyalty points.\n4. Payment tender is selected (Cash, Card, UPI) and completed.\n5. The system submits POST `/api/orders` with `type: 'POS_COUNTER'`.\n6. Inventory stock is decremented and a printable receipt is displayed."
    )

    add_subsec_title("8.6.6 API Design")
    pos_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["GET", "/api/products/barcode/:barcode", "Instant barcode lookup for POS scanner guns"],
        ["GET", "/api/auth/customers", "Retrieves customer profile and loyalty points by phone number"],
        ["POST", "/api/orders", "Records completed POS transaction with tender details and stock updates"],
        ["GET", "/api/orders?type=POS", "Retrieves historical POS sales registers and tender summaries"]
    ]
    add_styled_table(pos_apis[0], pos_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.6.7 DB Design")
    pos_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["orders", "PK: id, INDEX: type, createdAt", "type ('POS_COUNTER'), paymentMode, grandTotal, items, customerName"],
        ["products", "PK: id, INDEX: barcode", "barcode, name, price, stock, salesCount"]
    ]
    add_styled_table(pos_db[0], pos_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.6.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_6_1_pos_billing_terminal.png", "Fig 8.6.1: High-Speed POS Billing Terminal for Store Cashiers")
    add_body_p(
        "The POS Billing Terminal features a large product selection area, barcode input field, active cart table, and tender calculator. Cashiers can complete checkouts, apply discounts, and print receipts quickly."
    )
    add_image_figure("fig_8_6_2_sales_history.png", "Fig 8.6.2: Historical Sales & Tender Breakdown")
    add_body_p(
        "The Sales History view provides a chronological record of completed POS transactions, showing payment modes, customer details, and total amounts for daily reconciliation."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.7: SMART OPTICAL EXIT GATE & ANTI-THEFT VERIFICATION
    # =========================================================================
    add_sec_title("8.7 SMART OPTICAL EXIT GATE & ANTI-THEFT VERIFICATION")
    add_subsec_title("8.7.0 Purpose & Scope")
    add_body_p(
        "Secures store exit points by validating digital exit pass QR codes against verified paid orders, checking cart weight limits, and logging security events."
    )

    add_subsec_title("8.7.1 Functional Requirements")
    add_bullet_p("Optical QR Verification: ", "Scans the customer's digital exit pass (`PASS-ORD-xxxxx`) using optical turnstile sensors or staff inspection tablets.")
    add_bullet_p("Payment & Status Check: ", "Verifies that the order exists, has a status of `COMPLETED`, and has not been used previously.")
    add_bullet_p("Cart Weight Validation: ", "Compares the physical basket weight against the order's estimated tare weight (`cartWeight`) within a ±10% tolerance.")
    add_bullet_p("Audit Logging: ", "Records every turnstile pass attempt in the `GateLog` collection with timestamp, gate ID, and verification status.")

    add_subsec_title("8.7.2 Non-Functional Requirements")
    add_bullet_p("Verification Latency: ", "Exit pass verification completes in under 200 ms to ensure smooth customer exit flow.")
    add_bullet_p("Anti-Passback Security: ", "Prevents reuse of exit passes after clearance through state-locked database validation.")
    add_bullet_p("Failure Safety: ", "If verification fails or the code is invalid, the turnstile remains securely locked.")

    add_subsec_title("8.7.3 Tech Stack")
    gate_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Verification Engine", "Express Route /api/gate/verify", "Low-latency verification endpoint"],
        ["Audit Persistence", "MongoDB GateLog Collection", "Persistent log of all gate access attempts"],
        ["Inspector Interface", "React Security Verification Screen", "Provides manual override controls for store security"]
    ]
    add_styled_table(gate_tech[0], gate_tech[1:], col_widths=[1.5, 2.0, 3.0])

    add_subsec_title("8.7.4 Back-of-the-Envelope Estimation")
    gate_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Daily Turnstile Passes", "≈ 400 – 600 validations", "Scan & Go shoppers clearing the exit gate"],
        ["Verification Time", "≈ 150 ms", "Sub-second database lookup and response"],
        ["Log Growth per Day", "≈ 500 records (≈ 200 KB)", "Compact access log footprint"],
        ["Turnstile Unlock Window", "7 seconds", "Standard pedestrian turnstile passage time"]
    ]
    add_styled_table(gate_boe[0], gate_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.7.5 Low-Level Architecture")
    add_image_figure("fig_8_7_a_gate_arch.png", "Fig 8.7.A: Low-Level Architecture – Optical Gate Security", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. The customer presents their exit pass QR code to the turnstile scanner.\n2. The hardware sends a POST request to `/api/gate/verify` with `{ passCode, gateId }`.\n3. The server locates the order using the pass code or order ID.\n4. If valid and paid, the server logs a `GRANTED` record in `GateLog`.\n5. The API returns `GATE_UNLOCKED`, triggering the physical turnstile mechanism.\n6. If invalid or unpaid, the API returns `GATE_DENIED` and the turnstile stays locked."
    )

    add_subsec_title("8.7.6 API Design")
    gate_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["POST", "/api/gate/verify", "Validates exit pass code, checks payment status, logs gate access event"]
    ]
    add_styled_table(gate_apis[0], gate_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.7.7 DB Design")
    gate_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["gatelogs", "PK: _id, INDEX: orderId, createdAt", "orderId, gateId, verifiedBy, status ('GRANTED'|'DENIED'), createdAt"],
        ["orders", "PK: id, INDEX: exitPassCode", "exitPassCode, status, customerName, cartWeight, grandTotal"]
    ]
    add_styled_table(gate_db[0], gate_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.7.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_7_1_turnstile_verification.png", "Fig 8.7.1: Turnstile Security Verification Scanner")
    add_body_p(
        "The Turnstile Security Verification interface is used by security personnel and optical scanners to validate exit passes. It displays order details, paid amounts, and cart weights, and provides a manual override button when needed."
    )
    add_image_figure("fig_8_7_2_customer_profile_settings.png", "Fig 8.7.2: Customer Settings & Verified Digital ID")
    add_body_p(
        "The Customer Settings screen allows shoppers to manage their profile, dietary preferences (Vegan, Gluten-free, etc.), saved delivery addresses, and phone number verification for automated notifications."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.8: MULTI-CHANNEL COMMUNICATIONS, AI VOICE TELEPHONY & MARKETING AUTOMATION
    # =========================================================================
    add_sec_title("8.8 MULTI-CHANNEL COMMUNICATIONS, AI VOICE & MARKETING AUTOMATION")
    add_subsec_title("8.8.0 Purpose & Scope")
    add_body_p(
        "Provides customer engagement tools including an in-app AI conversational assistant, automated phone calls and voicemails via Twilio Voice API, SMS alerts, and promotional broadcasts."
    )

    add_subsec_title("8.8.1 Functional Requirements")
    add_bullet_p("AI Shopping Assistant: ", "In-app conversational chatbot that helps customers find products, provides recipe ideas, and gives aisle directions.")
    add_bullet_p("Twilio Automated Voice Calls: ", "Initiates automated phone calls to notify customers of flash discounts, order dispatches, and store events.")
    add_bullet_p("Interactive Voicemail: ", "Dispatches voicemail audio messages with store promotions to customer phone numbers.")
    add_bullet_p("SMS & Email Notifications: ", "Sends order confirmation SMS messages and formatted HTML email receipts via Nodemailer.")

    add_subsec_title("8.8.2 Non-Functional Requirements")
    add_bullet_p("Telephony Reliability: ", "Built-in fallback mode ensures notification requests succeed even during external API downtime.")
    add_bullet_p("Template Rendering: ", "Responsive HTML email templates compile in under 50 ms.")
    add_bullet_p("Spam Prevention: ", "Rate limiting prevents excessive call dispatches to the same phone number within a single day.")

    add_subsec_title("8.8.3 Tech Stack")
    voice_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Telephony API", "Twilio Voice & SMS SDK (^6.1.1)", "Automated phone call dispatch and TwiML generation"],
        ["Email Service", "Nodemailer (^10.0.16)", "SMTP-based delivery of responsive HTML emails"],
        ["Chatbot UI", "React AIChatbotModal", "In-app conversational assistant interface"]
    ]
    add_styled_table(voice_tech[0], voice_tech[1:], col_widths=[1.5, 2.0, 3.0])

    add_subsec_title("8.8.4 Back-of-the-Envelope Estimation")
    voice_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Daily AI Inquiries", "≈ 300 – 500 conversations", "Customer product questions and recipe requests"],
        ["Automated Voice Calls", "≈ 50 – 100 calls / campaign", "Weekly promotional deals broadcast"],
        ["SMS & Email Notifications", "≈ 1,200 messages / day", "Order confirmations and delivery updates"],
        ["Voice Call Duration", "≈ 25 – 40 seconds", "Short promotional audio announcements"]
    ]
    add_styled_table(voice_boe[0], voice_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.8.5 Low-Level Architecture")
    add_image_figure("fig_8_8_a_voice_comm_arch.png", "Fig 8.8.A: Low-Level Architecture – AI Voice & Telephony Engine", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. A manager triggers a campaign or a customer asks a question in the AI chatbot.\n2. The request is routed to `/api/voice/*` endpoints.\n3. For voice campaigns, the server calls Twilio Voice API to initiate the call with dynamic TwiML.\n4. For order notifications, Nodemailer dispatches an HTML email with order line items.\n5. Dispatch outcomes are logged in system notification collections."
    )

    add_subsec_title("8.8.6 API Design")
    voice_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["POST", "/api/voice/send-offer-alert", "Initiates automated phone call with promotional deals via Twilio"],
        ["POST", "/api/voice/send-voicemail", "Dispatches promotional voicemail audio to customer phone"],
        ["POST", "/api/voice/send-sms", "Sends order update or coupon code via SMS"],
        ["POST", "/api/voice/send-email", "Dispatches responsive HTML email invoice and order status"],
        ["POST", "/api/voice/broadcast-all", "Broadcasts promotional announcements to all registered customers"]
    ]
    add_styled_table(voice_apis[0], voice_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.8.7 DB Design")
    voice_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["users", "PK: id, INDEX: phone", "name, email, phone, loyaltyPoints, preferences"],
        ["orders", "PK: id, INDEX: customerPhone", "id, status, grandTotal, rider, customerPhone"]
    ]
    add_styled_table(voice_db[0], voice_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.8.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_8_1_staff_campaigns_broadcast.png", "Fig 8.8.1: Promotional Campaigns & Broadcast Management")
    add_body_p(
        "The Promotional Campaigns screen lets store managers configure automated outreach. Managers can create discount codes, select target customer segments, and launch automated voice calls, SMS, or email blasts."
    )
    add_image_figure("fig_8_8_2_customer_crm_registry.png", "Fig 8.8.2: Customer CRM & Contact Registry")
    add_body_p(
        "The Customer CRM Registry provides a centralized directory of shoppers. Managers can view verified phone numbers, email addresses, loyalty point balances, and purchase history."
    )
    add_image_figure("fig_8_8_3_customer_storefront_hub.png", "Fig 8.8.3: Customer Storefront & AI Supermarket Assistant Hub")
    add_body_p(
        "The Customer Storefront serves as the primary home screen for shoppers, showcasing featured deals, category navigation, the AI assistant modal launcher, and store announcements."
    )
    doc.add_page_break()

    # =========================================================================
    # MODULE 8.9: EXECUTIVE STORE DASHBOARD & MANAGER BUSINESS ANALYTICS
    # =========================================================================
    add_sec_title("8.9 EXECUTIVE STORE DASHBOARD & MANAGER BUSINESS ANALYTICS")
    add_subsec_title("8.9.0 Purpose & Scope")
    add_body_p(
        "Delivers real-time business intelligence for store executives, including KPI cards, revenue charts, category performance breakdowns, rush-hour footfall analytics, and team management."
    )

    add_subsec_title("8.9.1 Functional Requirements")
    add_bullet_p("Real-Time KPI Cards: ", "Displays live metrics for today's gross revenue, completed orders, active delivery riders, and out-of-stock SKU counts.")
    add_bullet_p("Sales Trends & Revenue Breakdown: ", "Interactive bar and line charts showing daily revenue trends and category sales distribution.")
    add_bullet_p("Hourly Footfall Heatmap: ", "Visualizes peak shopping hours to help store managers plan staffing and cashier lane openings.")
    add_bullet_p("Team Roster Management: ", "Tracks staff designations, duty shifts (Morning, Afternoon, Full Day), and attendance statuses.")

    add_subsec_title("8.9.2 Non-Functional Requirements")
    add_bullet_p("Aggregation Performance: ", "Dashboard aggregation queries complete in under 300 ms across active collections.")
    add_bullet_p("Read-Only Safety: ", "Analytics endpoints are strictly read-only, preventing any accidental modification of transaction data.")
    add_bullet_p("Responsive Charting: ", "SVG-based Recharts components render smoothly across mobile and desktop displays.")

    add_subsec_title("8.9.3 Tech Stack")
    dash_tech = [
        ["Concern", "Choice", "Why it fits this module"],
        ["Data Aggregation", "MongoDB Aggregation Pipeline", "Performs real-time sums, averages, and group-by calculations"],
        ["Visualization", "Recharts (^2.12.2)", "Responsive SVG charts integrated with React state"],
        ["Executive UI", "Tailwind CSS Grid & KPI Cards", "Clean dashboard layout optimized for managerial monitoring"]
    ]
    add_styled_table(dash_tech[0], dash_tech[1:], col_widths=[1.5, 2.0, 3.0])

    add_subsec_title("8.9.4 Back-of-the-Envelope Estimation")
    dash_boe = [
        ["Quantity", "Estimate", "Basis"],
        ["Dashboard Views", "≈ 50 – 100 views / day", "Periodic checks by store managers and supervisors"],
        ["Aggregation Load", "≈ 4 queries per view", "Revenue sum, order count, fleet status, low-stock count"],
        ["Response Payload", "≈ 12 KB JSON", "Aggregated daily totals and series points"],
        ["Report Refresh Interval", "On-demand / 60 seconds", "Balances data freshness with low server load"]
    ]
    add_styled_table(dash_boe[0], dash_boe[1:], col_widths=[2.0, 1.8, 2.7])

    add_subsec_title("8.9.5 Low-Level Architecture")
    add_image_figure("fig_8_9_a_analytics_arch.png", "Fig 8.9.A: Low-Level Architecture – Dashboard & Business Analytics", width=Inches(5.8))
    add_body_p(
        "Request Flow:\n1. The manager loads `/staff/dashboard` or `/staff/analytics`.\n2. The client fetches metrics from `/api/orders`, `/api/products`, `/api/staff`, and `/api/delivery/partners`.\n3. The controllers aggregate sales figures, count pending dispatches, and identify low-stock items.\n4. The server returns JSON summary payloads.\n5. Recharts renders the revenue trajectory, hourly distributions, and KPI cards."
    )

    add_subsec_title("8.9.6 API Design")
    dash_apis = [
        ["Method", "Endpoint", "Purpose / Contract"],
        ["GET", "/api/orders", "Retrieves store orders for revenue calculations and status counts"],
        ["GET", "/api/products", "Retrieves inventory catalog to evaluate stock health and reorder flags"],
        ["GET", "/api/staff", "Lists all staff members, shifts, and departmental assignments"],
        ["GET", "/api/delivery/partners", "Fetches delivery fleet status, completed trips, and active workloads"]
    ]
    add_styled_table(dash_apis[0], dash_apis[1:], col_widths=[1.0, 2.2, 3.3])

    add_subsec_title("8.9.7 DB Design")
    dash_db = [
        ["Collection", "Keys & Indexes", "Key Columns"],
        ["orders", "PK: id, INDEX: createdAt, status", "grandTotal, status, type, createdAt"],
        ["products", "PK: id, INDEX: stock", "stock, reorderLevel, salesCount, price"],
        ["staffmembers", "PK: id, INDEX: status", "name, role, shift, status, department"],
        ["deliverypartners", "PK: id, INDEX: status", "name, status, activeOrders, completedTrips"]
    ]
    add_styled_table(dash_db[0], dash_db[1:], col_widths=[1.5, 2.2, 2.8])

    add_subsec_title("8.9.8 Screenshots & Walkthrough")
    add_image_figure("fig_8_9_1_operational_dashboard.png", "Fig 8.9.1: Executive Store Operational Dashboard")
    add_body_p(
        "The Operational Dashboard presents a high-level summary of store performance, including KPI cards for today's revenue, active deliveries, and low-stock alerts, alongside recent orders and quick-action shortcuts."
    )
    add_image_figure("fig_8_9_2_manager_analytics.png", "Fig 8.9.2: Advanced Manager Business Analytics & Footfall Heatmap")
    add_body_p(
        "The Manager Analytics screen provides in-depth business intelligence. Store executives can inspect revenue trajectories, category sales contributions, gross margins, and an hourly footfall heatmap that highlights peak store rush periods."
    )
    add_image_figure("fig_8_9_3_team_management.png", "Fig 8.9.3: Store Team Management & Shift Schedule")
    add_body_p(
        "The Team Management module organizes supermarket personnel by department and shift. Managers can view attendance status, assign roles (Cashier, Floor Associate, Inventory Supervisor), and onboard new staff members."
    )
    doc.add_page_break()

    # =========================================================================
    # CHAPTER 9: CONCLUSION
    # =========================================================================
    add_ch_title("CHAPTER 9\nCONCLUSION")
    add_body_p(
        "The Smart Supermarket Management System provides an end-to-end digital platform that unifies in-store self-checkout, cashier POS billing, inventory management, security turnstiles, delivery logistics, AI voice telephony, and executive analytics into a cohesive web application."
    )
    add_body_p(
        "By replacing legacy queues and manual paper records with camera-driven Scan & Go barcode scanning and cryptographic QR exit passes, the system significantly reduces checkout wait times while maintaining anti-theft controls through cart weight verification. Cashiers benefit from a dedicated POS terminal, while delivery dispatch algorithms automate rider assignments for express grocery orders."
    )
    add_body_p(
        "The application is built on modern web technologies—React.js with Vite, Tailwind CSS, Node.js, Express.js, and MongoDB Atlas—ensuring high performance, schema flexibility, and responsive user experiences across mobile and desktop devices. Stateless JWT authentication and role-based route guards secure customer, staff, and delivery portals."
    )
    add_body_p(
        "In conclusion, the project successfully achieves its objective of delivering a modern, efficient, and scalable supermarket management platform that enhances the shopping experience for consumers while streamlining day-to-day operations and business oversight for store managers."
    )

    doc.save(DOC_PATH)
    print(f"Complete report successfully generated and saved to: {DOC_PATH}")

if __name__ == '__main__':
    create_report()
