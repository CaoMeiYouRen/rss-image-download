import path from 'node:path'
import crypto from 'node:crypto'
import fs from 'fs-extra'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import PQueue from 'p-queue'
import { sleep } from '@/utils/helper'

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay })

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
     * 下载图片
     * @param url 图片链接
     * @param filename 建议文件名（可选，默认使用 URL MD5）
     */
    async download(url: string, filename?: string): Promise<string | null> {
        return this.queue.add(async () => {
            try {
                // 随机延迟避免被封
                await sleep(Math.floor(Math.random() * 2000))

                const ext = path.extname(new URL(url).pathname) || '.jpg'
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

                const buffer = Buffer.from(response.data)
                const hash = crypto.createHash('md5').update(buffer).digest('hex')

                // 防“夹”检测
                if (this.clampedHashes.includes(hash)) {
                    console.log(`跳过被夹图片: ${url}`)
                    return null
                }

                await fs.writeFile(targetPath, buffer)
                return targetPath
            } catch (error) {
                console.error(`下载失败 [${url}]:`, error.message)
                return null
            }
        })
    }
}
