import * as vscode from 'vscode';
import { BookmarkGroup, BookmarkFile } from '../types';
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

  // 视图模式：'flat' 扁平视图（默认），'tree' 树形视图
  private viewMode: 'flat' | 'tree' = 'flat';

  // 目录树缓存：用于树形视图，存储分组ID对应的目录结构
  private directoryTreeCache = new Map<string, DirectoryNode[]>();

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
    // 清空目录树缓存
    this.directoryTreeCache.clear();
    this.refresh();
  }

  /**
   * 设置视图模式
   */
  setViewMode(mode: 'flat' | 'tree'): void {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      this.directoryTreeCache.clear();
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
    this._onDidChangeTreeData.fire();
  }

  /**
   * 清空目录树缓存
   */
  clearDirectoryCache(): void {
    this.directoryTreeCache.clear();
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

    // 如果是分组节点，返回分组下的文件或目录树
    if (element.data.type === 'group' && element.data.group) {
      if (this.viewMode === 'flat') {
        // 扁平视图：直接返回文件列表
        return this.getFileItems(element.data.group);
      } else {
        // 树形视图：返回目录树
        return this.getDirectoryTreeItems(element.data.group);
      }
    }

    // 如果是目录节点，返回目录下的子目录和文件
    if (element.data.type === 'directory' && element.data.groupId) {
      return this.getDirectoryChildren(element.data.groupId, element.data.directoryPath || '');
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
   * 获取目录树节点（树形视图）
   */
  private getDirectoryTreeItems(group: BookmarkGroup): BookmarkTreeItem[] {
    // 检查缓存
    if (this.directoryTreeCache.has(group.id)) {
      const cachedNodes = this.directoryTreeCache.get(group.id)!;
      return this.buildTreeItemsFromNodes(cachedNodes, group.id);
    }

    // 构建目录树
    const directoryNodes = this.buildDirectoryTree(group.files);
    this.directoryTreeCache.set(group.id, directoryNodes);

    return this.buildTreeItemsFromNodes(directoryNodes, group.id);
  }

  /**
   * 获取目录下的子节点
   * 对于合并路径（如 src/components），需要动态计算子节点
   */
  private getDirectoryChildren(groupId: string, directoryPath: string): BookmarkTreeItem[] {
    const group = this.bookmarkManager.getGroupById(groupId);
    if (!group) {
      return [];
    }

    // 筛选出属于该目录的文件
    const prefix = directoryPath ? `${directoryPath}/` : '';
    const matchingFiles = group.files.filter(f => f.relativePath.startsWith(prefix));

    if (matchingFiles.length === 0) {
      return [];
    }

    // 提取直接子节点（一级）
    const directChildren = new Map<string, { files: BookmarkFile[]; isDir: boolean }>();

    for (const file of matchingFiles) {
      // 移除前缀，获取相对路径
      const relativePath = file.relativePath.substring(prefix.length);
      const parts = relativePath.split('/');

      if (parts.length === 1) {
        // 这是一个文件
        const fileName = parts[0];
        if (!directChildren.has(fileName)) {
          directChildren.set(fileName, { files: [], isDir: false });
        }
        directChildren.get(fileName)!.files.push(file);
      } else {
        // 这是一个目录
        const dirName = parts[0];
        if (!directChildren.has(dirName)) {
          directChildren.set(dirName, { files: [], isDir: true });
        }
        directChildren.get(dirName)!.files.push(file);
      }
    }

    // 构建 TreeItem 列表
    const items: BookmarkTreeItem[] = [];

    // 先添加目录
    for (const [name, data] of directChildren) {
      if (data.isDir) {
        const childPath = directoryPath ? `${directoryPath}/${name}` : name;
        const treeData: TreeItemData = {
          type: 'directory',
          groupId: groupId,
          directoryPath: childPath
        };
        items.push(new BookmarkTreeItem(treeData));
      }
    }

    // 再添加文件
    for (const [name, data] of directChildren) {
      if (!data.isDir && data.files.length > 0) {
        const treeData: TreeItemData = {
          type: 'file',
          groupId: groupId,
          file: data.files[0]
        };
        items.push(new BookmarkTreeItem(treeData));
      }
    }

    return items;
  }

  /**
   * 构建目录树结构（带路径合并优化）
   */
  private buildDirectoryTree(files: BookmarkFile[]): DirectoryNode[] {
    if (files.length === 0) {
      return [];
    }

    // 分类文件
    const rootFiles: BookmarkFile[] = [];
    const subDirFiles: BookmarkFile[] = [];

    for (const file of files) {
      const pathParts = file.relativePath.split('/').filter((p: string) => p);
      if (pathParts.length === 1) {
        rootFiles.push(file);
      } else {
        subDirFiles.push(file);
      }
    }

    // 提取所有唯一目录路径
    const dirPaths = new Set<string>();
    for (const file of subDirFiles) {
      const pathParts = file.relativePath.split('/').filter((p: string) => p);
      const dirPath = pathParts.slice(0, -1).join('/');
      dirPaths.add(dirPath);
    }

    // 合并路径
    const mergedPaths = this.mergePaths(Array.from(dirPaths));

    // 为每个合并路径收集文件
    const result: DirectoryNode[] = [];

    for (const mergedPath of mergedPaths) {
      const files = this.getFilesForPath(subDirFiles, mergedPath);
      result.push({
        path: mergedPath,
        children: {},
        files: files
      });
    }

    // 添加根目录文件
    result.push(...rootFiles.map(file => ({
      path: file.relativePath,
      children: {},
      files: [file],
      isFile: true
    } as DirectoryNode)));

    return result;
  }

  /**
   * 获取属于某个路径的所有文件（直接子文件，不递归）
   */
  private getFilesForPath(allFiles: BookmarkFile[], path: string): BookmarkFile[] {
    const result: BookmarkFile[] = [];

    for (const file of allFiles) {
      const fileDirPath = file.relativePath.split('/').slice(0, -1).join('/');

      // 文件属于这个路径
      if (fileDirPath === path) {
        result.push(file);
      }
    }

    return result;
  }

  /**
   * 合并单子目录路径
   * 简单方案：对于每个路径，如果它没有文件且只有一个子路径，则跳过它
   */
  private mergePaths(dirPaths: string[]): string[] {
    const result: string[] = [];

    for (const path of dirPaths) {
      // 检查这个路径的直接子路径
      const directChildren: string[] = [];
      for (const other of dirPaths) {
        if (other !== path && other.startsWith(path + '/')) {
          // 检查是否是直接子路径（没有中间路径）
          const relative = other.substring(path.length + 1);
          if (!relative.includes('/')) {
            directChildren.push(other);
          }
        }
      }

      // 如果没有子路径或有多于一个子路径，保留这个路径
      if (directChildren.length !== 1) {
        result.push(path);
      }
      // 否则跳过（会被合并到子路径）
    }

    return result;
  }

  /**
   * 从目录节点构建 TreeItem
   */
  private buildTreeItemsFromNodes(nodes: DirectoryNode[], groupId: string): BookmarkTreeItem[] {
    const items: BookmarkTreeItem[] = [];

    for (const node of nodes) {
      // 处理文件节点
      if (node.isFile && node.files.length === 1) {
        const file = node.files[0];
        const data: TreeItemData = {
          type: 'file',
          groupId: groupId,
          file: file
        };
        items.push(new BookmarkTreeItem(data));
        continue;
      }

      // 处理目录节点
      const data: TreeItemData = {
        type: 'directory',
        groupId: groupId,
        directoryPath: node.path
      };
      items.push(new BookmarkTreeItem(data));
    }

    return items;
  }

  /**
   * 获取父节点
   */
  getParent?(element: BookmarkTreeItem): vscode.ProviderResult<BookmarkTreeItem> {
    if (element.data.type === 'file' && element.data.groupId) {
      const group = this.bookmarkManager.getGroupById(element.data.groupId);
      if (group) {
        // 树形视图：返回父目录或分组
        if (this.viewMode === 'tree') {
          const relativePath = element.data.file?.relativePath || '';
          const pathParts = relativePath.split('/').filter((p: string) => p);

          if (pathParts.length === 1) {
            // 根目录文件，父节点是分组
            const data: TreeItemData = {
              type: 'group',
              group: group
            };
            return new BookmarkTreeItem(data);
          } else {
            // 子目录文件，父节点是目录
            const dirPath = pathParts.slice(0, -1).join('/');
            const data: TreeItemData = {
              type: 'directory',
              groupId: group.id,
              directoryPath: dirPath
            };
            return new BookmarkTreeItem(data);
          }
        } else {
          // 扁平视图：父节点是分组
          const data: TreeItemData = {
            type: 'group',
            group: group
          };
          return new BookmarkTreeItem(data);
        }
      }
    }

    if (element.data.type === 'directory' && element.data.groupId) {
      const group = this.bookmarkManager.getGroupById(element.data.groupId);
      if (group) {
        const path = element.data.directoryPath || '';
        const pathParts = path.split('/').filter((p: string) => p);

        if (pathParts.length === 1) {
          // 一级目录，父节点是分组
          const data: TreeItemData = {
            type: 'group',
            group: group
          };
          return new BookmarkTreeItem(data);
        } else {
          // 子目录，父节点是父目录
          const parentPath = pathParts.slice(0, -1).join('/');
          const data: TreeItemData = {
            type: 'directory',
            groupId: group.id,
            directoryPath: parentPath
          };
          return new BookmarkTreeItem(data);
        }
      }
    }

    return undefined;
  }
}

/**
 * 目录树节点结构
 */
interface DirectoryNode {
  path: string;
  children: Record<string, DirectoryNode>;
  files: BookmarkFile[];
  // 是否是文件节点（用于根目录文件的扁平化显示）
  isFile?: boolean;
}