import * as vscode from 'vscode';
import { BookmarkGroup } from '../types';
import { BookmarkManager } from '../core/BookmarkManager';
import { BookmarkTreeItem } from './BookmarkTreeItem';
import { TreeItemData } from '../types';

/**
 * TreeView 数据提供者
 * 负责向 TreeView 提供数据
 */
export class BookmarkTreeProvider implements vscode.TreeDataProvider<BookmarkTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    BookmarkTreeItem | undefined | void
  >();

  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private bookmarkManager: BookmarkManager) {
    // 监听数据变化
    this.bookmarkManager.onDidChange(() => {
      this.refresh();
    });
  }

  /**
   * 刷新树视图
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * 获取 TreeItem
   */
  getTreeItem(element: BookmarkTreeItem): BookmarkTreeItem {
    return element;
  }

  /**
   * 获取子节点
   */
  async getChildren(element?: BookmarkTreeItem): Promise<BookmarkTreeItem[]> {
    // 如果没有父元素，返回所有分组
    if (!element) {
      return this.getGroupItems();
    }

    // 如果是分组节点，返回分组下的文件
    if (element.data.type === 'group' && element.data.group) {
      return this.getFileItems(element.data.group);
    }

    // 文件节点没有子节点
    return [];
  }

  /**
   * 获取所有分组节点
   */
  private getGroupItems(): BookmarkTreeItem[] {
    const groups = this.bookmarkManager.getGroups();

    return groups.map(group => {
      const data: TreeItemData = {
        type: 'group',
        group: group
      };
      return new BookmarkTreeItem(data);
    });
  }

  /**
   * 获取分组下的文件节点
   */
  private getFileItems(group: BookmarkGroup): BookmarkTreeItem[] {
    return group.files.map(file => {
      const data: TreeItemData = {
        type: 'file',
        groupId: group.id,
        file: file
      };
      return new BookmarkTreeItem(data);
    });
  }

  /**
   * 获取父节点
   */
  getParent?(element: BookmarkTreeItem): vscode.ProviderResult<BookmarkTreeItem> {
    if (element.data.type === 'file' && element.data.groupId) {
      const group = this.bookmarkManager.getGroupById(element.data.groupId);
      if (group) {
        const data: TreeItemData = {
          type: 'group',
          group: group
        };
        return new BookmarkTreeItem(data);
      }
    }
    return undefined;
  }
}
