Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
    showDelete: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    translateX: 0,
    startX: 0,
    moving: false,
    showDeleteBtn: false,
  },

  methods: {
    onTouchStart(e) {
      this.setData({
        startX: e.touches[0].clientX,
        moving: true,
      })
    },

    onTouchMove(e) {
      if (!this.data.moving || !this.properties.showDelete) return
      const dx = e.touches[0].clientX - this.data.startX
      // Only allow left swipe
      const translateX = Math.min(0, Math.max(-160, dx))
      this.setData({ translateX })
    },

    onTouchEnd() {
      const { translateX } = this.data
      if (translateX < -60) {
        this.setData({ translateX: -160, showDeleteBtn: true })
      } else {
        this.setData({ translateX: 0, showDeleteBtn: false })
      }
      this.setData({ moving: false })
    },

    onTap() {
      this.triggerEvent('itemtap', { id: this.properties.item.id })
    },

    onDelete() {
      this.triggerEvent('itemdelete', { id: this.properties.item.id })
      this.setData({ translateX: 0, showDeleteBtn: false })
    },

    resetSwipe() {
      this.setData({ translateX: 0, showDeleteBtn: false })
    },
  },
})
