// 用户登录：开发阶段支持 mock 登录，上线接微信 code2session
const express = require('express');
const db = require('../db/knex');
const { sign, requireUser } = require('../middleware/auth');

const router = express.Router();

// 登录：接收 { code, nickname, avatar }
// 开发模式：code 以 'mock_' 开头时，直接用 code 作为假 openid，不走微信
// 生产模式：code 走 https://api.weixin.qq.com/sns/jscode2session 拿 openid
router.post('/login', async (req, res) => {
  const { code, nickname, avatar } = req.body;
  if (!code) return res.status(400).json({ error: 'code 必填' });

  let openid;
  if (code.startsWith('mock_') || !process.env.WX_APPID) {
    openid = code.startsWith('mock_') ? code : `mock_${Date.now()}`;
  } else {
    // TODO: 接入微信 code2session
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    const r = await fetch(url).then((x) => x.json());
    if (!r.openid) return res.status(400).json({ error: '微信登录失败', detail: r });
    openid = r.openid;
  }

  let user = await db('users').where({ openid }).first();
  if (!user) {
    const [id] = await db('users').insert({
      openid,
      nickname: nickname || '球友' + String(Math.floor(Math.random() * 10000)),
      avatar: avatar || '',
    });
    user = await db('users').where({ id }).first();
  } else if (nickname || avatar) {
    await db('users').where({ id: user.id }).update({
      nickname: nickname || user.nickname,
      avatar: avatar || user.avatar,
    });
    user = await db('users').where({ id: user.id }).first();
  }

  const token = sign({ id: user.id, openid: user.openid });
  res.json({ token, user });
});

// 我的信息
router.get('/me', requireUser, async (req, res) => {
  const user = await db('users').where({ id: req.user.id }).first();
  res.json(user);
});

// 我的评论
router.get('/me/reviews', requireUser, async (req, res) => {
  const list = await db('reviews as r')
    .leftJoin('courts as c', 'r.court_id', 'c.id')
    .where('r.user_id', req.user.id)
    .orderBy('r.created_at', 'desc')
    .select('r.*', 'c.name as court_name');
  list.forEach((r) => {
    try { r.images = r.images ? JSON.parse(r.images) : []; } catch (_) { r.images = []; }
  });
  res.json({ list });
});

module.exports = router;
