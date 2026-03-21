# 半导体智能知识库审核前端

基于 `Vue 3 + TypeScript + Vite + Tailwind CSS v4` 的审核工作台前端，用于半导体知识库问答（QA）的人审流程。

## 1. 项目目标
- 支撑 `pending -> reviewed / deprecated` 的审核闭环。
- 支撑管理员/审核员/观察员的角色化访问。
- 对接后端审核接口，确保字段与接口契约严格一致。

## 2. 当前已实现
- 登录与路由守卫（Pinia + Vue Router）。
- 待审核队列页。
- 审核详情页：编辑、提交通过、标记废弃。
- 任务分配：批量分配、领取到我、取消分配。
- 筛选器：关键词、主题、场景、最低置信度、分配人、仅看我的任务。
- 草稿自动保存：按 `qaId + version` 写入 `localStorage`，支持恢复与清除。
- 统计页与历史页基础能力。
- Mock 模式与真实接口模式双通道。

## 3. 技术栈
- Vue 3（Composition API）
- TypeScript
- Vite 8
- Tailwind CSS v4
- Pinia
- Vue Router 4
- Axios

## 4. 项目结构
```txt
src/
  app/                # 应用级入口、router、provider
  components/
    business/         # 业务组件（筛选器、分配面板）
  layouts/            # 布局（登录布局、主布局）
  pages/              # 页面（队列、详情、统计、历史）
  services/
    api/              # API 调用层
    mock/             # Mock 数据实现
    http.ts           # Axios 实例与拦截器
  stores/             # Pinia 状态（auth/qa/ui）
  types/              # 领域类型定义
  utils/              # 工具函数
```

## 5. 快速开始
### 5.1 安装依赖
```bash
npm install
```

### 5.2 本地开发
```bash
npm run dev
```

### 5.3 生产构建
```bash
npm run build
```

## 6. 环境变量
在根目录 `.env` 中配置：

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCK=true
VITE_API_TIMEOUT=10000
```

说明：
- `VITE_USE_MOCK=true` 时走本地 mock 数据。
- `VITE_USE_MOCK=false` 时走真实后端。
- 当前默认 `BASE_URL + /qa/...`，例如：`/api/v1/qa/pending`。

## 7. 后端契约对齐说明
当前前端按以下审核接口对齐：
- `GET /qa/pending?limit=...`
- `GET /qa/{id}`
- `PUT /qa/{id}`
- `GET /qa/stats`
- `GET /qa-pairs`

并在 `src/services/api/qa.api.ts` 中增加了响应字段运行时校验：
- 字段缺失
- 字段类型不匹配
- 状态枚举非法

会直接抛出错误，避免“后端改字段但前端静默失败”。

## 8. 任务分配实现说明
文档中未定义独立 `assign` 接口，因此前端分配逻辑采用：
1. 读取 `GET /qa/{id}` 当前数据。
2. 通过 `PUT /qa/{id}` 回写完整 payload，仅更新 `reviewer`，状态保持 `pending`。

如果后端后续提供独立分配接口，可在 `src/services/api/qa.api.ts` 中切换实现。

## 9. 草稿机制
审核详情页会自动保存草稿到 `localStorage`：
- Key: `review_draft_{qaId}`
- 版本隔离：仅恢复同 `version` 草稿
- 提交成功后自动删除草稿

## 10. 后续建议
- 接入后端 OpenAPI 文档，自动生成 TS 类型，进一步收敛契约漂移。
- 为审核流程补充 E2E（登录 -> 分配 -> 审核 -> 统计刷新）。
- 增加服务端分页与虚拟列表联动优化。
