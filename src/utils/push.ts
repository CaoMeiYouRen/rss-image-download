import { runPushAllInOne, runPushAllInCloud } from 'push-all-in-one'
import { PUSH_URL, PUSH_KEY, PUSH_TYPE, PUSH_CONFIG } from '@/env'

/**
 * 发送推送通知
 * @param title 标题
 * @param content 内容
 */
export async function sendPush(title: string, content: string) {
    if (!PUSH_TYPE) {
        return
    }
    try {
        const raw = JSON.parse(PUSH_CONFIG)
        const config = raw?.config ?? raw
        let option = raw?.option

        // 兼容旧配置：当使用钉钉但未显式提供 option.msgtype 时，默认使用 markdown
        if (!option && PUSH_TYPE === 'Dingtalk') {
            option = {
                msgtype: raw?.msgtype || 'markdown',
            }
        }

        if (!option && raw?.msgtype) {
            option = {
                msgtype: raw.msgtype,
            }
        }

        const options: any = {
            type: PUSH_TYPE,
            config,
            option,
        }

        if (PUSH_URL) {
            // 如果配置了 PUSH_URL，则通过 push-all-in-cloud 云服务转发
            await runPushAllInCloud(title, content, {
                ...options,
                baseUrl: PUSH_URL,
                authToken: PUSH_KEY,
            })
        } else {
            // 否则在本地直接推送
            await runPushAllInOne(title, content, options)
        }
    } catch (error) {
        console.error('发送推送失败:', error)
    }
}
