# 面向高密度接入的智能楼宇全光网架管理系统

毕业设计演示系统：**POL（Passive Optical LAN）智能楼宇全光网管**。纯前端 + Mock 数据，便于答辩演示与 GitHub Pages 静态托管。

演示地址：https://ibi6.github.io/smart-building-pol/

仓库：https://github.com/ibi6/smart-building-pol

## 课题背景（简述）

传统综合布线在高密度办公楼宇中面临铜缆距离短、弱电间多、扩容难、能耗高等问题。基于 PON 的全光局域网（POL）采用 **OLT + ODN（无源分光）+ ONU/光 AP** 二级分光架构，一根光纤覆盖楼宇，支持 GPON / XGS-PON，适合办公、访客、安防、物联等多业务统一承载。本系统模拟一栋智能楼宇的网管视角，展示拓扑、设备、高密度接入与运维定界能力。

## 架构说明（POL 二级架构）

```
园区/楼宇核心交换机
        │
   ┌────┴────┐
 OLT-A     OLT-B     ← 双归属保护（示意）
   │         │
 一级分光(1:8) …     ← 弱电间
   │
 二级分光(1:8) …     ← 楼层走廊配线
   │
 ONU / 光网 AP       ← 房间 / 开放办公 / 安防 / 物联
```

末端等效分光比约 **1:64**。系统演示数据含 Combo（GPON + XGS-PON）速率字段。

## 功能清单

| 模块 | 说明 |
|------|------|
| 指挥总览 | 接入容量、OLT/ONU 在线、带宽利用率、并发用户、告警摘要、趋势图 |
| 全光拓扑 | ECharts 关系图：OLT → 多级 ODN → ONU/AP，点击看详情，支持漫游缩放 |
| 设备资产 | OLT / 分光器 / ONU·光 AP 列表（状态、型号、楼层房间、上下行、分光比） |
| 高密态势 | 按楼层区域展示终端密度、并发、热点；柱状图 + 热力图 |
| 业务切片 | 办公 / 访客 / 安防 / 物联 VLAN 切片视图与带宽占用 |
| 告警运维 | 告警列表、确认操作、光路/设备/端口故障定界说明 |
| 方案测算 | 输入楼层/点位/并发/业务/带宽/冗余/预算，规则引擎输出最优全光组网方案与设备清单 |

## 技术栈

- Vue 3 + Vite + TypeScript
- Element Plus（深色科技风）
- ECharts / vue-echarts（拓扑、趋势、热力）
- Vue Router（Hash 模式，适配 GitHub Pages）
- 纯前端 Mock，无后端依赖
- 答辩级视觉：青紫霓虹设计系统、指挥中心总览、拓扑光点流动、方案测算进度环；侧栏可开关动效

## 本地启动

```bash
npm install
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

生产构建产物目录：`dist/`。Vite `base` 为 `/smart-building-pol/`，与 GitHub Pages 项目站点路径一致。

## 目录结构

```
smart-building-pol/
├── public/
├── src/
│   ├── components/
│   ├── layouts/          # 主框架布局
│   ├── mock/data.ts      # 楼宇 / OLT / ODN / ONU / 告警等模拟数据
│   ├── planner/engine.ts  # 方案测算规则引擎
│   ├── router/
│   ├── types/
│   ├── views/            # 六大功能页
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## GitHub Pages

通过 GitHub Actions 将 `dist` 发布到 `gh-pages` 分支。推送 `main` 后自动部署。

预期 URL：https://ibi6.github.io/smart-building-pol/

## 说明

本仓库为毕业设计**演示系统**，设备型号与告警数据均为模拟，不连接真实 OLT/ONU。答辩时可按左侧菜单依次演示总览 → 拓扑 → 设备 → 高密度 → 切片 → 告警定界。
