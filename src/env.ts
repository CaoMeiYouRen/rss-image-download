import dotenv from 'dotenv'

dotenv.config()

export const __PROD__ = process.env.NODE_ENV === 'production'
export const __DEV__ = process.env.NODE_ENV === 'development'

export const BDUSS = process.env.BDUSS || ''
export const STOKEN = process.env.STOKEN || ''
export const REMOTE_BACKUP_PATH = process.env.REMOTE_BACKUP_PATH || '/apps/rss-image-download'
export const DOWNLOAD_CONCURRENCY = Number(process.env.DOWNLOAD_CONCURRENCY) || 5
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 */1 * * * *' // 默认每小时
export const ARCHIVE_CRON = process.env.ARCHIVE_CRON || '0 0 4 * * *' // 每日凌晨4点打包备份
