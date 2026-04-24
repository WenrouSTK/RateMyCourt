// 初始化数据库：建表 + 种子数据
const db = require('./knex');

async function createTables() {
  // 场馆表
  if (!(await db.schema.hasTable('courts'))) {
    await db.schema.createTable('courts', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable();
      t.string('district', 20);           // 福田/南山/罗湖...
      t.string('address', 200);
      t.decimal('lat', 10, 7);
      t.decimal('lng', 10, 7);
      t.string('phone', 30);
      t.integer('price_min');
      t.integer('price_max');
      t.string('surface', 20);            // 硬地/红土/人工草/塑胶
      t.tinyint('indoor').defaultTo(0);   // 0室外 1室内 2混合
      t.tinyint('has_light').defaultTo(0);
      t.tinyint('parking').defaultTo(0);
      t.string('cover_image', 300);
      t.float('avg_rating').defaultTo(0);
      t.integer('review_count').defaultTo(0);
      t.tinyint('status').defaultTo(1);   // 1上架 0下架
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('✅ 建表 courts');
  }

  // 用户表
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('openid', 64).unique();
      t.string('unionid', 64);
      t.string('nickname', 50);
      t.string('avatar', 300);
      t.tinyint('role').defaultTo(0);      // 0普通 1管理员
      t.tinyint('status').defaultTo(1);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ 建表 users');
  }

  // 评论表
  if (!(await db.schema.hasTable('reviews'))) {
    await db.schema.createTable('reviews', (t) => {
      t.increments('id').primary();
      t.integer('court_id').notNullable().index();
      t.integer('user_id').notNullable().index();
      t.tinyint('rating_overall');
      t.tinyint('rating_quality');   // 场地质量
      t.tinyint('rating_traffic');   // 交通
      t.tinyint('rating_facility');  // 灯光卫生间
      t.tinyint('rating_price');     // 价格
      t.text('content');
      t.text('images');              // JSON 字符串
      t.integer('like_count').defaultTo(0);
      t.tinyint('status').defaultTo(1); // 开发阶段默认 1 直接通过；上线改 0 待审
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ 建表 reviews');
  }
}

async function seedData() {
  const count = await db('courts').count({ c: '*' }).first();
  if (count.c > 0) {
    console.log('ℹ️  已有场馆数据，跳过种子');
    return;
  }
  await db('courts').insert([
    {
      name: '深圳湾体育中心网球场',
      district: '南山',
      address: '深圳市南山区滨海大道 3001 号',
      lat: 22.5108, lng: 113.9500,
      phone: '0755-86662345',
      price_min: 80, price_max: 200,
      surface: '硬地',
      indoor: 0, has_light: 1, parking: 1,
      avg_rating: 4.5,
    },
    {
      name: '香蜜公园网球场',
      district: '福田',
      address: '深圳市福田区香蜜湖农园路',
      lat: 22.5480, lng: 114.0356,
      phone: '',
      price_min: 60, price_max: 120,
      surface: '硬地',
      indoor: 0, has_light: 1, parking: 1,
      avg_rating: 4.2,
    },
    {
      name: '莲花山网球场',
      district: '福田',
      address: '深圳市福田区红荔路 6030 号莲花山公园',
      lat: 22.5590, lng: 114.0640,
      phone: '',
      price_min: 50, price_max: 100,
      surface: '硬地',
      indoor: 0, has_light: 0, parking: 1,
      avg_rating: 4.0,
    },
  ]);
  console.log('✅ 种子场馆 3 条');
}

(async () => {
  try {
    await createTables();
    await seedData();
    console.log('🎉 数据库初始化完成');
    process.exit(0);
  } catch (e) {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  }
})();
