import { gunzip, inflate, inflateRaw } from 'node:zlib'
import { promisify } from 'node:util'

const gunzipAsync = promisify(gunzip)
const inflateAsync = promisify(inflate)
const inflateRawAsync = promisify(inflateRaw)

/**
 * 响应编码不安全或不受支持时抛出
 */
export class UnsafeContentEncodingError extends Error {
    constructor(encoding: string) {
        super(`拒绝处理不安全的 Content-Encoding: ${encoding}`)
        this.name = 'UnsafeContentEncodingError'
    }
}

/**
 * 解析 Content-Encoding，拆分为编码列表
 * @param contentEncoding 响应头 content-encoding
 */
function parseContentEncoding(contentEncoding?: string | null): string[] {
    return String(contentEncoding || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item && item !== 'identity')
}

/**
 * 解码响应体。
 *
 * 禁用了 axios 的自动解压（decompress: false），因此需要在这里显式处理编码。
 * Brotli 一律拒绝：Node.js Brotli 解码器的越界写入漏洞（CVE-2026-111497）
 * 只有在解码攻击者可控的 br 数据时才会触发。
 * @param data 原始响应体
 * @param contentEncoding 响应头 content-encoding
 */
export async function decodeResponseBody(data: Buffer, contentEncoding?: string | null): Promise<Buffer> {
    const encodings = parseContentEncoding(contentEncoding)
    if (encodings.length === 0) {
        return data
    }
    if (encodings.includes('br')) {
        throw new UnsafeContentEncodingError(encodings.join(', '))
    }
    if (encodings.length !== 1) {
        throw new UnsafeContentEncodingError(encodings.join(', '))
    }

    switch (encodings[0]) {
        case 'gzip':
        case 'x-gzip':
        case 'compress':
        case 'x-compress':
            return gunzipAsync(data)
        case 'deflate':
            try {
                return await inflateAsync(data)
            } catch {
                // 兼容不带 zlib 头的 raw deflate
                return inflateRawAsync(data)
            }
        default:
            throw new UnsafeContentEncodingError(encodings[0])
    }
}
