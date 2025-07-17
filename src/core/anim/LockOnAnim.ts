import { golbalSetting } from "../golbalSetting";
import * as envSetting from "../envSetting";

export const lockOn=(x:number,y:number)=>{
    const rootContainer = golbalSetting.rootContainer;
    const appSetting = envSetting.appSetting;
    if (rootContainer) {
        rootContainer.x =Math.floor((appSetting.width / 2 - x)/envSetting.tileSize)*envSetting.tileSize;
        rootContainer.y = Math.floor((appSetting.height / 2 - y)/envSetting.tileSize)*envSetting.tileSize;
    }
}