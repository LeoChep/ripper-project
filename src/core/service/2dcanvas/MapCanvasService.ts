import { FrontObjSystem } from "./../../system/FrontObjSystem";
import { golbalSetting } from "@/core/golbalSetting";
import { useCharacterStore } from "@/stores/characterStore";
import * as PIXI from "pixi.js";
import * as envSetting from "@/core/envSetting";
import { createDoorAnimSpriteFromDoor } from "@/core/anim/DoorAnimSprite";
import { createChestAnimSpriteFromChest } from "@/core/anim/ChestAnimSprite";
import type { Unit } from "@/core/units/Unit";
import { FogSystem } from "@/core/system/NewFogSystem";
import {
  getAnimActionSpriteJsonFile,
  getAnimMetaJsonFile,
  getAnimSpriteImgUrl,
} from "@/utils/utils";
import { AnimMetaJson } from "@/core/anim/AnimMetaJson";
import { UnitAnimSpirite } from "@/core/anim/UnitAnimSprite";
import type { Creature } from "@/core/units/Creature";
import { createFrontObjAnimSpriteFromFront } from "@/core/anim/FrontObjAnimSprite";
import { MapContainer } from "@/core/anim/MapContainer";
import { DramaSystem } from "@/core/system/DramaSystem";
import { frustumCullService } from "./FrustumCullService";

export class MapCanvasService {
  constructor() {}
  static instance: MapCanvasService | null = null;
  static getInstance(): MapCanvasService {
    if (!MapCanvasService.instance) {
      MapCanvasService.instance = new MapCanvasService();
    }
    return MapCanvasService.instance;
  }
  clear = () => {
    const characterStore = useCharacterStore();
    characterStore.characters = [];
    const rootContainer = golbalSetting.rootContainer;
    const clearContainer = (container: any) => {
      if (container.children) {
        const children = container.children;
        for (let i = container.children.length - 1; i >= 0; i--) {
          const child = container.children[i];
          children.push(child);
        }
        children.forEach((child: any) => {
          clearContainer(child);
        });
        container.destroy();
      } else {
        // container.parent.removeChild(container);
        container.destroy();
      }
    };
    if (rootContainer) {
      clearContainer(rootContainer);
      console.log("清空容器完成", rootContainer.parent);
      rootContainer.destroy();
    }
    characterStore.clearCharacters();
  };
  createContainer = () => {
    const app = golbalSetting.app;
    const rlayers = golbalSetting.rlayers;
    if (!app || !rlayers) {
      throw new Error("App or render layers not initialized");
    }
    if (!rlayers.basicLayer) {
      throw new Error("Basic layer not initialized");
    }
    app.stage.interactive = true;
    const container = new PIXI.Container();
    // 创建一个 800x600 的矩形图形作为底盘
    const rect = new PIXI.Graphics();
    // rect.rect(0, 0, 20000, 20000);
    // rect.fill({ color: "black" }); // 黑色填充
    container.addChild(rect);
    container.eventMode = "static";
    rlayers.basicLayer.attach(container);
    app.stage.addChild(container);
    const spriteContainer = new PIXI.Container();
    const mapContainer = new MapContainer();
    const tipContainer = new PIXI.Container();
    spriteContainer.label = "spriteContainer";
    mapContainer.label = "mapContainer";
    container.addChild(spriteContainer);
    container.addChild(mapContainer);
    app.stage.addChild(tipContainer);
    spriteContainer.zIndex = envSetting.zIndexSetting.spriteZIndex;
    mapContainer.zIndex = envSetting.zIndexSetting.mapZindex;
    tipContainer.zIndex = envSetting.zIndexSetting.tipZIndex;
    // spriteContainer.eventMode = 'none';
    mapContainer.eventMode = "static";
    mapContainer.interactiveChildren = true;

    // 设置全局变量
    golbalSetting.spriteContainer = spriteContainer;
    golbalSetting.mapContainer = mapContainer;
    golbalSetting.rootContainer = container;
    golbalSetting.tipContainer = tipContainer;
    return container;
  };
  // 辅助函数：根据地图初始化
  initByMap = async (mapPassiable: any) => {
    // golbalSetting.map = mapPassiable;
    const container = golbalSetting.rootContainer;
    const rlayers = golbalSetting.rlayers;
    const units = mapPassiable.sprites;
    const mapView = mapPassiable.textures;

    // 绘制地图（现在是异步的，会先绘制遮罩）
    await this.drawMap(mapView, container, rlayers);
    console.log(units);

    // 等待一帧，确保战争迷雾遮罩已经完全渲染
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // 创建门
    const doors = mapPassiable.doors;
    const doorPromises: Promise<any>[] = [];
    doors.forEach((door: any) => {
      const promise = createDoorAnimSpriteFromDoor(door).then((doorSprite) => {
        doorSprite.visible = false; // 默认不可见，由战争迷雾系统控制
        if (container) container.addChild(doorSprite);
        if (rlayers.controllerLayer) rlayers.controllerLayer.attach(doorSprite);
        door.doorSprite = doorSprite;
      });
      doorPromises.push(promise);
    });
    await Promise.all(doorPromises);

    // 创建宝箱
    const chests = mapPassiable.chests;
    if (chests && chests.length > 0) {
      const chestPromises: Promise<any>[] = [];
      chests.forEach((chest: any) => {
        const promise = createChestAnimSpriteFromChest(chest).then(
          (chestSprite) => {
            chestSprite.visible = false; // 默认不可见，由战争迷雾系统控制
            if (container) container.addChild(chestSprite);
            if (rlayers.spriteLayer) rlayers.spriteLayer.attach(chestSprite);
            console.log(
              "Created chest sprite:",
              chest.id,
              "at",
              chest.x,
              chest.y
            );
          }
        );
        chestPromises.push(promise);
      });
      await Promise.all(chestPromises);
    }
    console.log("创建宝箱:", chests);

    // 创建前景
    console.log("加载前景物件信息...", mapPassiable.name);
    await FrontObjSystem.getInstance().loadAsset(mapPassiable.name);
    const frontObjs = mapPassiable.frontObjs;
    if (frontObjs && frontObjs.length > 0) {
      const frontObjPromises: Promise<any>[] = [];
      frontObjs.forEach((obj: any) => {
        const promise = createFrontObjAnimSpriteFromFront(
          obj,
          mapPassiable.name
        ).then((objSprite) => {
          if (!objSprite) {
            console.error(
              `Failed to create sprite for front object: ${obj.name}`
            );
            return;
          }
          objSprite.visible = true; // 默认不可见，由战争迷雾系统控制
          if (container) container.addChild(objSprite);
          if (rlayers.spriteLayer) rlayers.spriteLayer.attach(objSprite);
          console.log(
            "Created front object sprite:",
            obj.id,
            "at",
            obj.x,
            obj.y
          );
        });
        frontObjPromises.push(promise);
      });
      await Promise.all(frontObjPromises);
    }

    // console.log("创建前景物件:", frontObjs);
    // 创建单位
    let createEndPromise: Promise<any>[] = [];
    units.forEach((unit: Unit) => {
      if (unit.state == "dead") {
        return;
      }
      const promise = this.generateAnimSprite(unit);
      createEndPromise.push(promise);
    });

    if (createEndPromise.length > 0) await Promise.all(createEndPromise);
    // mapPassiable.sprites = units;
    console.log("所有单位创建完成:", units);
    const characterStore = useCharacterStore();
    characterStore.clearCharacters();
    units.forEach((unit: any) => {
      if (unit.party === "player") {
        characterStore.addCharacter(unit);
        console.log("characterStore", characterStore);
      }
    });

    // 绘制格子（在地图加载完成后绘制）
    // drawGrid(golbalSetting.app, rlayers);
  };

  // 辅助函数：绘制地图（2D）
  drawMap2D = async (mapView: any, container: any, rlayers: any) => {
    if (golbalSetting.mapContainer) {
      golbalSetting.mapContainer.children.forEach((child: any) => {
        golbalSetting.mapContainer!.removeChild(child);
        child.destroy();
      });
    }

    // 先初始化战争迷雾系统并绘制初始遮罩
    if (golbalSetting.map && golbalSetting.rootContainer && golbalSetting.app) {
      FogSystem.initFog(
        golbalSetting.map,
        golbalSetting.rootContainer,
        golbalSetting.app
      );

      // 立即计算并绘制一次迷雾，确保在地图显示前遮罩已经存在
      // const visibilityData = FogSystem.instanse.caculteVersionByPlayers();
      // if (visibilityData) {
      //   FogSystem.instanse.makeFogOfWar(visibilityData);
      // }
    }
    // 启动自动绘制循环

    // 等待一帧，确保遮罩已经渲染

    await new Promise((resolve) => FogSystem.instanse.autoDraw(resolve));
    FogSystem.instanse.refreshSpatialGrid(true);
    // document.addEventListener('keydown', (e) => {
    //   if (e.key === 'F') {
    //     FogSystem.instanse.testStopFlag=true;
    //   }})
    // 再绘制地图
    const ms = new PIXI.Sprite(mapView);
    ms.eventMode = "static";
    ms.zIndex = envSetting.zIndexSetting.mapZindex;
    ms.label = "map";
    if (golbalSetting.mapContainer) {
      golbalSetting.mapContainer.addChild(ms);
    }
  };

  // 辅助函数：绘制地图（2.5D）
  drawMap25D = async (_mapView: any, _container: any, _rlayers: any) => {
    // TODO: 实现 2.5D 渲染逻辑
       if (golbalSetting.mapContainer) {
      golbalSetting.mapContainer.children.forEach((child: any) => {
        golbalSetting.mapContainer!.removeChild(child);
        child.destroy();
      });
    }

    // 先初始化战争迷雾系统并绘制初始遮罩
    if (golbalSetting.map && golbalSetting.rootContainer && golbalSetting.app) {
      FogSystem.initFog(
        golbalSetting.map,
        golbalSetting.rootContainer,
        golbalSetting.app
      );

      // 立即计算并绘制一次迷雾，确保在地图显示前遮罩已经存在
      // const visibilityData = FogSystem.instanse.caculteVersionByPlayers();
      // if (visibilityData) {
      //   FogSystem.instanse.makeFogOfWar(visibilityData);
      // }
    }
    // 启动自动绘制循环

    // 等待一帧，确保遮罩已经渲染

    // await new Promise((resolve) => FogSystem.instanse.autoDraw(resolve));
    // FogSystem.instanse.refreshSpatialGrid(true);
    // document.addEventListener('keydown', (e) => {
    //   if (e.key === 'F') {
    //     FogSystem.instanse.testStopFlag=true;
    //   }})
    // 再绘制地图

    // 等待 canvas 元素可用
    const canvas = await new Promise<HTMLCanvasElement>((resolve) => {
      const checkCanvas = () => {
        const el = document.getElementById('viewport-canvas') as HTMLCanvasElement;
        if (el && el.width > 0 && el.height > 0) {
          console.log('Canvas found:', el.width, 'x', el.height);
          resolve(el);
        } else {
          console.log('Waiting for canvas...');
          requestAnimationFrame(checkCanvas);
        }
      };
      checkCanvas();
    });

    // 设置视窗大小到裁剪服务
    frustumCullService.setViewportSize(canvas.width, canvas.height);
    console.log('[FrustumCull] 视窗大小已设置:', canvas.width, 'x', canvas.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2d context');
      return;
    }

    // 2. 只创建一次纹理（PixiJS v8 官方写法）
    const dynamicTexture = PIXI.Texture.from(canvas);

    // 3. 只创建一次 Sprite
    const dynamicSprite = new PIXI.Sprite(dynamicTexture);

    // 设置精灵大小以匹配 canvas
    dynamicSprite.width = canvas.width;
    dynamicSprite.height = canvas.height;

    dynamicSprite.eventMode = "static";
    dynamicSprite.zIndex = envSetting.zIndexSetting.mapZindex;
    dynamicSprite.label = "map";
    if (golbalSetting.mapContainer) {
      golbalSetting.mapContainer.addChild(dynamicSprite);
    }

    const drawPixelContent = () => {
      // 1. 清空 Canvas

      // ==================== 关键：官方稳定更新 ====================
      // ✅ PixiJS v8 官方推荐，零报错，只更新数据
      dynamicTexture.source.update();
    };

    golbalSetting!.app!.ticker.add(drawPixelContent);
  };

  // 辅助函数：绘制地图（根据开关选择渲染方式）
  drawMap = async (mapView: any, container: any, rlayers: any) => {
    if (envSetting.is25dEnabled) {
      await this.drawMap25D(mapView, container, rlayers);
    } else {
      await this.drawMap2D(mapView, container, rlayers);
    }
  };
  // 辅助函数：生成动画精灵
  generateAnimSprite = async (unit: any) => {
    console.log("generateAnimSprite", unit);
    const container = golbalSetting.rootContainer;
    const rlayers = golbalSetting.rlayers;
    const mapPassiable = golbalSetting.map;
     let animSpriteUnit =  null
    try {
      animSpriteUnit = await this.createAnimSpriteUnits(unit);
    }
      catch (error) {
      return null;
      }

    unit.animUnit = animSpriteUnit;
    animSpriteUnit.zIndex = envSetting.zIndexSetting.spriteZIndex;

    console.log("generateAnimSprite", unit, animSpriteUnit);
    this.addAnimSpriteUnit(unit);
    animSpriteUnit.x =
      Math.round(unit.x / envSetting.tileSize) * envSetting.tileSize;
    animSpriteUnit.y =
      Math.round(unit.y / envSetting.tileSize) * envSetting.tileSize;
    unit.x = animSpriteUnit.x;
    unit.y = animSpriteUnit.y;
    return unit;
  };

  // 辅助函数：生成标准的 spritesheet JSON
  generateStandardSpriteJson = (
    animName: string,
    frameCount: number,
    onlySide: boolean,
    metaSize: { w: number; h: number }
  ): any => {
    const frames: any = {};
    const animations: any = {};

    // 定义方向：w(上), a(左), s(下), d(右)
    // 如果 onlySide 为 true，只使用 a 和 d
    const directions = onlySide ? ["d", "a"] : ["w", "a", "s", "d"];
    const directionCount = directions.length;

    // 根据 metaSize 和 frameCount 计算每帧的大小
    const frameWidth = metaSize.w / frameCount;
    const frameHeight = metaSize.h / directionCount;

    console.log(
      `计算帧大小: 宽度=${frameWidth}, 高度=${frameHeight}, 方向数=${directionCount}, 每行帧数=${frameCount}`
    );

    directions.forEach((dir, dirIndex) => {
      const animKey = `${animName}_${dir}`;
      animations[animKey] = [];

      for (let frame = 0; frame < frameCount; frame++) {
        const fileName = `${animName}_${dir}_${frame}.png`;
        animations[animKey].push(fileName);

        // 计算帧位置
        const x = frame * frameWidth;
        const y = dirIndex * frameHeight;

        frames[fileName] = {
          frame: { x, y, w: frameWidth, h: frameHeight },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
          sourceSize: { w: frameWidth, h: frameHeight },
        };
      }
    });

    return {
      frames,
      animations,
      meta: {
        version: "1.0",
        format: "RGBA8888",
        size: metaSize,
        scale: "1",
      },
    };
  };

  // 辅助函数：创建动画精灵单位
  createAnimSpriteUnits = async (unit: any) => {
    const unitTypeName = unit.unitTypeName;
    console.log("创建动画精灵单位:", unitTypeName, unit);
    const testJsonFetchPromise = getAnimMetaJsonFile(unitTypeName);
    const animMetaJson = new AnimMetaJson((await testJsonFetchPromise) as any);
    const animSpriteUnit = new UnitAnimSpirite(unit);

    animSpriteUnit.setFrameSize({
      width: animMetaJson.frameSize,
      height: animMetaJson.frameSize,
    });

    // 设置是否只使用左右朝向
    animSpriteUnit.onlySide = animMetaJson.onlySide;
    if (unit.creature) {
      console.log(
        "单位的视觉大小:",
        animSpriteUnit.visisualSizeValue,
        unit.creature.size
      );
      if (unit.creature.size == "big")
        animSpriteUnit.visisualSizeValue = {
          width: envSetting.tileSize * 2,
          height: envSetting.tileSize * 2,
        };
    } else {
      animSpriteUnit.visisualSizeValue = {
        width: envSetting.tileSize,
        height: envSetting.tileSize,
      };
    }
    for (const anim of animMetaJson.getAllExportedAnimations()) {
      console.log(anim);
      const spriteUrl = getAnimSpriteImgUrl(unitTypeName, anim, "standard");
      const sheetTexture = await PIXI.Assets.load(spriteUrl);
      console.log(anim);
      const jsonFetchPromise = getAnimActionSpriteJsonFile(
        unitTypeName,
        anim,
        "standard"
      );
      let json: any = await jsonFetchPromise;

      // 如果 JSON 不存在或没有 frames 属性，则自动生成
      if (!json || !json.frames||1) {
        console.log(
          `动画 ${anim} 的 JSON 文件不存在或缺少 frames 属性，自动生成标准 JSON`
        );
        const frameCount = animMetaJson.getFrameCount(anim);
        if (frameCount) {
          // 尝试从原 JSON 获取 meta.size，否则使用默认值
          const metaSize = json?.meta?.size || {
            w: frameCount * animMetaJson.frameSize,
            h: animMetaJson.frameSize * (animMetaJson.onlySide ? 2 : 4),
          };

          json = this.generateStandardSpriteJson(
            anim,
            frameCount,
            animMetaJson.onlySide,
            metaSize
          );
          console.log(`自动生成动画 ${anim} 的标准 JSON 完成，内容为`, json);
        } else {
          console.warn(`无法获取动画 ${anim} 的帧数，跳过`);
          continue;
        }
      }

      if (json && json.frames) {
        const spritesheet = new PIXI.Spritesheet(sheetTexture, json as any);
        await spritesheet.parse();
        console.log("创建动画精灵单位 - 加载完成:", anim, spritesheet);
        animSpriteUnit.addAnimationSheet(anim, spritesheet);
      }
    }
    // setTimeout(() => {
    //   animSpriteUnit.anims["walk"].renderable = true;
    // }, 6000);

    return animSpriteUnit;
  };

  openDetail = (unit: Unit, creature: Creature) => {};
  // 辅助函数：添加动画精灵单位
  addAnimSpriteUnit = (unit: any) => {
    const animSpriteUnit = unit.animUnit;
    console.log("addAnimSpriteUnit", unit);
    const rlayers = golbalSetting.rlayers;
    if (!rlayers || !golbalSetting.spriteContainer || !rlayers.spriteLayer) {
      console.error("渲染层或精灵容器未初始化，无法添加动画精灵单位");
      return;
    }
    rlayers.spriteLayer.attach(animSpriteUnit);
    animSpriteUnit.eventMode = "static";
    animSpriteUnit.on("click",(event:any)=>{
           if (unit.name) {
        // 这里可以触发选择事件，但为了保持简洁，暂时移除选择逻辑
            DramaSystem.getInstance().checkInteraction(unit.name)
      }
    })
    animSpriteUnit.on("rightclick", (event: any) => {
      if (unit.creature) {
        // 这里可以触发选择事件，但为了保持简洁，暂时移除选择逻辑
        console.log("Clicked on unit:", unit.unitTypeName);
        if (unit.party === "player" || unit.party !== "true") {
          console.log("这是玩家角色，打开角色面板");
          this.openDetail(unit, unit.creature);
        } else {
          console.log("这是非玩家角色，打开生物信息面板");
        }
      }
    });
    if (golbalSetting.spriteContainer) {
      golbalSetting.spriteContainer.addChild(animSpriteUnit);
    }
  };
  createRenderLayers = (app: any) => {
    const rlayers: any = {
      basicLayer: null,
      spriteLayer: null,
      lineLayer: null,
      fogLayer: null,
      selectLayer: null,
      controllerLayer: null,
    };
    rlayers.basicLayer = new PIXI.RenderLayer();
    rlayers.spriteLayer = new PIXI.RenderLayer();
    rlayers.spriteLayer.sortableChildren = true;
    rlayers.lineLayer = new PIXI.RenderLayer();
    rlayers.fogLayer = new PIXI.RenderLayer();
    rlayers.selectLayer = new PIXI.RenderLayer();
    rlayers.controllerLayer = new PIXI.RenderLayer();
    app.stage.addChildAt(rlayers.basicLayer, 0);
    app.stage.addChildAt(rlayers.spriteLayer, 1);
    app.stage.addChildAt(rlayers.selectLayer, 2);
    app.stage.addChildAt(rlayers.fogLayer, 3);
    app.stage.addChildAt(rlayers.lineLayer, 4);
    app.stage.addChildAt(rlayers.controllerLayer, 5);
    rlayers.basicLayer.label = "basicLayer";
    rlayers.spriteLayer.label = "spriteLayer";
    rlayers.selectLayer.label = "selectLayer";
    rlayers.lineLayer.label = "lineLayer";
    rlayers.fogLayer.label = "fogLayer";
    rlayers.controllerLayer.label = "controllerLayer";
    golbalSetting.rlayers = rlayers;

    return rlayers;
  };
}
