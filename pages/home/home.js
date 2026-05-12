const { getItemsPaged, getExpiryBadgeCount, deleteItem, getExportData, importData } = require('../../utils/storage')
const { getCategoryMap } = require('../../utils/storage')
const { getExpiryStatus, getExpiryStatusColor, getExpiryDisplayText } = require('../../utils/expiry')
const { PAGE_SIZE } = require('../../utils/constants')

Page({
  data: {
    items: [],
    searchQuery: '',
    page: 0,
    hasMore: true,
    loading: false,
  },

  onShow() {
    this.refreshList()
    this.updateBadge()
  },

  onPullDownRefresh() {
    this.refreshList()
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    this.loadMore()
  },

  refreshList() {
    const { searchQuery } = this.data
    const result = getItemsPaged({ page: 0, searchQuery })
    const categoryMap = getCategoryMap()
    const items = result.items.map(item => this._enrichItem(item, categoryMap))
    this.setData({ items, page: 0, hasMore: result.hasMore, loading: false })
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ loading: true })
    const { searchQuery, page } = this.data
    const result = getItemsPaged({ page: page + 1, searchQuery })
    const categoryMap = getCategoryMap()
    const newItems = result.items.map(item => this._enrichItem(item, categoryMap))
    this.setData({
      items: [...this.data.items, ...newItems],
      page: page + 1,
      hasMore: result.hasMore,
      loading: false,
    })
  },

  _enrichItem(item, categoryMap) {
    const category = categoryMap[item.categoryId]
    return {
      ...item,
      categoryName: category ? category.name : '未知',
      expiryStatus: getExpiryStatus(item.expiryDate),
      expiryStatusColor: getExpiryStatusColor(getExpiryStatus(item.expiryDate)),
      expiryDisplayText: getExpiryDisplayText(getExpiryStatus(item.expiryDate), item.expiryDate),
    }
  },

  onSearchInput(e) {
    const searchQuery = e.detail.value
    this.setData({ searchQuery })
    this.refreshList()
  },

  onClearSearch() {
    this.setData({ searchQuery: '' })
    this.refreshList()
  },

  onAddItem() {
    wx.navigateTo({ url: '/pages/item-form/item-form' })
  },

  onItemTap(e) {
    const id = e.detail.id
    wx.navigateTo({ url: `/pages/item-form/item-form?id=${id}` })
  },

  onItemDelete(e) {
    const id = e.detail.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个物品吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          deleteItem(id)
          this.refreshList()
          this.updateBadge()
        }
      },
    })
  },

  onImportExport() {
    wx.showActionSheet({
      itemList: ['导出数据（发到聊天）', '导出数据（复制到剪贴板）', '从剪贴板导入', '从聊天文件导入'],
      success: (res) => {
        if (res.tapIndex === 0) this.handleExportShare()
        else if (res.tapIndex === 1) this.handleExportClipboard()
        else if (res.tapIndex === 2) this.handleImportClipboard()
        else if (res.tapIndex === 3) this.handleImportFile()
      },
    })
  },

  handleExportShare() {
    const data = getExportData()
    const jsonStr = JSON.stringify(data, null, 2)
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/item_manager_export.json`
    fs.writeFileSync(filePath, jsonStr, 'utf8')
    wx.shareFileMessage({
      filePath,
      fileName: `物品管理_${new Date().toISOString().slice(0, 10)}.json`,
      success: () => wx.showToast({ title: '导出成功', icon: 'success' }),
      fail: () => wx.showToast({ title: '导出取消', icon: 'none' }),
    })
  },

  handleExportClipboard() {
    const data = getExportData()
    const jsonStr = JSON.stringify(data, null, 2)
    wx.setClipboardData({
      data: jsonStr,
      success: () => wx.showToast({ title: '已复制到剪贴板', icon: 'success' }),
    })
  },

  _doImport(jsonStr) {
    const result = importData(jsonStr, true)
    if (result.error) {
      wx.showToast({ title: result.error, icon: 'none' })
    } else {
      wx.showToast({ title: `导入成功，共${result.count}条`, icon: 'success' })
      this.refreshList()
      this.updateBadge()
    }
  },

  handleImportClipboard() {
    wx.getClipboardData({
      success: (res) => {
        this._doImport(res.data)
      },
    })
  },

  handleImportFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const fs = wx.getFileSystemManager()
        const content = fs.readFileSync(res.tempFiles[0].path, 'utf8')
        this._doImport(content)
      },
    })
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
