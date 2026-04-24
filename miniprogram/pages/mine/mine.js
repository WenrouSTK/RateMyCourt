const { request } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    user: null,
    myReviews: [],
  },
  async onShow() {
    const user = app.globalData.userInfo || wx.getStorageSync('user');
    this.setData({ user });
    if (user) this.loadMyReviews();
  },
  async login() {
    try {
      const u = await app.ensureLogin();
      this.setData({ user: u });
      this.loadMyReviews();
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  async loadMyReviews() {
    try {
      const res = await request('/api/user/me/reviews');
      this.setData({ myReviews: res.list });
    } catch (e) {
      // 未登录或 token 过期就忽略
    }
  },
  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('user');
    app.globalData.userInfo = null;
    this.setData({ user: null, myReviews: [] });
  },
  goCourt(e) {
    wx.navigateTo({ url: '/pages/court/court?id=' + e.currentTarget.dataset.id });
  },
});
