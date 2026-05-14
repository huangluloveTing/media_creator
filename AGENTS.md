# Media Creator

## 开发工作流

本项目使用 **openspec** 进行功能规划和规范定义，结合 **plan-eng-review** 和 **subagent-driven-development** 进行高效实现。

### 完整流程

1. **需求探索** — `/opsx:explore` 或直接讨论需求
2. **提案** — `/opsx:propose <change-name>` 生成 proposal、design、tasks
3. **工程审查 + 实现** — `/implement <change-name>` →
   - `plan-eng-review` 审查设计和任务
   - `subagent-driven-development` 用并行 subagent 实现
4. **归档** — `/opsx:archive` 归档完成的 change

### 核心技能

| 阶段 | 技能                          | 作用                                               |
| ---- | ----------------------------- | -------------------------------------------------- |
| 规划 | `openspec`                    | 生成规范文档（proposal.md / design.md / tasks.md） |
| 审查 | `plan-eng-review`             | 工程审查：架构、质量、测试、性能                   |
| 实现 | `subagent-driven-development` | 每个任务独立 subagent + 两阶段审查                 |
| 归档 | `openspec-archive-change`     | 归档完成的 change                                  |

### 命令

- `/implement [change-name]` — 审查 + 并行实现一条龙
- `/opsx:propose <name>` — 创建新的 change
- `/opsx:apply` — 直接实现（不经审查，用于简单任务）
- `/opsx:archive` — 归档完成的工作
