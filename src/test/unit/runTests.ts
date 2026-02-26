/**
 * 简单的单元测试运行器
 * 直接运行 Mocha 测试，不需要 VSCode Electron
 */

import Mocha from 'mocha';
import * as fs from 'fs';
import * as path from 'path';

const testsRoot = path.resolve(__dirname, '../suite');

function runTests(): Promise<void> {
  // 创建 Mocha 测试框架
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 5000
  });

  return new Promise<void>((resolve, reject) => {
    // 查找所有测试文件
    fs.readdir(testsRoot, (err, files) => {
      if (err) {
        return reject(err);
      }

      // 添加所有 .test.js 文件
      files.forEach(file => {
        if (file.endsWith('.test.js')) {
          mocha.addFile(path.join(testsRoot, file));
        }
      });

      try {
        // 运行测试
        mocha.run((failures: number) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            console.log('\n✅ All tests passed!');
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  });
}

// 运行测试
runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test run failed:', err.message);
    process.exit(1);
  });
