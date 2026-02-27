import * as vscode from 'vscode';
import { BookmarkManager } from './core/BookmarkManager';
import { BookmarkTreeProvider } from './tree/BookmarkTreeProvider';
import { BookmarkTreeItem } from './tree/BookmarkTreeItem';
import { DragAndDropHandler } from './tree/DragAndDropHandler';
import { GroupCommands } from './commands/groupCommands';
import { FileCommands } from './commands/fileCommands';
import { I18n } from './utils/I18n';

/**
 * 递归展开所有子节点
 */
async function expandAllChildren(
  treeView: vscode.TreeView<BookmarkTreeItem>,
  treeDataProvider: BookmarkTreeProvider,
  item: BookmarkTreeItem
): Promise<void> {
  // 展开当前节点
  await treeView.reveal(item, { expand: 2 }); // expand: 2 表示展开所有层级

  // 获取子节点
  const children = await treeDataProvider.getChildren(item);
  if (children && children.length > 0) {
    for (const child of children) {
      await expandAllChildren(treeView, treeDataProvider, child);
    }
  }
}

/**
 * 插件激活
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('File Bookmark Groups extension is now active');

  // 初始化 i18n
  I18n.initialize();

  // 创建书签管理器
  const bookmarkManager = new BookmarkManager(context);

  // 创建 TreeView 数据提供者
  const treeDataProvider = new BookmarkTreeProvider(bookmarkManager);

  // 创建拖拽处理器
  const dragAndDropHandler = new DragAndDropHandler(bookmarkManager, treeDataProvider);

  // 注册 TreeView（启用拖拽功能）
  const treeView = vscode.window.createTreeView('bookmarkTree', {
    treeDataProvider,
    showCollapseAll: true,
    dragAndDropController: dragAndDropHandler
  });

  // 设置激活上下文
  vscode.commands.executeCommand('setContext', 'bookmark.enabled', true);
  // 设置初始视图模式上下文
  vscode.commands.executeCommand('setContext', 'bookmark.viewMode', 'flat');

  // 创建命令处理器
  const groupCommands = new GroupCommands(bookmarkManager);
  const fileCommands = new FileCommands(bookmarkManager);

  // 注册所有命令
  const groupCommandDisposables = groupCommands.registerCommands();
  const fileCommandDisposables = fileCommands.registerCommands();

  // 注册刷新命令
  const refreshCommand = vscode.commands.registerCommand('bookmark.refresh', () => {
    treeDataProvider.refresh();
  });

  // 注册视图模式切换命令
  const toggleViewModeCommand = vscode.commands.registerCommand('bookmark.toggleViewMode', () => {
    (treeDataProvider as any).toggleViewMode();
    // 更新上下文变量
    const viewMode = (treeDataProvider as any).getViewMode();
    vscode.commands.executeCommand('setContext', 'bookmark.viewMode', viewMode);
  });

  // 注册全部展开命令
  const expandAllCommand = vscode.commands.registerCommand('bookmark.expandAll', async () => {
    const rootItems = await treeDataProvider.getChildren();
    for (const item of rootItems) {
      await expandAllChildren(treeView, treeDataProvider, item);
    }
  });

  // 将所有 disposables 添加到 context
  context.subscriptions.push(
    treeView,
    ...groupCommandDisposables,
    ...fileCommandDisposables,
    refreshCommand,
    toggleViewModeCommand,
    expandAllCommand
  );

  // 显示欢迎消息（仅在首次激活时）
  const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome');
  if (!hasShownWelcome) {
    const i18n = I18n.get();
    vscode.window.showInformationMessage(i18n.welcomeMessage);
    context.globalState.update('hasShownWelcome', true);
  }
}

/**
 * 插件停用
 */
export function deactivate() {
  console.log('File Bookmark Groups extension is now deactivated');
}
