import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders";
import type { Mesh, Scene } from "@babylonjs/core";
import "@babylonjs/procedural-textures";
import * as AmmoMoudle from "@plugin/ammo/Ammo";
const createScene = async function (engine: BABYLON.Engine) {
  const ammo = await AmmoMoudle.getInstanse();

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.White());
  scene.useRightHandedSystem = true;
  scene.enablePhysics(
    new BABYLON.Vector3(0, -9.81, 0),
    new BABYLON.AmmoJSPlugin(true, ammo)
  );

  // Ground (using a box not a plane)
  const ground = BABYLON.MeshBuilder.CreateBox(
    "Ground",
    { width: 100, height: 1, depth: 100 },
    scene
  );
  ground.position.y = 0;

  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  groundMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  groundMat.backFaceCulling = false;
  ground.material = groundMat;
  ground.receiveShadows = true;
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 1, restitution: 0 },
    scene
  );
  console.log(scene);
  return scene;
};
const cleanDiceTable = (scene: Scene) => {
  const meshes = scene.getActiveMeshes();
  const contentList: Mesh[] = [] as Mesh[];
  meshes.forEach(async (content) => {
    if (
      content.name !== "__root__" &&
      content.metadata &&
      content.metadata.type === "dice"
    ) {
      // content.dispose();
      contentList.push(content as Mesh);
      // scene.removeMesh(content);
      // const physicsWorld = scene
      //   .getPhysicsEngine()
      //   ?.getPhysicsPlugin() as BABYLON.AmmoJSPlugin;
      // console.log(content.getPhysicsImpostor()?._pluginData);
      // console.log(physicsWorld.bjsAMMO);
      // physicsWorld.world.removeRigidBody(
      //   content.getPhysicsImpostor()?.physicsBody
      // );
    }
  });
  for (const contnet of contentList) {
    contnet.dispose();
  }
  console.log(scene);
};
export { createScene, cleanDiceTable };
