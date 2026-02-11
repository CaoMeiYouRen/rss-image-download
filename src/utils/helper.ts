/**
 * 延迟执行
 * @param ms 毫秒
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param date
 */
export function formatDate(date: Date = new Date()): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}
