# Team Publications

一个零依赖、可直接部署到 GitHub Pages 的团队论文主页，收录 Ruiyang Xia、Lin Yuan、Jiawei Zhang 与 Xiao Pu 自 2022 年以来的公开论文。

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ready-1b9aaa)
![Data validation](https://img.shields.io/badge/data-deduplicated-ef6a5b)
![License](https://img.shields.io/badge/license-MIT-102b3f)

## 功能

- 论文按年份归档，支持标题、作者、期刊/会议全文搜索
- 支持按年份、团队作者和研究主题筛选
- 自动生成年度论文趋势图与团队内部合著网络
- 合著论文只保留一个条目，同时标出所有命中的团队成员
- 每篇论文提供 DOI、出版社、会议官网或 arXiv 链接
- 响应式布局，适配桌面与移动端
- 提交到 `main` 后由 GitHub Actions 自动校验并部署

## 本地运行

只需要 Node.js 20 或更高版本：

```bash
npm run check
npm run serve
```

然后访问 <http://localhost:4173>。

## 部署到 GitHub Pages

1. 创建一个空的 GitHub 仓库，并把本目录内容推送到 `main` 分支。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment → Source** 中选择 **GitHub Actions**。
4. 等待 `Validate and deploy GitHub Pages` 工作流完成。

站点根目录就是发布目录，不需要构建工具。

## 添加或修改论文

论文数据集中在 [`data/papers.json`](./data/papers.json)。新增条目后运行：

```bash
npm run check
```

校验器会检查：

- 年份是否早于 2022
- DOI 与规范化标题是否重复
- `teamMembers` 是否是已知团队成员
- 团队成员是否真的出现在论文作者列表
- 论文链接是否使用 HTTPS

建议优先填写正式期刊或会议版本。若同一成果同时有 arXiv 和正式版本，只保留正式版本；尚无正式版本时才使用 `Preprint`。

## 辅助查漏

```bash
npm run audit
```

该命令按四位作者的 ORCID 查询 OpenAlex，并列出当前数据集中没有匹配 DOI 或标题的候选记录。它只生成报告，不会改写数据。重名作者可能被索引服务错误合并，所以候选记录必须经 Google Scholar、DBLP 和出版社页面人工确认后才能加入。

## 数据来源与口径

作者身份由用户提供的 Google Scholar 主页确定，论文元数据与正式版本链接通过 DBLP、Crossref/OpenAlex、出版社和会议官网交叉核对。当前数据更新日期写在 `data/papers.json` 的 `site.lastUpdated` 字段中。

部分数据库会把同名作者合并到同一索引页。本项目只保留与目标 Scholar 主页、ORCID、研究方向及合作者网络相符的记录，不会把索引页上的同名论文直接全部导入。

## 项目结构

```text
.
├── .github/workflows/pages.yml
├── data/papers.json
├── scripts/
│   ├── audit-openalex.mjs
│   ├── serve.mjs
│   └── validate-data.mjs
├── app.js
├── index.html
└── styles.css
```

## License

[MIT](./LICENSE)
