import fs from 'fs-extra'
import archiver from 'archiver'

/**
 * 压缩文件夹
 * @param sourceDir 源目录
 * @param outPath 输出路径（包含文件名）
 */
export async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = fs.createWriteStream(outPath)

    return new Promise((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', (err) => reject(err))
            .pipe(stream)

        stream.on('close', () => resolve())
        void archive.finalize()
    })
}
