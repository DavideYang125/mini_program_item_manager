const { getExpiredItems, getExpiringSoonItems, getExpiryBadgeCount, getCategoryMap } = require('../../utils/storage')
const { getExpiryStatus, getExpiryStatusColor, getExpiryDisplayText } = require('../../utils/expiry')

Page({
  data: {
    expiredItems: [],
    expiringSoonItems: [],
  },

  onShow() {
    this.refreshData()
    this.updateBadge()
  },

  onPullDownRefresh() {
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  refreshData() {
    const categoryMap = getCategoryMap()
    const enrich = (item) => ({
      ...item,
      categoryName: categoryMap[item.categoryId] ? categoryMap[item.categoryId].name : '未知',
      expiryStatus: getExpiryStatus(item.expiryDate),
      expiryStatusColor: getExpiryStatusColor(getExpiryStatus(item.expiryDate)),
      expiryDisplayText: getExpiryDisplayText(getExpiryStatus(item.expiryDate), item.expiryDate),
    })
    this.setData({
      expiredItems: getExpiredItems().map(enrich),
      expiringSoonItems: getExpiringSoonItems().map(enrich),
    })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/item-form/item-form?id=${id}` })
  },

  updateBadge() {
    const count = getExpiryBadgeCount()
    if (count > 0) {
      wx.setTabBarBadge({ index: 1, text: String(count) })
    } else {
      wx.removeTabBarBadge({ index: 1 })
    }
  },
})
