import * as vscode from 'vscode';
import { BookmarkGroup, BookmarkFile } from '../types';
import { BookmarkManager } from '../core/BookmarkManager';
import { BookmarkTreeItem } from './BookmarkTreeItem';
import { TreeItemData } from '../types';

/**
 * 内部树节点结构
 */
interface TreeNode {
  name: string;
  children: TreeNode[];
  isFile: boolean;
  fullPath: string;
}

/**
 * TreeView 数据提供者
 * 负责向 TreeView 提供数据
 */
export class BookmarkTreeProvider implements vscode.TreeDataProvider<BookmarkTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    BookmarkTreeItem | undefined | void
  >();

  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  // 视图模式：'flat' 扁平视图（默认），'tree' 树形视图
  private viewMode: 'flat' | 'tree' = 'flat';

  // 树缓存：用于树形视图，存储分组ID对应的优化后的树结构
  private treeCache = new Map<string, TreeNode>();

  constructor(private bookmarkManager: BookmarkManager) {
    // 监听数据变化
    this.bookmarkManager.onDidChange(() => {
      this.refresh();
    });
  }

  /**
   * 切换视图模式
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'flat' ? 'tree' : 'flat';
    this.refresh();
  }

  /**
   * 设置视图模式
   */
  setViewMode(mode: 'flat' | 'tree'): void {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      this.refresh();
    }
  }

  /**
   * 获取当前视图模式
   */
  getViewMode(): 'flat' | 'tree' {
    return this.viewMode;
  }

  /**
   * 刷新树视图
   */
  refresh(): void {
    // 清空缓存
    this.treeCache.clear();
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
    // 根级别：返回所有分组
    if (!element) {
      return this.getGroupItems();
    }

    // 分组节点
    if (element.data.type === 'group' && element.data.group) {
      if (this.viewMode === 'flat') {
        // 扁平视图：直接返回文件列表
        return this.getFileItems(element.data.group);
      } else {
        // 树形视图：返回树结构
        const tree = this.getGroupTree(element.data.group);
        return this.buildTreeItemsFromTreeNode(tree, element.data.group.id);
      }
    }

    // 目录节点：从树中获取子节点
    if (element.data.type === 'directory' && element.data.groupId && element.data.directoryPath) {
      const tree = this.getGroupTree(
        this.bookmarkManager.getGroupById(element.data.groupId)!
      );
      const node = this.findNodeByPath(tree, element.data.directoryPath);
      if (node) {
        return this.buildTreeItemsFromTreeNode(node, element.data.groupId);
      }
    }

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
   * 获取分组下的文件节点（扁平视图）
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
   * 从文件列表构建完整树结构
   */
  private buildFileTree(files: BookmarkFile[]): TreeNode {
    const root: TreeNode = {
      name: '',
      children: [],
      isFile: false,
      fullPath: ''
    };

    for (const file of files) {
      const parts = file.relativePath.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const fullPath = parts.slice(0, i + 1).join('/');

        // 查找或创建节点
        let node = current.children.find(child => child.name === part);

        if (!node) {
          node = {
            name: part,
            children: [],
            isFile: isLast,  // 简单判断：最后一级是文件
            fullPath
          };
          current.children.push(node);
        } else {
          // 节点已存在，如果不是最后一级，说明它是目录
          if (!isLast) {
            node.isFile = false;
          }
        }

        current = node;
      }
    }

    return root;
  }

  /**
   * 优化树结构：合并只有一个子目录的目录
   * 自动去除空目录
   */
  private optimizeTree(node: TreeNode): TreeNode {
    // 文件节点或叶子节点，直接返回
    if (node.isFile || node.children.length === 0) {
      return node;
    }

    // 递归优化子节点
    node.children = node.children.map(child => this.optimizeTree(child));

    // 只有一个子节点且都是目录 → 合并
    if (node.children.length === 1 && !node.children[0].isFile && !node.isFile) {
      const child = node.children[0];
      return {
        name: node.name ? `${node.name}/${child.name}` : child.name,
        children: child.children,
        isFile: false,
        fullPath: child.fullPath
      };
    }

    // 有多个子节点或有文件 → 保持不变
    return node;
  }

  /**
   * 获取或构建分组树（带缓存）
   */
  private getGroupTree(group: BookmarkGroup): TreeNode {
    // 检查缓存
    if (this.treeCache.has(group.id)) {
      return this.treeCache.get(group.id)!;
    }

    // 构建树
    const rawTree = this.buildFileTree(group.files);
    const optimizedTree = this.optimizeTree(rawTree);

    // 缓存结果
    this.treeCache.set(group.id, optimizedTree);

    return optimizedTree;
  }

  /**
   * 根据路径在树中查找节点
   */
  private findNodeByPath(tree: TreeNode, path: string): TreeNode | null {
    if (tree.fullPath === path) {
      return tree;
    }

    for (const child of tree.children) {
      // 直接匹配或后代路径
      if (child.fullPath === path || path.startsWith(child.fullPath + '/')) {
        const found = this.findNodeByPath(child, path);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * 从路径获取文件对象
   */
  private fileFromPath(path: string, groupId: string): BookmarkFile | undefined {
    const group = this.bookmarkManager.getGroupById(groupId);
    return group?.files.find(f => f.relativePath === path);
  }

  /**
   * 从 TreeNode 节点构建 TreeItem 列表
   */
  private buildTreeItemsFromTreeNode(treeNode: TreeNode, groupId: string): BookmarkTreeItem[] {
    const items: BookmarkTreeItem[] = [];

    for (const child of treeNode.children) {
      const data: TreeItemData = {
        type: child.isFile ? 'file' : 'directory',
        groupId: groupId,
        directoryPath: child.isFile ? undefined : child.fullPath,
        file: child.isFile ? this.fileFromPath(child.fullPath, groupId) : undefined
      };
      items.push(new BookmarkTreeItem(data));
    }

    return items;
  }

  /**
   * 获取父节点
   */
  getParent?(element: BookmarkTreeItem): vscode.ProviderResult<BookmarkTreeItem> {
    const group = element.data.groupId
      ? this.bookmarkManager.getGroupById(element.data.groupId)
      : null;

    if (!group) return undefined;

    // 文件节点
    if (element.data.type === 'file' && element.data.file) {
      const pathParts = element.data.file.relativePath.split('/');

      if (pathParts.length === 1) {
        // 根文件，父节点是分组
        const data: TreeItemData = {
          type: 'group',
          group: group
        };
        return new BookmarkTreeItem(data);
      }

      // 子文件，父节点是父目录
      const parentPath = pathParts.slice(0, -1).join('/');
      const data: TreeItemData = {
        type: 'directory',
        groupId: group.id,
        directoryPath: parentPath
      };
      return new BookmarkTreeItem(data);
    }

    // 目录节点
    if (element.data.type === 'directory' && element.data.directoryPath) {
      const pathParts = element.data.directoryPath.split('/');

      if (pathParts.length === 1) {
        // 一级目录，父节点是分组
        const data: TreeItemData = {
          type: 'group',
          group: group
        };
        return new BookmarkTreeItem(data);
      }

      // 多级目录，父节点是父目录
      const parentPath = pathParts.slice(0, -1).join('/');
      const data: TreeItemData = {
        type: 'directory',
        groupId: group.id,
        directoryPath: parentPath
      };
      return new BookmarkTreeItem(data);
    }

    return undefined;
  }
}
