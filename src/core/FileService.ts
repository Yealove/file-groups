import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 文件服务类
 * 负责文件相关的操作
 */
export class FileService {
  private workspaceRoot: string | undefined;

  constructor() {
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * 获取文件的相对路径
   */
  getRelativePath(uri: vscode.Uri): string {
    if (!this.workspaceRoot) {
      return uri.fsPath;
    }

    const relative = path.relative(this.workspaceRoot, uri.fsPath);
    return relative || uri.fsPath;
  }

  /**
   * 验证文件是否存在
   */
  async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 打开文件
   */
  async openFile(uri: vscode.Uri): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
  }

  /**
   * 获取当前活动编辑器的文件 URI
   */
  getActiveFileUri(): vscode.Uri | undefined {
    return vscode.window.activeTextEditor?.document.uri;
  }

  /**
   * 获取文件信息
   */
  getFileInfo(uri: vscode.Uri): { fileName: string; relativePath: string } {
    const fileName = path.basename(uri.fsPath);
    const relativePath = this.getRelativePath(uri);

    return { fileName, relativePath };
  }
}
