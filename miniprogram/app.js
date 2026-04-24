// 全局 app 入口
const { request } = require('./utils/request');

App({
  globalData: {
    userInfo: null,
  },
  onLaunch() {
    // 尝试恢复登录态
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token && user) {
      this.globalData.userInfo = user;
    }
  },
  // 静默登录：给需要登录态的操作调用
  async ensureLogin() {
    if (this.globalData.userInfo) return this.globalData.userInfo;
    // 开发阶段：mock 登录
    const mockCode = 'mock_' + (wx.getStorageSync('mock_uid') || Date.now());
    wx.setStorageSync('mock_uid', mockCode.slice(5));
    const res = await request('/api/user/login', {
      method: 'POST',
      data: { code: mockCode, nickname: '球友' + String(Math.floor(Math.random() * 9000 + 1000)) },
    });
    wx.setStorageSync('token', res.token);
    wx.setStorageSync('user', res.user);
    this.globalData.userInfo = res.user;
    return res.user;
  },
});
