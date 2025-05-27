<template>
    <div class="unit-in-box">
        <div class="image-container">
            <img :src="unit.imageUrl" alt="unit image" />
        </div>
        <div class="text-container">
            <span>{{ unit.name }}</span>
        </div>
    </div>
</template>

<script setup>
import { Unit } from '@/class/Unit';

defineProps({
    unit: {
        type: Unit,
        required: true
    }
});
</script>

<style scoped>
.unit-in-box {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.image-container {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.image-container img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.text-container {
    flex: none;
    width: 100%;
    padding: 4px 8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-container span {
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    white-space: normal;
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
    justify-content: center;
    align-items: center;
}
</style>
