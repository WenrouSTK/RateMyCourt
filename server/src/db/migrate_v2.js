// 迁移 v2：扩字段到"深网地图 Demo"版
// 给 courts 增加：cover_image_real、images、specs、price_tiers、
//   env_tags、facility_tags、parking_tip、metro_info
// 给 reviews 增加：tags（JSON）、is_real_shot
// 新表：corrections（纠错反馈）
const db = require('./knex');

async function addColumnIfMissing(table, col, builder) {
  const has = await db.schema.hasColumn(table, col);
  if (has) return false;
  await db.schema.alterTable(table, (t) => builder(t, col));
  console.log(`  + ${table}.${col}`);
  return true;
}

async function migrate() {
  // courts 扩字段
  console.log('📋 扩展 courts 表');
  await addColumnIfMissing('courts', 'cover_image_real', (t) => t.string('cover_image_real', 300));
  await addColumnIfMissing('courts', 'images',          (t) => t.text('images'));        // JSON: [{url, category:"official|real"}]
  await addColumnIfMissing('courts', 'specs',           (t) => t.text('specs'));         // JSON: [{type,count,condition}]
  await addColumnIfMissing('courts', 'price_tiers',     (t) => t.text('price_tiers'));   // JSON: [{scene,price}]
  await addColumnIfMissing('courts', 'env_tags',        (t) => t.text('env_tags'));      // JSON: ["露天","风雨","空调"]
  await addColumnIfMissing('courts', 'facility_tags',   (t) => t.text('facility_tags')); // JSON: ["parking","metro","shower","stringing"]
  await addColumnIfMissing('courts', 'parking_tip',     (t) => t.text('parking_tip'));
  await addColumnIfMissing('courts', 'metro_info',      (t) => t.string('metro_info', 100)); // 如 "1号线 桃园站 B 出口"
  await addColumnIfMissing('courts', 'court_types',     (t) => t.text('court_types'));   // JSON: ["hard","clay","grass","indoor_practice"]

  // reviews 扩字段
  console.log('📋 扩展 reviews 表');
  await addColumnIfMissing('reviews', 'tags',         (t) => t.text('tags'));
  await addColumnIfMissing('reviews', 'is_real_shot', (t) => t.tinyint('is_real_shot').defaultTo(1));

  // corrections 纠错表
  if (!(await db.schema.hasTable('corrections'))) {
    await db.schema.createTable('corrections', (t) => {
      t.increments('id').primary();
      t.integer('court_id').notNullable().index();
      t.integer('user_id');
      t.string('field', 40);    // phone / price / hours / address / other
      t.text('content');         // 用户描述
      t.tinyint('status').defaultTo(0); // 0待处理 1已处理 2忽略
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('  ✅ 建表 corrections');
  }

  // 更新种子数据（把示例场馆填满）
  console.log('🌱 更新种子数据');
  const enrichments = [
    {
      id: 1,
      patch: {
        cover_image_real: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', category: 'real' },
          { url: 'https://images.unsplash.com/photo-1595435934349-5c8a59a6a1e8?w=800', category: 'real' },
          { url: 'https://images.unsplash.com/photo-1542144612-1b3641ec3459?w=800', category: 'official' },
        ]),
        court_types: JSON.stringify(['hard']),
        env_tags: JSON.stringify(['露天', '风雨']),
        facility_tags: JSON.stringify(['parking', 'metro', 'shower', 'stringing']),
        specs: JSON.stringify([
          { type: '室外硬地', count: 6, condition: '较新' },
          { type: '风雨硬地', count: 2, condition: '新' },
        ]),
        price_tiers: JSON.stringify([
          { scene: '工作日白场', price: 80 },
          { scene: '工作日晚场', price: 150 },
          { scene: '周末节假日', price: 200 },
        ]),
        parking_tip: '场馆自带停车场，打球每小时免费停 1 小时（凭小票兑换）。导航至"深圳湾体育中心 T 区"。',
        metro_info: '2/11号线 后海站 E 出口步行约 10 分钟',
      },
    },
    {
      id: 2,
      patch: {
        cover_image_real: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800', category: 'real' },
          { url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800', category: 'real' },
        ]),
        court_types: JSON.stringify(['hard']),
        env_tags: JSON.stringify(['露天']),
        facility_tags: JSON.stringify(['parking']),
        specs: JSON.stringify([
          { type: '室外硬地', count: 4, condition: '旧' },
        ]),
        price_tiers: JSON.stringify([
          { scene: '工作日白场', price: 60 },
          { scene: '工作日晚场', price: 100 },
          { scene: '周末节假日', price: 120 },
        ]),
        parking_tip: '公园内停车场，节假日易满。建议绿色出行。',
        metro_info: '7号线 香蜜站 A 出口步行约 15 分钟',
      },
    },
    {
      id: 3,
      patch: {
        cover_image_real: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800', category: 'real' },
        ]),
        court_types: JSON.stringify(['hard']),
        env_tags: JSON.stringify(['露天']),
        facility_tags: JSON.stringify(['parking', 'metro']),
        specs: JSON.stringify([
          { type: '室外硬地', count: 4, condition: '一般' },
        ]),
        price_tiers: JSON.stringify([
          { scene: '工作日白场', price: 50 },
          { scene: '周末节假日', price: 100 },
        ]),
        parking_tip: '莲花山公园南门停车场，周末极易满，建议 9 点前到。',
        metro_info: '3/4号线 少年宫站 D 出口步行约 8 分钟',
      },
    },
  ];
  for (const { id, patch } of enrichments) {
    await db('courts').where({ id }).update(patch);
  }

  // 新增两个示例场馆，体现"红土/室内"等多元化
  const existing = await db('courts').count({ c: '*' }).first();
  if (existing.c < 5) {
    await db('courts').insert([
      {
        name: '南山科兴网球场',
        district: '南山',
        address: '深圳市南山区科技园科兴科学园 A1 栋楼顶',
        lat: 22.5396, lng: 113.9512,
        phone: '0755-86331234',
        price_min: 100, price_max: 180,
        surface: '硬地',
        indoor: 1, has_light: 1, parking: 1,
        avg_rating: 4.3,
        cover_image_real: 'https://images.unsplash.com/photo-1577471487943-9c5edb6d1f40?w=800',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1577471487943-9c5edb6d1f40?w=800', category: 'real' },
        ]),
        court_types: JSON.stringify(['hard', 'indoor_practice']),
        env_tags: JSON.stringify(['空调']),
        facility_tags: JSON.stringify(['parking', 'metro', 'shower', 'stringing']),
        specs: JSON.stringify([
          { type: '室内空调硬地', count: 4, condition: '新' },
        ]),
        price_tiers: JSON.stringify([
          { scene: '工作日白场', price: 100 },
          { scene: '工作日晚场', price: 160 },
          { scene: '周末节假日', price: 180 },
        ]),
        parking_tip: '科兴科学园地下 B 区，前台领票打球前 3 小时免费。',
        metro_info: '2号线 科苑站 C 出口步行约 5 分钟',
      },
      {
        name: '龙岗红土网球训练中心',
        district: '龙岗',
        address: '深圳市龙岗区龙翔大道 8288 号',
        lat: 22.7209, lng: 114.2563,
        phone: '0755-28851111',
        price_min: 120, price_max: 220,
        surface: '红土',
        indoor: 0, has_light: 1, parking: 1,
        avg_rating: 4.7,
        cover_image_real: 'https://images.unsplash.com/photo-1622279457486-28e993fb4ac2?w=800',
        images: JSON.stringify([
          { url: 'https://images.unsplash.com/photo-1622279457486-28e993fb4ac2?w=800', category: 'real' },
        ]),
        court_types: JSON.stringify(['clay']),
        env_tags: JSON.stringify(['露天']),
        facility_tags: JSON.stringify(['parking', 'shower', 'stringing']),
        specs: JSON.stringify([
          { type: '露天红土', count: 6, condition: '新' },
        ]),
        price_tiers: JSON.stringify([
          { scene: '工作日白场', price: 120 },
          { scene: '工作日晚场', price: 180 },
          { scene: '周末节假日', price: 220 },
        ]),
        parking_tip: '场馆自有地面停车场，免费停。',
        metro_info: '3号线 龙城广场站步行约 10 分钟',
      },
    ]);
    console.log('  ✅ 补充 2 个场馆');
  }

  console.log('🎉 迁移完成');
}

migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
