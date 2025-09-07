// 测试报告配置
import { defineConfig } from 'vitest/config';
import type { Reporter } from 'vitest';

interface TestReportConfig {
  outputDir: string;
  formats: {
    html: boolean;
    json: boolean;
    junit: boolean;
    lcov: boolean;
  };
  coverage: {
    threshold: {
      global: {
        branches: number;
        functions: number;
        lines: number;
        statements: number;
      };
    };
  };
}

export const reportConfig: TestReportConfig = {
  outputDir: 'tests/reports',
  formats: {
    html: true,
    json: true,
    junit: true,
    lcov: true,
  },
  coverage: {
    threshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
};

// 自定义报告器配置
export const customReporter: Reporter = {
  name: 'bmad-custom-reporter',
  onInit(ctx) {
    console.log('🧪 BMad Link 测试报告器初始化...');
  },
  onTaskUpdate(packs) {
    // 实时更新测试进度
  },
  onFinished(files, errors) {
    const totalTests = files.reduce((sum, file) => sum + file.tasks.length, 0);
    const passedTests = files.reduce((sum, file) => 
      sum + file.tasks.filter(task => task.result?.state === 'pass').length, 0
    );
    const failedTests = files.reduce((sum, file) => 
      sum + file.tasks.filter(task => task.result?.state === 'fail').length, 0
    );

    console.log('\n📊 BMad Link 测试总结:');
    console.log(`✅ 通过: ${passedTests}`);
    console.log(`❌ 失败: ${failedTests}`);
    console.log(`📈 通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (errors && errors.length > 0) {
      console.log(`🚨 错误: ${errors.length}`);
    }
  }
};

export default reportConfig;