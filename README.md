<div align="center">
  <img src="src-tauri/icons/icon.png" alt="Opcode Logo" width="120" height="120">

  <h1>Opcode</h1>
  
  <p>
    <strong>🚀 一个强大的 Claude Code GUI 客户端与工具集</strong>
  </p>
  <p>
    创建自定义 AI Agent、管理交互式 Claude Code 会话、运行安全的后台代理，以及更多功能。
  </p>
  
  <p>
    <a href="#-功能特性"><img src="https://img.shields.io/badge/功能-✨-blue?style=for-the-badge" alt="Features"></a>
    <a href="#-快速开始"><img src="https://img.shields.io/badge/安装-🚀-green?style=for-the-badge" alt="Installation"></a>
    <a href="#-开发指南"><img src="https://img.shields.io/badge/开发-🛠️-orange?style=for-the-badge" alt="Development"></a>
    <a href="https://github.com/hua123an/opcode"><img src="https://img.shields.io/badge/GitHub-⭐-yellow?style=for-the-badge" alt="GitHub"></a>
  </p>
</div>

---

## 📖 简介

**Opcode** 是一款基于 Tauri 2 构建的现代化桌面应用程序，为 Claude Code 提供了优雅的图形用户界面。它将命令行工具的强大功能与可视化界面的便捷性相结合，让 AI 辅助开发变得更加直观和高效。

### 核心优势

- � **直观的可视化界面** - 告别命令行，用图形界面管理所有 Claude Code 操作
- ⚡ **高性能虚拟化列表** - 即使处理数千条消息也能流畅滚动
- � **本地优先** - 所有数据存储在本地，保护您的隐私
- 🎨 **现代化设计** - 深色/浅色主题，美观的 UI 动效

---

## ✨ 功能特性

### �️ 项目与会话管理

| 功能 | 描述 |
|------|------|
| **可视化项目浏览器** | 浏览 `~/.claude/projects/` 中的所有项目 |
| **会话历史** | 查看并恢复过去的编码会话，保持完整上下文 |
| **智能搜索** | 快速搜索项目和会话 |
| **会话洞察** | 一览显示首条消息、时间戳等元数据 |

### 🤖 CC Agents (自定义 AI 代理)

- **自定义系统提示词** - 为不同任务创建专用代理
- **后台执行** - 在独立进程中运行代理，不阻塞 UI
- **执行历史** - 追踪所有代理运行记录和性能指标
- **权限控制** - 配置文件读写和网络访问权限

### 📊 使用分析仪表板

- **成本追踪** - 实时监控 Claude API 使用量和费用
- **Token 分析** - 按模型、项目和时间段的详细分解
- **可视化图表** - 展示使用趋势的精美图表
- **数据导出** - 导出使用数据用于分析和报告

### 🔌 MCP Server 管理

- **服务器注册中心** - 从统一 UI 管理 Model Context Protocol 服务器
- **易于配置** - 通过 UI 或 JSON 导入添加服务器
- **连接测试** - 使用前验证服务器连接
- **Claude Desktop 导入** - 从 Claude Desktop 导入服务器配置

### ⏰ 时间线与检查点

- **会话版本控制** - 在会话的任何时刻创建检查点
- **可视化时间线** - 用分支时间线浏览会话历史
- **一键恢复** - 点击即跳转回任何检查点
- **会话分叉** - 从现有检查点创建新分支
- **差异查看器** - 查看检查点间的具体变化

### 📝 CLAUDE.md 管理

- **内置编辑器** - 直接在应用内编辑 CLAUDE.md 文件
- **实时预览** - 实时查看 Markdown 渲染效果
- **项目扫描器** - 查找项目中的所有 CLAUDE.md 文件

---

## 🚀 快速开始

### 系统要求

- **操作系统**: Windows 10/11, macOS 11+, 或 Linux (Ubuntu 20.04+)
- **内存**: 最低 4GB (推荐 8GB)
- **存储**: 至少 1GB 可用空间
- **Claude Code CLI**: 需要预先安装

### 从源码构建

#### 1. 安装依赖

**Rust** (1.70.0+)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Node.js / Bun**
```bash
# 使用 Bun (推荐)
curl -fsSL https://bun.sh/install | bash

# 或使用 npm
npm install
```

**Linux 额外依赖**
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential \
  libssl-dev \
  libxdo-dev \
  libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev
```

**macOS**
```bash
xcode-select --install
```

#### 2. 克隆并构建

```bash
# 克隆仓库
git clone https://github.com/hua123an/opcode.git
cd opcode

# 安装前端依赖
bun install
# 或 npm install

# 开发模式运行 (带热重载)
bun run tauri dev

# 生产构建
bun run tauri build
```

---

## 🛠️ 开发指南

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + TypeScript + Vite 6 |
| **后端** | Rust + Tauri 2 |
| **UI** | Tailwind CSS v4 + shadcn/ui |
| **数据库** | SQLite (rusqlite) |
| **虚拟化** | @tanstack/react-virtual |

### 项目结构

```
opcode/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   ├── ClaudeCodeSession.tsx  # 主会话组件
│   │   ├── StreamMessage.tsx      # 消息渲染组件
│   │   └── ...
│   ├── lib/                # API 客户端与工具函数
│   ├── hooks/              # React Hooks
│   ├── contexts/           # React Context
│   └── services/           # 持久化服务
├── src-tauri/              # Rust 后端源码
│   ├── src/
│   │   ├── commands/       # Tauri 命令处理器
│   │   ├── checkpoint/     # 时间线管理
│   │   └── process/        # 进程管理
│   └── tauri.conf.json     # Tauri 配置
└── public/                 # 公共资源
```

### 开发命令

```bash
# 启动开发服务器 (前端 + 后端)
bun run tauri dev

# 仅运行前端
bun run dev

# 类型检查
bunx tsc --noEmit

# 构建生产版本
bun run tauri build

# 运行 Rust 测试
cd src-tauri && cargo test

# 格式化代码
cd src-tauri && cargo fmt
```

---

## � 性能优化

本项目采用了多项性能优化措施：

### 虚拟化列表
- 使用 `@tanstack/react-virtual` 实现消息列表虚拟化
- 只渲染可视区域内的消息 + 少量缓冲
- 支持动态高度测量

### 组件优化
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 移除生产环境的调试日志

### 事件处理
- 使用 Tauri 事件系统实现高效的进程间通信
- 正确清理事件监听器，防止内存泄漏

---

## 🔒 安全性

Opcode 优先考虑您的隐私和安全：

- ✅ **进程隔离** - 代理在独立进程中运行
- ✅ **权限控制** - 可配置每个代理的文件和网络访问权限
- ✅ **本地存储** - 所有数据保存在本地
- ✅ **无遥测** - 不收集任何用户数据
- ✅ **开源透明** - 完整代码开源可审计

---

## 🤝 贡献指南

欢迎贡献！您可以通过以下方式参与：

- 🐛 **Bug 修复** - 修复已知问题
- ✨ **新功能** - 实现新特性
- 📚 **文档** - 改进文档
- 🎨 **UI/UX** - 优化用户界面
- 🧪 **测试** - 增加测试覆盖率
- 🌐 **国际化** - 添加多语言支持

### 提交流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 AGPL 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Tauri](https://tauri.app/) - 安全的桌面应用框架
- [Claude](https://claude.ai) by Anthropic - 强大的 AI 助手
- [React](https://react.dev/) - 用户界面库
- [TanStack Virtual](https://tanstack.com/virtual) - 虚拟化列表

---

<div align="center">
  <p>
    <strong>Made with ❤️</strong>
  </p>
  <p>
    <a href="https://github.com/hua123an/opcode/issues">报告 Bug</a>
    ·
    <a href="https://github.com/hua123an/opcode/issues">功能建议</a>
  </p>
</div>

> **注意**: 本项目不隶属于 Anthropic，也不受其认可或赞助。Claude 是 Anthropic, PBC 的商标。这是一个独立的开发者项目。
