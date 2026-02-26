import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // VSCode 测试运行器
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // 下载 VSCode，运行测试
    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
