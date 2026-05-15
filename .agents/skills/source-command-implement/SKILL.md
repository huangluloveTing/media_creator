---
name: 'source-command-implement'
description: '从 openspec spec 出发，经 plan-eng-review 审查后，使用 subagent-driven-development 并行实现'
---

# source-command-implement

Use this skill when the user asks to run the migrated source command `implement`.

## Command Template

## 概述

将 openspec 的工作成果（proposal、design、tasks）经过 engineering review 后，使用并行 subagent 高效实现。

## 执行步骤

### 1. 选择 Change

如果用户提供了 change 名称（如 `/implement add-auth`），直接使用。否则：

- 从对话上下文推断
- 如果只有一个活跃 change，自动选择
- 如果模糊不清，运行 `ls openspec/changes/` 列出可用 change，让用户选择

### 2. 读取 Artifacts

```bash
openspec status --change "<name>" --json
openspec instructions apply --change "<name>" --json
```

读取所有 artifacts：

- `proposal.md` — 理解要做什么、为什么
- `design.md` — 理解架构和设计决策
- `tasks.md` — 获取任务列表

如果 tasks 尚未创建或有前置 artifacts 未完成，提示用户先用 `/opsx:propose` 完成提案。

### 3. Engineering Review

调用 **`plan-eng-review`** 技能，对 design 和 tasks 进行工程审查：

- 架构合理性
- 代码质量预期
- 测试覆盖要求
- 性能考量
- 识别可并行的任务

审查通过后继续。如有阻塞性问题，先解决再继续。

### 4. 并行实现

调用 **`subagent-driven-development`** 技能，按 plan-eng-review 识别的并行策略执行：

- 使用 `isolation: "worktree"` 的 Agent 工具为独立任务创建并行 subagent
- 每个 subagent 负责一个独立模块/功能
- 每个 subagent 完成后进行 spec 合规审查 + 代码质量审查
- 主会话协调合并

### 5. 最终审查

所有任务完成后进行整体代码审查，然后建议用 `/opsx:archive` 归档。

## 工作流示意图

```
┌─────────────────────────────────────────────┐
│  /opsx:propose                              │
│  → proposal.md + design.md + tasks.md       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  /implement [change]                        │
│  ┌─────────────────────────────────────┐   │
│  │  1. 读取 openspec artifacts          │   │
│  │  2. plan-eng-review (工程审查)        │   │
│  │  3. subagent-driven-development     │   │
│  │     ├── Agent A: 并行实现模块A      │   │
│  │     ├── Agent B: 并行实现模块B      │   │
│  │     └── Agent C: 并行实现模块C      │   │
│  │  4. 审查 → 归档                     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 注意事项

- `plan-eng-review` 是交互式审查，会提出问题和选项，需要用户参与决策
- `subagent-driven-development` 会为每个任务创建独立 subagent，保持主会话上下文干净
- 确保每个 subagent 有完整的上下文（相关 spec 片段 + 文件路径），不需要继承主会话
- 如果 tasks 之间有依赖关系，按拓扑顺序执行，先完成无依赖的任务
