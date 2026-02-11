import { $ } from 'zx'

/**
 * 使用 bduss 登录百度网盘
 *
 * @author CaoMeiYouRen
 * @date 2022-09-18
 * @param bduss
 * @param stoken
 */
export async function loginByBduss(bduss: string, stoken: string) {
    return $`BaiduPCS-Go login -bduss=${bduss} -stoken=${stoken}`
}

/**
 * 获取当前帐号
 *
 * @author CaoMeiYouRen
 * @date 2022-09-18
 */
export async function who() {
    return $`BaiduPCS-Go who`
}

/**
 * 上传本地文件到百度网盘
 *
 * @author CaoMeiYouRen
 * @date 2022-09-18
 * @param from 本地路径
 * @param to 远程路径
 */
export async function upload(from: string, to: string) {
    return $`BaiduPCS-Go upload "${from}" "${to}"`
}

/**
 * 移动、重命名文件路径
 *
 * @author CaoMeiYouRen
 * @date 2022-09-18
 * @param from
 * @param to
 */
export async function move(from: string, to: string) {
    return $`BaiduPCS-Go mv "${from}" "${to}"`
}

/**
 * 删除文件/目录
 *
 * @author CaoMeiYouRen
 * @date 2024-03-23
 * @param from
 */
export async function remove(from: string) {
    return $`BaiduPCS-Go rm "${from}"`
}

/**
 * 离线下载
 *
 * @author CaoMeiYouRen
 * @date 2024-03-23
 * @param url
 * @param to
 */
export async function offlinedl(url: string, to: string) {
    return $`BaiduPCS-Go offlinedl add -path=${to} ${url}`
}

export const BaiduPCS = {
    loginByBduss,
    upload,
    move,
    who,
    remove,
    offlinedl,
}
