# 项目核心功能分析 (Node.js 纯净版)

## 1. 核心功能概述
本项目是一个纯粹的 Node.js 自动化脚本服务，负责监控 RSS 订阅源、下载图片、打包资源并备份至百度网盘。不再提供任何 Web 接口，完全通过 CLI 或定时任务运行。

## 2. 详细功能模块

### 2.1 RSS 监控与解析
- **多源支持**：通过 rssConfig.yml 配置多个 RSSHub 或原生 RSS 链接。
- **内容清洗**：过滤关键词（机器人、广告、AI 生成等）。
- **图片链接提取**：从 RSS 的 description 或其他字段中提取高质量原图链接。

### 2.2 图片下载与处理
- **HTTP 下载**：使用 axios 进行并发下载。
- **去重逻辑**：
    - URL 哈希化：使用图片 URL 的 MD5 作为文件名。
    - 内容校验：计算下载后图片的 MD5 Hash，若与占位图/屏蔽图匹配则自动剔除。
- **并发控制**：引入 p-queue 进行限流，并加入随机延迟。

### 2.3 归档与备份
- **ZIP 打包**：定期（如每日）将下载的图片按日期打包为 .zip 文件。
- **百度网盘备份**：调用 BaiduPCS-Go 命令行工具实现自动登录、上传和目录移动。
    - 提供封装好的 BaiduPCS 工具类，利用 zx 执行 shell 命令。

### 2.4 状态管理
- **本地数据库/缓存**：使用 history.json 记录已下载的图片 URL，防止重复下载。

### 2.5 自动化调度
- **Cron 任务**：基于 cron 包实现：
    - 每隔 N 分钟检查一次 RSS。
    - 每日执行一次打包与备份任务。

---

# 实现步骤规划

## 1. 模块定义
- src/utils/baidu.ts: 封装 BaiduPCS-Go 命令。
- src/utils/zip.ts: 封装 archiver 进行打包。
- src/core/rss.ts: RSS 解析逻辑。
- src/core/downloader.ts: 图片下载与 Hash 校验逻辑。
- src/index.ts: 定时任务调度与主流程。

## 2. 环境配置
- 使用 .env 管理 BDUSS、STOKEN 等敏感信息。
- 使用 rssConfig.yml 管理订阅源列表。

## 3. 去重机制
- 建立 history.json 记录已下载的图片 URL。
