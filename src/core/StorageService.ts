import * as vscode from 'vscode';
import { BookmarkData } from '../types';

/**
 * 存储服务类
 * 负责书签数据的持久化
 */
export class StorageService {
  private static readonly STORAGE_KEY = 'bookmarkData';
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * 从 workspaceState 加载数据
   */
  async load(): Promise<BookmarkData> {
    const data = this.context.workspaceState.get<BookmarkData>(
      StorageService.STORAGE_KEY,
      { groups: [] }
    );
    return data;
  }

  /**
   * 保存数据到 workspaceState
   */
  async save(data: BookmarkData): Promise<void> {
    await this.context.workspaceState.update(
      StorageService.STORAGE_KEY,
      data
    );
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    await this.context.workspaceState.update(
      StorageService.STORAGE_KEY,
      { groups: [] }
    );
  }
}
