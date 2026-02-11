import { $ } from 'zx'

// 设置 zx 的 quiet 模式，默认不打印。执行时通过 .quiet(false) 手动开启
$.quiet = true

/**
 * 使用 bduss 登录百度网盘
 */
export async function loginByBduss(bduss: string, stoken: string) {
    const flags = [
        `-bduss=${bduss}`,
        `-stoken=${stoken}`,
    ]
    return $`BaiduPCS-Go login ${flags}`.nothrow().quiet(false)
}

/**
 * 获取当前帐号
 */
export async function who() {
    return $`BaiduPCS-Go who`.nothrow().quiet(false)
}

/**
 * 上传本地文件到百度网盘
 */
export async function upload(from: string, to: string) {
    const flags = [
        from,
        to,
    ]
    return $`BaiduPCS-Go upload ${flags}`.nothrow().quiet(false)
}

/**
 * 移动、重命名文件路径
 */
export async function move(from: string, to: string) {
    const flags = [
        from,
        to,
    ]
    return $`BaiduPCS-Go mv ${flags}`.nothrow()
}

/**
 * 删除文件/目录
 */
export async function remove(from: string) {
    const flags = [
        from,
    ]
    return $`BaiduPCS-Go rm ${flags}`.nothrow()
}

/**
 * 搜索文件夹内的文件
 * @param keyword 关键词
 * @param path 搜索目录
 */
export async function search(keyword: string, path: string = '/') {
    const flags = [
        '-path',
        path,
        '-r',
        keyword,
    ]
    const p = await $`BaiduPCS-Go search ${flags}`.nothrow()
    return p.stdout
}

/**
 * 离线下载
 */
export async function offlinedl(url: string, to: string) {
    return $`BaiduPCS-Go offlinedl add -path=${to} ${url}`.nothrow().quiet(false)
}

export const BaiduPCS = {
    loginByBduss,
    upload,
    move,
    who,
    remove,
    offlinedl,
    search,
}
