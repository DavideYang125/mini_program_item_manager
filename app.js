const { initDefaultCategories } = require('./utils/storage')

App({
  onLaunch() {
    initDefaultCategories()
  }
})
