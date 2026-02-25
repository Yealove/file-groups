import * as vscode from 'vscode';
import { BookmarkManager } from '../core/BookmarkManager';
import { BookmarkTreeItem } from '../tree/BookmarkTreeItem';
import { I18n } from '../utils/I18n';

/**
 * 分组管理命令
 */
export class GroupCommands {
  constructor(private bookmarkManager: BookmarkManager) {}

  /**
   * 注册所有分组命令
   */
  registerCommands(): vscode.Disposable[] {
    return [
      vscode.commands.registerCommand('bookmark.createGroup', () => this.createGroup()),
      vscode.commands.registerCommand('bookmark.deleteGroup', (groupId: string) => this.deleteGroup(groupId)),
      vscode.commands.registerCommand('bookmark.renameGroup', (groupId: string) => this.renameGroup(groupId))
    ];
  }

  /**
   * 创建新分组
   */
  private async createGroup(): Promise<void> {
    const i18n = I18n.get();

    const groupName = await vscode.window.showInputBox({
      placeHolder: i18n.enterGroupName,
      prompt: i18n.commandCreateGroup,
      validateInput: (value: string) => {
        if (!value || !value.trim()) {
          return i18n.groupNameCannotBeEmpty;
        }
        return null;
      }
    });

    if (!groupName) {
      return;
    }

    try {
      await this.bookmarkManager.createGroup(groupName);
      vscode.window.showInformationMessage(I18n.format(i18n.groupCreated, { name: groupName }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create group';
      vscode.window.showErrorMessage(message);
    }
  }

  /**
   * 删除分组
   */
  private async deleteGroup(arg: string | BookmarkTreeItem): Promise<void> {
    const i18n = I18n.get();

    // 处理参数：可能是 TreeItem 对象或直接的 groupId 字符串
    let groupId: string;
    if (typeof arg === 'string') {
      groupId = arg;
    } else if (arg instanceof BookmarkTreeItem && arg.data.type === 'group') {
      groupId = arg.data.group?.id || '';
    } else {
      vscode.window.showErrorMessage(i18n.groupNotFound);
      return;
    }

    const group = this.bookmarkManager.getGroupById(groupId);
    if (!group) {
      vscode.window.showErrorMessage(i18n.groupNotFound);
      return;
    }

    const fileCount = group.files.length;
    const confirmMessage = I18n.format(
      fileCount > 0 ? i18n.confirmDeleteGroupWithFiles : i18n.confirmDeleteGroup,
      { name: group.name, count: fileCount }
    );

    const confirmation = await vscode.window.showWarningMessage(
      confirmMessage,
      { modal: true },
      i18n.delete
    );

    if (confirmation !== i18n.delete) {
      return;
    }

    try {
      await this.bookmarkManager.deleteGroup(groupId);
      vscode.window.showInformationMessage(I18n.format(i18n.groupDeleted, { name: group.name }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete group';
      vscode.window.showErrorMessage(message);
    }
  }

  /**
   * 重命名分组
   */
  private async renameGroup(arg: string | BookmarkTreeItem): Promise<void> {
    const i18n = I18n.get();

    // 处理参数：可能是 TreeItem 对象或直接的 groupId 字符串
    let groupId: string;
    if (typeof arg === 'string') {
      groupId = arg;
    } else if (arg instanceof BookmarkTreeItem && arg.data.type === 'group') {
      groupId = arg.data.group?.id || '';
    } else {
      vscode.window.showErrorMessage(i18n.groupNotFound);
      return;
    }

    const group = this.bookmarkManager.getGroupById(groupId);
    if (!group) {
      vscode.window.showErrorMessage(i18n.groupNotFound);
      return;
    }

    const newName = await vscode.window.showInputBox({
      placeHolder: i18n.enterNewGroupName,
      prompt: i18n.commandRenameGroup,
      value: group.name,
      validateInput: (value: string) => {
        if (!value || !value.trim()) {
          return i18n.groupNameCannotBeEmpty;
        }
        return null;
      }
    });

    if (!newName || newName === group.name) {
      return;
    }

    try {
      await this.bookmarkManager.renameGroup(groupId, newName);
      vscode.window.showInformationMessage(I18n.format(i18n.groupRenamed, { name: newName }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename group';
      vscode.window.showErrorMessage(message);
    }
  }
}
