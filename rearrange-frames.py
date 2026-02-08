#!/usr/bin/env python3
"""
将3x3网格的序列帧图片重新排列为1x9的水平布局
"""

from PIL import Image
import sys
import os

def rearrange_frames(input_path, output_path=None):
    """
    将3行3列的图片重新排列为1行9列
    
    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径（可选，默认为原文件名_horizontal.png）
    """
    # 打开图片
    print(f"[1/4] 正在加载图片: {input_path}")
    img = Image.open(input_path)
    width, height = img.size
    print(f"      原始尺寸: {width}x{height}")
    
    # 计算每个小格子的尺寸（3x3网格）
    frame_width = width // 3
    frame_height = height // 3
    print(f"[2/4] 检测到每帧尺寸: {frame_width}x{frame_height}")
    
    # 创建新画布（1行9列）
    new_width = frame_width * 9
    new_height = frame_height
    new_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
    print(f"[3/4] 创建新画布: {new_width}x{new_height}")
    
    # 从3x3网格中按顺序提取并排列到1行
    index = 0
    for row in range(3):
        for col in range(3):
            # 从原图中裁剪小格子
            left = col * frame_width
            top = row * frame_height
            right = left + frame_width
            bottom = top + frame_height
            
            frame = img.crop((left, top, right, bottom))
            
            # 粘贴到新画布的水平位置
            new_x = index * frame_width
            new_img.paste(frame, (new_x, 0))
            
            print(f"      帧 {index + 1}: 从({left},{top})移动到({new_x},0)")
            index += 1
    
    # 保存结果
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_horizontal{ext}"
    
    new_img.save(output_path)
    print(f"[4/4] 已保存到: {output_path}")
    print(f"\n✅ 完成！新图片尺寸: {new_width}x{new_height}")
    
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python rearrange-frames.py <输入图片> [输出图片]")
        print("示例: python rearrange-frames.py skeleton_3x3.png skeleton_1x9.png")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(input_file):
        print(f"❌ 错误: 文件不存在: {input_file}")
        sys.exit(1)
    
    rearrange_frames(input_file, output_file)
