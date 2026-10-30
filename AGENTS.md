# 公开展示仓库

- 此仓库公开，不得复制私有业务源码、后台配置、账户资料或凭据。
- 每次已交付原生或 UI 更新都同步 README、release-manifest.json 和 GitHub Release，并验证发布 workflow 及附件。
- 当前 app.fmkj.top 公开清单由 scripts/sync-public-release.mjs 根据下载站发布后读回的元数据生成；重新下载两平台版本化安装包核验长度与 SHA256。旧工作台同步脚本只适用于历史 copilot.fmkj.top；版本不能取自未发布源码候选。
- README release-sync 标记内内容由脚本管理；各平台与 UI 版本分别展示；保留历史 Release。
