// 公共常量：图标映射
const COURT_TYPE_MAP = {
  hard: { icon: '🎾', label: '硬地', color: '#0d6efd' },
  clay: { icon: '🟫', label: '红土', color: '#d2691e' },
  grass: { icon: '🌱', label: '草地', color: '#28a745' },
  indoor_practice: { icon: '🏠', label: '室内练习', color: '#6f42c1' },
};

const ENV_TAG_MAP = {
  '露天': '☀️',
  '风雨': '☂️',
  '空调': '❄️',
};

const FACILITY_MAP = {
  parking:   { icon: '🅿️', label: '停车' },
  metro:     { icon: '🚇', label: '地铁' },
  shower:    { icon: '🚿', label: '洗澡' },
  stringing: { icon: '🎾', label: '穿线' },
};

// 预设评价标签
const REVIEW_TAGS = [
  '灯光够亮', '弹性适中', '地面平整', '设施新', '服务好',
  '有饮水机', '有更衣室', '好停车', '地铁方便', '性价比高',
  '地面磨损', '灯光昏暗', '蚊子多', '遮阳伞坏了', '价格偏贵',
];

module.exports = { COURT_TYPE_MAP, ENV_TAG_MAP, FACILITY_MAP, REVIEW_TAGS };
