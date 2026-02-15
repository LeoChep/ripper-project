import { golbalSetting } from "../golbalSetting";
import * as envSetting from "../envSetting";

export const lookOn=(x:number,y:number)=>{
    const rootContainer = golbalSetting.rootContainer;
    const appSetting = envSetting.appSetting;
    const centerX=Math.floor((appSetting.width / 2 - x)/envSetting.tileSize)*envSetting.tileSize;
    const centerY=Math.floor(((appSetting.height) / 2 - y)/envSetting.tileSize)*envSetting.tileSize;
    
    if (rootContainer&&rootContainer._position&&golbalSetting.map) {
        // if (centerX < 0) {
        //     rootContainer.x = centerX;
        // }
        console.log('golbalSetting.map?.width*envSetting.tileSize',centerX,golbalSetting.map?.width*envSetting.tileSize-centerX);
        if (golbalSetting.map?.width*envSetting.tileSize<appSetting.width) {
            rootContainer.x =  (appSetting.width-golbalSetting.map?.width*envSetting.tileSize)/2;
        }
        else if (golbalSetting.map?.width*envSetting.tileSize-centerX<appSetting.width) {
            rootContainer.x =  appSetting.width-golbalSetting.map?.width*envSetting.tileSize;
        }else if (centerX >0 ) {
            rootContainer.x = 0;
        }else {
            rootContainer.x = centerX;
        }
              console.log('golbalSetting.map?.height*envSetting.tileSize',centerY,golbalSetting.map?.height*envSetting.tileSize-centerY,appSetting.height);
        if (golbalSetting.map?.height*envSetting.tileSize<appSetting.height-envSetting.pannelHeight) {
            rootContainer.y =  (appSetting.height-golbalSetting.map?.height*envSetting.tileSize)/2;
        }
        else if (golbalSetting.map?.height*envSetting.tileSize+centerY<appSetting.height) {
            rootContainer.y =  appSetting.height-golbalSetting.map?.height*envSetting.tileSize;
        }else if (centerY >0 ) {
            rootContainer.y = 0;
        }else {
            rootContainer.y = centerY;
        }

       
    }
}