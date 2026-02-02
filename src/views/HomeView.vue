<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import SaveLoadDialog from '@/components/SaveLoadDialog/SaveLoadDialog.vue';

const router = useRouter();
const showLoadDialog = ref(false);

// 开始新游戏
const startNewGame = () => {
  router.push('/game');
};

// 打开读取存档对话框
const openLoadDialog = () => {
  showLoadDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  showLoadDialog.value = false;
};

// 处理存档栏位选择
const handleSlotSelect = async (slotId: number) => {
  const savedState = localStorage.getItem(`gameState_slot_${slotId}`);
  if (!savedState) {
    alert(`栏位 ${slotId} 没有存档文件！`);
    return;
  }
  
  // 跳转到游戏页面，并传递存档栏位信息
  router.push({
    path: '/game',
    query: { loadSlot: slotId.toString() }
  });
  closeDialog();
};
</script>

<template>
  <div class="home-view">
    <div class="title-container">
      <h1 class="game-title">浪漫奇想</h1>
      <p class="game-subtitle">开启你的冒险之旅</p>
    </div>
    
    <div class="menu-container">
      <button class="menu-button new-game-button" @click="startNewGame">

        <span class="button-text">开始新游戏</span>
      </button>
      
      <button class="menu-button load-game-button" @click="openLoadDialog">
       
        <span class="button-text">读取存档</span>
      </button>
    </div>

    <!-- 读取存档对话框 -->
    <SaveLoadDialog 
      mode="load" 
      :isVisible="showLoadDialog"
      @close="closeDialog"
      @select="handleSlotSelect"
    />
  </div>
</template>

<style scoped>
.home-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: url('/book.jpg') center/cover no-repeat;
  overflow: hidden;
  position: relative;
}

.home-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.title-container {
  text-align: center;
  margin-bottom: 60px;
  z-index: 1;
  animation: fadeInDown 1s ease-out;
}

.game-title {
  font-size: 80px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  font-family: 'STXingkai', 'KaiTi', '华文行楷', 'STKaiti', 'Microsoft YaHei', serif;
  text-shadow: 
    0 0 20px rgba(255, 200, 100, 0.9),
    0 0 40px rgba(255, 180, 80, 0.7),
    0 0 60px rgba(255, 150, 60, 0.5),
    2px 2px 4px rgba(0, 0, 0, 0.9),
    4px 4px 8px rgba(0, 0, 0, 0.8),
    6px 6px 12px rgba(0, 0, 0, 0.7);
  letter-spacing: 16px;
  -webkit-text-stroke: 2px rgba(80, 50, 20, 0.8);
  text-stroke: 2px rgba(80, 50, 20, 0.8);
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.9)) contrast(1.3) brightness(1.15);
  background: linear-gradient(180deg, #fffbf0 0%, #ffd700 20%, #ffb347 50%, #d4af37 80%, #b8860b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-subtitle {
  font-size: 22px;
  color: rgba(255, 230, 200, 0.95);
  margin: 15px 0 0 0;
  text-shadow: 
    0 0 15px rgba(255, 200, 100, 0.7),
    0 0 25px rgba(255, 180, 80, 0.5),
    0 3px 10px rgba(0, 0, 0, 0.6),
    2px 2px 4px rgba(0, 0, 0, 0.9);
  letter-spacing: 6px;
  font-weight: 500;
  font-family: 'STKaiti', 'KaiTi', 'Microsoft YaHei', '微软雅黑', serif;
  font-style: italic;
}

.menu-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 1;
  animation: fadeInUp 1s ease-out 0.3s backwards;
}

.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 25px 80px;
  font-size: 26px;
  font-weight: 700;
  color: #f5e6d3;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  background: url('/button-start.png') center/contain no-repeat;
  min-width: 500px;
  min-height: 120px;
  position: relative;
  text-shadow: 
    0 0 8px rgba(255, 200, 100, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.8),
    0 -1px 2px rgba(255, 255, 255, 0.2),
    2px 2px 6px rgba(0, 0, 0, 0.9);
  font-family: 'STKaiti', 'KaiTi', 'Microsoft YaHei', serif;
  letter-spacing: 3px;
}

.menu-button:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.menu-button:active {
  transform: scale(0.98);
}

.new-game-button:hover {
  filter: brightness(1.15) drop-shadow(0 0 15px rgba(76, 175, 80, 0.5));
}

.load-game-button:hover {
  filter: brightness(1.15) drop-shadow(0 0 15px rgba(33, 150, 243, 0.5));
}

.button-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.button-text {
  letter-spacing: 4px;
  font-weight: 700;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
