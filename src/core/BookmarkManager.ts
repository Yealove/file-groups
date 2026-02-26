import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { BookmarkData, BookmarkGroup, BookmarkFile } from '../types';
import { StorageService } from './StorageService';
import { FileService } from './FileService';

/**
 * 数据变更事件
 */
export interface DataChangeEvent {
  type: 'group' | 'file';
  action: 'add' | 'update' | 'delete';
}

/**
 * 书签管理器
 * 负责分组和文件的核心管理
 */
export class BookmarkManager {
  private data: BookmarkData = { groups: [] };
  private storageService: StorageService;
  private fileService: FileService;
  private _onDidChange = new vscode.EventEmitter<void>();

  readonly onDidChange = this._onDidChange.event;

  constructor(context: vscode.ExtensionContext) {
    this.storageService = new StorageService(context);
    this.fileService = new FileService();
    this.load();
  }

  /**
   * 加载数据
   */
  private async load(): Promise<void> {
    this.data = await this.storageService.load();
  }

  /**
   * 保存数据
   */
  async save(): Promise<void> {
    await this.storageService.save(this.data);
    this._onDidChange.fire();
  }

  /**
   * 获取所有分组
   */
  getGroups(): BookmarkGroup[] {
    return this.data.groups;
  }

  /**
   * 根据 ID 获取分组
   */
  getGroupById(id: string): BookmarkGroup | undefined {
    return this.data.groups.find(g => g.id === id);
  }

  /**
   * 创建分组
   */
  async createGroup(name: string): Promise<BookmarkGroup> {
    // 检查名称是否已存在
    const existingGroup = this.data.groups.find(g => g.name === name);
    if (existingGroup) {
      throw new Error(`Group "${name}" already exists`);
    }

    const newGroup: BookmarkGroup = {
      id: uuidv4(),
      name: name.trim(),
      files: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.data.groups.push(newGroup);
    await this.save();

    return newGroup;
  }

  /**
   * 删除分组
   */
  async deleteGroup(groupId: string): Promise<void> {
    const index = this.data.groups.findIndex(g => g.id === groupId);
    if (index === -1) {
      throw new Error(`Group not found`);
    }

    this.data.groups.splice(index, 1);
    await this.save();
  }

  /**
   * 重命名分组
   */
  async renameGroup(groupId: string, newName: string): Promise<void> {
    const group = this.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group not found`);
    }

    // 检查新名称是否与其他分组重复
    const existingGroup = this.data.groups.find(g => g.name === newName && g.id !== groupId);
    if (existingGroup) {
      throw new Error(`Group "${newName}" already exists`);
    }

    group.name = newName.trim();
    group.updatedAt = Date.now();
    await this.save();
  }

  /**
   * 添加文件到分组
   */
  async addFileToGroup(groupId: string, uri: vscode.Uri): Promise<BookmarkFile> {
    const group = this.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group not found`);
    }

    // 检查文件是否已存在于该分组
    const existingFile = group.files.find(f => f.uri === uri.toString());
    if (existingFile) {
      throw new Error(`File already exists in this group`);
    }

    const fileInfo = this.fileService.getFileInfo(uri);

    const newFile: BookmarkFile = {
      uri: uri.toString(),
      relativePath: fileInfo.relativePath,
      fileName: fileInfo.fileName,
      addedAt: Date.now()
    };

    group.files.push(newFile);
    group.updatedAt = Date.now();
    await this.save();

    return newFile;
  }

  /**
   * 从分组移除文件
   */
  async removeFileFromGroup(groupId: string, fileUri: string): Promise<void> {
    const group = this.getGroupById(groupId);
    if (!group) {
      throw new Error(`Group not found`);
    }

    const index = group.files.findIndex(f => f.uri === fileUri);
    if (index === -1) {
      throw new Error(`File not found in this group`);
    }

    group.files.splice(index, 1);
    group.updatedAt = Date.now();
    await this.save();
  }

  /**
   * 移动文件到另一个分组
   */
  async moveFileToGroup(
    fileUri: string,
    fromGroupId: string,
    toGroupId: string
  ): Promise<void> {
    // 验证源分组
    const fromGroup = this.getGroupById(fromGroupId);
    if (!fromGroup) {
      throw new Error(`Source group not found`);
    }

    // 验证目标分组
    const toGroup = this.getGroupById(toGroupId);
    if (!toGroup) {
      throw new Error(`Target group not found`);
    }

    // 如果是同一分组，不做操作
    if (fromGroupId === toGroupId) {
      return;
    }

    // 检查文件是否在源分组中
    const fileIndex = fromGroup.files.findIndex(f => f.uri === fileUri);
    if (fileIndex === -1) {
      throw new Error(`File not found in source group`);
    }

    // 检查目标分组是否已有该文件
    const existingInTarget = toGroup.files.find(f => f.uri === fileUri);
    if (existingInTarget) {
      throw new Error(`File already exists in target group`);
    }

    // 移动文件
    const [file] = fromGroup.files.splice(fileIndex, 1);
    toGroup.files.push(file);

    // 更新时间戳
    fromGroup.updatedAt = Date.now();
    toGroup.updatedAt = Date.now();

    await this.save();
  }

  /**
   * 获取分组中的文件
   */
  getGroupFiles(groupId: string): BookmarkFile[] {
    const group = this.getGroupById(groupId);
    return group?.files || [];
  }

  /**
   * 清理不存在的文件
   */
  async cleanupMissingFiles(): Promise<void> {
    let hasChanges = false;

    for (const group of this.data.groups) {
      const originalLength = group.files.length;
      const validFiles = await Promise.all(
        group.files.map(async (file) => {
          const uri = vscode.Uri.parse(file.uri);
          const exists = await this.fileService.fileExists(uri);
          return exists ? file : null;
        })
      );

      group.files = validFiles.filter((f): f is BookmarkFile => f !== null);

      if (group.files.length !== originalLength) {
        hasChanges = true;
        group.updatedAt = Date.now();
      }
    }

    if (hasChanges) {
      await this.save();
    }
  }

  /**
   * 刷新数据
   */
  async refresh(): Promise<void> {
    await this.load();
    this._onDidChange.fire();
  }

  /**
   * 调试方法：打印当前数据
   */
  debug(): void {
    console.log('Current bookmark data:', JSON.stringify(this.data, null, 2));
  }
}
