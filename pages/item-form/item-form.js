const { getItemById, insertItem, updateItem, deleteItem, getAllCategories } = require('../../utils/storage')

Page({
  data: {
    isEdit: false,
    itemId: null,
    name: '',
    categories: [],
    categoryIndex: 0,
    selectedCategoryId: null,
    location: '',
    expiryDate: '',
    quantity: 1,
    unit: '',
    notes: '',
  },

  onLoad(options) {
    const categories = getAllCategories()
    const data = { categories }

    if (options.id) {
      const item = getItemById(Number(options.id))
      if (item) {
        const catIndex = categories.findIndex(c => c.id === item.categoryId)
        Object.assign(data, {
          isEdit: true,
          itemId: item.id,
          name: item.name,
          categoryIndex: catIndex >= 0 ? catIndex : 0,
          selectedCategoryId: item.categoryId,
          location: item.location,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
        })
        wx.setNavigationBarTitle({ title: '编辑物品' })
      }
    } else {
      const otherIndex = categories.findIndex(c => c.name === '其他')
      if (otherIndex >= 0) {
        data.selectedCategoryId = categories[otherIndex].id
        data.categoryIndex = otherIndex
      } else {
        data.selectedCategoryId = categories.length > 0 ? categories[0].id : null
      }
    }

    this.setData(data)
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      categoryIndex: index,
      selectedCategoryId: this.data.categories[index].id,
    })
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onDateChange(e) {
    this.setData({ expiryDate: e.detail.value })
  },

  onClearDate() {
    this.setData({ expiryDate: '' })
  },

  onQuantityInput(e) {
    this.setData({ quantity: Number(e.detail.value) || 1 })
  },

  onUnitInput(e) {
    this.setData({ unit: e.detail.value })
  },

  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  onSave() {
    const { name, selectedCategoryId, location, expiryDate, quantity, unit, notes } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }
    if (!selectedCategoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    const itemData = {
      name: name.trim(),
      categoryId: selectedCategoryId,
      location,
      expiryDate,
      quantity: quantity || 1,
      unit,
      notes,
    }

    if (this.data.isEdit) {
      updateItem(this.data.itemId, itemData)
    } else {
      insertItem(itemData)
    }

    wx.navigateBack()
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个物品吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          deleteItem(this.data.itemId)
          wx.navigateBack()
        }
      },
    })
  },
})
