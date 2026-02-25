import * as vscode from 'vscode';
import { BookmarkManager } from '../core/BookmarkManager';
import { FileService } from '../core/FileService';
import { BookmarkTreeItem } from '../tree/BookmarkTreeItem';
import { I18n } from '../utils/I18n';

/**
 * 文件操作命令
 */
export class FileCommands {
  private fileService: FileService;

  constructor(private bookmarkManager: BookmarkManager) {
    this.fileService = new FileService();
  }

  /**
   * 注册所有文件命令
   */
  registerCommands(): vscode.Disposable[] {
    return [
      vscode.commands.registerCommand('bookmark.addFileToGroup', (uri?) => this.addFileToGroup(uri)),
      vscode.commands.registerCommand('bookmark.removeFile', (groupId: string, fileUri: string) =>
        this.removeFile(groupId, fileUri)
      ),
      vscode.commands.registerCommand('bookmark.openFile', (fileUri: string) => this.openFile(fileUri)),
      vscode.commands.registerCommand('bookmark.addCurrentFileToGroup', () =>
        this.addCurrentFileToGroup()
      )
    ];
  }

  /**
   * 添加文件到分组
   */
  private async addFileToGroup(uri?: vscode.Uri): Promise<void> {
    const i18n = I18n.get();

    // 如果没有提供 URI，尝试获取当前活动的文件
    if (!uri) {
      uri = this.fileService.getActiveFileUri();
      if (!uri) {
        vscode.window.showWarningMessage(i18n.noActiveFile);
        return;
      }
    }

    // 获取所有分组
    const groups = this.bookmarkManager.getGroups();

    if (groups.length === 0) {
      const createGroup = await vscode.window.showInformationMessage(
        i18n.noGroupsFound,
        i18n.createGroup
      );

      if (createGroup === i18n.createGroup) {
        vscode.commands.executeCommand('bookmark.createGroup');
      }
      return;
    }

    // 显示分组选择器
    const groupItems = groups.map(group => ({
      label: group.name,
      description: `${group.files.length} ${group.files.length === 1 ? i18n.file : i18n.files}`,
      groupId: group.id
    }));

    const selected = await vscode.window.showQuickPick(groupItems, {
      placeHolder: i18n.selectGroup
    });

    if (!selected) {
      return;
    }

    try {
      const file = await this.bookmarkManager.addFileToGroup(selected.groupId, uri);
      vscode.window.showInformationMessage(
        I18n.format(i18n.fileAdded, { fileName: file.fileName, groupName: selected.label })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.fileAlreadyExists;
      vscode.window.showErrorMessage(message);
    }
  }

  /**
   * 从分组移除文件
   */
  private async removeFile(arg: any, fileUri?: string): Promise<void> {
    const i18n = I18n.get();

    // 处理参数：可能是 TreeItem 对象或直接的参数
    let groupId: string;
    let uri: string;

    if (arg instanceof BookmarkTreeItem && arg.data.type === 'file') {
      // 从 TreeItem 提取信息
      groupId = arg.data.groupId || '';
      uri = arg.data.file?.uri || '';
    } else if (typeof arg === 'string' && fileUri) {
      // 直接参数
      groupId = arg;
      uri = fileUri;
    } else {
      vscode.window.showErrorMessage(i18n.fileNotFound);
      return;
    }

    const group = this.bookmarkManager.getGroupById(groupId);
    if (!group) {
      vscode.window.showErrorMessage(i18n.groupNotFound);
      return;
    }

    const file = group.files.find(f => f.uri === uri);
    if (!file) {
      vscode.window.showErrorMessage(i18n.fileNotFound);
      return;
    }

    const confirmation = await vscode.window.showWarningMessage(
      I18n.format(i18n.confirmRemoveFile, { fileName: file.fileName, groupName: group.name }),
      i18n.remove
    );

    if (confirmation !== i18n.remove) {
      return;
    }

    try {
      await this.bookmarkManager.removeFileFromGroup(groupId, uri);
      vscode.window.showInformationMessage(I18n.format(i18n.fileRemoved, { fileName: file.fileName }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove file';
      vscode.window.showErrorMessage(message);
    }
  }

  /**
   * 打开文件
   */
  private async openFile(fileUri: string): Promise<void> {
    try {
      const uri = vscode.Uri.parse(fileUri);
      await this.fileService.openFile(uri);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to open file');
    }
  }

  /**
   * 添加当前活动文件到分组
   */
  private async addCurrentFileToGroup(): Promise<void> {
    const i18n = I18n.get();
    const uri = this.fileService.getActiveFileUri();
    if (!uri) {
      vscode.window.showWarningMessage(i18n.noActiveFile);
      return;
    }

    await this.addFileToGroup(uri);
  }
}
