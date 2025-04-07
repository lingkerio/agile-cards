@echo off

REM 删除android文件夹
if exist android (
    rmdir /s /q android
)

REM 执行构建命令
npm run build

REM 添加Android平台
npx cap add android

REM 打开Android Studio
npx cap open android