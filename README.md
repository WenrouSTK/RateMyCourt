# 🎾 深网地图 · Shenzhen Tennis Map

> 最懂深圳球友的场地百科全书。真实点评、硬核标签、避雷指南。

基于 Apple HIG 深色风格设计的微信小程序，帮深圳网球爱好者找到靠谱的球场。

## ✨ 特性

- 📍 **距离优先** — 按离你最近排序，定位懒加载
- 🎯 **4 维评分** — 场地质量 / 交通 / 灯光卫生间 / 性价比
- 🏷️ **硬核标签** — 场地类型、露天/风雨/空调、🅿️🚇🚿🎾
- 💰 **价格阶梯** — 工作日白场/晚场/周末分开
- 🚗 **老司机指引** — 停车攻略、地铁步行指引
- 📸 **球友实拍** — 真实场景 vs 官方宣传分开展示
- ⚠️ **一键纠错** — 电话变了、涨价了，球友共同维护
- 🌙 **深色模式** — 锁定深色，Apple HIG 风格

## 🧱 技术栈

### 后端
- **Node.js** + Express
- **Knex** 查询构造器（开发用 sqlite3，生产切 MySQL 只改 .env）
- **JWT** 鉴权
- **Multer** 本地上传（生产切腾讯云 COS）

### 前端
- **微信小程序原生**（WXML/WXSS/JS）
- 自绘悬浮胶囊 Tab Bar + 自定义导航栏
- Apple HIG 深色主题

### 管理后台
- 单 HTML 文件，零依赖
- 场馆录入 / 评论审核 / 纠错处理

## 📂 项目结构

```
biaodian/
├── server/                 # 后端
│   ├── src/
│   │   ├── index.js       # 入口
│   │   ├── db/            # 数据库 + 迁移
│   │   ├── routes/        # API 路由
│   │   └── middleware/    # 鉴权
│   ├── public/admin/      # 管理后台（HTML）
│   └── uploads/           # 本地图片
└── miniprogram/           # 小程序
    ├── pages/             # 页面
    ├── components/        # tabbar / nav-bar
    └── utils/             # request / 常量
```

## 🚀 本地运行

### 后端

```bash
cd server
cp .env.example .env   # 修改 ADMIN_TOKEN、JWT_SECRET
npm install
node src/db/init.js          # 初始化数据库
node src/db/migrate_v2.js    # V2 字段迁移 + 种子数据
npm run dev                  # 启动：http://localhost:3000
```

启动后：
- 健康检查：<http://localhost:3000/api/health>
- 管理后台：<http://localhost:3000/admin/>
- HIG 预览：<http://localhost:3000/admin/preview.html>

### 小程序

1. 装微信开发者工具 <https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html>
2. **导入项目** → 目录选 `miniprogram/` → AppID 选「测试号」
3. **详情 → 本地设置** → ✅ 勾选 "不校验合法域名"（因为本地是 http）
4. 编译即可

## 🗃️ 数据模型

4 张核心表：

| 表 | 说明 |
|---|---|
| `courts` | 球场：名称/坐标/规格 JSON/价格阶梯 JSON/攻略 |
| `users` | 用户：openid + JWT |
| `reviews` | 点评：4 维评分 + 标签 + 图片 |
| `corrections` | 纠错反馈：电话/价格/地址变更 |

**关键数据走 JSON 字段**（specs / price_tiers / env_tags / facility_tags / court_types / images），轻量可迭代。

## 🛣️ Roadmap

- [x] 后端 CRUD + 评论系统 + 纠错
- [x] 管理后台多选 chip + 动态行
- [x] Apple HIG 深色主题 + 悬浮胶囊 TabBar
- [x] 5 个种子球场
- [ ] 首页地图视图（腾讯位置服务）
- [ ] 录入剩 15 个深圳主流球馆
- [ ] 微信内容安全 msgSecCheck / imgSecCheck
- [ ] 收藏、举报、点赞
- [ ] ICP 备案 + HTTPS + 上线

## 📝 License

MIT
