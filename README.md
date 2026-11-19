# skills

[![Validate skills](https://github.com/shl6688/skills/actions/workflows/validate.yml/badge.svg)](https://github.com/shl6688/skills/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

给 AI 编码助手用的一组技能（Agent Skills）。每个技能是一个目录，目录里放一份 `SKILL.md`，写清楚它管哪类任务、按什么顺序做、输出成什么样。Claude Code、Cursor、Codex 这类支持 Agent Skills 规范的工具都能直接读，拷进对应的 skills 目录就能用。

通用技能用英文写，因为模型对英文指令的遵循度更稳；中文写作类技能（`humanize-writing`、`tech-blog-writing`）的规则本身就是中文，正文保留中文。这份 README 也用中文，方便自己回头查。

## 为什么单独建一个仓库

- **换工具不用重写**：`SKILL.md` 是 Markdown 加一段 YAML frontmatter，不绑定具体厂商。
- **改一处就生效**：调好一次的经验集中维护，不用在十几个项目里同步 prompt。
- **能被校验**：`scripts/validate-skills.mjs` 检查命名、frontmatter 和描述长度，CI 里跑一遍再合并。

## 目录结构

```text
.
├── skills/                   # 会被安装的技能
│   ├── humanize-writing/
│   │   └── SKILL.md
│   └── tech-blog-writing/
│       └── SKILL.md
├── examples/                 # 示例技能，不参与默认安装
│   ├── api-design-review/
│   ├── code-review/
│   ├── conventional-commits/
│   └── systematic-debugging/
├── templates/
│   └── skill-template/       # 新建技能先复制这个目录
├── scripts/
│   └── validate-skills.mjs
├── .claude-plugin/
│   ├── marketplace.json      # Claude Code 插件市场清单
│   └── plugin.json           # 插件元信息
└── .github/workflows/validate.yml
```

## 已收录的技能

只有下面两个会被安装。

| 技能 | 做什么 | 什么时候触发 |
| --- | --- | --- |
| [`humanize-writing`](skills/humanize-writing/SKILL.md) | 清掉中文里的套话、翻译腔和空形容词，只管语言层 | 写或改任何中文内容、被要求“说人话” |
| [`tech-blog-writing`](skills/tech-blog-writing/SKILL.md) | 讲机制、讲取舍的技术博客写法，图必须是真图片文件 | 写博客、做原理科普、整理架构说明 |

## 示例技能

`examples/` 下这四个是我写来给仓库撑结构用的，没在真实项目里长期跑过，所以不放进安装范围。它们的格式和正文照旧，想参考或直接拷走都可以，用的时候自己判断。

| 技能 | 做什么 |
| --- | --- |
| [`code-review`](examples/code-review/SKILL.md) | 按严重级别审 diff，每条结论带 `path:line` 和改法 |
| [`conventional-commits`](examples/conventional-commits/SKILL.md) | 从暂存区改动生成 Conventional Commits 格式的提交信息 |
| [`api-design-review`](examples/api-design-review/SKILL.md) | 用检查表审 HTTP API 的命名、状态码、分页和错误模型 |
| [`systematic-debugging`](examples/systematic-debugging/SKILL.md) | 先复现再定位，禁止靠猜改代码 |

## 安装

### 方式一：skills CLI（推荐）

需要 Node 22.20 以上。CLI 会列出仓库里的技能，让你选装哪几个、装给哪个 agent。

```bash
npx skills add shl6688/skills --list      # 先看仓库里有什么，不安装
npx skills add shl6688/skills -g          # 装到用户级，交互选择
npx skills add shl6688/skills -g --skill '*' -a claude-code -y   # 全装，不提问
```

不加 `-g` 是项目级安装，落在 `./<agent>/skills/`；两种方式都会在 `.agents/skills/` 放一份共享副本。装完用 `npx skills list` 看状态，`npx skills check` 查更新，`npx skills update` 升级，`npx skills remove` 卸载。

全局安装的具体落点以 CLI 版本为准，`npx skills ls -g` 会打印实际路径。本机 DSH 读的是 `~/.agents/skills/`，和 CLI 的共享目录约定一致。

### 方式二：Claude Code 插件市场

仓库根目录有 `.claude-plugin/marketplace.json`，可以直接当插件市场注册：

```bash
claude plugin marketplace add shl6688/skills
claude plugin install skills@shl6688-skills
```

会话里等价：`/plugin marketplace add shl6688/skills`。插件安装后技能名带前缀，例如 `/skills:humanize-writing`。

### 方式三：手动拷

```bash
git clone https://github.com/shl6688/skills.git
cp -r skills/humanize-writing ~/.claude/skills/
```

Windows 上用 PowerShell：

```powershell
git clone https://github.com/shl6688/skills.git
Copy-Item -Recurse skills/humanize-writing "$env:USERPROFILE\.claude\skills\"
```

常见放置位置：

| 工具 | 个人级 | 项目级 |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/` | `<repo>/.claude/skills/` |
| 跨工具约定 | `~/.agents/skills/` | `<repo>/.agents/skills/` |

工具版本更新较快，路径以各自文档为准；只要它能读目录下的 `SKILL.md`，放哪都能加载。

想跟着上游更新，可以把这个仓库作为 submodule 挂到项目里：

```bash
git submodule add https://github.com/shl6688/skills.git .skills
```

## 新增一个技能

```bash
cp -r templates/skill-template skills/my-skill
# 改 frontmatter 和正文
node scripts/validate-skills.mjs
```

## 编写约定

- `name` 用小写字母和连字符，长度不超过 64，必须和目录名一致。
- `description` 一行写完，不超过 1024 字符，格式是「做什么 + 什么时候用」，第三人称。
- 正文只写步骤、判断依据和输出格式。背景知识、长清单放 `references/`，用到的脚本放 `scripts/`。
- 不写「本文将介绍」，直接给操作。

细节见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 兼容性

- 目录布局按 [Agent Skills 规范](https://agentskills.io/specification)：`skills/<name>/SKILL.md`，可选 `scripts/`、`references/`、`assets/`。
- frontmatter 只用规范定义的字段：`name`、`description`、`license`、`compatibility`、`metadata`、`allowed-tools`。版本号和标签放进 `metadata`，不占顶层键。
- skills CLI 在 `skills/` 下三层范围内查找 `SKILL.md`，`examples/` 和 `templates/` 不在默认路径里，所以 `npx skills add . --list` 只列出 2 个。加 `--full-depth` 会把示例和模板一起列出来（共 7 个），日常安装别用这个开关。
- `.claude-plugin/marketplace.json` 加 `plugin.json` 让同一个仓库也能作为 Claude Code 插件市场安装，插件默认扫描的同样只有 `skills/`。
- CI 每次 push 跑 `node scripts/validate-skills.mjs`，分别校验 `skills/`、`examples/`、`templates/` 三个目录，另外检查两个插件 manifest 的必填项和路径。

`skills.sh` 目录站点什么时候收录新仓库不由我控制，`npx skills find` 搜不到时不影响按 `shl6688/skills` 直接安装。

## License

[MIT](LICENSE)