import * as InitiativeController from "@/core/system/InitiativeSystem";
import { CharacterOutCombatController } from "@/core/controller/CharacterOutCombatController";
import { golbalSetting } from "@/core/golbalSetting";
import { Drama } from "./drama";
import * as InitSystem from "@/core/system/InitiativeSystem";
import { Item, ItemRarity, ItemType, HolyWater } from "@/core/item";
import { UnitSystem } from "@/core/system/UnitSystem";
import { CharacterController } from "@/core/controller/CharacterController";
import { DramaSystem } from "@/core/system/DramaSystem";
import { lookOn } from "@/core/anim/LookOnAnim";
import { moveNear } from "@/core/system/UnitMoveSystem";
import { tileSize } from "@/core/envSetting";
import { toward } from "@/core/anim/UnitAnimSprite";
class Road extends Drama {
  mapName: string = "road";
  mapType: string = "png";
  constructor() {
    super("tavern", "这是一个测试剧情");
  }
  loadInit() {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd, addInteraction } =
      this;
  }
  play(): void {
    const startFlag = this.getVariable("startFlag");
    if (!startFlag) {
      this.setVariable("startFlag", true);
      this.startEvent();
    }
  }
  public battleEndHandle(): void {
    const { CGstart, unitSpeak, speak, unitChoose, CGEnd } = this;
  }
  combat2EndCG = async () => {};
  combat1EndCG = async () => {};

  private async startEvent(): Promise<void> {
    const {
      CGstart,
      unitSpeak,
      speak,
      unitChoose,
      CGEnd,
      addInteraction,
      unHiddenUnit,
    } = this;
    if (!this.map) {
      return;
    }
    CGstart();
    const player = UnitSystem.getInstance()
      .getAllUnits()
      .find((unit) => unit.party === "player");
    const orcBoss = UnitSystem.getInstance().getUnitByName("兽人老大");
    lookOn(orcBoss!.x - 500, orcBoss?.y);
    await DramaSystem.getInstance().hiddenUnit(player!);
    await unitSpeak("兽人A", "老大，我们在这里真的能打劫到人吗？");
    await unitSpeak(
      "兽人老大",
      "少废话，我问过至高的大尼克了，今天这里会有“钱袋子”路过，只要我们顺利动手，就再也不用为了吃喝发愁了。"
    );
    await unitSpeak(
      "兽人老大",
      "不过怎么还没来……我都困了。我先去睡一会，你们在这里继续蹲着。"
    );
    await unitSpeak("兽人B", "好嘞老大。");

    const pos = { x: orcBoss!.x, y: orcBoss!.y + 300 };
    await moveNear(orcBoss!, pos.x, pos.y);
    DramaSystem.getInstance().hiddenUnit(orcBoss!);
    await speak("过了一会……");
    await unitSpeak(
      "兽人A",
      "大尼克真的靠谱吗? 都蹲了快两个时辰了，连只兔子都没见到。"
    );
    await unitSpeak("兽人B", "不要乱说，让老大知道了有你好果子吃。");
    await speak("突然，远处传来一阵马蹄声……");
    await unitSpeak("兽人B", "好像有人来了，快藏好！");
    const orcA = UnitSystem.getInstance().getUnitByName("兽人A");
    const orcB = UnitSystem.getInstance().getUnitByName("兽人B");
    await moveNear(orcA!, orcA!.x, orcA!.y - 200);
    await moveNear(orcB!, orcB!.x, orcB!.y + 200);
    toward(orcA!, orcA!.x / tileSize, orcA!.y / tileSize + 2);
    toward(orcB!, orcB!.x / tileSize, orcB!.y / tileSize - 2);
    const drawf_rider_house_car_1 =
      UnitSystem.getInstance().getgetSceneHiddenUnitsByName(
        "drawf_rider_house_car_1"
      );
    drawf_rider_house_car_1!.direction = 0;
    lookOn(drawf_rider_house_car_1!.x + 500, drawf_rider_house_car_1?.y);
    await unHiddenUnit(drawf_rider_house_car_1!);

    await unitSpeak(
      "drawf_rider_house_car_1",
      "我说老弟，这天气可真容易犯困。"
    );
    const man = UnitSystem.getInstance().getUnitByName("战士");
    await unHiddenUnit(man!);
    await unitSpeak(
      "战士",
      "这里的地形太适合伏击了，我看还是小心点比较好。镇子就在前面。这荒郊野外的，万一遇到劫匪，你这一身的铁匠家伙事，可就成了别人的囊中之物。"
    );
    await unitSpeak(
      "drawf_rider_house_car_1",
      "劫匪？就这破地方，除了我们俩，谁会来？再说了，就凭我这斧子，来一个打一个，来两个打一双！"
    );
    await unitSpeak(
      "drawf_rider_house_car_1",
      "说起来，你听说了吗，有人目睹了贤者之龙在附近出现。不过乡野村夫，如果说他们搞混飞龙和龙，也都是正常的。"
    );

            await unitSpeak(
      "战士",
      "啊哈，那要是能见到贤者之龙就好了！我一直很想见识一下传说中的贤者之龙呢！"
    );
     

                    await unitSpeak(
      "战士",
      "不过我还是先趁着放松一下。我的叔叔就在附近，我正好去看望一下他，希望他身体和以前一样健硕。"
    );
    await moveNear(man!, man!.x + 600, man!.y - 100),
      await moveNear(
        drawf_rider_house_car_1!,
        drawf_rider_house_car_1!.x + 600,
        drawf_rider_house_car_1!.y - 100
      );
    await unitSpeak("战士", "等等，不对劲，这里有动静。");
    await unitSpeak(
      "drawf_rider_house_car_1",
      "动静？没有啊，是不是你太紧张了？"
    );

    await moveNear(orcA!, orcA!.x, orcA!.y + 200);
    await moveNear(orcB!, orcB!.x, orcB!.y - 200);
    orcA!.direction = 1;
    orcB!.direction = 1;
    await unitSpeak("兽人A", "不许动！打劫！");
    await unitSpeak("战士", "呀呀呀，真是说什么来什么，也正好活动一下筋骨吧。");
    this.setVariable("inCombat1", true);
    if (!golbalSetting.map) {
      return;
    }
    InitiativeController.setMap(golbalSetting.map);
    const players = golbalSetting.playerRoles;
    const units = UnitSystem.getInstance().getUnitBySelectionGroup("orc1").filter((unit) => unit.isSceneHidden == false)  ;

    const initCombatPromise = Promise.all([
      InitiativeController.addUnitsToInitiativeSheet(units),
      InitiativeController.addUnitsToInitiativeSheet(players),
    ]);
    initCombatPromise.then(async () => {
      await InitiativeController.startBattle();
      InitiativeController.startCombatTurn();
    });
    CGEnd();
    CharacterOutCombatController.isUse = true;
  }
}

export const road = new Road();
