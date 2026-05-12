const { EXPIRING_SOON_DAYS } = require('./constants')

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return 'noExpiry'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= EXPIRING_SOON_DAYS) return 'expiringSoon'
  return 'safe'
}

function getExpiryStatusColor(status) {
  switch (status) {
    case 'expired': return '#F44336'
    case 'expiringSoon': return '#FF9800'
    case 'safe': return '#4CAF50'
    default: return '#999999'
  }
}

function getExpiryDisplayText(status, dateStr) {
  if (status === 'noExpiry' || !dateStr) return ''
  const prefix = status === 'expired' ? '已过期' : status === 'expiringSoon' ? '即将过期' : ''
  return `${prefix} ${dateStr}`
}

module.exports = {
  getExpiryStatus,
  getExpiryStatusColor,
  getExpiryDisplayText,
}
