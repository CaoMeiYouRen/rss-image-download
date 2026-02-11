import path from 'node:path'
import os from 'node:os'
import fs from 'fs-extra'
import YAML from 'yaml'
import { usePowerShell } from 'zx'
import { CronJob } from 'cron'
import { Downloader } from './core/downloader'
import { parseRss } from './core/rss'
import { zipDirectory } from './utils/zip'
import { BaiduPCS } from './utils/baidu'
import { formatDate } from './utils/helper'
import {
    hasDownloaded,
    recordDownload,
    getUploadStatus,
    recordUpload,
} from './core/database'
import { sendPush } from './utils/push'
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

// Windows 环境下切换到 PowerShell
if (os.platform() === 'win32') {
    usePowerShell()
}

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

/**
 * 主任务：拉取并下载图片
 */
async function mainJob() {
    console.log(`[${new Date().toLocaleString()}] 开始执行 RSS 抓取任务...`)
    try {
        const config = await loadConfig()
        const downloader = new Downloader({
            outputDir: path.join(DATA_DIR, formatDate()),
            concurrency: DOWNLOAD_CONCURRENCY,
            clampedHashes: config.clampedHashes,
        })

        let downloadCount = 0
        for (const source of config.sources) {
            console.log(`正在解析: ${source.name} (${source.url})`)
            const items = await parseRss(source.url)
            for (const item of items) {
                for (const imgUrl of item.images) {
                    if (hasDownloaded(imgUrl)) {
                        continue
                    }
                    const savedPath = await downloader.download(imgUrl)
                    if (savedPath) {
                        recordDownload(imgUrl)
                        downloadCount++
                    }
                }
            }
        }
        console.log(`[${new Date().toLocaleString()}] RSS 抓取任务完成，共下载 ${downloadCount} 张图片。`)
        if (downloadCount > 0) {
            await sendPush('下载完成', `成功下载 ${downloadCount} 张图片。`)
        }
    } catch (error) {
        console.error('任务执行失败:', error)
        await sendPush('抓取任务失败', error.message)
    }
}

/**
 * 备份任务：打包并上传
 * @param targetDate 目标日期，默认为昨天
 */
async function archiveJob(targetDate?: Date) {
    console.log(`[${new Date().toLocaleString()}] 开始执行备份任务...`)
    try {
        const date = targetDate || new Date()
        if (!targetDate) {
            // 如果没传日期，默认备份昨天的目录
            date.setDate(date.getDate() - 1)
        }
        const dateStr = formatDate(date)
        const sourceDir = path.join(DATA_DIR, dateStr)

        if (!(await fs.pathExists(sourceDir))) {
            console.log(`目录不存在，跳过备份: ${sourceDir}`)
            return
        }

        const zipFilename = `data-${dateStr}.zip`
        const zipFile = path.join(DATA_DIR, zipFilename)

        // 检查是否已经上传过
        const status = getUploadStatus(zipFile)
        if (status === 'success') {
            console.log(`文件已在本地记录中标记为上传成功: ${zipFilename}`)
            return
        }

        // 尝试在网盘中搜索
        if (BDUSS && STOKEN) {
            await BaiduPCS.loginByBduss(BDUSS, STOKEN)
            // 搜索关键词长度限制（不大于 22 个字符，否则报 31023）
            const keyword = zipFilename.length > 22 ? zipFilename.slice(0, 22) : zipFilename
            console.log(`正在网盘中检索是否存在: ${zipFilename} (关键词: ${keyword})`)
            const searchResult = await BaiduPCS.search(keyword, REMOTE_BACKUP_PATH)
            if (searchResult.includes(zipFilename)) {
                console.log(`网盘中已存在该文件，跳过上传并更新本地记录: ${zipFilename}`)
                recordUpload(zipFile, REMOTE_BACKUP_PATH, 'success')
                return
            }
        }

        console.log(`正在打包: ${sourceDir} -> ${zipFile}`)
        await zipDirectory(sourceDir, zipFile)

        console.log('正在上传至百度网盘...')
        if (BDUSS && STOKEN) {
            let attempt = 0
            const maxRetry = 3
            let success = false

            while (attempt < maxRetry) {
                attempt++
                const res = await BaiduPCS.upload(zipFile, REMOTE_BACKUP_PATH)
                if (res.exitCode === 0) {
                    console.log(`上传成功 (第 ${attempt} 次尝试)`)
                    recordUpload(zipFile, REMOTE_BACKUP_PATH, 'success')
                    await fs.remove(zipFile)
                    await sendPush('备份成功', `日期: ${dateStr}\n文件名: ${zipFilename}`)
                    success = true
                    break
                } else {
                    console.error(`上传失败 (第 ${attempt}/${maxRetry} 次尝试), 错误码: ${res.exitCode}`)
                    if (attempt < maxRetry) {
                        await new Promise((resolve) => setTimeout(resolve, 5000))
                    }
                }
            }

            if (!success) {
                await sendPush('备份失败', `日期: ${dateStr}\n文件名: ${zipFilename}\n已达到最大重试次数`)
            }
        } else {
            console.warn('缺少百度网盘配置 (BDUSS/STOKEN)，跳过上传。')
        }
    } catch (error) {
        console.error('备份任务失败:', error)
        await sendPush('备份任务异常', error.message)
    }
}

/**
 * 启动程序
 */
async function bootstrap() {
    console.log('自动化图片下载服务已启动')

    let isManual = false

    // 如果设置了抓取 Cron，则注册定时任务
    if (CRON_SCHEDULE) {
        console.log(`发现抓取 Cron 计划: ${CRON_SCHEDULE}`)
        new CronJob(CRON_SCHEDULE, mainJob, null, true)
    } else {
        console.log('未发现抓取 Cron 计划，将立即执行一次。')
        await mainJob()
        isManual = true
    }

    // 如果设置了备份 Cron
    if (ARCHIVE_CRON) {
        console.log(`发现备份 Cron 计划: ${ARCHIVE_CRON}`)
        new CronJob(ARCHIVE_CRON, () => archiveJob(), null, true)
    } else if (isManual) {
        // 如果是手动模式且没有备份 Cron，立即备份今天下载的内容
        console.log('执行一次性备份任务 (备份今日数据)...')
        await archiveJob(new Date())
    }
}

bootstrap().catch((err) => {
    console.error('程序启动失败:', err)
})

