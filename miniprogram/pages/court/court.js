const { request } = require('../../utils/request');
const { COURT_TYPE_MAP, ENV_TAG_MAP, FACILITY_MAP } = require('../../utils/constants');

Page({
  data: {
    court: null,
    reviews: [],
    imageTab: 'all', // all | real | official
    imagesFiltered: [],
    dims: [
      { key: 'rating_quality', name: '场地质量' },
      { key: 'rating_traffic', name: '交通' },
      { key: 'rating_facility', name: '灯光卫生间' },
      { key: 'rating_price', name: '性价比' },
    ],
    // 纠错弹窗
    correctionVisible: false,
    correctionField: 'phone',
    correctionFields: [
      { key: 'phone', label: '电话变了' },
      { key: 'price', label: '价格涨/降了' },
      { key: 'hours', label: '营业时间变了' },
      { key: 'address', label: '地址有误' },
      { key: 'closed', label: '场馆已关闭' },
      { key: 'other', label: '其他' },
    ],
    correctionContent: '',
  },

  onLoad(options) {
    this.courtId = options.id;
    this.load();
  },
  onShow() { if (this.courtId) this.load(); },

  async load() {
    try {
      const court = await request('/api/courts/' + this.courtId);
      const res = await request('/api/reviews?court_id=' + this.courtId);

      // 补展示字段
      court.type_items = (court.court_types || []).map((t) => COURT_TYPE_MAP[t]).filter(Boolean);
      court.env_icons = (court.env_tags || []).map((t) => ENV_TAG_MAP[t]).filter(Boolean).join(' ');
      court.facility_items = (court.facility_tags || []).map((t) => FACILITY_MAP[t]).filter(Boolean);
      court.images = court.images || [];

      // 合并评论里的图片作为"球友实拍"
      const reviewShots = [];
      res.list.forEach((r) => {
        (r.images || []).forEach((url) => reviewShots.push({ url, category: 'real' }));
      });
      court.images = [...court.images, ...reviewShots];

      this.setData({ court, reviews: res.list });
      this.filterImages();
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },

  // 图集 tab 切换
  onImageTab(e) {
    this.setData({ imageTab: e.currentTarget.dataset.tab });
    this.filterImages();
  },
  filterImages() {
    const all = (this.data.court && this.data.court.images) || [];
    let list = all;
    if (this.data.imageTab === 'real') list = all.filter((i) => i.category === 'real');
    if (this.data.imageTab === 'official') list = all.filter((i) => i.category === 'official');
    this.setData({ imagesFiltered: list });
  },
  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({ urls, current });
  },

  goReview() {
    wx.navigateTo({ url: '/pages/review/review?court_id=' + this.courtId + '&court_name=' + encodeURIComponent(this.data.court.name) });
  },

  callPhone() {
    const phone = this.data.court && this.data.court.phone;
    if (phone) wx.makePhoneCall({ phoneNumber: phone });
  },

  // 一键导航（微信内置地图，会弹出高德/腾讯等选择器）
  openLocation() {
    const c = this.data.court;
    if (!c || !c.lat) return;
    wx.openLocation({
      latitude: Number(c.lat),
      longitude: Number(c.lng),
      name: c.name,
      address: c.address,
      scale: 16,
    });
  },

  // 纠错
  showCorrection() { this.setData({ correctionVisible: true, correctionContent: '' }); },
  hideCorrection() { this.setData({ correctionVisible: false }); },
  onCorrectionField(e) { this.setData({ correctionField: e.currentTarget.dataset.key }); },
  onCorrectionInput(e) { this.setData({ correctionContent: e.detail.value }); },
  async submitCorrection() {
    if (!this.data.correctionContent || this.data.correctionContent.length < 3) {
      return wx.showToast({ title: '说说哪里不对（至少 3 字）', icon: 'none' });
    }
    try {
      await request('/api/courts/' + this.courtId + '/correction', {
        method: 'POST',
        data: { field: this.data.correctionField, content: this.data.correctionContent },
      });
      wx.showToast({ title: '已提交，感谢反馈 🙏', icon: 'success' });
      this.setData({ correctionVisible: false });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
});
