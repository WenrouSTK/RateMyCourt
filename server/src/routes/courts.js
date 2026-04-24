// 场馆接口 v2：新增距离排序、字段扩展、JSON 字段解析
const express = require('express');
const db = require('../db/knex');
const { requireAdmin, optionalUser, requireUser } = require('../middleware/auth');

const router = express.Router();

// Haversine 距离（km）
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const JSON_FIELDS = ['images', 'specs', 'price_tiers', 'env_tags', 'facility_tags', 'court_types'];

function parseJsonFields(row) {
  if (!row) return row;
  for (const f of JSON_FIELDS) {
    if (row[f] && typeof row[f] === 'string') {
      try { row[f] = JSON.parse(row[f]); } catch (_) { row[f] = null; }
    }
  }
  // 最小起价
  if (Array.isArray(row.price_tiers) && row.price_tiers.length) {
    row.price_from = Math.min(...row.price_tiers.map((t) => t.price || 0).filter((n) => n > 0));
  } else if (row.price_min) {
    row.price_from = row.price_min;
  }
  return row;
}

// 列表：支持 lat/lng、sort=distance|rating|new、筛选
router.get('/', async (req, res) => {
  const { district, q, sort = 'rating', lat, lng, court_type, env_tag } = req.query;
  let query = db('courts').where('status', 1);
  if (district && district !== '全部') query = query.where('district', district);
  if (q) query = query.where('name', 'like', `%${q}%`);
  let rows = await query;

  rows = rows.map(parseJsonFields);

  // 过滤（JSON 字段过滤放内存）
  if (court_type) rows = rows.filter((r) => Array.isArray(r.court_types) && r.court_types.includes(court_type));
  if (env_tag) rows = rows.filter((r) => Array.isArray(r.env_tags) && r.env_tags.includes(env_tag));

  // 计算距离
  if (lat && lng) {
    const userLat = Number(lat), userLng = Number(lng);
    rows.forEach((r) => {
      if (r.lat && r.lng) r.distance_km = +distanceKm(userLat, userLng, Number(r.lat), Number(r.lng)).toFixed(2);
      else r.distance_km = null;
    });
  }

  // 排序
  if (sort === 'distance' && lat && lng) {
    rows.sort((a, b) => {
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
  } else if (sort === 'new') {
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    rows.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  }

  res.json({ list: rows });
});

// 详情：JSON 字段解析 + 评论标签聚合
router.get('/:id', async (req, res) => {
  const court = parseJsonFields(await db('courts').where('id', req.params.id).first());
  if (!court) return res.status(404).json({ error: '场馆不存在' });

  // 维度均分
  const agg = await db('reviews')
    .where({ court_id: court.id, status: 1 })
    .avg({ q: 'rating_quality', t: 'rating_traffic', f: 'rating_facility', p: 'rating_price' })
    .first();
  court.dim_avg = {
    rating_quality: agg.q ? Number(agg.q).toFixed(1) : null,
    rating_traffic: agg.t ? Number(agg.t).toFixed(1) : null,
    rating_facility: agg.f ? Number(agg.f).toFixed(1) : null,
    rating_price: agg.p ? Number(agg.p).toFixed(1) : null,
  };

  // 热门标签（统计 reviews.tags 字段）
  const reviews = await db('reviews').where({ court_id: court.id, status: 1 }).select('tags');
  const tagCount = {};
  reviews.forEach((r) => {
    if (!r.tags) return;
    try {
      const arr = JSON.parse(r.tags);
      if (Array.isArray(arr)) arr.forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1));
    } catch (_) {}
  });
  court.hot_tags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  res.json(court);
});

// 管理员：新增
router.post('/', requireAdmin, async (req, res) => {
  const data = pickCourtFields(req.body);
  if (!data.name) return res.status(400).json({ error: '名称必填' });
  const [id] = await db('courts').insert(data);
  res.json({ id });
});

// 管理员：更新
router.put('/:id', requireAdmin, async (req, res) => {
  const data = pickCourtFields(req.body);
  data.updated_at = db.fn.now();
  await db('courts').where('id', req.params.id).update(data);
  res.json({ ok: true });
});

// 管理员：下架
router.delete('/:id', requireAdmin, async (req, res) => {
  await db('courts').where('id', req.params.id).update({ status: 0 });
  res.json({ ok: true });
});

// 纠错反馈
router.post('/:id/correction', optionalUser, async (req, res) => {
  const court_id = Number(req.params.id);
  const { field, content } = req.body;
  if (!content) return res.status(400).json({ error: '内容必填' });
  const [id] = await db('corrections').insert({
    court_id,
    user_id: req.user ? req.user.id : null,
    field: field || 'other',
    content,
  });
  res.json({ id });
});

function pickCourtFields(body) {
  const scalars = [
    'name', 'district', 'address', 'lat', 'lng', 'phone',
    'price_min', 'price_max', 'surface', 'indoor', 'has_light',
    'parking', 'cover_image', 'cover_image_real', 'parking_tip', 'metro_info',
  ];
  const jsons = ['images', 'specs', 'price_tiers', 'env_tags', 'facility_tags', 'court_types'];
  const out = {};
  for (const f of scalars) if (body[f] !== undefined) out[f] = body[f];
  for (const f of jsons) {
    if (body[f] !== undefined) {
      out[f] = typeof body[f] === 'string' ? body[f] : JSON.stringify(body[f]);
    }
  }
  return out;
}

module.exports = router;
