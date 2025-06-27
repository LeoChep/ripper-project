import type { IRenderLayer } from 'pixi.js';

export interface RLayers{
    basicLayer: IRenderLayer;
    spriteLayer: IRenderLayer;
    lineLayer: IRenderLayer;
    selectLayer: IRenderLayer;
    controllerLayer: IRenderLayer;
}