import * as assert from 'assert';
import { BookmarkFile } from '../../types';

/**
 * 测试 mergePaths 逻辑
 * 这些测试模拟了 BookmarkTreeProvider 中的目录合并行为
 */

// 模拟 mergePaths 函数
function mergePaths(dirPaths: string[], allFiles: BookmarkFile[]): string[] {
  const result: string[] = [];

  for (const path of dirPaths) {
    // 检查这个路径是否有直接文件
    const hasDirectFiles = allFiles.some(file => {
      const fileDirPath = file.relativePath.split('/').slice(0, -1).join('/');
      return fileDirPath === path;
    });

    // 只保留有直接文件的路径
    if (hasDirectFiles) {
      result.push(path);
    }
  }

  return result;
}

/**
 * 打印测试详情
 */
function printTestCase(
  title: string,
  files: BookmarkFile[],
  dirPaths: string[],
  expected: string[],
  actual: string[]
): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`📋 测试场景: ${title}`);
  console.log('═'.repeat(70));

  console.log('\n📁 输入文件:');
  if (files.length === 0) {
    console.log('  (无)');
  } else {
    files.forEach((file, i) => {
      console.log(`  ${i + 1}. ${file.relativePath}`);
    });
  }

  console.log('\n📂 输入目录路径:');
  if (dirPaths.length === 0) {
    console.log('  (无)');
  } else {
    dirPaths.forEach((path, i) => {
      console.log(`  ${i + 1}. "${path}"`);
    });
  }

  console.log('\n✅ 预期结果:');
  if (expected.length === 0) {
    console.log('  (无)');
  } else {
    expected.forEach((path, i) => {
      console.log(`  ${i + 1}. "${path}"`);
    });
  }

  console.log('\n🔍 实际结果:');
  if (actual.length === 0) {
    console.log('  (无)');
  } else {
    actual.forEach((path, i) => {
      console.log(`  ${i + 1}. "${path}"`);
    });
  }

  const passed = JSON.stringify(expected.sort()) === JSON.stringify(actual.sort());
  console.log('\n' + '─'.repeat(70));
  console.log(`${passed ? '✅ 通过' : '❌ 失败'}`);
  console.log('═'.repeat(70));
}

suite('BookmarkTreeProvider - mergePaths 测试', () => {

  test('场景1: 单个子目录且无直接文件 - 应该合并', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/a/b/c.ts', fileName: 'c.ts', addedAt: 1 }
    ];
    const dirPaths = ['src/a', 'src/a/b'];
    const expected = ['src/a/b'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '单个子目录且无直接文件 - 应该合并',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result, expected);
  });

  test('场景2: 单个子目录但有直接文件 - 不应该合并', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/a/index.ts', fileName: 'index.ts', addedAt: 1 },
      { uri: 'file://2', relativePath: 'src/a/b/c.ts', fileName: 'c.ts', addedAt: 2 }
    ];
    const dirPaths = ['src/a', 'src/a/b'];
    const expected = ['src/a', 'src/a/b'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '单个子目录但有直接文件 - 不应该合并',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result.sort(), expected.sort());
  });

  test('场景3: 多个子目录 - 不保留无文件的父目录', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/a/b/c.ts', fileName: 'c.ts', addedAt: 1 },
      { uri: 'file://2', relativePath: 'src/a/d/e.ts', fileName: 'e.ts', addedAt: 2 }
    ];
    const dirPaths = ['src/a', 'src/a/b', 'src/a/d'];
    const expected = ['src/a/b', 'src/a/d'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '多个子目录 - 不保留无文件的父目录',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result.sort(), expected.sort());
  });

  test('场景4: 无子目录的路径 - 应该保留', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/components/Button.tsx', fileName: 'Button.tsx', addedAt: 1 }
    ];
    const dirPaths = ['src/components'];
    const expected = ['src/components'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '无子目录的路径 - 应该保留',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result, expected);
  });

  test('场景5: 嵌套三层目录', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/a/b/c/d.ts', fileName: 'd.ts', addedAt: 1 }
    ];
    const dirPaths = ['src/a', 'src/a/b', 'src/a/b/c'];
    const expected = ['src/a/b/c'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '嵌套三层目录',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result, expected);
  });

  test('场景6: 复杂场景 - 混合情况', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/utils/index.ts', fileName: 'index.ts', addedAt: 1 },
      { uri: 'file://2', relativePath: 'src/utils/helpers/format.ts', fileName: 'format.ts', addedAt: 2 },
      { uri: 'file://3', relativePath: 'src/components/Button.tsx', fileName: 'Button.tsx', addedAt: 3 }
    ];
    const dirPaths = ['src/utils', 'src/utils/helpers', 'src/components'];
    const expected = ['src/components', 'src/utils', 'src/utils/helpers'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '复杂场景 - 混合情况',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result.sort(), expected.sort());
  });

  test('场景7: Bug 修复验证 - 父目录文件不会丢失', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/a/index.ts', fileName: 'index.ts', addedAt: 1 },
      { uri: 'file://2', relativePath: 'src/a/b/c.ts', fileName: 'c.ts', addedAt: 2 },
      { uri: 'file://3', relativePath: 'src/a/b/d.ts', fileName: 'd.ts', addedAt: 3 }
    ];
    const dirPaths = ['src/a', 'src/a/b'];
    const expected = ['src/a', 'src/a/b'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      'Bug 修复验证 - 父目录文件不会丢失',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result.sort(), expected.sort());
  });

  test('场景8: 多层级合并', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'a/b/c/d/e.ts', fileName: 'e.ts', addedAt: 1 }
    ];
    const dirPaths = ['a', 'a/b', 'a/b/c', 'a/b/c/d'];
    const expected = ['a/b/c/d'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '多层级合并',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result, expected);
  });

  test('场景9: 平级多目录', () => {
    const files: BookmarkFile[] = [
      { uri: 'file://1', relativePath: 'src/a/b.ts', fileName: 'b.ts', addedAt: 1 },
      { uri: 'file://2', relativePath: 'src/c/d.ts', fileName: 'd.ts', addedAt: 2 },
      { uri: 'file://3', relativePath: 'src/e/f.ts', fileName: 'f.ts', addedAt: 3 }
    ];
    const dirPaths = ['src/a', 'src/c', 'src/e'];
    const expected = ['src/a', 'src/c', 'src/e'];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '平级多目录',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result.sort(), expected.sort());
  });

  test('场景10: 空数组', () => {
    const files: BookmarkFile[] = [];
    const dirPaths: string[] = [];
    const expected: string[] = [];

    const result = mergePaths(dirPaths, files);

    printTestCase(
      '空数组',
      files,
      dirPaths,
      expected,
      result
    );

    assert.deepStrictEqual(result, expected);
  });
});
