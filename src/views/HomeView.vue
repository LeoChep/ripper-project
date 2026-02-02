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
        <span class="button-icon">🎮</span>
        <span class="button-text">开始新游戏</span>
      </button>
      
      <button class="menu-button load-game-button" @click="openLoadDialog">
        <span class="button-icon">📂</span>
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
  background: 
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    url('/book.jpg') center/cover no-repeat;
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
  font-size: 72px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  font-family: 'STKaiti', 'KaiTi', '华文行楷', 'STXingkai', 'Microsoft YaHei', serif;
  text-shadow: 
    0 0 15px rgba(200, 230, 255, 0.9),
    0 0 25px rgba(200, 230, 255, 0.7),
    0 0 35px rgba(180, 220, 255, 0.5),
    1px 1px 2px rgba(0, 0, 0, 0.9),
    2px 2px 4px rgba(0, 0, 0, 0.8),
    3px 3px 6px rgba(0, 0, 0, 0.7);
  letter-spacing: 12px;
  -webkit-text-stroke: 2px rgba(50, 50, 80, 0.8);
  text-stroke: 2px rgba(50, 50, 80, 0.8);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.7)) contrast(1.2) brightness(1.1);
  background: linear-gradient(180deg, #ffffff 0%, #e8f4ff 30%, #b8d8f5 70%, #a0c8e8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin: 10px 0 0 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
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
  padding: 20px 60px;
  font-size: 24px;
  font-weight: 600;
  color: white;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  min-width: 350px;
}

.menu-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.menu-button:active {
  transform: translateY(-2px);
}

.new-game-button:hover {
  background: rgba(76, 175, 80, 0.3);
  border-color: #4caf50;
}

.load-game-button:hover {
  background: rgba(33, 150, 243, 0.3);
  border-color: #2196f3;
}

.button-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.button-text {
  letter-spacing: 2px;
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
