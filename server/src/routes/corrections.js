// 管理员：纠错反馈接口
const express = require('express');
const db = require('../db/knex');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 列表
router.get('/', requireAdmin, async (req, res) => {
  const rows = await db('corrections as c')
    .leftJoin('courts as ct', 'c.court_id', 'ct.id')
    .leftJoin('users as u', 'c.user_id', 'u.id')
    .orderBy('c.created_at', 'desc')
    .select('c.*', 'ct.name as court_name', 'u.nickname as user_nickname');
  res.json({ list: rows });
});

// 更新状态
router.post('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body; // 0 / 1 / 2
  await db('corrections').where('id', req.params.id).update({ status: Number(status) });
  res.json({ ok: true });
});

module.exports = router;
