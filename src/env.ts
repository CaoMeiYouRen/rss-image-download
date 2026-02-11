import dotenv from 'dotenv'

dotenv.config()

export const __PROD__ = process.env.NODE_ENV === 'production'
export const __DEV__ = process.env.NODE_ENV === 'development'

export const BDUSS = process.env.BDUSS || ''
export const STOKEN = process.env.STOKEN || ''
export const REMOTE_BACKUP_PATH = process.env.REMOTE_BACKUP_PATH || '/apps/rss-image-download'
export const DOWNLOAD_CONCURRENCY = Number(process.env.DOWNLOAD_CONCURRENCY) || 5
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE || ''
export const ARCHIVE_CRON = process.env.ARCHIVE_CRON || ''

export const PUSH_URL = process.env.PUSH_URL || '' // push-all-in-cloud 的部署地址
export const PUSH_KEY = process.env.PUSH_KEY || '' // push-all-in-cloud 的 authToken
export const PUSH_TYPE = process.env.PUSH_TYPE || '' // 推送渠道类型，如 'Dingtalk', 'WechatApp'
export const PUSH_CONFIG = process.env.PUSH_CONFIG || '{}' // 推送渠道的完整配置 (JSON 字符串)

export const DB_PATH = process.env.DB_PATH || 'data/data.db' // 数据库存储路径
