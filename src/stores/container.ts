import { golbalSetting } from "@/core/golbalSetting";
import { defineStore } from "pinia";
import * as PIXI from "pixi.js";
let container = null as PIXI.Container<PIXI.ContainerChild> | null;

const layers = {
  lineLayer: null as PIXI.IRenderLayer | null,
  basicLayer: null as PIXI.IRenderLayer | null,
  spriteLayer: null as PIXI.IRenderLayer | null,
  selectLayer: null as PIXI.IRenderLayer | null,
  controllerLayer: null as PIXI.IRenderLayer | null,
};
export const getContainer = () => {
  return golbalSetting.rootContainer;
};
export const getLayers = () => {
  return golbalSetting.rlayers
};
export const setContainer = (c: PIXI.Container<PIXI.ContainerChild> | null) => {
  container = c;
};


export const setLayer = (ls: { basicLayer: PIXI.IRenderLayer; spriteLayer: PIXI.IRenderLayer; lineLayer: PIXI.IRenderLayer; selectLayer: PIXI.IRenderLayer; controllerLayer: PIXI.IRenderLayer; }) => {
  layers.basicLayer = ls.basicLayer;
  layers.spriteLayer = ls.spriteLayer;
  layers.lineLayer = ls.lineLayer;
  layers.selectLayer = ls.selectLayer;
  layers.controllerLayer = ls.controllerLayer;
};