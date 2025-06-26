export const getUnitFile = (unitTypeName: string, actionNmae: string) => {
  return new URL(`../assets/${unitTypeName}/${actionNmae}.png`, import.meta.url)
    .href;
};
export const getMapAssetFile = (mapName: string) => {
  return new URL(`../assets/map/${mapName}.png`, import.meta.url).href;
};
export const fetchJsonFile = (jsonUrl: string) => {
  if (jsonUrl.endsWith("undefined")) {
    return new Promise((resolve, reject) => {
      resolve(undefined);
    })
  }
  const jsonFetchPromise = new Promise((resolve, reject) => {
    fetch(jsonUrl)
      .then(async (response) => {
        if (!response.body) {
          throw new Error("Response body is null");
        }
        const reader = response.body.getReader();
        // 读取数据
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream finished");
          return;
        }
        console.log("Received data chunk", value);
        const result_1 = await reader.read();
        var dataString = "";
        for (var i = 0; i < value.length; i++) {
          dataString += String.fromCharCode(value[i]);
        }
        console.log(jsonUrl)
        const json = JSON.parse(dataString);
        return json;
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
  return jsonFetchPromise;
};
export const getAnimMetaJsonFile = (
  unitTypeName: string,
) => {
  console.log("getJsonFile", `../assets/${unitTypeName}/anim/credits/metadata.json`);
  const jsonUrl = new URL(
   `../assets/${unitTypeName}/anim/credits/metadata.json`,
    import.meta.url
  ).href;
  console.log(jsonUrl);
  return fetchJsonFile(jsonUrl)
};
export const getAnimSpriteImgUrl = (unitTypeName: string, actionNmae: string,dir:string,) => {
  return new URL(`../assets/${unitTypeName}/anim/${dir}/${actionNmae}.png`, import.meta.url)
    .href;
};
export const getAnimActionSpriteJsonFile = (
  unitTypeName: string,
  actionName:string,
  dir:string
) => {
  console.log("getJsonFile", `../assets/${unitTypeName}/anim/${dir}/${actionName}.json`);
  const jsonUrl = new URL(
   `../assets/${unitTypeName}/anim/${dir}/${actionName}.json`,
    import.meta.url
  ).href;
  console.log(jsonUrl);
  return fetchJsonFile(jsonUrl)
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
  return fetchJsonFile(jsonUrl)
};

