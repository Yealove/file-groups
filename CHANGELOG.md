# Changelog

All notable changes to the "File Group Manager" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-02-26

### Fixed

**树形视图优化 (Tree View Optimization)**
- 修复树形视图中空目录显示的问题 - Fixed empty directories appearing in tree view
- 重构树形视图实现，代码减少 31%（480 行 → 331 行）- Refactored tree view implementation, reduced code by 31% (480 → 331 lines)
- 使用更简洁的 buildFileTree + optimizeTree 方法 - Adopted cleaner buildFileTree + optimizeTree approach
- 自动合并单子目录，优化树结构显示 - Automatically merge single-child directories for better tree structure

**图标改进 (Icon Improvements)**
- 使用 resourceUri 自动应用文件图标主题 - Use resourceUri to automatically apply file icon themes
- 支持用户安装的图标主题（Material Icon Theme、VSCode Icons 等）- Support user-installed icon themes
- 不同文件类型显示对应彩色图标 - Display colored icons for different file types
- .vue 文件显示绿色 Vue 图标，.ts 显示蓝色 TS 图标等 - .vue files show green Vue icon, .ts show blue TS icon, etc.

### Technical Changes

**代码重构 (Code Refactoring)**
- 移除复杂的 mergePaths 算法，改用递归 optimizeTree - Removed complex mergePaths algorithm in favor of recursive optimizeTree
- 简化树缓存机制（从 DirectoryNode[] 改为 TreeNode）- Simplified tree caching mechanism (DirectoryNode[] → TreeNode)
- 修复 findNodeByPath 无法查找直接子节点的 bug - Fixed findNodeByPath bug where direct child nodes couldn't be found
- 修复节点已存在时 isFile 标志未更新的 bug - Fixed bug where isFile flag wasn't updated when node already existed

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
