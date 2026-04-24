// 评论接口：列表公开，写评论需登录，审核需管理员
const express = require('express');
const db = require('../db/knex');
const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 某场馆的评论列表
router.get('/', async (req, res) => {
  const { court_id, page = 1, page_size = 20 } = req.query;
  if (!court_id) return res.status(400).json({ error: 'court_id 必填' });
  const offset = (Number(page) - 1) * Number(page_size);
  const rows = await db('reviews as r')
    .leftJoin('users as u', 'r.user_id', 'u.id')
    .where('r.court_id', court_id)
    .where('r.status', 1)
    .orderBy('r.created_at', 'desc')
    .limit(page_size).offset(offset)
    .select(
      'r.*',
      'u.nickname as user_nickname',
      'u.avatar as user_avatar',
    );
  rows.forEach((r) => {
    try { r.images = r.images ? JSON.parse(r.images) : []; } catch (_) { r.images = []; }
    try { r.tags = r.tags ? JSON.parse(r.tags) : []; } catch (_) { r.tags = []; }
  });
  res.json({ list: rows });
});

// 发布评论
router.post('/', requireUser, async (req, res) => {
  const {
    court_id,
    rating_overall, rating_quality, rating_traffic,
    rating_facility, rating_price,
    content, images = [], tags = [], is_real_shot = 1,
  } = req.body;

  if (!court_id) return res.status(400).json({ error: 'court_id 必填' });
  if (!rating_overall || rating_overall < 1 || rating_overall > 5) {
    return res.status(400).json({ error: '总评分 1-5' });
  }
  if (!content || content.length < 5) {
    return res.status(400).json({ error: '内容至少 5 字' });
  }

  const court = await db('courts').where('id', court_id).first();
  if (!court) return res.status(404).json({ error: '场馆不存在' });

  const [id] = await db('reviews').insert({
    court_id, user_id: req.user.id,
    rating_overall, rating_quality, rating_traffic,
    rating_facility, rating_price,
    content,
    images: JSON.stringify(images.slice(0, 3)),
    tags: JSON.stringify(Array.isArray(tags) ? tags.slice(0, 10) : []),
    is_real_shot: is_real_shot ? 1 : 0,
    status: 1,
  });

  await refreshCourtRating(court_id);
  res.json({ id });
});

// 管理员：审核通过/拒绝
router.post('/:id/audit', requireAdmin, async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'
  const status = action === 'approve' ? 1 : 2;
  await db('reviews').where('id', req.params.id).update({ status });
  const review = await db('reviews').where('id', req.params.id).first();
  if (review) await refreshCourtRating(review.court_id);
  res.json({ ok: true });
});

// 管理员：所有评论（含待审）
router.get('/admin/all', requireAdmin, async (req, res) => {
  const rows = await db('reviews as r')
    .leftJoin('users as u', 'r.user_id', 'u.id')
    .leftJoin('courts as c', 'r.court_id', 'c.id')
    .orderBy('r.created_at', 'desc')
    .select(
      'r.*',
      'u.nickname as user_nickname',
      'c.name as court_name',
    );
  rows.forEach((r) => {
    try { r.images = r.images ? JSON.parse(r.images) : []; } catch (_) { r.images = []; }
    try { r.tags = r.tags ? JSON.parse(r.tags) : []; } catch (_) { r.tags = []; }
  });
  res.json({ list: rows });
});

async function refreshCourtRating(court_id) {
  const agg = await db('reviews')
    .where({ court_id, status: 1 })
    .avg({ a: 'rating_overall' })
    .count({ c: '*' })
    .first();
  await db('courts').where('id', court_id).update({
    avg_rating: Number(agg.a || 0).toFixed(1),
    review_count: agg.c || 0,
  });
}

module.exports = router;
