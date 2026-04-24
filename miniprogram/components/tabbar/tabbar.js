Component({
  properties: {
    active: { type: String, value: 'home' }, // home | mine
  },
  data: {
    tabs: [
      { key: 'home', label: '球场', icon: '🎾', url: '/pages/index/index' },
      { key: 'mine', label: '我的', icon: '👤', url: '/pages/mine/mine' },
    ],
  },
  methods: {
    onTap(e) {
      const t = e.currentTarget.dataset.tab;
      if (t.key === this.data.active) return;
      wx.reLaunch({ url: t.url });
    },
  },
});
