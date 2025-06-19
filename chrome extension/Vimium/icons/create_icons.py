#!/usr/bin/env python3
import base64
from pathlib import Path

# 简单的1像素透明PNG (最小的PNG)
simple_png_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGUu4JQ4gAAAABJRU5ErkJggg=='

def create_icons():
    """创建所有尺寸的图标文件"""
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        filename = f"icon{size}.png"
        
        # 使用简单的透明PNG作为占位符
        try:
            icon_data = base64.b64decode(simple_png_base64)
            with open(filename, 'wb') as f:
                f.write(icon_data)
            print(f"✓ 创建了 {filename}")
        except Exception as e:
            print(f"✗ 创建 {filename} 失败: {e}")

if __name__ == "__main__":
    create_icons()
    print("图标创建完成！") 