const { request } = require('../../utils/request');
const { COURT_TYPE_MAP, ENV_TAG_MAP, FACILITY_MAP } = require('../../utils/constants');

Page({
  data: {
    list: [],
    keyword: '',
    district: '',
    districts: ['全部', '福田', '南山', '罗湖', '宝安', '龙岗', '龙华', '坪山', '盐田', '光明', '大鹏'],
    districtIndex: 0,
    sort: 'rating', // distance | rating | new
    loading: false,
    userLocation: null, // { lat, lng }
    locationDenied: false,
    typeMap: COURT_TYPE_MAP,
    envMap: ENV_TAG_MAP,
    facilityMap: FACILITY_MAP,
  },
  onShow() { this.loadList(); },
  onPullDownRefresh() {
    this.loadList().finally(() => wx.stopPullDownRefresh());
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const q = [];
      if (this.data.district && this.data.district !== '全部') q.push('district=' + encodeURIComponent(this.data.district));
      if (this.data.keyword) q.push('q=' + encodeURIComponent(this.data.keyword));
      q.push('sort=' + this.data.sort);
      if (this.data.userLocation) {
        q.push('lat=' + this.data.userLocation.lat);
        q.push('lng=' + this.data.userLocation.lng);
      }
      const res = await request('/api/courts?' + q.join('&'));
      // 给每条数据构造展示用字段
      const list = res.list.map((c) => ({
        ...c,
        type_items: (c.court_types || []).map((t) => COURT_TYPE_MAP[t]).filter(Boolean),
        env_icons: (c.env_tags || []).map((t) => ENV_TAG_MAP[t]).filter(Boolean).join(' '),
        facility_items: (c.facility_tags || []).map((t) => FACILITY_MAP[t]).filter(Boolean),
        cover: c.cover_image_real || (c.images && c.images[0] && c.images[0].url) || '',
        distance_text: c.distance_km == null
          ? ''
          : (c.distance_km < 1 ? `${Math.round(c.distance_km * 1000)}m` : `${c.distance_km}km`),
      }));
      this.setData({ list });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onKeyword(e) { this.setData({ keyword: e.detail.value }); },
  onSearch() { this.loadList(); },
  onDistrictChange(e) {
    const idx = Number(e.detail.value);
    this.setData({ districtIndex: idx, district: this.data.districts[idx] });
    this.loadList();
  },

  async onSortTap(e) {
    const sort = e.currentTarget.dataset.sort;
    if (sort === 'distance' && !this.data.userLocation) {
      // 懒加载定位
      try {
        const loc = await this.getLocation();
        this.setData({ userLocation: loc, locationDenied: false, sort });
      } catch (err) {
        this.setData({ locationDenied: true });
        wx.showModal({
          title: '需要位置权限',
          content: '按距离排序需要获取你的位置，请在设置中允许。',
          confirmText: '去设置',
          success: (r) => {
            if (r.confirm) wx.openSetting();
          },
        });
        return;
      }
    } else {
      this.setData({ sort });
    }
    this.loadList();
  },

  getLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => resolve({ lat: res.latitude, lng: res.longitude }),
        fail: reject,
      });
    });
  },

  goCourt(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/court/court?id=' + id });
  },
});
