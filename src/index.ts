import path from 'node:path'
import fs from 'fs-extra'
import YAML from 'yaml'
import { CronJob } from 'cron'
import { Downloader } from './core/downloader'
import { parseRss } from './core/rss'
import { zipDirectory } from './utils/zip'
import { BaiduPCS } from './utils/baidu'
import { formatDate } from './utils/helper'
import {
    BDUSS,
    STOKEN,
    DOWNLOAD_CONCURRENCY,
    CRON_SCHEDULE,
    ARCHIVE_CRON,
    REMOTE_BACKUP_PATH,
} from './env'

const CONFIG_PATH = path.join(process.cwd(), 'rssConfig.yml')
const DATA_DIR = path.join(process.cwd(), 'public/data')
const HISTORY_PATH = path.join(process.cwd(), 'history.json')

interface Config {
    sources: { name: string, url: string }[]
    clampedHashes?: string[]
}

async function loadConfig(): Promise<Config> {
    if (!(await fs.pathExists(CONFIG_PATH))) {
        throw new Error(`配置文件不存在: ${CONFIG_PATH}`)
    }
    const file = await fs.readFile(CONFIG_PATH, 'utf8')
    return YAML.parse(file)
}

async function loadHistory(): Promise<Set<string>> {
    if (!(await fs.pathExists(HISTORY_PATH))) { return new Set() }
    const history = await fs.readJson(HISTORY_PATH)
    return new Set(history)
}

async function saveHistory(history: Set<string>) {
    await fs.writeJson(HISTORY_PATH, Array.from(history))
}

/**
 * 主任务：拉取并下载图片
 */
async function mainJob() {
    console.log(`[${new Date().toLocaleString()}] 开始执行 RSS 抓取任务...`)
    try {
        const config = await loadConfig()
        const history = await loadHistory()
        const downloader = new Downloader({
            outputDir: path.join(DATA_DIR, formatDate()),
            concurrency: DOWNLOAD_CONCURRENCY,
            clampedHashes: config.clampedHashes,
        })

        for (const source of config.sources) {
            console.log(`正在解析: ${source.name} (${source.url})`)
            const items = await parseRss(source.url)
            for (const item of items) {
                for (const imgUrl of item.images) {
                    if (history.has(imgUrl)) { continue }
                    const savedPath = await downloader.download(imgUrl)
                    if (savedPath) {
                        history.add(imgUrl)
                    }
                }
            }
        }
        await saveHistory(history)
        console.log(`[${new Date().toLocaleString()}] RSS 抓取任务完成。`)
    } catch (error) {
        console.error('任务执行失败:', error)
    }
}

/**
 * 备份任务：打包并上传
 */
async function archiveJob() {
    console.log(`[${new Date().toLocaleString()}] 开始执行备份任务...`)
    try {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = formatDate(yesterday)
        const sourceDir = path.join(DATA_DIR, dateStr)

        if (!(await fs.pathExists(sourceDir))) {
            console.log(`目录不存在，跳过备份: ${sourceDir}`)
            return
        }

        const zipFile = path.join(DATA_DIR, `${dateStr}.zip`)
        console.log(`正在打包: ${sourceDir} -> ${zipFile}`)
        await zipDirectory(sourceDir, zipFile)

        console.log('正在上传至百度网盘...')
        if (BDUSS && STOKEN) {
            await BaiduPCS.loginByBduss(BDUSS, STOKEN)
            await BaiduPCS.upload(zipFile, REMOTE_BACKUP_PATH)
            console.log('上传成功。')
            // 上传成功后可以选择删除本地 zip 和原始文件夹
            await fs.remove(zipFile)
            // await fs.remove(sourceDir) // 根据需要保留或删除
        } else {
            console.warn('缺少百度网盘配置 (BDUSS/STOKEN)，跳过上传。')
        }
    } catch (error) {
        console.error('备份任务失败:', error)
    }
}

// 启动定时任务
console.log('自动化图片下载服务已启动')
console.log(`抓取计划: ${CRON_SCHEDULE}`)
console.log(`备份计划: ${ARCHIVE_CRON}`)

new CronJob(CRON_SCHEDULE, mainJob, null, true)
new CronJob(ARCHIVE_CRON, archiveJob, null, true)

// 启动时立即运行一次抓取
mainJob()

export function hello() {
    console.log('你好，世界！')
}
