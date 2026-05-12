const PAGE_SIZE = 20
const EXPIRING_SOON_DAYS = 7

const PRESET_CATEGORIES = [
  { name: '食品', isPreset: 1, sortOrder: 1 },
  { name: '药品', isPreset: 1, sortOrder: 2 },
  { name: '日用品', isPreset: 1, sortOrder: 3 },
  { name: '电子产品', isPreset: 1, sortOrder: 4 },
  { name: '其他', isPreset: 1, sortOrder: 5 },
]

module.exports = {
  PAGE_SIZE,
  EXPIRING_SOON_DAYS,
  PRESET_CATEGORIES,
}
