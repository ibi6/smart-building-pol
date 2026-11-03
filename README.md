# 面向高密度接入的智能楼宇全光网架管理系统

毕业设计演示系统：基于 **POL（Passive Optical LAN）** 的楼宇全光局域网网管界面。纯前端 + Mock 数据，可部署于 GitHub Pages。

演示地址：https://ibi6.github.io/smart-building-pol/

仓库：https://github.com/ibi6/smart-building-pol

## 课题背景

传统综合布线在高密度办公楼中存在铜缆距离短、弱电间多、扩容与能耗压力大等问题。POL 采用 **OLT + ODN（无源分光）+ ONU/光 AP** 的二级分光架构，用光纤覆盖楼宇，支持 GPON / XGS-PON，可统一承载办公、访客、安防、物联等业务。本系统从网管视角演示拓扑、设备、接入性能、告警定界与组网规划。

## 架构说明（POL 二级分光）

```
楼宇核心交换机
      │
 ┌────┴────┐
OLT-A    OLT-B     ← 可选双归属
 │         │
一级分光(如 1:8)
 │
二级分光(如 1:8)
 │
ONU / 光 AP
```

末端等效分光比常见为 1:64 量级。演示数据含 GPON / XGS-PON（Combo）速率字段。

## 功能清单

| 模块 | 说明 |
|------|------|
| 网络总览 | 接入容量、OLT/ONU 在线、带宽利用率、并发、告警摘要与趋势 |
| 网络拓扑 | OLT → 多级 ODN → ONU/AP 关系图，点击查看详情 |
| 设备管理 | OLT / 分光器 / ONU·光 AP 列表（状态、型号、位置、速率、分光比） |
| 接入性能 | 按楼层统计终端密度、并发与热点；柱状图与热力图 |
| 业务划分 | 办公 / 访客 / 安防 / 物联等 VLAN 切片与带宽占用 |
| 告警管理 | 告警列表、确认、光路/设备/端口定界说明 |
| 组网规划 | 按楼层/点位/并发估算制式与分光，含公式、BOM、风险与成本/性能对照 |

## 技术栈

- Vue 3 + Vite + TypeScript
- Element Plus（深色主题）
- ECharts / vue-echarts
- Vue Router（Hash，适配 GitHub Pages）
- 纯前端 Mock，无后端依赖

## 本地启动

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

产物目录：`dist/`。Vite `base` 为 `/smart-building-pol/`。

## 目录结构

```
smart-building-pol/
├── public/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── mock/data.ts
│   ├── planner/engine.ts   # 组网规划规则
│   ├── router/
│   ├── types/
│   ├── views/
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## GitHub Pages

`main` 分支推送后，Actions 将 `dist` 发布到 `gh-pages`。

预期 URL：https://ibi6.github.io/smart-building-pol/

## 说明

设备型号与告警均为模拟数据，不连接真实 OLT/ONU。侧栏可开关页面动效；系统遵循 `prefers-reduced-motion`。
