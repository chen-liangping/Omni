# 项目管理与分支部署系统 - 文档总览

## 📚 文档结构

本项目包含完整的业务需求、技术实现和接口规范文档，为系统的开发、部署和维护提供全面指导。

### 文档列表

| 文档名称 | 文件路径 | 说明 |
|---------|----------|------|
| 📋 **完整业务需求文档** | `完整业务需求文档.md` | 详细的业务需求和功能规范 |
| 🔧 **技术实现文档** | `技术实现文档.md` | 代码结构和技术实现细节 |
| 📊 **数据结构与接口文档** | `数据结构与接口文档.md` | 数据模型和接口定义 |
| 📝 **项目页面需求说明** | `项目页面-需求说明.md` | 项目模块专项需求 |
| ⏰ **定时发布需求** | `定时发布.md` | 分支部署和时间管理需求 |

## 🎯 系统概述

### 核心功能
- **项目管理**：项目创建、编辑、删除，多环境配置
- **分支部署**：智能分支管理，环境特定部署策略
- **测试流程**：完整的分支测试、合并、审核流程
- **Webhook集成**：机器人通知，自动化提醒
- **仓库管理**：分支列表，保护规则配置

### 技术栈
- **前端框架**：Next.js 15 + React 18
- **UI组件库**：Ant Design 5.x
- **开发语言**：TypeScript
- **数据存储**：LocalStorage (前端原型)
- **样式方案**：CSS Modules + CSS Variables

## 🏗️ 系统架构

### 目录结构
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 全局布局
│   ├── page.tsx           # 首页
│   ├── globals.css        # 全局样式
│   ├── projects/          # 项目管理路由
│   ├── commits/           # Commit管理路由
│   ├── webhooks/          # Webhook管理路由
│   └── repositories/      # 仓库管理路由
├── components/             # 业务组件
│   ├── projects/          # 项目相关组件
│   ├── repository/        # 仓库相关组件
│   └── webhooks/          # Webhook相关组件
└── omni.tsx               # 全局工具和类型
```

### 核心模块

#### 1. 项目管理模块
- **项目列表** (`/projects`)：项目概览、CRUD操作
- **项目详情** (`/projects/[name]`)：环境管理、分支规划

#### 2. 分支管理模块
- **状态管理**：testing → completed → merged
- **时间规划**：生效时间、失效时间
- **特殊分支**：dev (STG环境)、master (PROD环境)

#### 3. Commit管理模块
- **审核流程** (`/commits`)：同意、拒绝、查看
- **状态同步**：与分支状态联动

#### 4. Webhook模块
- **机器人管理** (`/webhooks`)：通知配置
- **集成支持**：分支关联、自动通知

## 📋 业务流程

### 1. 项目创建流程
```mermaid
graph TD
    A[新增项目] --> B[填写项目信息]
    B --> C[配置环境]
    C --> D[保存项目]
    D --> E[项目列表更新]
```

### 2. 分支部署流程
```mermaid
graph TD
    A[规划部署] --> B[选择分支]
    B --> C[设置时间]
    C --> D[关联机器人]
    D --> E[保存配置]
    E --> F[自动生效]
```

### 3. 测试审核流程
```mermaid
graph TD
    A[分支测试] --> B[测试完成]
    B --> C[合并代码]
    C --> D[生成Commit]
    D --> E[提交审核]
    E --> F{审核结果}
    F -->|同意| G[分支合并]
    F -->|拒绝| H[回到测试]
```

## 🔧 技术特性

### 前端技术
- **组件化设计**：可复用的业务组件
- **类型安全**：完整的TypeScript类型定义
- **状态管理**：基于React Hooks的状态管理
- **数据持久化**：LocalStorage + StorageEvent同步
- **响应式设计**：适配不同屏幕尺寸

### 业务特性
- **智能分支管理**：自动状态转换、冲突检测
- **时间规划**：精确到分钟的时间控制
- **多环境支持**：STG、PROD环境隔离
- **审核机制**：完整的代码审核流程
- **通知集成**：Webhook机器人自动通知

## 📊 数据模型

### 核心实体
- **Project**：项目基础信息
- **Branch**：分支状态和时间信息
- **Commit**：代码合并记录
- **Robot**：Webhook通知机器人

### 状态管理
- **分支状态**：testing → active → completed → merged
- **Commit状态**：pending → approved/rejected
- **环境状态**：实时显示当前生效分支

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 访问应用
- 开发环境：http://localhost:3000
- 项目列表：http://localhost:3000/projects
- Commit管理：http://localhost:3000/commits
- Webhook管理：http://localhost:3000/webhooks

## 📖 使用指南

### 1. 项目管理
1. 访问项目列表页面
2. 点击"新增项目"创建项目
3. 配置项目仓库和环境信息
4. 进入项目详情进行分支管理

### 2. 分支规划
1. 在项目详情页点击"规划部署"
2. 选择分支和设置生效时间
3. 关联通知机器人
4. 保存配置等待自动生效

### 3. 特殊分支部署
1. 点击"部署dev"或"部署master"
2. 查看已合并分支列表
3. 确认部署操作
4. 分支自动生效

### 4. 代码审核
1. 分支测试完成后点击"合并代码"
2. 系统生成Commit记录
3. 在Commit列表进行审核
4. 审核结果自动同步到分支状态

## 🔍 故障排除

### 常见问题

#### 1. 数据丢失
- **原因**：LocalStorage被清空
- **解决**：系统会自动初始化默认数据

#### 2. 分支状态异常
- **原因**：并发操作导致状态不一致
- **解决**：刷新页面重新加载数据

#### 3. 时间显示错误
- **原因**：时区设置问题
- **解决**：检查系统时区设置

### 调试工具
- 浏览器开发者工具
- LocalStorage查看器
- Console日志输出

## 📈 性能优化

### 已实现优化
- **组件懒加载**：按需加载页面组件
- **数据缓存**：LocalStorage持久化
- **防抖处理**：用户输入防抖
- **表格虚拟化**：大数据量表格优化

### 建议优化
- **服务端渲染**：提升首屏加载速度
- **CDN部署**：静态资源加速
- **数据分页**：减少单次数据加载量

## 🔐 安全考虑

### 数据安全
- 前端数据存储在LocalStorage
- 敏感信息不在前端存储
- Webhook URL验证

### 操作安全
- 关键操作二次确认
- 状态变更日志记录
- 错误操作可回退

## 📝 更新日志

### v1.0.0 (2025-01-15)
- ✨ 完整的项目管理功能
- ✨ 分支生命周期管理
- ✨ Commit审核流程
- ✨ Webhook通知集成
- ✨ 响应式UI设计

## 🤝 贡献指南

### 开发规范
- 使用TypeScript开发
- 遵循ESLint规则
- 组件命名使用PascalCase
- 函数命名使用camelCase

### 提交规范
- feat: 新功能
- fix: 错误修复
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构

## 📞 支持与反馈

### 技术支持
- 查看技术实现文档获取详细信息
- 检查数据结构文档了解接口规范
- 参考业务需求文档理解功能逻辑

### 问题反馈
- 功能建议：提交Feature Request
- Bug报告：提交Bug Report
- 文档问题：提交Documentation Issue

---

## 📚 相关文档链接

- [完整业务需求文档](./完整业务需求文档.md) - 详细的功能需求和业务规则
- [技术实现文档](./技术实现文档.md) - 代码结构和实现细节
- [数据结构与接口文档](./数据结构与接口文档.md) - 数据模型和API规范
- [项目页面需求说明](./项目页面-需求说明.md) - 项目模块专项需求
- [定时发布需求](./定时发布.md) - 分支部署时间管理需求

---

*最后更新：2025年1月15日*

## 🧩 项目初始化（Project Init）

1. 环境准备
   - Node.js 18+
   - npm 或 yarn
2. 安装与启动
   ```bash
   npm install
   npm run dev
   ```
3. 本地数据初始化（前端原型，使用 LocalStorage）
   - 进入 “项目列表” → 点击“新增项目” 完成最小化配置；或使用浏览器控制台快速写入（可选）：
   ```js
   // 最小示例，仅供开发期演示
   localStorage.setItem('omni-projects', JSON.stringify({
     demo: {
       id: 'demo', name: 'demo', envCount: 1, createdAt: new Date().toISOString(),
       repos: ['https://github.com/your/repo']
     }
   }))
   ```
   - 机器人（Webhook）示例（可选）：
   ```js
   localStorage.setItem('omni-webhooks', JSON.stringify([
     { id: 'bot-1', name: 'Release Bot', enabled: true }
   ]))
   ```

---

## 🔗 GitHub 初始化（Discussions / Giscus）

本项目评论功能基于 Giscus（GitHub Discussions）。需在你的仓库完成以下配置：

1. 在 GitHub 仓库启用 Discussions
   - Settings → General → Discussions → 勾选 “Enable discussions”
2. 安装并配置 Giscus
   - 打开 `https://giscus.app`，登录后选择你的仓库
   - 选择 Discussion 分类（建议：Announcements 或 Q&A）
   - 记下以下信息（giscus 页面会自动生成）：
     - repo（形如 `owner/name`）
     - repo-id
     - category（名称）
     - category-id
3. 在代码中更新 Giscus 配置（如需）
   - 位置：`src/components/comments/GiscusComments.tsx`
   - 更新以下属性值：
   ```ts
   script.setAttribute('data-repo', 'your/repo')
   script.setAttribute('data-repo-id', 'REPO_ID')
   script.setAttribute('data-category', 'Announcements')
   script.setAttribute('data-category-id', 'CATEGORY_ID')
   // 其他可选项：mapping/strict/reactions/input-position/theme/lang
   ```
   - 本项目已默认配置为 `pathname` 映射：不同页面路径对应不同讨论串。

提示：若你更换了仓库或分类，务必同步更新以上 4 个关键字段，否则评论区将无法正常关联到你的 Discussions。

---