import { golbalSetting } from "../golbalSetting";
import { BattleEvenetSystem } from "../system/BattleEventSystem";
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
import type { UnitAttackEvent } from "../event/UnitAttackAbstractEvent";
import type { GameEvent } from "../event/Event";

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
        creature: CreatureSerializer.serializeCreature(sprite.creature),
      };
    });
    const dramaRecord = DramaSystem.getInstance().getRercords();
    const initRecord = InitiativeSystem.getInitRecord();
    const eventRecord = BattleEvenetSystem.getInstance().serializeEvents();
    // 收集需要保存的游戏数据
    const gameState = {
      // 保存完整的地图数据
      doors: doors,
      edges: edges,
      sprites: sprites,
      dramaRecord: dramaRecord,
      initiativeRecord: initRecord,
      eventRecord: eventRecord,
      timestamp: Date.now(), // 保存时间戳
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
    Saver.gameState = gameState;
    return true;
  }
  static async loadUnit(): Promise<boolean> {
    const map = golbalSetting.map;
    const gameState = Saver.gameState;
    if (!map) {
      return false;
    }
    map.sprites = createUnitsFromMapSprites(gameState.sprites);
    map.sprites.forEach((sprite: Unit, index: string | number) => {
      const savedSprite = gameState.sprites[index];
      if (savedSprite && savedSprite.creature) {
        sprite.party = savedSprite.party; // 确保有 party 属性
        sprite.unitTypeName = savedSprite.unitTypeName;
        sprite.creature = savedSprite.creature;
        if (sprite.creature) {
          console.log("恢复的角色数据:", sprite.creature.buffs);
          loadTraits(sprite, sprite.creature);
          loadPowers(sprite, sprite.creature);
        }
      }
    });
    const findSprite = (id: string) => {
      return map.sprites.find((sprite) => sprite.id === parseInt(id)) ;
    };
    for (let i = 0; i < map.sprites.length; i++) {
      const sprite = map.sprites[i];
      const buffs = sprite.creature.buffs || [];
      const deserializedBuffs = await BuffSerializer.deserializeArray(buffs,undefined,findSprite);
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
    return true;
  }
  static loadDrama() {
    const gameState = Saver.gameState;
    const vars = gameState.dramaRecord.recorders || [];
    DramaSystem.getInstance().records = vars;
    DramaSystem.getInstance().setDramaUse(gameState.dramaRecord.use);
  }
  static async loadGameState(gameState: any): Promise<any> {

    // 清空当前角色数据
    // 恢复角色数据
    const map = {} as TiledMap;
    golbalSetting.map = map;
    Saver.gameState = gameState;
    Saver.loadWallAndDoor();
    await Saver.loadUnit();
    Saver.loadDrama();
    if (gameState.initiativeRecord) {
      InitiativeSystem.loadInitRecord(gameState.initiativeRecord);
    }
    //加载战斗事件
    const eventSerializeDatas = gameState.eventRecord || [];
    const events: (GameEvent)[]=[];
    eventSerializeDatas.forEach((eventSerializeData:EventSerializeData) => {
      console.log("反序列化事件:", eventSerializeData);
        const deserializer = EventDeserializerFactory.getDeserializer(eventSerializeData.eventName);
        if (deserializer) {
            const event = deserializer.deserialize(eventSerializeData);
            if (event) {
                events.push(event);
                event.hook();
            }
        }
    })
    console.log("加载的战斗事件:", events);

  }
}
