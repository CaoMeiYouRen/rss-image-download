<h1 align="center">rss-image-download </h1>
<p>
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/rss-image-download.svg" />
  <img src="https://img.shields.io/badge/node-%3E%3D20-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/rss-image-download#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/rss-image-download/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/rss-image-download/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/rss-image-download?color=yellow" />
  </a>
</p>


> 自动从 RSS 下载图片，按日打包资源，并通过 BaiduPCS-Go 自动备份至百度网盘。

## ✨ 特性

- **纯净 Node.js 环境**：移除重量级框架，完全基于 CLI 与定时任务运行。
- **智能去重与恢复**：使用 SQLite (better-sqlite3) 记录下载与上传历史，支持程序崩溃后原地恢复进度。
- **BaiduPCS-Go 深度集成**：
    - 自动通过 `BDUSS` 和 `STOKEN` 登录。
    - **云端去重**：上传前查表 + 云端检索双重校验，处理了搜索关键词 22 字符限制（错误码 31023）。
  - **聚合打包**：按文件数/总大小/累计天数阈值自动聚合多个日期目录并打包上传。
- **多通道推送通知**：集成 [push-all-in-one](https://github.com/CaoMeiYouRen/push-all-in-one)，支持钉钉、企业微信、Server酱等多种通知方式。
- **双模运行**：
    - 配置 Cron 表达式后作为常驻服务运行。
    - 不配置 Cron 则立即执行一次任务后退出，适合手动触发。

## 📦 依赖要求

- node >=20
- [BaiduPCS-Go](https://github.com/qjfoidnh/BaiduPCS-Go) (需配置在系统环境变量中)

## 🚀 快速开始

1. **安装依赖**
   ```sh
   npm install
   ```

2. **配置环境**
   复制 `.env.example` 为 `.env` 并填写相关信息：
   - `BDUSS` / `STOKEN`: 百度网盘凭证。
  - `PUSH_TYPE` / `PUSH_CONFIG`: 推送通道配置（推荐使用标准结构）。
   - `CRON_SCHEDULE`: 抓取频率（Cron 表达式）。
  - `ARCHIVE_TRIGGER_MAX_FILES`: 文件数触发阈值。
  - `ARCHIVE_TRIGGER_MAX_SIZE`: 大小触发阈值（支持 `better-bytes` 格式，例如 `2GiB`）。
  - `ARCHIVE_MAX_PENDING_DAYS`: 累计天数兜底阈值。
  - `ARCHIVE_INCLUDE_TODAY`: 定时备份是否包含当天目录。

  推荐示例（钉钉）：
  ```sh
  PUSH_TYPE=Dingtalk
  PUSH_CONFIG={"config":{"DINGTALK_ACCESS_TOKEN":"your_token","DINGTALK_SECRET":"your_secret"},"option":{"msgtype":"markdown"}}
  ```

  兼容旧示例（仍可用）：
  ```sh
  PUSH_CONFIG={"DINGTALK_ACCESS_TOKEN":"your_token","DINGTALK_SECRET":"your_secret"}
  ```

  聚合备份阈值示例：
  ```sh
  ARCHIVE_TRIGGER_MAX_FILES=1000
  ARCHIVE_TRIGGER_MAX_SIZE=2GiB
  ARCHIVE_MAX_PENDING_DAYS=3
  ARCHIVE_INCLUDE_TODAY=false
  ```

3. **配置 RSS 源**
   复制 `rssConfig.example.yml` 为 `rssConfig.yml` 并添加您要监控的 RSSHub 或原生 RSS 链接。

4. **运行**
   ```sh
   # 开发模式
   npm run dev
   
   # 编译运行
   npm run build
   npm run start
   ```

## 👨‍💻 使用

```sh
npm run start
```

## 🛠️ 开发

```sh
npm run dev
```

## 🔧 编译

```sh
npm run build
```

## 🔍 Lint

```sh
npm run lint
```

## 💾 Commit

```sh
npm run commit
```


## 👤 作者


**CaoMeiYouRen**

* Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)

* GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)


## 🤝 贡献

欢迎 贡献、提问或提出新功能！<br />如有问题请查看 [issues page](https://github.com/CaoMeiYouRen/rss-image-download/issues). <br/>贡献或提出新功能可以查看[contributing guide](https://github.com/CaoMeiYouRen/rss-image-download/blob/master/CONTRIBUTING.md).

## 💰 支持

如果觉得这个项目有用的话请给一颗⭐️，非常感谢

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="在爱发电支持我">
</a>


## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/rss-image-download&type=Date)](https://star-history.com/#CaoMeiYouRen/rss-image-download&Date)

## 📝 License

Copyright © 2026 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).<br />
This project is [MIT](https://github.com/CaoMeiYouRen/rss-image-download/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
