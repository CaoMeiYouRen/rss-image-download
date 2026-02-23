import fs from 'fs-extra'
import archiver from 'archiver'

interface ZipDirectoryInput {
    dirPath: string
    entryName?: string | false
}

/**
 * 压缩多个文件夹
 * @param sources 源目录列表
 * @param outPath 输出路径（包含文件名）
 */
export async function zipDirectories(sources: ZipDirectoryInput[], outPath: string): Promise<void> {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = fs.createWriteStream(outPath)

    return new Promise((resolve, reject) => {
        for (const source of sources) {
            archive.directory(source.dirPath, source.entryName ?? false)
        }

        archive
            .on('error', (err) => reject(err))
            .pipe(stream)

        stream.on('close', () => resolve())
        void archive.finalize()
    })
}

/**
 * 压缩文件夹
 * @param sourceDir 源目录
 * @param outPath 输出路径（包含文件名）
 */
export async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
    await zipDirectories([{ dirPath: sourceDir, entryName: false }], outPath)
}
