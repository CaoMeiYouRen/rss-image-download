import path from 'node:path'
import crypto from 'node:crypto'
import fs from 'fs-extra'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import PQueue from 'p-queue'
import { sleep } from '@/utils/helper'

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay })

const IMAGE_MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
    'image/avif': '.avif',
    'image/tiff': '.tiff',
}

export interface DownloadOptions {
    concurrency?: number
    outputDir: string
    clampedHashes?: string[] // 已知“被夹”图片的 MD5 列表
}

export class Downloader {
    private queue: PQueue
    private outputDir: string
    private clampedHashes: string[]

    constructor(options: DownloadOptions) {
        this.queue = new PQueue({ concurrency: options.concurrency || 5 })
        this.outputDir = options.outputDir
        this.clampedHashes = options.clampedHashes || []
        fs.ensureDirSync(this.outputDir)
    }

    /**
     * 从 Content-Type 响应头获取文件后缀名
     */
    private getExtensionFromMime(contentType: string): string | null {
        const mime = contentType.split(';')[0].trim().toLowerCase()
        return IMAGE_MIME_TO_EXT[mime] || null
    }

    /**
     * 获取文件后缀名
     * @param urlStr
     */
    private getExtension(urlStr: string): string {
        try {
            const url = new URL(urlStr)

            // 如果是代理链接，尝试提取原始链接并解析
            if (url.pathname.includes('http')) {
                const decodedPath = decodeURIComponent(url.pathname)
                const match = /(https?:\/\/[^\s]+)/.exec(decodedPath)
                if (match) {
                    return this.getExtension(match[1])
                }
            }

            // 1. 优先从查询参数中获取 (针对 Twitter/WeChat 等)
            const format = url.searchParams.get('format') || url.searchParams.get('wx_fmt')
            if (format) {
                return `.${format}`
            }

            // 2. 从路径中提取
            let ext = path.extname(url.pathname)
            if (ext) {
                // 去掉后缀中可能带有的参数 (虽然 URL.pathname 理论上不带参数，但兼容一些奇葩情况)
                ext = ext.split('?')[0].split('&')[0].split(':')[0]
                if (ext.length > 1 && ext.length < 10) {
                    return ext
                }
            }
        } catch {
            // ignore
        }
        return '.jpg'
    }

    /**
     * 下载图片
     * @param url 图片链接
     * @param filename 建议文件名（可选，默认使用 URL MD5）
     */
    async download(url: string, filename?: string): Promise<string | null> {
        return this.queue.add(async () => {
            try {
                // 随机延迟避免被封
                await sleep(Math.floor(Math.random() * 2000))

                const ext = this.getExtension(url)
                const name = filename || crypto.createHash('md5').update(url).digest('hex')
                const targetPath = path.join(this.outputDir, `${name}${ext}`)

                // 如果已存在则跳过
                if (await fs.pathExists(targetPath)) {
                    return targetPath
                }

                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                })

                // 检查 Content-Type，跳过非图片响应
                const contentType = String(response.headers['content-type'] || '')
                const mimeExt = this.getExtensionFromMime(contentType)
                if (!mimeExt) {
                    console.log(`跳过非图片响应 [${contentType || '未知'}]: ${url}`)
                    return null
                }

                // 如果 URL 无法解析出有效后缀，使用 Content-Type 确定的后缀
                const finalExt = (ext === '.jpg' && !url.includes('.')) ? mimeExt : ext

                const buffer = Buffer.from(response.data)
                const hash = crypto.createHash('md5').update(buffer).digest('hex')

                // 防"夹"检测
                if (this.clampedHashes.includes(hash)) {
                    console.log(`跳过被夹图片: ${url}`)
                    return null
                }

                // 如果后缀因 Content-Type 改变，更新目标路径
                const finalPath = finalExt !== ext
                    ? path.join(this.outputDir, `${name}${finalExt}`)
                    : targetPath

                // 再次检查目标文件是否已存在
                if (finalPath !== targetPath && await fs.pathExists(finalPath)) {
                    return finalPath
                }

                await fs.writeFile(finalPath, buffer)
                return finalPath
            } catch (error) {
                console.error(`下载失败 [${url}]:`, error.message)
                return null
            }
        })
    }
}
