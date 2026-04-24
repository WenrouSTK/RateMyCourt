// 统一的网络请求封装
const BASE_URL = 'http://localhost:3000'; // 开发环境；真机/上线换成 HTTPS 域名

function request(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: BASE_URL + path,
      method: opts.method || 'GET',
      data: opts.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(opts.header || {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error((res.data && res.data.error) || '请求失败 ' + res.statusCode));
        }
      },
      fail: (err) => reject(err),
    });
  });
}

module.exports = { request, BASE_URL };
