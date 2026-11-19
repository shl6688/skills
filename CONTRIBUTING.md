# Contributing

这个仓库只放我自己在用的技能，不追求数量。加技能的流程固定成下面几步，主要是为了让 CI 能拦住格式问题。

## 目录约定

```text
skills/<skill-name>/
├── SKILL.md          # 必需
├── references/       # 可选，长文档，正文里按需引用
└── scripts/          # 可选，可执行脚本
```

目录名就是技能名，小写字母加连字符，例如 `code-review`、`api-design-review`。

## frontmatter 字段

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `name` | 是 | `^[a-z0-9]+(-[a-z0-9]+)*$`，≤ 64 字符，与目录名一致 |
| `description` | 是 | 单行，20–1024 字符，写清「做什么 + 什么时候用」 |
| `license` | 否 | SPDX 标识，本仓库统一 `MIT` |
| `compatibility` | 否 | ≤ 500 字符，写运行环境要求 |
| `metadata` | 否 | 字符串键值对，版本号写 `version`，标签写 `tags` |
| `allowed-tools` | 否 | 空格分隔的预授权工具名，实验字段 |

这六个键之外的顶层键校验会失败，因为 Agent Skills 规范没有定义它们。版本号和标签放 `metadata` 下：

```yaml
license: MIT
metadata:
  version: 1.2.0
  tags: review, git
```

## 正文怎么写

1. 第一段说清楚这个技能在什么情况下被调用，以及它不做哪些事。
2. 中间是编号步骤，每步有明确的产出。
3. 最后给输出模板。模板用代码块，别用截图。
4. 判断标准写成可执行的规则，例如「删除一个成员的接口返回 204 而不是 200」，不写「保持接口一致」。

控制长度。单个 `SKILL.md` 建议不超过 150 行，超过就把细节挪到 `references/`。

## 提交前

```bash
node scripts/validate-skills.mjs
```

校验器只查格式，查不了内容质量。合并前自己读一遍，确认步骤能照着做出来。

提交信息用 Conventional Commits：

```text
feat(skills): add api-design-review
fix(skills): tighten code-review severity rules
docs: explain how to install with submodule
```

## 新增技能的检查清单

- [ ] 目录名与 `name` 一致
- [ ] `description` 能独立看懂，不依赖上下文
- [ ] 正文有可执行的步骤，没有空话
- [ ] 引用的文件路径真实存在
- [ ] `node scripts/validate-skills.mjs` 通过
- [ ] README 的表格里补了一行