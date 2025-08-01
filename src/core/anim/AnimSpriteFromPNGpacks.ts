import { loadEffectAnim } from '@/utils/utils';
import * as PIXI from 'pixi.js';

export const getAnimSpriteFromPNGpacks = async (animName: string,num: number) => {
    const alienImages = loadEffectAnim(animName, num);
    const textureArray = [];
    console.log("alienImages", alienImages);
    for (let i = 0; i < num; i++) {
        await PIXI.Assets.load(alienImages[i]);
      const texture = PIXI.Texture.from(alienImages[i]);
      textureArray.push(texture);
    }

    const animatedSprite = new PIXI.AnimatedSprite(textureArray);
    return animatedSprite

}