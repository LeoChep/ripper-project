import type { Container } from "pixi.js";
// If you are using @pixi/layers, import IRenderLayer from there:
import type { IRenderLayer } from "pixi.js";

export const golbalSetting = {
    rootContainer: null as null | Container,
    spriteContainer: null as null | Container,
    mapContainer: null as null | Container,
    rlayers: {
        basicLayer: null as null | IRenderLayer,
        spriteLayer: null as null | IRenderLayer,
        lineLayer: null as null | IRenderLayer,
        fogLayer: null as null | IRenderLayer,
        selectLayer: null as null | IRenderLayer,
        controllerLayer: null as null | IRenderLayer
    }
}