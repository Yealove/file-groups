/**
 * 书签文件数据结构
 */
export interface BookmarkFile {
  /** 文件 URI */
  uri: string;
  /** 相对路径（用于显示） */
  relativePath: string;
  /** 文件名 */
  fileName: string;
  /** 添加时间 */
  addedAt: number;
}

/**
 * 书签分组数据结构
 */
export interface BookmarkGroup {
  /** 唯一标识 */
  id: string;
  /** 分组名称 */
  name: string;
  /** 文件列表 */
  files: BookmarkFile[];
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 全局书签数据结构
 */
export interface BookmarkData {
  /** 分组列表 */
  groups: BookmarkGroup[];
}

/**
 * TreeView 节点类型
 */
export type TreeItemType = 'group' | 'directory' | 'file';

/**
 * TreeItem 数据结构
 */
export interface TreeItemData {
  /** 节点类型 */
  type: TreeItemType;
  /** 分组 ID（文件和目录节点需要） */
  groupId?: string;
  /** 目录路径（仅目录节点需要） */
  directoryPath?: string;
  /** 分组对象（仅分组节点需要） */
  group?: BookmarkGroup;
  /** 文件对象（仅文件节点需要） */
  file?: BookmarkFile;
}
