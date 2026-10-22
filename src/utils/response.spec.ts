import { brotliCompressSync, gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { decodeResponseBody, UnsafeContentEncodingError } from '@/utils/response'

describe('decodeResponseBody', () => {
    const raw = Buffer.from('image-bytes')

    it('未压缩响应原样返回', async () => {
        await expect(decodeResponseBody(raw)).resolves.toBe(raw)
        await expect(decodeResponseBody(raw, 'identity')).resolves.toBe(raw)
    })

    it('解压 gzip 响应', async () => {
        await expect(decodeResponseBody(gzipSync(raw), 'gzip')).resolves.toEqual(raw)
    })

    it('拒绝 Brotli 响应，不进入易受攻击的解码路径', async () => {
        const compressed = brotliCompressSync(raw)
        await expect(decodeResponseBody(compressed, 'br')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
    })

    it('拒绝叠加 Brotli 与未知编码', async () => {
        await expect(decodeResponseBody(raw, 'gzip, br')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
        await expect(decodeResponseBody(raw, 'zstd')).rejects.toBeInstanceOf(UnsafeContentEncodingError)
    })
})
