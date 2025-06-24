import * as PIXI from "pixi.js";
let oldselectionBox: PIXI.Graphics | null = null;
export const UnitRightEvent = (
  event: PIXI.FederatedPointerEvent,
  anim: PIXI.AnimatedSprite,
  container: PIXI.Container<PIXI.ContainerChild>,
  selectLayer: PIXI.IRenderLayer,
) => {
  // alert('click');
  // 如果之前有选择框，先移除它
  console.log(oldselectionBox);
  event.stopPropagation();
  if (oldselectionBox) {
    container.removeChild(oldselectionBox);
    oldselectionBox = null;
    // alert("取消选择");
  }
  const selectionBox = new PIXI.Graphics();
  const boxWidth = 40;
  const boxHeight = 80;

  let boxX = anim.x + anim.width + 10;
  if (boxX + boxWidth > container.width) {
    // 如果选择框超出右边界，则调整位置
    boxX = anim.x - boxWidth - 10;
  }
  let boxY = anim.y - boxHeight / 2 + anim.height / 2;
  if (boxY < 0) {
    // 如果选择框超出上边界，则调整位置
    boxY = 0;
  } else if (boxY + boxHeight > container.height) {
    // 如果选择框超出下边界，则调整位置
    boxY = container.height - boxHeight;
  }
  // 绘制竖排选择框背景
  selectionBox.x = boxX;
  selectionBox.y = boxY;

  selectionBox.roundRect(0, 0, boxWidth, boxHeight, 12);
  selectionBox.fill({ color: 0x333366, alpha: 0.9 });

  // 示例：添加三个选项
  const options = ["攻击", "移动", "取消"];
  options.forEach((text, i) => {
    const label = new PIXI.Text({
      text,
      style: {
        fontFamily: "Arial",
        fontSize: 12,
        fill: 0xffffff,
        align: "center",
      },
    });
    label.x = boxWidth / 2 - label.width / 2;
    label.y = 8 + i * 20;
    label.eventMode = "static";
    label.cursor = "pointer";
    label.on("pointertap", () => {
      alert(`选择了: ${text}`);
      if (text == "移动") {
        moveSelect(anim, container);
      }
      container.removeChild(selectionBox);
    });

    selectionBox.addChild(label);
  });

  container.addChild(selectionBox);
  selectLayer.attach(selectionBox);
  oldselectionBox = selectionBox;
  container.once("rightdown", () => {
    if (oldselectionBox) {
      container.removeChild(oldselectionBox);
      oldselectionBox = null;
    }
  });

  // alert("取消选择");
};
export const moveSelect = (
  anim: PIXI.AnimatedSprite,
  container: PIXI.Container<PIXI.ContainerChild>
) => {
  //显示红色的可移动范围
  const range = 5;
  const tileSize = 64;
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0.4;
  graphics.zIndex = 1000;

  const centerX = anim.x + anim.width / 2;
  const centerY = anim.y + anim.height / 2;
  //欧几里得距离
  // for (let dx = -range; dx <= range; dx++) {
  //     for (let dy = -range; dy <= range; dy++) {
  //         const dist = Math.sqrt(dx * dx + dy * dy);
  //         if (dist <= range) {
  //             const x = centerX + dx * tileSize - tileSize / 2;
  //             const y = centerY + dy * tileSize - tileSize / 2;
  //             graphics.rect(x, y, tileSize, tileSize);
  //             graphics.fill({ color: 0xff0000 });
  //         }
  //     }
  // }
  //使用棋盘距离绘制
  // for (let dx = -range; dx <= range; dx++) {
  //     for (let dy = -range; dy <= range; dy++) {
  //         if (Math.abs(dx) + Math.abs(dy) <= range) {
  //             const x = centerX + dx * tileSize - tileSize / 2;
  //             const y = centerY + dy * tileSize - tileSize / 2;
  //             graphics.rect(x, y, tileSize, tileSize);
  //             graphics.fill({ color: 0xff0000 });
  //         }
  //     }
  // }
  //使用切比雪夫距离绘制
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= range) {
        const x = centerX + dx * tileSize - tileSize / 2;
        const y = centerY + dy * tileSize - tileSize / 2;
        graphics.rect(x, y, tileSize, tileSize);
        graphics.fill({ color: 0xff0000 });
      }
    }
  }
  graphics.eventMode = "static";

  container.addChild(graphics);

  // 点击其他地方移除移动范围
  const removeGraphics = () => {
    if (graphics.parent) {
      graphics.parent.removeChild(graphics);
    }
    container.off("pointerdown", removeGraphics);
  };
  graphics.on("pointerdown", (e) => {
    e.stopPropagation();
    removeGraphics();
    moveMovement(e, anim, container);
  });
  container.on("pointerdown", removeGraphics);
};

export const moveMovement = (
  event: PIXI.FederatedPointerEvent,
  anim: PIXI.AnimatedSprite,
  container: PIXI.Container<PIXI.ContainerChild>
) => {
  const tileSize = 64; // 格子大小
  //计算出动画精灵所在的格子
  const centerX = Math.floor(anim.x / tileSize);
  const centerY = Math.floor(anim.y / tileSize);
  console.log(`动画精灵所在格子: (${centerX}, ${centerY})`);
  // 获取点击位置
  const pos = event.data.global;
  // 计算点击位置相对于动画精灵的偏移
  const offsetX = pos.x;
  const offsetY = pos.y;
  // 计算点击位置对应的格子坐标
  const tileX = Math.floor(offsetX / tileSize);
  const tileY = Math.floor(offsetY / tileSize);
  console.log(`点击位置所在格子: (${tileX}, ${tileY})`);
  // 计算实际的移动位置
  const targetX = tileX * tileSize;
  const targetY = tileY * tileSize;
  console.log(`目标位置: (${targetX}, ${targetY})`);
  // 设置动画精灵的新位置
  const moveFunc = () => {
    console.log(`目标位置: (${targetX}, ${targetY})`);
    // 如果精灵已经在目标
    if (anim.x !== targetX || anim.y !== targetY) {
      // 计算移动步长
      const dx = targetX - anim.x;
      const dy = targetY - anim.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const step = 64;
      const stepX =
        distance === 0 ? 0 : (dx / distance) * Math.min(step, Math.abs(dx));
      const stepY =
        distance === 0 ? 0 : (dy / distance) * Math.min(step, Math.abs(dy));
      // 更新动画精灵的位置
      anim.x += stepX;
      anim.y += stepY;
      // 如果接近目标位置，则直接设置到目标位置
      if (Math.abs(anim.x - targetX) < 1 && Math.abs(anim.y - targetY) < 1) {
        anim.x = targetX;
        anim.y = targetY;
        // 停止动画更新
      }
    }
  };
  const timer = setInterval(() => {
    moveFunc();
    if (Math.abs(anim.x - targetX) < 1 && Math.abs(anim.y - targetY) < 1) {
      clearInterval(timer);
      console.log("移动完成");
    }
  }, 160);
};
