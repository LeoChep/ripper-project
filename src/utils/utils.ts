export const getUnitFile = (unitTypeName: string,actionNmae:string) => {
  return new URL(`../assets/${unitTypeName}/${actionNmae}.png`, import.meta.url).href;
};
export const getMapAssetFile = (mapName: string) => {
  return new URL(`../assets/map/${mapName}.png`, import.meta.url).href;
};
export const getJsonFile = (dirName: string,fileName:string,type='json' ) => {
  const jsonUrl = new URL(
    `../assets/${dirName}/${fileName}.${type}`,
    import.meta.url
  ).href;
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
        const json = JSON.parse(dataString);
        return json;
      })
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });
  return jsonFetchPromise;
};
