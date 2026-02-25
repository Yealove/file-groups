import * as vscode from 'vscode';

/**
 * 国际化字符串定义
 */
interface I18nStrings {
  // 命令相关
  commandCreateGroup: string;
  commandAddFileToGroup: string;
  commandDeleteGroup: string;
  commandRenameGroup: string;

  // 提示信息
  noActiveFile: string;
  enterGroupName: string;
  enterNewGroupName: string;
  groupNameCannotBeEmpty: string;
  groupAlreadyExists: string;
  groupNotFound: string;
  fileAlreadyExists: string;
  fileNotFound: string;

  // 确认对话框
  confirmDeleteGroup: string;
  confirmDeleteGroupWithFiles: string;
  confirmRemoveFile: string;

  // 成功消息
  groupCreated: string;
  groupRenamed: string;
  groupDeleted: string;
  fileAdded: string;
  fileRemoved: string;
  noGroupsFound: string;
  selectGroup: string;

  // 按钮文本
  createGroup: string;
  delete: string;
  remove: string;

  // TreeView 描述
  file: string;
  files: string;

  // 欢迎消息
  welcomeMessage: string;
}

/**
 * 英文翻译
 */
const enStrings: I18nStrings = {
  commandCreateGroup: 'Create Group',
  commandAddFileToGroup: 'Add File to Group',
  commandDeleteGroup: 'Delete Group',
  commandRenameGroup: 'Rename Group',
  noActiveFile: 'No active file to add',
  enterGroupName: 'Enter group name',
  enterNewGroupName: 'Enter a new name for the group',
  groupNameCannotBeEmpty: 'Group name cannot be empty',
  groupAlreadyExists: 'Group "{name}" already exists',
  groupNotFound: 'Group not found',
  fileAlreadyExists: 'File already exists in this group',
  fileNotFound: 'File not found in this group',
  confirmDeleteGroup: 'Are you sure you want to delete group "{name}"?',
  confirmDeleteGroupWithFiles: 'Are you sure you want to delete group "{name}" with {count} file(s)?',
  confirmRemoveFile: 'Remove "{fileName}" from group "{groupName}"?',
  groupCreated: 'Group "{name}" created successfully',
  groupRenamed: 'Group renamed to "{name}"',
  groupDeleted: 'Group "{name}" deleted',
  fileAdded: 'Added "{fileName}" to group "{groupName}"',
  fileRemoved: 'Removed "{fileName}" from group',
  noGroupsFound: 'No groups found. Would you like to create one?',
  selectGroup: 'Select a group',
  createGroup: 'Create Group',
  delete: 'Delete',
  remove: 'Remove',
  file: 'file',
  files: 'files',
  welcomeMessage: 'File Groups extension activated! Use the side panel to manage your file groups.'
};

/**
 * 中文翻译
 */
const zhStrings: I18nStrings = {
  commandCreateGroup: '创建分组',
  commandAddFileToGroup: '添加文件到分组',
  commandDeleteGroup: '删除分组',
  commandRenameGroup: '重命名分组',
  noActiveFile: '没有活动文件可添加',
  enterGroupName: '输入分组名称',
  enterNewGroupName: '输入分组的新名称',
  groupNameCannotBeEmpty: '分组名称不能为空',
  groupAlreadyExists: '分组 "{name}" 已存在',
  groupNotFound: '分组未找到',
  fileAlreadyExists: '文件已存在于该分组中',
  fileNotFound: '文件未在该分组中找到',
  confirmDeleteGroup: '确定要删除分组 "{name}" 吗？',
  confirmDeleteGroupWithFiles: '确定要删除分组 "{name}" 及其 {count} 个文件吗？',
  confirmRemoveFile: '从分组 "{groupName}" 中移除 "{fileName}" 吗？',
  groupCreated: '分组 "{name}" 创建成功',
  groupRenamed: '分组已重命名为 "{name}"',
  groupDeleted: '分组 "{name}" 已删除',
  fileAdded: '已将 "{fileName}" 添加到分组 "{groupName}"',
  fileRemoved: '已从分组中移除 "{fileName}"',
  noGroupsFound: '没有找到分组。要创建一个吗？',
  selectGroup: '选择一个分组',
  createGroup: '创建分组',
  delete: '删除',
  remove: '移除',
  file: '个文件',
  files: '个文件',
  welcomeMessage: '文件分组扩展已激活！使用侧边栏管理您的文件分组。'
};

/**
 * 国际化工具类
 */
export class I18n {
  private static strings: I18nStrings;

  /**
   * 初始化 i18n
   */
  static initialize() {
    const locale = vscode.env.language || 'en';

    // 检测是否为中文
    if (locale.startsWith('zh')) {
      this.strings = zhStrings;
    } else {
      this.strings = enStrings;
    }
  }

  /**
   * 获取翻译字符串
   */
  static get(): I18nStrings {
    if (!this.strings) {
      this.initialize();
    }
    return this.strings;
  }

  /**
   * 格式化字符串（替换占位符）
   */
  static format(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }
}
