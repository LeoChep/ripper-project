# CYCLOPS 自定义动画

## 用途

此文件夹用于存放非标准动画，如:
- 特殊技能动画
- 受击状态变体
- 环境交互动画

## 文件命名规范

- `<animation_name>.png` - 单个动画精灵图
- `<animation_name>.json` - 动画配置

## 配置示例

```json
{
  "name": "special_attack",
  "frames": [0, 1, 2, 3],
  "fps": 12,
  "loop": false
}
```
