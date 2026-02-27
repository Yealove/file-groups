import * as vscode from 'vscode';
import { TreeItemData } from '../types';
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
    } else if (data.type === 'directory') {
      this.setupDirectoryNode(data);
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
    this.id = `file-${data.groupId}-${data.file?.uri}`;

    // 设置 resourceUri，VSCode 会自动应用文件图标主题
    if (data.file?.uri) {
      this.resourceUri = vscode.Uri.parse(data.file.uri);
    }

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
   * 设置目录节点
   */
  private setupDirectoryNode(data: TreeItemData): void {
    // 对于合并的路径，显示完整路径（例如：src/components）
    // 对于单级路径，显示目录名
    let label = data.directoryPath || '';

    // 如果路径太长，使用省略号显示
    const maxLength = 30;
    if (label.length > maxLength) {
      // 保留最后一级目录完整显示，前面的部分用省略号
      const parts = label.split('/');
      if (parts.length > 1) {
        // 最后一级目录名
        const lastPart = parts[parts.length - 1];
        // 倒数第二级目录名
        const secondLastPart = parts.length > 1 ? parts[parts.length - 2] : '';

        // 如果最后两级就足够短，只显示最后两级
        const shortLabel = `${secondLastPart}/${lastPart}`;
        if (shortLabel.length <= maxLength - 4) {
          label = `.../${shortLabel}`;
        } else {
          // 否则只保留最后一级，前面用省略号
          label = `.../${lastPart}`;
        }
      } else {
        // 只有一级，直接截断
        label = `...${label.slice(-(maxLength - 3))}`;
      }
    }

    this.label = label;
    this.tooltip = data.directoryPath || ''; // 悬停时显示完整路径
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.contextValue = 'directory';
    this.iconPath = new vscode.ThemeIcon('folder');
    this.id = `directory-${data.groupId}-${data.directoryPath}`;
  }

  /**
   * 获取提示信息
   */
  getTooltip(): string {
    if (this.data.type === 'group') {
      const fileCount = this.data.group?.files.length || 0;
      return `${this.data.group?.name} (${fileCount} files)`;
    } else if (this.data.type === 'directory') {
      return this.data.directoryPath || '';
    } else {
      return this.data.file?.relativePath || '';
    }
  }
}
