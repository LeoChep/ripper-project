# CUDA 和 GPU 环境诊断脚本

Write-Host "=== GPU 硬件检测 ===" -ForegroundColor Cyan
Write-Host ""

# 检查是否有 NVIDIA GPU
$gpu = Get-WmiObject Win32_VideoController | Where-Object { $_.Name -like "*NVIDIA*" }
if ($gpu) {
    Write-Host "✓ 检测到 NVIDIA GPU:" -ForegroundColor Green
    $gpu | ForEach-Object {
        Write-Host "  型号: $($_.Name)" -ForegroundColor Yellow
        Write-Host "  驱动版本: $($_.DriverVersion)" -ForegroundColor Yellow
        Write-Host "  显存: $([math]::Round($_.AdapterRAM / 1GB, 2)) GB" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ 未检测到 NVIDIA GPU（可能使用集显或AMD显卡）" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== NVIDIA 驱动检测 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 nvidia-smi
try {
    $nvidiaSmi = nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ NVIDIA 驱动已安装" -ForegroundColor Green
        Write-Host $nvidiaSmi -ForegroundColor Yellow
    } else {
        throw "nvidia-smi 命令失败"
    }
} catch {
    Write-Host "✗ NVIDIA 驱动未正确安装或 nvidia-smi 不可用" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== CUDA 环境检测 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 CUDA 环境变量
if ($env:CUDA_PATH) {
    Write-Host "✓ CUDA_PATH: $env:CUDA_PATH" -ForegroundColor Green
} else {
    Write-Host "✗ CUDA_PATH 环境变量未设置" -ForegroundColor Red
}

# 检查 nvcc
try {
    $nvccVersion = nvcc --version 2>&1 | Select-String "release"
    if ($nvccVersion) {
        Write-Host "✓ CUDA Compiler: $nvccVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ CUDA Toolkit 未安装（nvcc 不可用）" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== PyTorch CUDA 检测 ===" -ForegroundColor Cyan
Write-Host ""

# 检查 PyTorch 的 CUDA 支持
$pythonCheck = @"
import torch
print(f'PyTorch 版本: {torch.__version__}')
print(f'CUDA 可用: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA 版本: {torch.version.cuda}')
    print(f'GPU 数量: {torch.cuda.device_count()}')
    print(f'当前 GPU: {torch.cuda.get_device_name(0)}')
else:
    print('PyTorch 未检测到可用的 CUDA GPU')
"@

try {
    $pythonPath = Join-Path $PSScriptRoot "..\tool\comfyFile\.venv\Scripts\python.exe"
    if (Test-Path $pythonPath) {
        Write-Host "使用 ComfyUI 虚拟环境检测..." -ForegroundColor Yellow
        $result = & $pythonPath -c $pythonCheck 2>&1
        Write-Host $result -ForegroundColor Yellow
    } else {
        Write-Host "使用系统 Python 检测..." -ForegroundColor Yellow
        $result = python -c $pythonCheck 2>&1
        Write-Host $result -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Python 检测失败: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 诊断建议 ===" -ForegroundColor Cyan
Write-Host ""

if (-not $gpu) {
    Write-Host "⚠ 你的电脑没有 NVIDIA GPU，需要使用 CPU 模式运行 ComfyUI" -ForegroundColor Yellow
    Write-Host "  速度会非常慢（每张图可能需要几分钟到几十分钟）" -ForegroundColor Yellow
} else {
    Write-Host "建议检查项：" -ForegroundColor Yellow
    Write-Host "1. 更新 NVIDIA 驱动到最新版本" -ForegroundColor White
    Write-Host "2. 安装 CUDA Toolkit 11.8 或 12.1" -ForegroundColor White
    Write-Host "3. 重新安装 PyTorch GPU 版本" -ForegroundColor White
}
