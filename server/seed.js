/**
 * MongoDB Database Seeder for Smart Supermarket
 * Seeds MongoDB with the product catalog and demo staff/customer accounts
 */

const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (e) {}
try { require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); } catch (e) {}

const Product = require('./models/Product');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartmart';

const initialProducts = [
  // --- Groceries & Staples ---
  {
    id: '1', productCode: 'GRO001', barcode: '890100000001',
    name: 'India Gate Basmati Rice Feast Rozzana 5kg', brand: 'India Gate',
    category: 'Groceries', price: 650, mrp: 699, unit: '5kg', stock: 45,
    reorderLevel: 20, aisle: 1, shelf: 1,
    image: 'https://images.openfoodfacts.org/images/products/069/022/510/1134/front_en.25.400.jpg',
    status: 'ACTIVE'
  },
  {
    id: '2', productCode: 'GRO002', barcode: '890100000002',
    name: 'Aashirvaad Superior MP Whole Wheat Atta 5kg', brand: 'Aashirvaad',
    category: 'Groceries', price: 250, mrp: 275, unit: '5kg', stock: 25,
    reorderLevel: 15, aisle: 1, shelf: 2,
    image: 'https://images.openfoodfacts.org/images/products/890/172/501/6838/front_en.7.400.jpg',
    status: 'ACTIVE'
  },
  {
    id: '3', productCode: 'GRO003', barcode: '890100000003',
    name: 'Tata Salt Vacuum Evaporated Iodized 1kg', brand: 'Tata',
    category: 'Groceries', price: 25, mrp: 28, unit: '1kg', stock: 120,
    reorderLevel: 50, aisle: 1, shelf: 3,
    image: 'https://images.openfoodfacts.org/images/products/890/404/390/1015/front_en.34.400.jpg',
    status: 'ACTIVE'
  },
  {
    id: '4', productCode: 'GRO004', barcode: '890100000004',
    name: 'Fortune Sunlite Refined Sunflower Oil 1L', brand: 'Fortune',
    category: 'Groceries', price: 145, mrp: 165, unit: '1L', stock: 60,
    reorderLevel: 30, aisle: 1, shelf: 4,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '5', productCode: 'GRO005', barcode: '890100000005',
    name: 'Maggi 2-Minute Masala Noodles Pack of 4', brand: 'Nestle',
    category: 'Groceries', price: 56, mrp: 68, unit: '280g', stock: 180,
    reorderLevel: 50, aisle: 2, shelf: 1,
    image: 'https://images.openfoodfacts.org/images/products/890/105/801/7687/front_en.13.400.jpg',
    status: 'ACTIVE'
  },
  {
    id: '6', productCode: 'GRO006', barcode: '890100000006',
    name: 'Tata Sampann Toor Dal 1kg', brand: 'Tata',
    category: 'Groceries', price: 139, mrp: 155, unit: '1kg', stock: 70,
    reorderLevel: 25, aisle: 2, shelf: 2,
    image: 'https://images.unsplash.com/photo-1585994192704-58673a5a415a?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '7', productCode: 'GRO007', barcode: '890100000007',
    name: 'Everest Turmeric Powder Haldi 200g', brand: 'Everest',
    category: 'Groceries', price: 72, mrp: 85, unit: '200g', stock: 90,
    reorderLevel: 30, aisle: 2, shelf: 3,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  // --- Dairy & Eggs ---
  {
    id: '8', productCode: 'DAI001', barcode: '890200000001',
    name: 'Amul Taaza Toned Milk 1L Tetra Pack', brand: 'Amul',
    category: 'Dairy', price: 27, mrp: 27, unit: '1L', stock: 200,
    reorderLevel: 80, aisle: 3, shelf: 1,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '9', productCode: 'DAI002', barcode: '890200000002',
    name: 'Amul Butter Pasteurized Salted 500g', brand: 'Amul',
    category: 'Dairy', price: 260, mrp: 275, unit: '500g', stock: 85,
    reorderLevel: 30, aisle: 3, shelf: 2,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '10', productCode: 'DAI003', barcode: '890200000003',
    name: 'Mother Dairy Fresh Paneer 200g', brand: 'Mother Dairy',
    category: 'Dairy', price: 88, mrp: 95, unit: '200g', stock: 50,
    reorderLevel: 20, aisle: 3, shelf: 3,
    image: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '11', productCode: 'DAI004', barcode: '890200000004',
    name: 'Britannia Processed Cheese Slices 750g', brand: 'Britannia',
    category: 'Dairy', price: 430, mrp: 475, unit: '750g', stock: 30,
    reorderLevel: 10, aisle: 3, shelf: 4,
    image: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '12', productCode: 'DAI005', barcode: '890200000005',
    name: 'Nestle Everyday Dairy Whitener 1kg', brand: 'Nestle',
    category: 'Dairy', price: 340, mrp: 370, unit: '1kg', stock: 45,
    reorderLevel: 15, aisle: 3, shelf: 5,
    image: 'https://images.unsplash.com/photo-1584947921538-23f46f4be084?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  // --- Beverages ---
  {
    id: '13', productCode: 'BEV001', barcode: '890300000001',
    name: 'Coca-Cola Classic 2L PET Bottle', brand: 'Coca-Cola',
    category: 'Beverages', price: 90, mrp: 100, unit: '2L', stock: 120,
    reorderLevel: 40, aisle: 5, shelf: 1,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '14', productCode: 'BEV002', barcode: '890300000002',
    name: 'Nescafe Classic Instant Coffee 50g', brand: 'Nestle',
    category: 'Beverages', price: 135, mrp: 145, unit: '50g', stock: 65,
    reorderLevel: 20, aisle: 5, shelf: 2,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '15', productCode: 'BEV003', barcode: '890300000003',
    name: 'Taj Mahal Premium Leaf Tea 500g', brand: 'Brooke Bond',
    category: 'Beverages', price: 245, mrp: 270, unit: '500g', stock: 55,
    reorderLevel: 20, aisle: 5, shelf: 3,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '16', productCode: 'BEV004', barcode: '890300000004',
    name: 'Real Fruit Power Mixed Fruit Juice 1L', brand: 'Dabur',
    category: 'Beverages', price: 130, mrp: 150, unit: '1L', stock: 80,
    reorderLevel: 25, aisle: 5, shelf: 4,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '17', productCode: 'BEV005', barcode: '890300000005',
    name: 'Bisleri Mineral Water 1L', brand: 'Bisleri',
    category: 'Beverages', price: 20, mrp: 20, unit: '1L', stock: 300,
    reorderLevel: 100, aisle: 5, shelf: 5,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  // --- Personal Care ---
  {
    id: '18', productCode: 'PER001', barcode: '890400000001',
    name: 'Colgate MaxFresh Blue Mint Toothpaste 300g', brand: 'Colgate',
    category: 'Personal Care', price: 175, mrp: 195, unit: '300g', stock: 90,
    reorderLevel: 30, aisle: 7, shelf: 1,
    image: 'https://images.unsplash.com/photo-1559591937-e160e1d8847f?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '19', productCode: 'PER002', barcode: '890400000002',
    name: 'Lifebuoy Total 10 Antibacterial Soap 150g', brand: 'HUL',
    category: 'Personal Care', price: 48, mrp: 55, unit: '150g', stock: 150,
    reorderLevel: 50, aisle: 7, shelf: 2,
    image: 'https://images.unsplash.com/photo-1607006314177-e6f7724214f7?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '20', productCode: 'PER003', barcode: '890400000003',
    name: 'Head & Shoulders Anti-Dandruff Shampoo 340ml', brand: 'P&G',
    category: 'Personal Care', price: 260, mrp: 295, unit: '340ml', stock: 60,
    reorderLevel: 20, aisle: 7, shelf: 3,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '21', productCode: 'PER004', barcode: '890400000004',
    name: 'Dove Beauty Bar Soap 3x100g Pack', brand: 'Dove',
    category: 'Personal Care', price: 195, mrp: 225, unit: '3x100g', stock: 70,
    reorderLevel: 25, aisle: 7, shelf: 4,
    image: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '22', productCode: 'PER005', barcode: '890400000005',
    name: 'Nivea Soft Light Moisturizer 500ml', brand: 'Nivea',
    category: 'Personal Care', price: 340, mrp: 375, unit: '500ml', stock: 45,
    reorderLevel: 15, aisle: 7, shelf: 5,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  // --- Household ---
  {
    id: '23', productCode: 'HOU001', barcode: '890500000001',
    name: 'Surf Excel Easy Wash Detergent Powder 3kg', brand: 'HUL',
    category: 'Household', price: 295, mrp: 320, unit: '3kg', stock: 80,
    reorderLevel: 25, aisle: 8, shelf: 1,
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '24', productCode: 'HOU002', barcode: '890500000002',
    name: 'Vim Dishwash Liquid Lemon 750ml', brand: 'HUL',
    category: 'Household', price: 98, mrp: 115, unit: '750ml', stock: 110,
    reorderLevel: 35, aisle: 8, shelf: 2,
    image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '25', productCode: 'HOU003', barcode: '890500000003',
    name: 'Harpic Power Plus Toilet Cleaner 1L', brand: 'Reckitt',
    category: 'Household', price: 135, mrp: 155, unit: '1L', stock: 75,
    reorderLevel: 20, aisle: 8, shelf: 3,
    image: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '26', productCode: 'HOU004', barcode: '890500000004',
    name: 'Lizol All-Surface Floor Cleaner Floral 2L', brand: 'Reckitt',
    category: 'Household', price: 250, mrp: 275, unit: '2L', stock: 55,
    reorderLevel: 15, aisle: 8, shelf: 4,
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  // --- Fresh Produce ---
  {
    id: '27', productCode: 'VEG001', barcode: '890600000001',
    name: 'Fresh Red Onion 1kg Bag', brand: 'Farm Fresh',
    category: 'Vegetables', price: 45, mrp: 50, unit: '1kg', stock: 80,
    reorderLevel: 30, aisle: 9, shelf: 1,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '28', productCode: 'VEG002', barcode: '890600000002',
    name: 'Farm Fresh Tomatoes 1kg Net', brand: 'Farm Fresh',
    category: 'Vegetables', price: 35, mrp: 40, unit: '1kg', stock: 100,
    reorderLevel: 40, aisle: 9, shelf: 2,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '29', productCode: 'VEG003', barcode: '890600000003',
    name: 'Golden Fresh Potatoes 2kg', brand: 'Farm Fresh',
    category: 'Vegetables', price: 50, mrp: 60, unit: '2kg', stock: 90,
    reorderLevel: 30, aisle: 9, shelf: 3,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '30', productCode: 'FRU001', barcode: '890600000004',
    name: 'Shimla Fresh Red Apples 1kg Premium', brand: 'Shimla Hills',
    category: 'Fruits', price: 185, mrp: 210, unit: '1kg', stock: 60,
    reorderLevel: 20, aisle: 9, shelf: 4,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '31', productCode: 'FRU002', barcode: '890600000005',
    name: 'Robusta Bananas 1 Dozen (12 pcs)', brand: 'Farm Fresh',
    category: 'Fruits', price: 60, mrp: 70, unit: '1 doz', stock: 120,
    reorderLevel: 40, aisle: 9, shelf: 5,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  },
  {
    id: '32', productCode: 'FRU003', barcode: '890600000006',
    name: 'Nagpur Orange 1kg Pack', brand: 'Farm Fresh',
    category: 'Fruits', price: 100, mrp: 120, unit: '1kg', stock: 75,
    reorderLevel: 25, aisle: 9, shelf: 6,
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80',
    status: 'ACTIVE'
  }
];

const defaultUsers = [
  {
    id: 'staff_admin',
    name: 'Store Manager (Staff)',
    email: 'staff@smartmart.com',
    role: 'STAFF',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
    loyaltyPoints: 1000,
  },
  {
    id: 'cust_ananya',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    phone: '9876543210',
    role: 'CUSTOMER',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
    loyaltyPoints: 350,
  },
];

async function seed() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected to MongoDB.');

  // 1. Seed Products
  let insertedProducts = 0;
  let updatedProducts = 0;

  for (const item of initialProducts) {
    const existing = await Product.findOne({
      $or: [{ id: item.id }, { barcode: item.barcode }],
    });

    if (existing) {
      await Product.updateOne({ _id: existing._id }, { $set: item });
      updatedProducts++;
    } else {
      await Product.create(item);
      insertedProducts++;
    }
  }

  console.log(`📦 Products Seeded: ${insertedProducts} new, ${updatedProducts} updated (Total: ${initialProducts.length})`);

  // 2. Seed Default Accounts
  for (const user of defaultUsers) {
    await User.findOneAndUpdate(
      { email: user.email },
      { $set: user },
      { upsert: true, new: true }
    );
  }
  console.log(`👤 Demo Accounts Seeded: Staff (${defaultUsers[0].email}) and Customer (${defaultUsers[1].email})`);

  console.log('🎉 MongoDB seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeder Error:', err.message);
  console.error('👉 Make sure MongoDB is running locally (mongod) or update MONGODB_URI in server/.env');
  process.exit(1);
});
