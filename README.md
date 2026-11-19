# skills

[![Validate skills](https://github.com/shl6688/skills/actions/workflows/validate.yml/badge.svg)](https://github.com/shl6688/skills/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

给 AI 编码助手用的一组技能（Agent Skills）。每个技能是一个目录，目录里放一份 `SKILL.md`，写清楚它管哪类任务、按什么顺序做、输出成什么样。Claude Code、Cursor、Codex 这类支持 Agent Skills 规范的工具都能直接读，拷进对应的 skills 目录就能用。

技能描述和正文用英文写，因为模型对英文指令的遵循度更稳；这份 README 用中文，方便自己回头查。

## 为什么单独建一个仓库

- **换工具不用重写**：`SKILL.md` 是 Markdown 加一段 YAML frontmatter，不绑定具体厂商。
- **改一处就生效**：调好一次的经验集中维护，不用在十几个项目里同步 prompt。
- **能被校验**：`scripts/validate-skills.mjs` 检查命名、frontmatter 和描述长度，CI 里跑一遍再合并。

## 目录结构

```text
.
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md          # 必需：frontmatter + 操作说明
│       ├── references/       # 可选：需要时才读的长文
│       └── scripts/          # 可选：可执行脚本
├── templates/
│   └── skill-template/       # 新建技能先复制这个目录
├── scripts/
│   └── validate-skills.mjs
└── .github/workflows/validate.yml
```

## 已收录的技能

| 技能 | 做什么 | 什么时候触发 |
| --- | --- | --- |
| [`code-review`](skills/code-review/SKILL.md) | 按严重级别审 diff，每条结论带 `path:line` 和改法 | 提 PR 前、让我看一段改动 |
| [`conventional-commits`](skills/conventional-commits/SKILL.md) | 从暂存区改动生成 Conventional Commits 格式的提交信息 | 提交代码、整理 changelog |
| [`api-design-review`](skills/api-design-review/SKILL.md) | 用一份检查表审 HTTP API 的命名、状态码、分页和错误模型 | 设计新接口、评审接口文档 |
| [`systematic-debugging`](skills/systematic-debugging/SKILL.md) | 先复现再定位，禁止靠猜改代码 | 修 bug、排查线上异常 |
| [`technical-writing-zh`](skills/technical-writing-zh/SKILL.md) | 去掉中文技术文档里的套话和翻译腔 | 写 README、博客、发布说明 |

## 怎么用

克隆下来，把需要的技能目录拷到工具的 skills 路径下：

```bash
git clone https://github.com/shl6688/skills.git
cp -r skills/code-review ~/.claude/skills/
```

Windows 上用 PowerShell：

```powershell
git clone https://github.com/shl6688/skills.git
Copy-Item -Recurse skills/code-review "$env:USERPROFILE\.claude\skills\"
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

## License

[MIT](LICENSE)