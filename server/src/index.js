// 标点后端入口
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const courtsRouter = require('./routes/courts');
const reviewsRouter = require('./routes/reviews');
const userRouter = require('./routes/user');
const uploadRouter = require('./routes/upload');
const correctionsRouter = require('./routes/corrections');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件：上传图片 + 管理后台
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
app.use('/admin', express.static(path.resolve(__dirname, '..', 'public', 'admin')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: '标点', time: new Date().toISOString() });
});

// API 路由
app.use('/api/courts', courtsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/user', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/corrections', correctionsRouter);

// 错误兜底
app.use((err, req, res, next) => {
  console.error('❌', err);
  res.status(err.status || 500).json({ error: err.message || '服务器错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎾 标点后端启动: http://localhost:${PORT}`);
  console.log(`   管理后台:     http://localhost:${PORT}/admin/`);
  console.log(`   健康检查:     http://localhost:${PORT}/api/health`);
});
