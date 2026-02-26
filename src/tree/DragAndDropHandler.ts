import * as vscode from 'vscode';
import { BookmarkManager } from '../core/BookmarkManager';
import { BookmarkTreeItem } from './BookmarkTreeItem';
import { I18n } from '../utils/I18n';

/**
 * 拖拽处理器
 * 实现 TreeDragAndDropController 接口以支持文件拖拽移动
 */
export class DragAndDropHandler implements vscode.TreeDragAndDropController<BookmarkTreeItem> {
  dropMimeTypes = ['application/vnd.code.tree.bookmarkTree'];
  dragMimeTypes = ['text/uri-list'];

  // 临时存储当前拖拽的源节点
  private currentDragSources: BookmarkTreeItem[] = [];

  constructor(
    private bookmarkManager: BookmarkManager,
    private treeDataProvider: { refresh(): void }
  ) {}

  /**
   * 处理拖拽开始
   * 只允许拖拽文件节点
   */
  async handleDrag(
    source: readonly BookmarkTreeItem[],
    treeDataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // 只允许拖拽文件节点
    const fileItems = source.filter(item => item.data.type === 'file');

    if (fileItems.length === 0) {
      // 如果没有文件节点，不设置拖拽数据，阻止拖拽样式显示
      return;
    }

    // 存储拖拽源
    this.currentDragSources = [...fileItems];

    // 将拖拽数据添加到 transfer
    treeDataTransfer.set('application/vnd.code.tree.bookmarkTree', new vscode.DataTransferItem(''));
  }

  /**
   * 处理放置
   * 将拖拽的文件移动到目标分组
   */
  async handleDrop(
    target: BookmarkTreeItem | undefined,
    _treeDataTransfer: vscode.DataTransfer,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const i18n = I18n.get();

    // 没有拖拽源，直接返回
    if (!this.currentDragSources || this.currentDragSources.length === 0) {
      return;
    }

    // 确定目标分组 ID
    let targetGroupId: string;

    if (!target) {
      // 拖到空白处，不允许
      vscode.window.showWarningMessage(i18n.dropToGroupRequired);
      this.currentDragSources = [];
      return;
    }

    if (target.data.type === 'group') {
      // 拖到分组节点上
      targetGroupId = target.data.group?.id || '';
    } else if (target.data.type === 'file') {
      // 拖到文件节点上，使用该文件的分组
      targetGroupId = target.data.groupId || '';
    } else if (target.data.type === 'directory') {
      // 拖到目录节点上，使用目录所属的分组
      targetGroupId = target.data.groupId || '';
    } else {
      vscode.window.showWarningMessage(i18n.dropToGroupRequired);
      this.currentDragSources = [];
      return;
    }

    if (!targetGroupId) {
      vscode.window.showErrorMessage(i18n.groupNotFound);
      this.currentDragSources = [];
      return;
    }

    // 处理每个拖拽的文件
    let movedCount = 0;
    let firstFileName = '';
    let firstFromGroup = '';
    let firstToGroup = '';

    for (const sourceItem of this.currentDragSources) {
      if (sourceItem.data.type !== 'file') {
        continue;
      }

      const fromGroupId = sourceItem.data.groupId;
      const fileUri = sourceItem.data.file?.uri;
      const fileName = sourceItem.data.file?.fileName;

      if (!fromGroupId || !fileUri) {
        continue;
      }

      try {
        await this.bookmarkManager.moveFileToGroup(fileUri, fromGroupId, targetGroupId);
        movedCount++;

        if (movedCount === 1) {
          firstFileName = fileName || '';
          const fromGroup = this.bookmarkManager.getGroupById(fromGroupId);
          const toGroup = this.bookmarkManager.getGroupById(targetGroupId);
          firstFromGroup = fromGroup?.name || '';
          firstToGroup = toGroup?.name || '';
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : i18n.moveFileFailed;
        vscode.window.showErrorMessage(message);
        this.currentDragSources = [];
        return;
      }
    }

    // 清空拖拽源
    this.currentDragSources = [];

    // 刷新视图（refresh 会自动清理缓存）
    this.treeDataProvider.refresh();

    // 显示成功消息
    if (movedCount > 0) {
      if (movedCount === 1) {
        vscode.window.showInformationMessage(
          I18n.format(i18n.fileMoved, {
            fileName: firstFileName,
            fromGroup: firstFromGroup,
            toGroup: firstToGroup
          })
        );
      } else {
        vscode.window.showInformationMessage(
          I18n.format(i18n.filesMoved, { count: movedCount, toGroup: firstToGroup })
        );
      }
    }
  }
}
