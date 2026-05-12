const { getAllCategories, addCategory, updateCategory, deleteCategory, countItemsByCategory } = require('../../utils/storage')

Page({
  data: {
    categories: [],
    showDialog: false,
    dialogMode: 'add', // 'add' or 'edit'
    editingId: null,
    dialogName: '',
  },

  onShow() {
    this.refreshCategories()
  },

  refreshCategories() {
    const categories = getAllCategories().map(c => ({
      ...c,
      itemCount: countItemsByCategory(c.id),
    }))
    this.setData({ categories })
  },

  onAddCategory() {
    this.setData({
      showDialog: true,
      dialogMode: 'add',
      editingId: null,
      dialogName: '',
    })
  },

  onEditCategory(e) {
    const id = e.currentTarget.dataset.id
    const cat = this.data.categories.find(c => c.id === id)
    if (!cat || cat.isPreset) return
    this.setData({
      showDialog: true,
      dialogMode: 'edit',
      editingId: id,
      dialogName: cat.name,
    })
  },

  onDeleteCategory(e) {
    const id = e.currentTarget.dataset.id
    const cat = this.data.categories.find(c => c.id === id)
    if (!cat || cat.isPreset) return
    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类"${cat.name}"吗？`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          const result = deleteCategory(id)
          if (result.error) {
            wx.showToast({ title: result.error, icon: 'none' })
          } else {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.refreshCategories()
          }
        }
      },
    })
  },

  onDialogInput(e) {
    this.setData({ dialogName: e.detail.value })
  },

  onDialogConfirm() {
    const { dialogMode, editingId, dialogName } = this.data
    if (!dialogName.trim()) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }
    let result
    if (dialogMode === 'add') {
      result = addCategory(dialogName.trim())
    } else {
      result = updateCategory(editingId, dialogName.trim())
    }
    if (result.error) {
      wx.showToast({ title: result.error, icon: 'none' })
    } else {
      this.setData({ showDialog: false })
      this.refreshCategories()
    }
  },

  onDialogCancel() {
    this.setData({ showDialog: false })
  },
})
