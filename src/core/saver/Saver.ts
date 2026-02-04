import { BattleEvenetSystem } from "./../system/BattleEventSystem";
import { golbalSetting } from "../golbalSetting";

import { DramaSystem } from "../system/DramaSystem";
import { CreatureSerializer } from "../units/CreatureSerializer";
import { DoorSerializer } from "../units/DoorSerializer";
import * as InitiativeSystem from "@/core/system/InitiativeSystem";
import {
  createUnitsFromMapSprites,
  loadPowers,
  loadTraits,
  Unit,
} from "../units/Unit";
import type { TiledMap } from "../MapClass";
import { BuffSerializer } from "../buff/BuffSerializer";
import { CharacterCombatController } from "../controller/CharacterCombatController";
import { CharacterOutCombatController } from "../controller/CharacterOutCombatController";
import type { EventSerializeData } from "../event/EventSerializeData";
import { EventDeserializerFactory } from "../event/EventDeserializerFactory";
import type { EndTurnRemoveBuffEvent } from "../event/EndTurnRemoveBuffEvent";
import type { BasedAbstractEvent } from "../event/BasedAbstractEvent";
import type { GameEvent } from "../event/Event";
import { AreaSystem } from "../system/AreaSystem";
import { EventSheet } from "../event/EventSheet";
import { ItemSerializer } from "../item/ItemSerializer";
import { ChestSerializer } from "../units/ChestSerializer";
import { ChestSystem } from "../system/ChestSystem";

export class Saver {
  static gameState: any;
  static saveGameState(): boolean {
    const map = golbalSetting.map;
    if (!map) {
      console.error("No map data available to save.");
      return false;
    }
    const doors = DoorSerializer.serializeArray(map.doors);
    const edges = map.edges;
    const sprites = map.sprites.map((sprite) => {
      return {
        id: sprite.id,
        x: sprite.x,
        y: sprite.y,
        width: sprite.width,
        height: sprite.height,
        name: sprite.name,
        unitTypeName: sprite.unitTypeName,
        party: sprite.party,
        friendly: sprite.friendly,
        state: sprite.state,
        creature: CreatureSerializer.serializeCreature(sprite.creature),
        inventory: ItemSerializer.serializeArray(sprite.inventory || []),
      };
    });
    const dramaRecord = DramaSystem.getInstance().getRercords();
    const initRecord = InitiativeSystem.getInitRecord();
    const eventRecord = BattleEvenetSystem.getInstance().serializeEvents();
    const areasRecord = AreaSystem.getInstance().getSaver();
    
    // 从ChestSystem获取宝箱数据以确保是最新状态
    const chestSystem = ChestSystem.getInstance();
    const chestsRecord = ChestSerializer.serializeArray(chestSystem.getAllChests());
    
    // 收集需要保存的游戏数据
    const gameState = {
      // 保存完整的地图数据
      doors: doors,
      edges: edges,
      sprites: sprites,
      chests: chestsRecord,
      dramaRecord: dramaRecord,
      initiativeRecord: initRecord,
      eventRecord: eventRecord,
      areasRecord: areasRecord,
      timestamp: Date.now(), // 保存时间戳
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
    Saver.gameState = gameState;
    
    // 同步map.chests以保持一致性
    map.chests = chestSystem.getAllChests();
    
    return true;
  }
  static async loadUnit(): Promise<boolean> {
    const map = golbalSetting.map;
    const gameState = Saver.gameState;
    if (!map) {
      return false;
    }
    console.log(
      "[changemap-Saver] loadUnit 前 map.sprites:",
      map.sprites?.length,
    );
    map.sprites = createUnitsFromMapSprites(gameState.sprites);
    console.log(
      "[changemap-Saver] loadUnit 修改 map.sprites 后:",
      map.sprites?.length,
    );
    map.sprites.forEach((sprite: Unit, index: string | number) => {
      const savedSprite = gameState.sprites[index];
      if (savedSprite && savedSprite.creature) {
        sprite.party = savedSprite.party; // 确保有 party 属性
        sprite.unitTypeName = savedSprite.unitTypeName;
        sprite.friendly = savedSprite.friendly ?? false; // 恢复friendly属性
        sprite.state = savedSprite.state ?? "idle"; // 恢复state属性，默认为idle
        sprite.creature = savedSprite.creature;
        
        // 恢复背包道具
        if (savedSprite.inventory) {
          console.log(`[Saver] 开始恢复单位 ${sprite.name} 的背包，原始数据:`, savedSprite.inventory);
          try {
            sprite.inventory = ItemSerializer.deserializeArray(savedSprite.inventory);
            console.log(`[Saver] 成功恢复单位 ${sprite.name} 的背包，道具数量: ${sprite.inventory.length}`);
            console.log(`[Saver] 恢复的道具:`, sprite.inventory);
          } catch (error) {
            console.error(`[Saver] 恢复单位 ${sprite.name} 的背包失败:`, error);
            sprite.inventory = [];
          }
        }
        
        if (sprite.creature) {
          console.log("恢复的角色数据:", sprite.creature.buffs);
          loadTraits(sprite, sprite.creature);
          loadPowers(sprite, sprite.creature);
        }
      }
    });
    const findSprite = (id: string) => {
      return map.sprites.find((sprite) => sprite.id === parseInt(id));
    };
    for (let i = 0; i < map.sprites.length; i++) {
      const sprite = map.sprites[i];
      const buffs = sprite.creature.buffs || [];
      const deserializedBuffs = await BuffSerializer.deserializeArray(
        buffs,
        undefined,
        findSprite,
      );
      sprite.creature.buffs = deserializedBuffs;
      console.log("恢复的角色数据:", sprite.creature);
    }
    return true;
  }
  static loadWallAndDoor(): boolean {
    const map = golbalSetting.map;
    if (!map) {
      return false;
    }
    const gameState = Saver.gameState;
    //door 反序列化
    if (gameState.doors && gameState.doors.length > 0) {
      map.doors = DoorSerializer.deserializeArray(gameState.doors);
      console.log("恢复的门数据:", map.doors);
    } else {
      map.doors = [];
    }
    map.edges = gameState.edges || [];
    
    // 同步门和墙体的状态
    map.doors.forEach((door) => {
      const wall = map.edges.find((edge) => edge.id === door.linkedId);
      if (wall) {
        // 门打开时，墙不可用（可以通过）；门关闭时，墙可用（阻挡）
        wall.useable = !door.isOpen;
        console.log(`同步门状态: 门ID=${door.linkedId}, 门状态=${door.isOpen ? '打开' : '关闭'}, 墙体可用=${wall.useable}`);
      }
    });
    
    return true;
  }
  
  static loadChest(): boolean {
    const map = golbalSetting.map;
    if (!map) {
      return false;
    }
    const gameState = Saver.gameState;
    
    // 反序列化宝箱
    if (gameState.chests && gameState.chests.length > 0) {
      map.chests = ChestSerializer.deserializeArray(gameState.chests);
      // 重新注册宝箱到系统
      const chestSystem = ChestSystem.getInstance();
      chestSystem.clearAll(); // 清空之前的注册
      map.chests.forEach(chest => {
        chestSystem.registerChest(chest);
      });
      console.log("恢复的宝箱数据:", map.chests);
    } else {
      map.chests = [];
    }
    
    return true;
  }
  static async loadDrama() {
    const gameState = Saver.gameState;
    const vars = gameState.dramaRecord.recorders || [];
    DramaSystem.getInstance().records = vars;
    await DramaSystem.getInstance().setDramaUse(gameState.dramaRecord.use);
    // DramaSystem.getInstance().setDramaUse(gameState.dramaRecord.use);
  }
  static loadArea() {
    const gameState = Saver.gameState;
    const vars = gameState.areasRecord || [];
    AreaSystem.getInstance().loadRecords(vars);
  }
  static async loadGameState(gameState: any): Promise<any> {
    // 清空当前角色数据
    // 恢复角色数据
    // const map = {} as TiledMap;
    // golbalSetting.map = map;

    Saver.gameState = gameState;
    
    // 先加载drama，这会创建基础地图结构
    await Saver.loadDrama();
    
    // 然后覆盖门和墙数据（从存档恢复）
    Saver.loadWallAndDoor();
    
    // 恢复宝箱数据
    Saver.loadChest();
    
    // 恢复单位数据
    await Saver.loadUnit();

    Saver.loadArea();

    //加载战斗事
    BattleEvenetSystem.getInstance().clearEvents();
    const eventSerializeDatas = gameState.eventRecord || [];
    const events: GameEvent[] = [];
    eventSerializeDatas.forEach((eventSerializeData: EventSerializeData) => {
      console.log("反序列化事件:", eventSerializeData);
      // const deserializer = EventSheet.getInstance().getSerializer(eventSerializeData.eventName);
      const deserializer = EventDeserializerFactory.getDeserializer(
        eventSerializeData.eventName,
      );
      console.log("获取反序列化器:", deserializer);
      if (deserializer) {
        const event = deserializer.deserialize(eventSerializeData);
        console.log("加载的战斗事件 one:", deserializer, event);
        if (event) {
          events.push(event);
          event.hook();
        }
      }
    });
    console.log("加载的战斗事件:", events);
    if (gameState.initiativeRecord) {
      InitiativeSystem.loadInitRecord(gameState.initiativeRecord);
    }
  }
}
