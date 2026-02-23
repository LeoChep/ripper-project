import * as PIXI from "pixi.js";
export class MapContainer extends PIXI.Container {
    containsPoint(point: PIXI.Point): boolean {
        // 这里可以添加逻辑来判断是否应该拦截点击事件
        // 例如，如果地图容器上有某些元素需要响应点击，可以返回 true
        // 否则返回 false 以允许事件继续传播到下层元素
        console.log("MapContainer containsPoint called with point:", point);
        return false; // 返回 false 以允许事件继续传播
    }
}