import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
  // 创建 Mocha 测试框架
  const mocha = new Mocha({
    ui: 'tdd',
    color: true
  });

  const testsRoot = path.resolve(__dirname, '.');

  return new Promise<void>((c, e) => {
    // 查找所有测试文件
    glob('**/**.test.js', { cwd: testsRoot })
      .then((files: string[]) => {
        // 添加文件到测试套件
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

        try {
          // 运行测试
          mocha.run((failures: number) => {
            if (failures > 0) {
              e(new Error(`${failures} tests failed.`));
            } else {
              c();
            }
          });
        } catch (err) {
          console.error(err);
          e(err);
        }
      })
      .catch((err: Error) => {
        e(err);
      });
  });
}
