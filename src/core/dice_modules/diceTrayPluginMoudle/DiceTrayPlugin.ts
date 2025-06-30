import { InstancedMesh, Vector3, type Scene } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { createDice, loadDiceMesh, rollDiceIns } from "./ammoDiceMoudle";
import {
  createScene as createDiceTable,
  cleanDiceTable,
} from "./diceTableMoudle";
import type { Dice, DicesPlugin } from "../dices/rollerMoudle";
import { subscribe } from "@plugin/tool_modules/SubscribeMan/SubscribeMan";
class DiceTrayDice implements Dice {
  diceType = "";
  getResultValue = async () => {
    return await this.resultValue;
  };
  mesh!: InstancedMesh;
  value!: number;
  proxy: any;
  getValue() {
    return this.value;
  }
  resultValue!: Promise<number>;
}
class DiceTrayPlugin implements DicesPlugin {
  scene!: Scene;

  constructor() {}
  cleanDices() {
    cleanDiceTable(this.scene);
  }

  async createDiceTray(canvas: HTMLCanvasElement) {
    //创建引擎
    const engine = new BABYLON.Engine(canvas as HTMLCanvasElement, true, {
      deterministicLockstep: true,
      lockstepMaxSteps: 60,
    });
    //生成Scene
    const scene = await createDiceTable(engine);
    this.scene = scene;
    const camera = new BABYLON.TargetCamera("camera", new Vector3(0, 20, 0));
    camera.setTarget(new Vector3(0, 0, 0));
    camera.attachControl(engine.getRenderingCanvas(), true);
    //const light =
    new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 20, 40), scene);
    await loadDiceMesh(scene);
    engine.runRenderLoop(async function () {
      scene.render();
    });

    // 监听浏览器改变大小的事件，通过调用engine.resize()来自适应窗口大小
    window.addEventListener("resize", function () {
      engine.resize();
    });
  }

  //投掷骰子函数
  roll = async (diceType: string) => {
    //创建骰子实体
    const dice = new DiceTrayDice();
    dice.diceType = diceType;
    //创建骰子的物理实体
    const diceMesh = await createDice(this.scene, diceType);
    dice.mesh = diceMesh;
    dice.value = 0;
    //为其增加自己本身为顶级代理
    dice.proxy = dice;

    //让骰子滚动,并在滚动结束后将值返回到resultValue中
    const resultValue = rollDiceIns(diceMesh);
    dice.resultValue = resultValue as Promise<number>;
    dice.resultValue.then((result) => {
      dice.proxy.value = result;
      console.log("骰子停下");
    });
    //监听骰子物理实体的实时数值
    diceMesh.metadata = subscribe(diceMesh.metadata, "rollNum", () => {
      dice.proxy.value = diceMesh.metadata.rollNum;
    });
    //返回创建好的骰子对象

    return dice;
  };
}

export { DiceTrayPlugin };
