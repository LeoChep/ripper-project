import type { TiledMap } from "@/core/MapClass";
import { useTalkStateStore } from "@/stores/talkStateStore";
import * as InitiativeController from "@/core/system/InitiativeSystem";

export const d1 = {
  map: null as TiledMap | null,
  start: async () => {
    if (!d1.map) return;
    const talkStore = useTalkStateStore();
    talkStore.CGstart();
    await talkStore.speak(
      "你醒来时，发现自己躺在一片荒野上，四周一片寂静。你感到头痛欲裂，似乎刚刚经历了一场激烈的战斗。你环顾四周，发现自己身处一个陌生的地方，四周只有一些破旧的建筑和荒芜的土地。你决定站起来，寻找出路。"
    );
    await talkStore.speak(
      "你站起身来，感到身体有些虚弱，发现这里一片荒凉，建筑物大多破败不堪。突然,你听到一阵低语声。你停下脚步，仔细聆听，发现声音来自一座废弃的房屋。你决定走近一探究竟。"
    );
    const door1 = d1.map?.edges?.find((edge: { id: number }) => edge.id === 10);
    let door1Flag = false;
    talkStore.CGEnd();
    setInterval(async () => {
      if (door1?.useable === false && !door1Flag) {
        door1Flag = true;
        talkStore.CGstart();
        await talkStore.speak(
          "你走近废弃的房屋，发现门口有一扇破旧的门。你试图推开门，但它似乎被什么东西卡住了。你决定用力推开它。"
        );
        await talkStore.speak("骷髅：咯吱吱……咯吱吱");
        talkStore.CGEnd();
        //开始战斗
        if (!d1.map) {
          return;
        }
        InitiativeController.setMap(d1.map);
        const initCombatPromise =
          InitiativeController.addUnitsToInitiativeSheet(d1.map.sprites);
        initCombatPromise.then(() => {
          InitiativeController.startCombatTurn();
        });
      }
    }, 100);
    return;
  },
};
