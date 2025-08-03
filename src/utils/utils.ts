import { Assets } from 'pixi.js';

export const getUnitAvatar = (unitTypeName: string) => {
  return new URL(`../assets/${unitTypeName}/avatar.png`, import.meta.url)
    .href;
};
export const getDoorSvg=(state:string)=>{
    return new URL(`../assets/door/door-${state}.svg`, import.meta.url)
    .href;
}
export const getMapAssetFile = (mapName: string) => {
  return new URL(`../assets/map/${mapName}.png`, import.meta.url).href;
};
export const getParticleFile = (particleName: string) => {
  return new URL(`../assets/partics/${particleName}.png`, import.meta.url).href;
};
export const getEffectFileUrl = (effectName: string, frameName: string) => {

  return new URL(`../assets/effect/${effectName}/${frameName}.png`, import.meta.url).href;
};
export const getStatusEffectsIconUrl = (effectName: string) => {
  return new URL(`../assets/effect/statusEffects/${effectName}.svg`, import.meta.url).href;
};
export const getStatusEffectsIcon = async (effectName: string) => {
  const url = getStatusEffectsIconUrl(effectName);
  await Assets.load(url);
  
};
export const loadEffectAnim= (effectName: string, frameNum:number) => {
  const frames: string[] = [];
  for (let i = 0; i < frameNum; i++) {
    const num= i.toString().padStart(4, '0');
    frames.push(
      new URL(`../assets/effect/${effectName}/frame_${num}_alpha.png`, import.meta.url).href
    );
  }
  return frames;
}
export const fetchJsonFile = (jsonUrl: string) => {
  if (jsonUrl.endsWith("undefined")) {
    return new Promise((resolve, reject) => {
      resolve(undefined);
    });
  }
  const jsonFetchPromise = new Promise((resolve, reject) => {
    fetch(jsonUrl)
      .then((response) => {
        if (!response.body) {
          throw new Error("Response body is null");
        }
        return response.blob();
      })
      .then(async (data) => {
        const reader = new FileReader();
        // 读取数据
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.readAsText(data, "utf-8");
        // 读取完成后，输出结果
        const promise = new Promise((resolve) => {
          reader.onload = () => {
            console.log("reader", reader.result);
            const json = JSON.parse(reader.result as string);
            resolve(json);
          };
        });

        // 读取错误时，输出错误信息

        return await promise;
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
  return jsonFetchPromise;
};
export const getAnimMetaJsonFile = (unitTypeName: string) => {
  console.log(
    "getJsonFile",
    `../assets/${unitTypeName}/anim/credits/metadata.json`
  );
  const jsonUrl = new URL(
    `../assets/${unitTypeName}/anim/credits/metadata.json`,
    import.meta.url
  ).href;
  console.log(jsonUrl);
  return fetchJsonFile(jsonUrl);
};
export const getAnimSpriteImgUrl = (
  unitTypeName: string,
  actionNmae: string,
  dir: string
) => {
  return new URL(
    `../assets/${unitTypeName}/anim/${dir}/${actionNmae}.png`,
    import.meta.url
  ).href;
};
export const getAnimActionSpriteJsonFile = (
  unitTypeName: string,
  actionName: string,
  dir: string
) => {
  console.log(
    "getJsonFile",
    `../assets/${unitTypeName}/anim/${dir}/${actionName}.json`
  );
  const jsonUrl = new URL(
    `../assets/${unitTypeName}/anim/${dir}/${actionName}.json`,
    import.meta.url
  ).href;
  console.log(jsonUrl);
  return fetchJsonFile(jsonUrl);
};
export const getJsonFile = (
  dirName: string,
  fileName: string,
  type = "json"
) => {
  console.log("getJsonFile", `../assets/${dirName}/${fileName}.${type}`);
  const jsonUrl = new URL(
    `../assets/${dirName}/${fileName}.${type}`,
    import.meta.url
  ).href;
  console.log(jsonUrl);
  return fetchJsonFile(jsonUrl);
};
