import fs from 'fs';
import path from 'path';

interface FileCheck {
  filePath: string;
  lineCount: number;
  threshold: number;
  category: string;
}

interface Config {
  hooks: number;
  components: number;
  utilities: number;
  types: number;
}

const config: Config = {
  hooks: 150,
  components: 200,
  utilities: 100,
  types: 200,
};

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return 0;
  }
}

function getFileCategory(filePath: string): { category: string; threshold: number } | null {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  
  if (relativePath.startsWith('hooks/')) {
    return { category: 'Hooks', threshold: config.hooks };
  }
  
  if (relativePath.startsWith('components/')) {
    return { category: 'Components', threshold: config.components };
  }
  
  if (relativePath.startsWith('lib/')) {
    return { category: 'Utilities', threshold: config.utilities };
  }
  
  if (relativePath.startsWith('types/')) {
    return { category: 'Types', threshold: config.types };
  }
  
  return null;
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function checkFileLengths(): FileCheck[] {
  const allFiles = getAllFiles(process.cwd());
  const violations: FileCheck[] = [];
  
  for (const filePath of allFiles) {
    const categoryInfo = getFileCategory(filePath);
    if (categoryInfo) {
      const lineCount = countLines(filePath);
      if (lineCount > categoryInfo.threshold) {
        violations.push({
          filePath: path.relative(process.cwd(), filePath),
          lineCount,
          threshold: categoryInfo.threshold,
          category: categoryInfo.category,
        });
      }
    }
  }
  
  return violations.sort((a, b) => b.lineCount - a.lineCount);
}

function generateReport(violations: FileCheck[]): string {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  
  let report = `# Code Health Report\n\n`;
  report += `Generated on: ${timestamp}\n\n`;
  report += `## File Length Analysis\n\n`;
  report += `This report identifies files that exceed the recommended length thresholds:\n\n`;
  report += `- **Hooks**: ${config.hooks}+ lines\n`;
  report += `- **Components**: ${config.components}+ lines\n`;
  report += `- **Utilities** (lib folder): ${config.utilities}+ lines\n`;
  report += `- **Types**: ${config.types}+ lines\n\n`;
  
  if (violations.length === 0) {
    report += `✅ **All files are within the recommended length thresholds!**\n\n`;
  } else {
    report += `## Files Exceeding Thresholds\n\n`;
    report += `Found ${violations.length} file(s) that exceed the recommended thresholds:\n\n`;
    
    const groupedViolations = violations.reduce((acc, violation) => {
      if (!acc[violation.category]) {
        acc[violation.category] = [];
      }
      acc[violation.category].push(violation);
      return acc;
    }, {} as Record<string, FileCheck[]>);
    
    for (const [category, categoryViolations] of Object.entries(groupedViolations)) {
      report += `### ${category}\n\n`;
      report += `| File | Lines | Threshold | Excess |\n`;
      report += `|------|-------|-----------|--------|\n`;
      
      for (const violation of categoryViolations) {
        const excess = violation.lineCount - violation.threshold;
        report += `| \`${violation.filePath}\` | ${violation.lineCount} | ${violation.threshold} | +${excess} |\n`;
      }
      report += `\n`;
    }
    
    report += `## Summary\n\n`;
    report += `- **Total files analyzed**: ${getAllFiles(process.cwd()).filter(f => getFileCategory(f)).length}\n`;
    report += `- **Files exceeding thresholds**: ${violations.length}\n`;
    report += `- **Average excess lines**: ${Math.round(violations.reduce((acc, v) => acc + (v.lineCount - v.threshold), 0) / violations.length)}\n\n`;
    
    report += `## Recommendations\n\n`;
    report += `Consider refactoring the files listed above to improve maintainability:\n\n`;
    report += `- **Break down large components** into smaller, focused components\n`;
    report += `- **Extract custom hooks** from complex logic\n`;
    report += `- **Split utility files** into more specific modules\n`;
    report += `- **Organize type definitions** into logical groupings\n`;
    report += `- **Use composition patterns** to reduce file complexity\n\n`;
  }
  
  return report;
}

function printTableToConsole(violations: FileCheck[]) {
  if (violations.length === 0) {
    console.log('✅ All files are within the recommended length thresholds!');
    return;
  }

  console.log('\n📊 CODE HEALTH ANALYSIS');
  console.log('========================');
  console.log(`Found ${violations.length} file(s) exceeding thresholds:\n`);

  const groupedViolations = violations.reduce((acc, violation) => {
    if (!acc[violation.category]) {
      acc[violation.category] = [];
    }
    acc[violation.category].push(violation);
    return acc;
  }, {} as Record<string, FileCheck[]>);

  for (const [category, categoryViolations] of Object.entries(groupedViolations)) {
    console.log(`\n🔍 ${category.toUpperCase()}`);
    console.log('─'.repeat(80));
    
    const maxFileLength = Math.max(...categoryViolations.map(v => v.filePath.length));
    const fileColWidth = Math.max(maxFileLength + 2, 30);
    
    console.log(`${'File'.padEnd(fileColWidth)} | Lines | Threshold | Excess`);
    console.log('─'.repeat(fileColWidth) + '─┼───────┼───────────┼───────');
    
    categoryViolations.forEach(violation => {
      const excess = violation.lineCount - violation.threshold;
      const fileName = violation.filePath.length > fileColWidth - 2 
        ? '...' + violation.filePath.slice(-(fileColWidth - 5))
        : violation.filePath;
      
      console.log(
        `${fileName.padEnd(fileColWidth)} | ${violation.lineCount.toString().padStart(5)} | ${violation.threshold.toString().padStart(9)} | +${excess.toString().padStart(4)}`
      );
    });
  }

  const totalAnalyzed = getAllFiles(process.cwd()).filter(f => getFileCategory(f)).length;
  const averageExcess = Math.round(violations.reduce((acc, v) => acc + (v.lineCount - v.threshold), 0) / violations.length);
  
  console.log('\n📈 SUMMARY');
  console.log('─'.repeat(30));
  console.log(`Total files analyzed: ${totalAnalyzed}`);
  console.log(`Files exceeding thresholds: ${violations.length}`);
  console.log(`Average excess lines: ${averageExcess}`);
  
  console.log('\n💡 RECOMMENDATIONS');
  console.log('─'.repeat(50));
  console.log('• Break down large components into smaller, focused components');
  console.log('• Extract custom hooks from complex logic');
  console.log('• Split utility files into more specific modules');
  console.log('• Organize type definitions into logical groupings');
  console.log('• Use composition patterns to reduce file complexity');
}

function main() {
  try {
    console.log('Analyzing file lengths...');
    const violations = checkFileLengths();
    const report = generateReport(violations);
    
    const outputPath = path.join(process.cwd(), 'readme', 'CODE_HEALTH.md');
    fs.writeFileSync(outputPath, report);
    
    console.log(`Report generated: ${outputPath}`);
    
    printTableToConsole(violations);
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { checkFileLengths, generateReport };