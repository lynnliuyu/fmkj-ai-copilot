# 繁梦 AI 工具箱（FMKJ AI Copilot）

> 面向 Windows 和 macOS 的 AI 工具箱，同一个客户端可切换基础版和高级版。

**官方下载站：<https://app.fmkj.top/download>**

## 主要功能

- **基础版免繁梦登录**：在紧凑窗口中选择工具、查看版本，使用安装/更新、汉化、官方授权和清除配置。各工具与系统按实际支持情况提供操作。
- **高级版按需切换**：保留账户、订阅、积分、模型配置及工具管理功能；版本选择会在下次打开时保留。
- **三个工具入口**：Codex、Claude Desktop、WorkBuddy。
- **平台各用自己的顶部栏**：Windows 使用右上窗口控件；Mac 保留原生红黄绿按钮。
- **原有反馈与信息轮播**：联系方式在顶部，信息轮播在底部。

## 下载

<!-- release-sync:start -->
| 下载 | 客户端版本 | 内置界面 |
|---|---|---|
| [Windows x64 安装版](https://app.fmkj.top/downloads/FMKJ-Copilot_0.1.197_x64-setup.exe) | 0.1.197 | 0.1.197 |
| [macOS Apple Silicon / Intel 通用版](https://app.fmkj.top/downloads/FMKJ-Copilot_0.1.197_universal.dmg) | 0.1.197 | 0.1.197 |

本次界面随完整安装包交付。**自动更新清单未升级，Windows 自动更新仍为 0.1.194**；请下载对应系统的完整安装包更新。Mac 包未经 Apple 公证。

[本次发布记录与安装包](https://github.com/lynnliuyu/fmkj-ai-copilot/releases/tag/v0.1.197) · [所有发布记录](https://github.com/lynnliuyu/fmkj-ai-copilot/releases)
<!-- release-sync:end -->

## 安装与使用

1. Windows 用户下载 x64 安装包，按安装器提示完成安装。
2. macOS 13+ 用户下载通用 DMG，将应用拖入「应用程序」。同一包支持 Apple Silicon 与 Intel；当前包未经 Apple Developer ID 签名或公证。
3. 打开后默认进入基础版。选择要管理的工具，使用「安装 / 更新」；Windows Codex 安装完成后可使用「汉化」。Mac 版不提供 Codex 界面汉化。
4. 需要账户和模型配置时，在顶部切换「高级版」并登录。基础版的安装等功能不要求繁梦登录。
5. 「官方授权」只在工具支持时可用；清除配置会先确认，并保留官方账号与本地会话。

遇到问题可使用客户端顶部联系方式，或在本仓库提交 Issue。

## 说明

- 发布记录注明每个平台实际的签名与验证范围；未执行的 Windows 11 安装/升级不会记作已验收。
- 本仓库用于发布客户端安装包和说明文档。

## 发布维护

下载站发布并完整读回安装包后，使用已发布元数据生成展示资料：

```sh
node scripts/sync-public-release.mjs /path/to/release197-published.json
node --test scripts/release-data.test.mjs
node scripts/publish-release.mjs --check
```

同步脚本只接受当前站点的版本化 Windows 安装器和 Mac 通用 DMG，并重新下载、比对字节长度与 SHA256 后才写入 README 和清单。候选包不可替代已发布文件。公开仓库推送触发 `Sync public release`，上传两份安装包与校验文件；核对工作流和 Release 附件后，再运行同步命令加 `--check`。历史 Release 保留。

**关键词**：Codex 汉化、Codex 中文版、Codex 简体中文、Codex 一键安装、Windows Codex、AI 编程助手、AI 写代码、GPT、DeepSeek、API Key 配置、AI 工具箱、WorkBuddy、繁梦 AI、FMKJ Copilot
