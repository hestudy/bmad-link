#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
}

interface TestModule {
  name: string;
  file: string;
  tests: TestResult[];
  status: 'pass' | 'fail' | 'partial';
  duration: number;
}

interface TestReport {
  timestamp: string;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  modules: TestModule[];
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

class ReportGenerator {
  private templatePath: string;
  private outputDir: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../templates/report-template.html');
    this.outputDir = path.join(process.cwd(), 'tests/reports');
    
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReport(jsonReport: string): Promise<void> {
    try {
      const reportData = JSON.parse(jsonReport) as TestReport;
      const htmlContent = await this.generateHTML(reportData);
      
      const outputPath = path.join(this.outputDir, 'index.html');
      fs.writeFileSync(outputPath, htmlContent, 'utf-8');
      
      console.log(`📄 测试报告已生成: ${outputPath}`);
      
      // 同时生成JSON格式报告
      const jsonPath = path.join(this.outputDir, 'report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf-8');
      
      // 生成JUnit格式报告
      const junitContent = this.generateJUnit(reportData);
      const junitPath = path.join(this.outputDir, 'junit.xml');
      fs.writeFileSync(junitPath, junitContent, 'utf-8');
      
      console.log(`📊 完整报告套件已生成到: ${this.outputDir}`);
    } catch (error) {
      console.error('报告生成失败:', error);
      process.exit(1);
    }
  }

  private async generateHTML(data: TestReport): Promise<string> {
    const template = fs.readFileSync(this.templatePath, 'utf-8');
    
    const passPercentage = ((data.passedTests / data.totalTests) * 100).toFixed(1);
    const failPercentage = ((data.failedTests / data.totalTests) * 100).toFixed(1);
    
    // 生成测试模块HTML
    const testModulesHTML = data.modules.map(module => {
      const statusClass = module.status === 'pass' ? 'status-pass' : 
                         module.status === 'fail' ? 'status-fail' : 'status-partial';
      
      const testsHTML = module.tests.map(test => `
        <li class="test-item">
          <div class="test-status ${test.status}"></div>
          <div class="test-name">${test.name}</div>
          <div class="test-duration">${test.duration}ms</div>
        </li>
      `).join('');
      
      return `
        <div class="module">
          <div class="module-header">
            <h3>${module.name}</h3>
            <div class="module-status ${statusClass}">
              ${module.tests.filter(t => t.status === 'pass').length}/${module.tests.length}
            </div>
          </div>
          <div class="module-details">
            <ul class="test-list">${testsHTML}</ul>
          </div>
        </div>
      `;
    }).join('');

    return template
      .replace('{{TIMESTAMP}}', data.timestamp)
      .replace('{{PASSED_TESTS}}', data.passedTests.toString())
      .replace('{{FAILED_TESTS}}', data.failedTests.toString())
      .replace('{{TOTAL_TESTS}}', data.totalTests.toString())
      .replace('{{PASS_PERCENTAGE}}', passPercentage)
      .replace('{{FAIL_PERCENTAGE}}', failPercentage)
      .replace('{{DURATION}}', (data.duration / 1000).toFixed(2))
      .replace('{{TEST_MODULES}}', testModulesHTML)
      .replace(/\{\{STMT_COVERAGE\}\}/g, data.coverage.statements.toFixed(1))
      .replace(/\{\{BRANCH_COVERAGE\}\}/g, data.coverage.branches.toFixed(1))
      .replace(/\{\{FUNC_COVERAGE\}\}/g, data.coverage.functions.toFixed(1))
      .replace(/\{\{LINE_COVERAGE\}\}/g, data.coverage.lines.toFixed(1));
  }

  private generateJUnit(data: TestReport): string {
    const totalTime = (data.duration / 1000).toFixed(3);
    
    const testSuites = data.modules.map(module => {
      const testCases = module.tests.map(test => {
        if (test.status === 'fail') {
          return `    <testcase classname="${module.name}" name="${test.name}" time="${(test.duration / 1000).toFixed(3)}">
      <failure message="${test.error || 'Test failed'}">${test.error || 'Test failed'}</failure>
    </testcase>`;
        } else if (test.status === 'skip') {
          return `    <testcase classname="${module.name}" name="${test.name}" time="0">
      <skipped/>
    </testcase>`;
        } else {
          return `    <testcase classname="${module.name}" name="${test.name}" time="${(test.duration / 1000).toFixed(3)}"/>`;
        }
      }).join('\n');

      const moduleTime = (module.duration / 1000).toFixed(3);
      const failures = module.tests.filter(t => t.status === 'fail').length;
      const skipped = module.tests.filter(t => t.status === 'skip').length;

      return `  <testsuite name="${module.name}" tests="${module.tests.length}" failures="${failures}" skipped="${skipped}" time="${moduleTime}">
${testCases}
  </testsuite>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="BMad Link Tests" tests="${data.totalTests}" failures="${data.failedTests}" skipped="${data.skippedTests}" time="${totalTime}">
${testSuites}
</testsuites>`;
  }

  static async parseVitestOutput(jsonPath: string): Promise<TestReport> {
    const vitestResult = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    const modules: TestModule[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    let totalDuration = 0;

    // 解析Vitest输出格式
    if (vitestResult.testResults) {
      vitestResult.testResults.forEach((file: any) => {
        const tests: TestResult[] = [];
        let moduleStatus: 'pass' | 'fail' | 'partial' = 'pass';
        let moduleDuration = 0;

        file.tests?.forEach((test: any) => {
          const testResult: TestResult = {
            name: test.title || test.name,
            status: test.state === 'passed' ? 'pass' : 
                   test.state === 'failed' ? 'fail' : 'skip',
            duration: test.duration || 0,
            error: test.errors?.[0]?.message
          };

          tests.push(testResult);
          moduleDuration += testResult.duration;
          totalTests++;

          if (testResult.status === 'pass') passedTests++;
          else if (testResult.status === 'fail') {
            failedTests++;
            moduleStatus = 'fail';
          } else skippedTests++;
        });

        if (tests.some(t => t.status === 'fail') && tests.some(t => t.status === 'pass')) {
          moduleStatus = 'partial';
        }

        modules.push({
          name: path.basename(file.name || file.file, '.test.ts'),
          file: file.name || file.file,
          tests,
          status: moduleStatus,
          duration: moduleDuration
        });

        totalDuration += moduleDuration;
      });
    }

    return {
      timestamp: new Date().toLocaleString('zh-CN'),
      duration: totalDuration,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      modules,
      coverage: {
        statements: vitestResult.coverage?.statements || 0,
        branches: vitestResult.coverage?.branches || 0,
        functions: vitestResult.coverage?.functions || 0,
        lines: vitestResult.coverage?.lines || 0
      }
    };
  }
}

export { ReportGenerator, TestReport, TestModule, TestResult };

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ReportGenerator();
  const inputPath = process.argv[2];
  
  if (!inputPath) {
    console.error('用法: node report-generator.ts <json-report-path>');
    process.exit(1);
  }
  
  ReportGenerator.parseVitestOutput(inputPath).then(data => {
    return generator.generateReport(JSON.stringify(data));
  }).catch(error => {
    console.error('报告生成失败:', error);
    process.exit(1);
  });
}