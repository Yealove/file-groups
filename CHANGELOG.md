# Changelog

All notable changes to the "File Group Manager" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-26

### Added

**分组管理 (Group Management)**
- 创建分组 - Create new file groups to organize your files
- 删除分组 - Remove groups you no longer need
- 重命名分组 - Rename groups to better organize your workflow

**文件操作 (File Operations)**
- 添加文件到分组 - Add files from explorer or editor context menu
- 从分组中移除文件 - Remove individual files from groups
- 拖拽文件移动 - Drag and drop files between groups
- 快速打开文件 - Open files directly from the group view

**视图功能 (View Features)**
- 扁平视图模式 - Flat view displaying all files in a simple list
- 树形视图模式 - Tree view showing directory structure
- 一键切换视图 - Toggle between view modes with one click

**便捷功能 (Convenience Features)**
- 复制文件名 - Copy file name to clipboard
- 复制相对路径 - Copy relative path to clipboard
- 国际化支持 - Full support for English and Chinese
- 右键菜单集成 - Seamless integration with VSCode context menus

### Changed

- 项目名称从 "File Groups" 更改为 "File Group Manager" 以避免命名冲突
  - Changed project name from "File Groups" to "File Group Manager" to avoid naming conflicts
- 扩展标识符更新为 `file-group-manager`
  - Updated extension identifier to `file-group-manager`

### Features

**核心功能 (Core Features)**
- 创建和删除文件分组
- 添加文件到分组（支持资源管理器和编辑器右键菜单）
- 拖拽文件在分组间移动
- 两种视图模式切换（扁平/树形）
- 目录树结构显示
- 文件快捷操作（复制名称/路径/打开）

**技术亮点 (Technical Highlights)**
- TreeDragAndDropController API 集成实现拖拽功能
- 双视图模式支持（扁平视图 & 树形视图）
- 目录树缓存机制优化性能
- 完整的国际化支持（i18n）
- VSCode 原生菜单集成

## [0.0.1] - Initial Release

### Added
- Initial commit: File Groups extension for VSCode
- Basic file group management functionality
