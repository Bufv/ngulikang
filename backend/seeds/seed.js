const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hashPassword = async (password) => bcrypt.hash(password, 10);

const ensureUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return existing;
  }
  return prisma.user.create({ data });
};

const seedUsers = async () => {
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');
  const tukangPassword = await hashPassword('tukang123');

  const admins = [
    { name: 'Admin Utama', email: 'admin@ngulikang.com' },
    { name: 'Admin Dua', email: 'admin2@ngulikang.com' },
    { name: 'Admin Tiga', email: 'admin3@ngulikang.com' }
  ];

  for (const admin of admins) {
    await ensureUser({
      name: admin.name,
      email: admin.email,
      password: adminPassword,
      role: 'admin'
    });
  }

  const tukangUsers = [];
  for (let i = 1; i <= 10; i += 1) {
    tukangUsers.push({
      name: `Tukang ${i}`,
      email: `tukang${i}@ngulikang.com`
    });
  }

  const skillPool = ['Renovasi', 'Bangun Baru', 'Plumbing', 'Elektrikal', 'Interior', 'Cat'];

  for (const tukang of tukangUsers) {
    const existing = await prisma.user.findUnique({ where: { email: tukang.email } });
    if (existing) {
      continue;
    }
    const skills = [skillPool[Math.floor(Math.random() * skillPool.length)], skillPool[Math.floor(Math.random() * skillPool.length)]];
    await prisma.user.create({
      data: {
        name: tukang.name,
        email: tukang.email,
        password: tukangPassword,
        role: 'tukang',
        tukangProfile: {
          create: {
            skills,
            experience: `${2 + Math.floor(Math.random() * 8)} tahun`,
            rating: 3 + Math.random() * 2,
            verified: true,
            saldo: new Prisma.Decimal(500000 + Math.floor(Math.random() * 1500000))
          }
        }
      }
    });
  }

  const users = [];
  for (let i = 1; i <= 20; i += 1) {
    users.push({
      name: `User ${i}`,
      email: `user${i}@example.com`
    });
  }

  for (const user of users) {
    await ensureUser({
      name: user.name,
      email: user.email,
      password: userPassword,
      role: 'user'
    });
  }

  return {
    users: await prisma.user.findMany({ where: { role: 'user' } }),
    tukang: await prisma.user.findMany({ where: { role: 'tukang' } })
  };
};

const seedLamaran = async (users) => {
  const count = await prisma.lamaran.count();
  if (count > 0) {
    return;
  }

  const statuses = ['pending', 'pending', 'pending', 'approved', 'rejected'];
  const lamaranData = statuses.map((status, index) => ({
    email: users[index]?.email || `lamaran${index + 1}@example.com`,
    phone: `08123${index}456789`,
    skills: ['Renovasi', 'Bangun Baru'],
    status,
    userId: users[index]?.id
  }));

  await prisma.lamaran.createMany({ data: lamaranData });
};

const seedProducts = async () => {
  const count = await prisma.product.count();
  if (count > 0) {
    return;
  }

  const products = Array.from({ length: 15 }).map((_, index) => ({
    name: `Produk ${index + 1}`,
    description: 'Produk berkualitas untuk kebutuhan proyek.',
    price: new Prisma.Decimal(50000 + index * 25000),
    category: index % 2 === 0 ? 'Bahan Bangunan' : 'Peralatan',
    imageUrl: '',
    stock: 10 + index
  }));

  await prisma.product.createMany({ data: products });
};

const seedOrders = async (users, tukang) => {
  const count = await prisma.order.count();
  if (count > 0) {
    const existing = await prisma.order.findMany({ take: 10 });
    return { orders: existing };
  }

  const serviceTypes = ['harian', 'borongan', 'renovasi', 'premium', 'korporate', 'bangun'];
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const orders = [];

  for (let i = 0; i < 10; i += 1) {
    const user = users[i % users.length];
    const tukangUser = tukang[i % tukang.length];
    const status = statuses[i % statuses.length];

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        tukangId: status === 'pending' ? null : tukangUser.id,
        serviceType: serviceTypes[i % serviceTypes.length],
        status,
        totalPrice: new Prisma.Decimal(1500000 + i * 250000),
        location: `Lokasi proyek ${i + 1}`,
        notes: 'Catatan order contoh.'
      }
    });
    orders.push(order);
  }

  return { orders };
};

const seedOrderProgress = async (orders, tukang) => {
  const count = await prisma.orderProgress.count();
  if (count > 0) {
    return;
  }

  const inProgressOrders = orders.filter((order) => order.status === 'in_progress');
  for (const order of inProgressOrders) {
    const updater = tukang.find((t) => t.id === order.tukangId) || tukang[0];
    await prisma.orderProgress.create({
      data: {
        orderId: order.id,
        progressPercentage: 30,
        notes: 'Pengerjaan awal dimulai.',
        images: [],
        updatedBy: updater.id
      }
    });
  }
};

const seedGaji = async (tukang, orders) => {
  const count = await prisma.gaji.count();
  if (count > 0) {
    return;
  }

  let orderList = orders;
  if (!orderList || orderList.length === 0) {
    orderList = await prisma.order.findMany({ take: 10 });
  }

  const data = [];
  for (let i = 0; i < 8; i += 1) {
    const tukangUser = tukang[i % tukang.length];
    const order = orderList.length > 0 ? orderList[i % orderList.length] : null;
    data.push({
      tukangId: tukangUser.id,
      orderId: order?.id || null,
      amount: new Prisma.Decimal(300000 + i * 50000),
      status: i < 3 ? 'pending' : 'paid',
      paidAt: i < 3 ? null : new Date()
    });
  }

  await prisma.gaji.createMany({ data });
};

const seedChat = async (users, tukang) => {
  const count = await prisma.chatRoom.count();
  if (count > 0) {
    return;
  }

  for (let i = 0; i < 3; i += 1) {
    const user = users[i % users.length];
    const tukangUser = tukang[i % tukang.length];
    const room = await prisma.chatRoom.create({
      data: {
        userId: user.id,
        tukangId: tukangUser.id
      }
    });

    await prisma.message.createMany({
      data: [
        {
          roomId: room.id,
          senderId: user.id,
          content: 'Halo, saya butuh bantuan proyek.',
          read: true
        },
        {
          roomId: room.id,
          senderId: tukangUser.id,
          content: 'Siap, kapan mau mulai?',
          read: true
        },
        {
          roomId: room.id,
          senderId: user.id,
          content: 'Minggu depan bisa?',
          read: false
        }
      ]
    });
  }
};

const seedNotifications = async (users) => {
  const count = await prisma.notification.count();
  if (count > 0) {
    return;
  }

  const notifications = Array.from({ length: 10 }).map((_, index) => ({
    userId: users[index % users.length].id,
    type: 'order',
    title: 'Update Order',
    message: `Order Anda mendapatkan update ke-${index + 1}.`,
    read: index % 2 === 0
  }));

  await prisma.notification.createMany({ data: notifications });
};

const seedCart = async (users) => {
  const count = await prisma.cart.count();
  if (count > 0) {
    return;
  }

  const products = await prisma.product.findMany({ take: 5 });
  if (products.length === 0) {
    return;
  }

  const user = users[0];
  if (!user) {
    return;
  }

  await prisma.cart.createMany({
    data: products.map((product, index) => ({
      userId: user.id,
      productId: product.id,
      quantity: index + 1
    }))
  });
};

const seed = async () => {
  console.log('Seeding started...');

  const { users, tukang } = await seedUsers();
  console.log('Seeded users, admins, and tukang.');
  await seedLamaran(users);
  console.log('Seeded lamaran.');
  await seedProducts();
  console.log('Seeded products.');
  const { orders } = await seedOrders(users, tukang);
  console.log('Seeded orders.');
  await seedOrderProgress(orders, tukang);
  console.log('Seeded order progress.');
  await seedGaji(tukang, orders);
  console.log('Seeded gaji.');
  await seedChat(users, tukang);
  console.log('Seeded chat rooms and messages.');
  await seedNotifications(users);
  console.log('Seeded notifications.');
  await seedCart(users);
  console.log('Seeded cart items.');

  console.log('Seeding completed.');
};

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

const disconnect = () => prisma.$disconnect();

module.exports = { seed, disconnect };
