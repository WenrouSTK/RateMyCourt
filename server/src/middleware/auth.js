// JWT 鉴权中间件 + 管理员校验
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'biaodian-dev-secret';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

// 用户登录态：必须
function requireUser(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'token 无效或过期' });
  }
}

// 用户登录态：可选（未登录也放行，用于列表页）
function optionalUser(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch (_) { /* 忽略 */ }
  }
  next();
}

// 管理员：用环境变量里的简单 token（开发阶段够用）
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  if (token && token === process.env.ADMIN_TOKEN) return next();
  res.status(403).json({ error: '需要管理员权限' });
}

module.exports = { sign, requireUser, optionalUser, requireAdmin };
