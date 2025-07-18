import { golbalSetting } from "../golbalSetting";
import * as envSetting from "../envSetting";

export const lockOn=(x:number,y:number)=>{
    const rootContainer = golbalSetting.rootContainer;
    const appSetting = envSetting.appSetting;
    const centerX=Math.floor((appSetting.width / 2 - x)/envSetting.tileSize)*envSetting.tileSize;
    const centerY=Math.floor((appSetting.height / 2 - y)/envSetting.tileSize)*envSetting.tileSize;
    if (rootContainer) {

        rootContainer.x =centerX<0? centerX : 0;
        rootContainer.y = centerY<0? centerY : 0;
    }
}