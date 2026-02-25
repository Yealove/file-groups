import * as vscode from 'vscode';
import { TreeItemType, TreeItemData } from '../types';
import { I18n } from '../utils/I18n';

/**
 * TreeView 节点类
 * 表示分组或文件节点
 */
export class BookmarkTreeItem extends vscode.TreeItem {
  readonly data: TreeItemData;

  constructor(data: TreeItemData) {
    super('', vscode.TreeItemCollapsibleState.None);

    this.data = data;

    if (data.type === 'group') {
      this.setupGroupNode(data);
    } else if (data.type === 'file') {
      this.setupFileNode(data);
    }
  }

  /**
   * 设置分组节点
   */
  private setupGroupNode(data: TreeItemData): void {
    this.label = data.group?.name || '';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.contextValue = 'group';
    this.iconPath = new vscode.ThemeIcon('folder');
    this.id = `group-${data.group?.id}`;

    // 设置描述信息
    const i18n = I18n.get();
    const fileCount = data.group?.files.length || 0;
    this.description = fileCount === 1
      ? `1 ${i18n.file}`
      : `${fileCount} ${i18n.files}`;
  }

  /**
   * 设置文件节点
   */
  private setupFileNode(data: TreeItemData): void {
    this.label = data.file?.fileName || '';
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    this.contextValue = 'file';
    this.iconPath = new vscode.ThemeIcon('file');
    this.id = `file-${data.groupId}-${data.file?.uri}`;

    // 设置描述为相对路径
    this.description = data.file?.relativePath || '';

    // 设置点击命令
    if (data.file?.uri) {
      this.command = {
        command: 'bookmark.openFile',
        title: 'Open File',
        arguments: [data.file.uri]
      };
    }
  }

  /**
   * 获取提示信息
   */
  getTooltip(): string {
    if (this.data.type === 'group') {
      const fileCount = this.data.group?.files.length || 0;
      return `${this.data.group?.name} (${fileCount} files)`;
    } else {
      return this.data.file?.relativePath || '';
    }
  }
}
