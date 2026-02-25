import * as vscode from 'vscode';
import { BookmarkManager } from './core/BookmarkManager';
import { BookmarkTreeProvider } from './tree/BookmarkTreeProvider';
import { GroupCommands } from './commands/groupCommands';
import { FileCommands } from './commands/fileCommands';
import { I18n } from './utils/I18n';

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

  // 注册 TreeView
  const treeView = vscode.window.createTreeView('bookmarkTree', {
    treeDataProvider,
    showCollapseAll: true
  });

  // 设置激活上下文
  vscode.commands.executeCommand('setContext', 'bookmark.enabled', true);

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

  // 将所有 disposables 添加到 context
  context.subscriptions.push(
    treeView,
    ...groupCommandDisposables,
    ...fileCommandDisposables,
    refreshCommand
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
