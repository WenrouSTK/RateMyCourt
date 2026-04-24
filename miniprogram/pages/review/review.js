const { request, BASE_URL } = require('../../utils/request');
const { REVIEW_TAGS } = require('../../utils/constants');
const app = getApp();

Page({
  data: {
    court_id: 0,
    court_name: '',
    rating_overall: 0,
    dims: [
      { key: 'rating_quality', name: '场地质量', val: 0 },
      { key: 'rating_traffic', name: '交通', val: 0 },
      { key: 'rating_facility', name: '灯光卫生间', val: 0 },
      { key: 'rating_price', name: '性价比', val: 0 },
    ],
    content: '',
    images: [],
    presetTags: REVIEW_TAGS,
    selectedTags: [],
    is_real_shot: true,
    submitting: false,
  },
  onLoad(options) {
    this.setData({
      court_id: Number(options.court_id),
      court_name: decodeURIComponent(options.court_name || ''),
    });
  },
  onStarTap(e) {
    const { field, n } = e.currentTarget.dataset;
    if (field === 'overall') this.setData({ rating_overall: Number(n) });
    else {
      const dims = this.data.dims.map((d) => d.key === field ? { ...d, val: Number(n) } : d);
      this.setData({ dims });
    }
  },
  onContent(e) { this.setData({ content: e.detail.value }); },
  toggleTag(e) {
    const t = e.currentTarget.dataset.tag;
    const selected = this.data.selectedTags.includes(t)
      ? this.data.selectedTags.filter((x) => x !== t)
      : [...this.data.selectedTags, t];
    this.setData({ selectedTags: selected.slice(0, 10) });
  },
  toggleRealShot(e) { this.setData({ is_real_shot: e.detail.value }); },

  chooseImage() {
    const left = 3 - this.data.images.length;
    if (left <= 0) return wx.showToast({ title: '最多 3 张', icon: 'none' });
    wx.chooseMedia({
      count: left, mediaType: ['image'], sizeType: ['compressed'],
      success: (res) => {
        const paths = res.tempFiles.map((f) => f.tempFilePath);
        this.setData({ images: [...this.data.images, ...paths] });
      },
    });
  },
  removeImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const images = [...this.data.images];
    images.splice(idx, 1);
    this.setData({ images });
  },
  async uploadOne(filePath) {
    const token = wx.getStorageSync('token');
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: BASE_URL + '/api/upload',
        filePath, name: 'file',
        header: { Authorization: 'Bearer ' + token },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.url) resolve(BASE_URL + data.url);
            else reject(new Error(data.error || '上传失败'));
          } catch (e) { reject(e); }
        },
        fail: reject,
      });
    });
  },
  async submit() {
    if (this.data.submitting) return;
    if (!this.data.rating_overall) return wx.showToast({ title: '请打总评分', icon: 'none' });
    if (!this.data.content || this.data.content.length < 5) return wx.showToast({ title: '内容至少 5 字', icon: 'none' });

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });
    try {
      await app.ensureLogin();
      const urls = [];
      for (const p of this.data.images) urls.push(await this.uploadOne(p));
      const body = {
        court_id: this.data.court_id,
        rating_overall: this.data.rating_overall,
        content: this.data.content,
        images: urls,
        tags: this.data.selectedTags,
        is_real_shot: this.data.is_real_shot ? 1 : 0,
      };
      this.data.dims.forEach((d) => body[d.key] = d.val || this.data.rating_overall);
      await request('/api/reviews', { method: 'POST', data: body });
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
