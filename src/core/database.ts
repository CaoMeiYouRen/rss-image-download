import path from 'node:path'
import Database from 'better-sqlite3'
import fs from 'fs-extra'
import { DB_PATH as DB_FILE_PATH } from '@/env'

const DB_PATH = path.isAbsolute(DB_FILE_PATH) ? DB_FILE_PATH : path.join(process.cwd(), DB_FILE_PATH)
fs.ensureDirSync(path.dirname(DB_PATH))

const db = new Database(DB_PATH)

// 初始化数据库表
db.exec(`
    CREATE TABLE IF NOT EXISTS download_history (
        url TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS upload_history (
        file_path TEXT PRIMARY KEY,
        remote_path TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`)

/**
 * 检查 URL 是否已下载
 */
export function hasDownloaded(url: string): boolean {
    const row = db.prepare('SELECT 1 FROM download_history WHERE url = ?').get(url)
    return !!row
}

/**
 * 记录下载成功
 */
export function recordDownload(url: string) {
    db.prepare('INSERT OR IGNORE INTO download_history (url) VALUES (?)').run(url)
}

/**
 * 检查文件是否已上传
 */
export function getUploadStatus(filePath: string): string | null {
    const row = db.prepare('SELECT status FROM upload_history WHERE file_path = ?').get(filePath) as { status: string } | undefined
    return row ? row.status : null
}

/**
 * 记录上传状态
 */
export function recordUpload(filePath: string, remotePath: string, status: string = 'success') {
    db.prepare(`
        INSERT OR REPLACE INTO upload_history (file_path, remote_path, status)
        VALUES (?, ?, ?)
    `).run(filePath, remotePath, status)
}

export { }
