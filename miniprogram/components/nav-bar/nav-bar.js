Component({
  properties: {
    // 大标题
    title: { type: String, value: '' },
    // 副标题
    subtitle: { type: String, value: '' },
    // 模式：'large'(大标题) | 'normal'(普通)
    mode: { type: String, value: 'large' },
    // 是否显示返回按钮
    showBack: { type: Boolean, value: false },
  },
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
  },
  lifetimes: {
    attached() {
      const sys = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const menu = wx.getMenuButtonBoundingClientRect && wx.getMenuButtonBoundingClientRect();
      const statusBarHeight = sys.statusBarHeight || 20;
      // 胶囊按钮高度通常 32px，上下留白到导航栏高度
      const navBarHeight = menu ? (menu.top - statusBarHeight) * 2 + menu.height : 44;
      this.setData({ statusBarHeight, navBarHeight });
    },
  },
  methods: {
    goBack() { wx.navigateBack(); },
  },
});
