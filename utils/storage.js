const { PAGE_SIZE, PRESET_CATEGORIES } = require('./constants')
const { generateId, formatDateTime } = require('./util')

const CATEGORIES_KEY = 'categories'
const ITEMS_KEY = 'items'

// ========== 通用读写 ==========

function _getCategories() {
  return wx.getStorageSync(CATEGORIES_KEY) || []
}

function _setCategories(categories) {
  wx.setStorageSync(CATEGORIES_KEY, categories)
}

function _getItems() {
  return wx.getStorageSync(ITEMS_KEY) || []
}

function _setItems(items) {
  wx.setStorageSync(ITEMS_KEY, items)
}

// ========== 分类 CRUD ==========

function initDefaultCategories() {
  const existing = _getCategories()
  if (existing.length > 0) return
  const categories = PRESET_CATEGORIES.map(preset => ({
    id: generateId(),
    name: preset.name,
    isPreset: preset.isPreset,
    sortOrder: preset.sortOrder,
  }))
  _setCategories(categories)
}

function getAllCategories() {
  return _getCategories().sort((a, b) => a.sortOrder - b.sortOrder)
}

function getCategoryMap() {
  const categories = _getCategories()
  const map = {}
  categories.forEach(c => { map[c.id] = c })
  return map
}

function addCategory(name) {
  const categories = _getCategories()
  if (categories.some(c => c.name === name)) {
    return { error: '分类名称已存在' }
  }
  const maxSort = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0)
  const newCategory = {
    id: generateId(),
    name,
    isPreset: 0,
    sortOrder: maxSort + 1,
  }
  categories.push(newCategory)
  _setCategories(categories)
  return { success: true, category: newCategory }
}

function updateCategory(id, newName) {
  const categories = _getCategories()
  const cat = categories.find(c => c.id === id)
  if (!cat) return { error: '分类不存在' }
  if (cat.isPreset) return { error: '预设分类不可修改' }
  if (categories.some(c => c.id !== id && c.name === newName)) {
    return { error: '分类名称已存在' }
  }
  cat.name = newName
  _setCategories(categories)
  return { success: true }
}

function deleteCategory(id) {
  const categories = _getCategories()
  const cat = categories.find(c => c.id === id)
  if (!cat) return { error: '分类不存在' }
  if (cat.isPreset) return { error: '预设分类不可删除' }
  const items = _getItems()
  if (items.some(item => item.categoryId === id)) {
    return { error: '该分类下有物品，无法删除' }
  }
  _setCategories(categories.filter(c => c.id !== id))
  return { success: true }
}

function countItemsByCategory(categoryId) {
  return _getItems().filter(item => item.categoryId === categoryId).length
}

// ========== 物品 CRUD ==========

function getAllItems() {
  return _getItems().sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })
}

function getItemsPaged({ page = 0, limit = PAGE_SIZE, searchQuery = '' }) {
  let items = getAllItems()
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    )
  }
  const start = page * limit
  const pagedItems = items.slice(start, start + limit)
  return {
    items: pagedItems,
    hasMore: start + limit < items.length,
    total: items.length,
  }
}

function getItemById(id) {
  return _getItems().find(item => item.id === id) || null
}

function insertItem(itemData) {
  const items = _getItems()
  const now = formatDateTime(new Date())
  const newItem = {
    id: generateId(),
    name: itemData.name,
    categoryId: itemData.categoryId,
    location: itemData.location || '',
    expiryDate: itemData.expiryDate || '',
    quantity: itemData.quantity || 1,
    unit: itemData.unit || '',
    notes: itemData.notes || '',
    createdAt: now,
    updatedAt: now,
  }
  items.push(newItem)
  _setItems(items)
  return newItem
}

function updateItem(id, itemData) {
  const items = _getItems()
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return null
  const now = formatDateTime(new Date())
  items[index] = {
    ...items[index],
    name: itemData.name !== undefined ? itemData.name : items[index].name,
    categoryId: itemData.categoryId !== undefined ? itemData.categoryId : items[index].categoryId,
    location: itemData.location !== undefined ? itemData.location : items[index].location,
    expiryDate: itemData.expiryDate !== undefined ? itemData.expiryDate : items[index].expiryDate,
    quantity: itemData.quantity !== undefined ? itemData.quantity : items[index].quantity,
    unit: itemData.unit !== undefined ? itemData.unit : items[index].unit,
    notes: itemData.notes !== undefined ? itemData.notes : items[index].notes,
    updatedAt: now,
  }
  _setItems(items)
  return items[index]
}

function deleteItem(id) {
  const items = _getItems()
  _setItems(items.filter(item => item.id !== id))
}

// ========== 过期查询 ==========

function getExpiredItems() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return _getItems()
    .filter(item => {
      if (!item.expiryDate) return false
      const exp = new Date(item.expiryDate)
      exp.setHours(0, 0, 0, 0)
      return exp < today
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
}

function getExpiringSoonItems() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const soonDate = new Date(today)
  soonDate.setDate(soonDate.getDate() + 7)
  return _getItems()
    .filter(item => {
      if (!item.expiryDate) return false
      const exp = new Date(item.expiryDate)
      exp.setHours(0, 0, 0, 0)
      return exp >= today && exp <= soonDate
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
}

function getExpiryBadgeCount() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const soonDate = new Date(today)
  soonDate.setDate(soonDate.getDate() + 7)
  return _getItems().filter(item => {
    if (!item.expiryDate) return false
    const exp = new Date(item.expiryDate)
    exp.setHours(0, 0, 0, 0)
    return exp <= soonDate
  }).length
}

// ========== 导入/导出 ==========

function getExportData() {
  const categories = _getCategories()
  const items = _getItems()
  const categoryMap = getCategoryMap()
  return {
    app: 'item_manager',
    version: 1,
    exported_at: formatDateTime(new Date()),
    categories: categories.map(c => ({
      name: c.name,
      is_preset: c.isPreset,
    })),
    items: items.map(item => ({
      name: item.name,
      category_name: categoryMap[item.categoryId] ? categoryMap[item.categoryId].name : '其他',
      location: item.location,
      expiry_date: item.expiryDate,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
    })),
  }
}

function importData(jsonString, replace) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch (e) {
    return { error: 'JSON 格式错误' }
  }
  if (!data || typeof data !== 'object' || data.app !== 'item_manager') {
    return { error: '不是有效的物品管理数据' }
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { error: '数据中没有物品' }
  }
  // 校验每个 item 必须有 name
  for (let i = 0; i < data.items.length; i++) {
    if (!data.items[i].name) {
      return { error: `第${i + 1}条物品缺少名称` }
    }
  }

  let categories
  let items

  if (replace) {
    // 覆盖模式：用导入的数据重建分类和物品
    categories = []
    let sortIdx = 0
    if (data.categories) {
      data.categories.forEach(c => {
        sortIdx++
        categories.push({
          id: generateId(),
          name: c.name,
          isPreset: c.is_preset || 0,
          sortOrder: sortIdx,
        })
      })
    }
    _setCategories(categories)
    items = []
  } else {
    // 追加模式：合并分类，追加物品
    categories = _getCategories()
    const existingNames = new Set(categories.map(c => c.name))
    let maxSort = categories.reduce((max, c) => Math.max(max, c.sortOrder), 0)
    if (data.categories) {
      data.categories.forEach(c => {
        if (!existingNames.has(c.name)) {
          maxSort++
          categories.push({
            id: generateId(),
            name: c.name,
            isPreset: c.is_preset || 0,
            sortOrder: maxSort,
          })
          existingNames.add(c.name)
        }
      })
    }
    _setCategories(categories)
    items = _getItems()
  }

  // 导入物品
  const categoryMap = {}
  categories.forEach(c => { categoryMap[c.name] = c.id })
  const now = formatDateTime(new Date())
  let importCount = 0
  if (data.items) {
    data.items.forEach(itemData => {
      const categoryId = categoryMap[itemData.category_name] || categoryMap['其他']
      if (!categoryId) return
      items.push({
        id: generateId(),
        name: itemData.name,
        categoryId,
        location: itemData.location || '',
        expiryDate: itemData.expiry_date || '',
        quantity: itemData.quantity || 1,
        unit: itemData.unit || '',
        notes: itemData.notes || '',
        createdAt: now,
        updatedAt: now,
      })
      importCount++
    })
  }
  _setItems(items)
  return { success: true, count: importCount }
}

module.exports = {
  initDefaultCategories,
  getAllCategories,
  getCategoryMap,
  addCategory,
  updateCategory,
  deleteCategory,
  countItemsByCategory,
  getAllItems,
  getItemsPaged,
  getItemById,
  insertItem,
  updateItem,
  deleteItem,
  getExpiredItems,
  getExpiringSoonItems,
  getExpiryBadgeCount,
  getExportData,
  importData,
}
