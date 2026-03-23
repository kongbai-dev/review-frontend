# 半导体智能知识库审核前端

基于 `Vue 3 + TypeScript + Vite + Tailwind CSS v4` 的审核工作台前端，用于半导体知识库问答（QA）的人审流程。

## 1. 项目目标
- 支持 `pending -> reviewed / deprecated` 的审核闭环。
- 支持管理员 / 审核员 / 观察员的角色化访问。
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
- 人工添加问答对：可在队列页直接补录并进入审核流。
- 队列页 / 历史页分页显示，减少长列表一次性渲染压力。
- E2E 测试骨架：覆盖登录 -> 人工添加 -> 审核 -> 统计刷新主流程。

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
    business/         # 业务组件（筛选器、分配面板、分页、人工录入表单）
  layouts/            # 布局（登录布局、主布局）
  pages/              # 页面（队列、详情、统计、历史）
  services/
    api/              # API 调用层
    mock/             # Mock 数据实现
    http.ts           # Axios 实例与拦截器
  stores/             # Pinia 状态（auth/qa/ui）
  types/              # 领域类型定义
  utils/              # 工具函数
e2e/                  # Playwright E2E 用例
playwright.config.ts  # Playwright 配置
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
# 可选：真实后端新增 QA 接口
# VITE_QA_CREATE_ENDPOINT=/qa
```

说明：
- `VITE_USE_MOCK=true` 时走本地 mock 数据。
- `VITE_USE_MOCK=false` 时走真实后端。
- `VITE_QA_CREATE_ENDPOINT` 为可选项，用于真实后端启用“人工添加问答对”。
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
- 列表响应兼容数组与 `{ items, total }`

会直接抛出错误，避免“后端改字段但前端静默失败”。

## 8. 人工添加问答对
- 入口位于待审核队列页顶部。
- `Mock` 模式下可直接创建 `pending` 问答对，并跳转到审核详情页。
- 真实后端模式下，需要在 `.env` 中配置 `VITE_QA_CREATE_ENDPOINT`。
- 可选补充参考片段、来源、页码范围，便于后续审核追踪。

## 9. 分页与列表优化
- 待审核队列与审核历史均改为分页展示。
- 过滤仍在前端完成，交互上保持现有筛选体验不变。
- API 层已经兼容 `ListResponse` 形态，为后端后续切换真正的服务端分页预留接口适配位。

## 10. 草稿机制
审核详情页会自动保存草稿到 `localStorage`：
- Key: `review_draft_{qaId}`
- 版本隔离：仅恢复同 `version` 草稿
- 提交成功后自动删除草稿

## 11. E2E 测试
当前仓库已补充 Playwright 测试骨架：
- 文件：`e2e/review-flow.spec.ts`
- 流程：登录 -> 人工添加 -> 审核通过 -> 统计刷新

如需执行：
```bash
npm install -D @playwright/test
npx playwright install
npx playwright test
```

说明：
- 该测试默认跑 `mock` 模式。
- 当前仅提交了测试骨架与配置文件，未在本次变更中拉取新依赖。

## 12. 后续建议状态
- OpenAPI 自动生成类型：已预留接口契约兼容位，但仓库内暂无现成 OpenAPI 文档，下一步建议接入真实 `openapi.json/yaml` 后生成。
- 审核流程 E2E：已补充 Playwright 骨架，可继续扩展更多断言与角色场景。
- 服务端分页与列表优化：前端分页已落地，API 层已兼容分页响应，后续可在后端提供分页参数后无缝切换。
