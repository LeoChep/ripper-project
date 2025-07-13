import { useTalkStateStore } from "@/stores/talkStateStore";

export const d1 = {
  start: async () => {
    const talkStore = useTalkStateStore();
    await talkStore.speak(
      "你醒来时，发现自己躺在一片荒野上，四周一片寂静。你感到头痛欲裂，似乎刚刚经历了一场激烈的战斗。你环顾四周，发现自己身处一个陌生的地方，四周只有一些破旧的建筑和荒芜的土地。你决定站起来，寻找出路。"
    );
    await talkStore.speak(
      "你站起身来，感到身体有些虚弱，发现这里一片荒凉，建筑物大多破败不堪。突然,你听到一阵低语声。你停下脚步，仔细聆听，发现声音来自一座废弃的房屋。你决定走近一探究竟。"
    );

    return ;
  },
};
