import Parser from 'rss-parser'

const parser = new Parser()

export interface RssItem {
    title?: string
    link?: string
    content?: string
    contentSnippet?: string
    isoDate?: string
    images: string[]
}

/**
 * 解析 RSS 源并提取图片链接
 * @param url RSS 链接
 */
export async function parseRss(url: string): Promise<RssItem[]> {
    const feed = await parser.parseURL(url)
    return feed.items.map((item) => {
        const images = extractImages(item.content || item.description || '')
        return {
            title: item.title,
            link: item.link,
            content: item.content,
            contentSnippet: item.contentSnippet,
            isoDate: item.isoDate,
            images,
        }
    })
}

/**
 * 从 HTML 内容中提取图片链接
 * @param html 内容
 */
function extractImages(html: string): string[] {
    const imgReg = /<img [^>]*src=['"]([^'"]+)[^>]*>/g
    const images: string[] = []
    let match: RegExpExecArray | null
     
    while ((match = imgReg.exec(html)) !== null) {
        images.push(match[1])
    }
    return images
}
