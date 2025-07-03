import fs from 'fs';
import path from 'path';

interface FileCheck {
  filePath: string;
  lineCount: number;
  threshold: number;
  category: string;
}

interface CodeQualityIssue {
  filePath: string;
  line: number;
  column?: number;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface CodeQualityReport {
  duplicateCode: CodeQualityIssue[];
  unusedImports: CodeQualityIssue[];
  deadCode: CodeQualityIssue[];
  magicNumbers: CodeQualityIssue[];
}

interface TechnicalDebtItem {
  filePath: string;
  line: number;
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX';
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface BundleSizeItem {
  filePath: string;
  sizeBytes: number;
  lineCount: number;
  complexity: number;
  imports: number;
}

interface ExtraReport {
  technicalDebt: TechnicalDebtItem[];
  bundleImpact: BundleSizeItem[];
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

function getFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
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

function detectDuplicateCode(allFiles: string[]): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];
  const codeBlocks = new Map<string, { filePath: string; line: number }[]>();
  
  for (const filePath of allFiles) {
    const content = getFileContent(filePath);
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    // Check for duplicate blocks of 3+ lines
    for (let i = 0; i < lines.length - 2; i++) {
      const block = lines.slice(i, i + 3)
        .map(line => line.trim())
        .filter(line => line.length > 10 && !line.startsWith('//') && !line.startsWith('*'))
        .join('|');
      
      if (block.length > 30) {
        if (!codeBlocks.has(block)) {
          codeBlocks.set(block, []);
        }
        codeBlocks.get(block)!.push({ filePath: relativePath, line: i + 1 });
      }
    }
  }
  
  // Find duplicates
  codeBlocks.forEach((locations) => {
    if (locations.length > 1) {
      locations.forEach(location => {
        issues.push({
          filePath: location.filePath,
          line: location.line,
          issue: 'Duplicate Code',
          severity: 'medium',
          description: `Duplicate code block found (${locations.length} occurrences)`
        });
      });
    }
  });
  
  return issues;
}

function detectUnusedImports(allFiles: string[]): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];
  
  for (const filePath of allFiles) {
    const content = getFileContent(filePath);
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    lines.forEach((line, index) => {
      // Match import statements
      const importMatch = line.match(/^import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const [, namedImports, namespaceImport, defaultImport] = importMatch;
        let imports: string[] = [];
        
        if (namedImports) {
          imports = namedImports.split(',').map(imp => imp.trim().split(' as ')[0].trim());
        } else if (namespaceImport) {
          imports = [namespaceImport];
        } else if (defaultImport) {
          imports = [defaultImport];
        }
        
        imports.forEach(imp => {
          // Simple check - if import is not used in the file content
          const regex = new RegExp(`\\b${imp}\\b`, 'g');
          const matches = content.match(regex);
          if (!matches || matches.length <= 1) { // Only the import statement itself
            issues.push({
              filePath: relativePath,
              line: index + 1,
              issue: 'Unused Import',
              severity: 'low',
              description: `Import '${imp}' appears to be unused`
            });
          }
        });
      }
    });
  }
  
  return issues;
}

function detectDeadCode(allFiles: string[]): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];
  
  for (const filePath of allFiles) {
    const content = getFileContent(filePath);
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for unreachable code after return statements
      if (trimmedLine.startsWith('return') && index < lines.length - 1) {
        const nextLine = lines[index + 1]?.trim();
        if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//') && !nextLine.startsWith('*')) {
          issues.push({
            filePath: relativePath,
            line: index + 2,
            issue: 'Dead Code',
            severity: 'high',
            description: 'Unreachable code after return statement'
          });
        }
      }
      
      // Check for unused variables (simple pattern)
      const varMatch = trimmedLine.match(/^(?:const|let|var)\s+(\w+)\s*=/);
      if (varMatch) {
        const varName = varMatch[1];
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        const matches = content.match(regex);
        if (matches && matches.length <= 1) {
          issues.push({
            filePath: relativePath,
            line: index + 1,
            issue: 'Dead Code',
            severity: 'medium',
            description: `Variable '${varName}' is declared but never used`
          });
        }
      }
    });
  }
  
  return issues;
}

function detectMagicNumbers(allFiles: string[]): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];
  const allowedNumbers = new Set(['0', '1', '2', '-1', '10', '100', '1000']);
  
  for (const filePath of allFiles) {
    const content = getFileContent(filePath);
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    lines.forEach((line, index) => {
      // Find numbers that are not in quotes and not part of obvious contexts
      const numberMatches = line.match(/\b\d+(?:\.\d+)?\b/g);
      if (numberMatches) {
        numberMatches.forEach(number => {
          if (!allowedNumbers.has(number)) {
            // Skip if it's in a comment or string
            const numberIndex = line.indexOf(number);
            const beforeNumber = line.substring(0, numberIndex);
            const isInComment = beforeNumber.includes('//') || beforeNumber.includes('/*');
            const isInString = (beforeNumber.match(/'/g) || []).length % 2 === 1 || 
                              (beforeNumber.match(/"/g) || []).length % 2 === 1 ||
                              (beforeNumber.match(/`/g) || []).length % 2 === 1;
            
            if (!isInComment && !isInString) {
              issues.push({
                filePath: relativePath,
                line: index + 1,
                column: numberIndex + 1,
                issue: 'Magic Number',
                severity: 'low',
                description: `Magic number '${number}' should be replaced with a named constant`
              });
            }
          }
        });
      }
    });
  }
  
  return issues;
}

function analyzeCodeQuality(): CodeQualityReport {
  const allFiles = getAllFiles(process.cwd());
  
  console.log('Analyzing code quality...');
  
  return {
    duplicateCode: detectDuplicateCode(allFiles),
    unusedImports: detectUnusedImports(allFiles),
    deadCode: detectDeadCode(allFiles),
    magicNumbers: detectMagicNumbers(allFiles)
  };
}

function detectTechnicalDebt(allFiles: string[]): TechnicalDebtItem[] {
  const debtItems: TechnicalDebtItem[] = [];
  const debtPatterns = [
    { type: 'TODO' as const, regex: /\/\/\s*TODO:?\s*(.+)/gi, priority: 'medium' as const },
    { type: 'FIXME' as const, regex: /\/\/\s*FIXME:?\s*(.+)/gi, priority: 'high' as const },
    { type: 'HACK' as const, regex: /\/\/\s*HACK:?\s*(.+)/gi, priority: 'high' as const },
    { type: 'XXX' as const, regex: /\/\/\s*XXX:?\s*(.+)/gi, priority: 'medium' as const }
  ];
  
  for (const filePath of allFiles) {
    const content = getFileContent(filePath);
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    lines.forEach((line, index) => {
      debtPatterns.forEach(pattern => {
        const match = pattern.regex.exec(line);
        if (match) {
          debtItems.push({
            filePath: relativePath,
            line: index + 1,
            type: pattern.type,
            content: match[1].trim(),
            priority: pattern.priority
          });
        }
        pattern.regex.lastIndex = 0; // Reset regex
      });
    });
  }
  
  return debtItems.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function analyzeBundleImpact(allFiles: string[]): BundleSizeItem[] {
  const bundleItems: BundleSizeItem[] = [];
  
  for (const filePath of allFiles) {
    const content = getFileContent(filePath);
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    
    // Calculate file size in bytes
    const sizeBytes = Buffer.byteLength(content, 'utf8');
    
    // Count lines
    const lineCount = content.split('\n').length;
    
    // Simple complexity metric based on various factors
    const complexityFactors = {
      functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
      conditionals: (content.match(/if\s*\(|switch\s*\(|case\s+/g) || []).length,
      loops: (content.match(/for\s*\(|while\s*\(|\.map\s*\(|\.forEach\s*\(|\.filter\s*\(/g) || []).length,
      classes: (content.match(/class\s+\w+|interface\s+\w+|type\s+\w+/g) || []).length,
      jsx: (content.match(/<[A-Z]\w*/g) || []).length
    };
    
    const complexity = Object.values(complexityFactors).reduce((sum, count) => sum + count, 0);
    
    // Count imports
    const imports = (content.match(/^import\s+.+from\s+/gm) || []).length;
    
    bundleItems.push({
      filePath: relativePath,
      sizeBytes,
      lineCount,
      complexity,
      imports
    });
  }
  
  // Sort by size (largest first)
  return bundleItems.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

function analyzeExtra(): ExtraReport {
  const allFiles = getAllFiles(process.cwd());
  
  console.log('Analyzing technical debt and bundle impact...');
  
  return {
    technicalDebt: detectTechnicalDebt(allFiles),
    bundleImpact: analyzeBundleImpact(allFiles)
  };
}

function generateReport(violations: FileCheck[], qualityReport: CodeQualityReport, extraReport: ExtraReport): string {
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
  
  // Add Code Quality section
  report += `## Code Quality Analysis\n\n`;
  
  const totalIssues = qualityReport.duplicateCode.length + qualityReport.unusedImports.length + 
                     qualityReport.deadCode.length + qualityReport.magicNumbers.length;
  
  if (totalIssues === 0) {
    report += `✅ **No code quality issues detected!**\n\n`;
  } else {
    report += `Found ${totalIssues} code quality issue(s) across the codebase:\n\n`;
    
    // Duplicate Code
    if (qualityReport.duplicateCode.length > 0) {
      report += `### Duplicate Code (${qualityReport.duplicateCode.length} issues)\n\n`;
      report += `| File | Line | Description |\n`;
      report += `|------|------|-------------|\n`;
      qualityReport.duplicateCode.slice(0, 10).forEach(issue => {
        report += `| \`${issue.filePath}\` | ${issue.line} | ${issue.description} |\n`;
      });
      if (qualityReport.duplicateCode.length > 10) {
        report += `| ... | ... | ${qualityReport.duplicateCode.length - 10} more issues |\n`;
      }
      report += `\n`;
    }
    
    // Unused Imports
    if (qualityReport.unusedImports.length > 0) {
      report += `### Unused Imports (${qualityReport.unusedImports.length} issues)\n\n`;
      report += `| File | Line | Description |\n`;
      report += `|------|------|-------------|\n`;
      qualityReport.unusedImports.slice(0, 10).forEach(issue => {
        report += `| \`${issue.filePath}\` | ${issue.line} | ${issue.description} |\n`;
      });
      if (qualityReport.unusedImports.length > 10) {
        report += `| ... | ... | ${qualityReport.unusedImports.length - 10} more issues |\n`;
      }
      report += `\n`;
    }
    
    // Dead Code
    if (qualityReport.deadCode.length > 0) {
      report += `### Dead Code (${qualityReport.deadCode.length} issues)\n\n`;
      report += `| File | Line | Severity | Description |\n`;
      report += `|------|------|----------|-------------|\n`;
      qualityReport.deadCode.slice(0, 10).forEach(issue => {
        const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        report += `| \`${issue.filePath}\` | ${issue.line} | ${severityIcon} ${issue.severity} | ${issue.description} |\n`;
      });
      if (qualityReport.deadCode.length > 10) {
        report += `| ... | ... | ... | ${qualityReport.deadCode.length - 10} more issues |\n`;
      }
      report += `\n`;
    }
    
    // Magic Numbers
    if (qualityReport.magicNumbers.length > 0) {
      report += `### Magic Numbers (${qualityReport.magicNumbers.length} issues)\n\n`;
      report += `| File | Line | Column | Description |\n`;
      report += `|------|------|--------|-------------|\n`;
      qualityReport.magicNumbers.slice(0, 10).forEach(issue => {
        report += `| \`${issue.filePath}\` | ${issue.line} | ${issue.column || 'N/A'} | ${issue.description} |\n`;
      });
      if (qualityReport.magicNumbers.length > 10) {
        report += `| ... | ... | ... | ${qualityReport.magicNumbers.length - 10} more issues |\n`;
      }
      report += `\n`;
    }
    
    report += `### Code Quality Summary\n\n`;
    report += `- **Duplicate Code**: ${qualityReport.duplicateCode.length} issues\n`;
    report += `- **Unused Imports**: ${qualityReport.unusedImports.length} issues\n`;
    report += `- **Dead Code**: ${qualityReport.deadCode.length} issues\n`;
    report += `- **Magic Numbers**: ${qualityReport.magicNumbers.length} issues\n\n`;
    
    report += `### Code Quality Recommendations\n\n`;
    report += `- **Extract duplicate code** into reusable functions or components\n`;
    report += `- **Remove unused imports** to improve bundle size and code clarity\n`;
    report += `- **Eliminate dead code** to reduce maintenance burden\n`;
    report += `- **Replace magic numbers** with named constants for better readability\n`;
    report += `- **Use linting tools** like ESLint to catch these issues automatically\n\n`;
  }
  
  // Add Extra section
  report += `## Extra Analysis\n\n`;
  
  // Technical Debt
  report += `### Technical Debt (${extraReport.technicalDebt.length} items)\n\n`;
  if (extraReport.technicalDebt.length === 0) {
    report += `✅ **No technical debt markers found!**\n\n`;
  } else {
    report += `Found ${extraReport.technicalDebt.length} technical debt marker(s):\n\n`;
    report += `| File | Line | Type | Priority | Description |\n`;
    report += `|------|------|------|----------|-------------|\n`;
    
    extraReport.technicalDebt.slice(0, 15).forEach(item => {
      const priorityIcon = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      const typeIcon = item.type === 'TODO' ? '📝' : item.type === 'FIXME' ? '🔧' : item.type === 'HACK' ? '⚠️' : '❌';
      report += `| \`${item.filePath}\` | ${item.line} | ${typeIcon} ${item.type} | ${priorityIcon} ${item.priority} | ${item.content} |\n`;
    });
    
    if (extraReport.technicalDebt.length > 15) {
      report += `| ... | ... | ... | ... | ${extraReport.technicalDebt.length - 15} more items |\n`;
    }
    report += `\n`;
    
    // Technical debt summary by type
    const debtByType = extraReport.technicalDebt.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    report += `**Technical Debt Breakdown:**\n`;
    Object.entries(debtByType).forEach(([type, count]) => {
      const typeIcon = type === 'TODO' ? '📝' : type === 'FIXME' ? '🔧' : type === 'HACK' ? '⚠️' : '❌';
      report += `- **${typeIcon} ${type}**: ${count} items\n`;
    });
    report += `\n`;
  }
  
  // Bundle Size Impact
  report += `### Bundle Size Impact (Top 15 largest files)\n\n`;
  const totalSize = extraReport.bundleImpact.reduce((sum, item) => sum + item.sizeBytes, 0);
  const avgComplexity = Math.round(extraReport.bundleImpact.reduce((sum, item) => sum + item.complexity, 0) / extraReport.bundleImpact.length);
  
  report += `| File | Size (KB) | Lines | Complexity | Imports | Impact Score |\n`;
  report += `|------|-----------|-------|------------|---------|-------------|\n`;
  
  extraReport.bundleImpact.slice(0, 15).forEach(item => {
    const sizeKB = (item.sizeBytes / 1024).toFixed(1);
    // Impact score: combination of size, complexity, and imports
    const impactScore = Math.round((item.sizeBytes / 1024) + (item.complexity * 2) + (item.imports * 1.5));
    report += `| \`${item.filePath}\` | ${sizeKB} | ${item.lineCount} | ${item.complexity} | ${item.imports} | ${impactScore} |\n`;
  });
  report += `\n`;
  
  report += `**Bundle Analysis Summary:**\n`;
  report += `- **Total codebase size**: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;
  report += `- **Average file complexity**: ${avgComplexity}\n`;
  report += `- **Largest file**: ${extraReport.bundleImpact[0]?.filePath || 'N/A'} (${(extraReport.bundleImpact[0]?.sizeBytes / 1024).toFixed(1)} KB)\n`;
  report += `- **Most complex file**: ${extraReport.bundleImpact.reduce((max, item) => item.complexity > max.complexity ? item : max, extraReport.bundleImpact[0])?.filePath || 'N/A'}\n\n`;
  
  report += `### Extra Recommendations\n\n`;
  report += `**Technical Debt:**\n`;
  report += `- **Prioritize FIXME and HACK items** as they indicate urgent issues\n`;
  report += `- **Set regular technical debt cleanup sessions** to address TODO items\n`;
  report += `- **Use issue tracking** to convert debt markers into actionable tasks\n\n`;
  report += `**Bundle Optimization:**\n`;
  report += `- **Code split large files** to improve loading performance\n`;
  report += `- **Review high-complexity files** for refactoring opportunities\n`;
  report += `- **Consider lazy loading** for heavy components and utilities\n`;
  report += `- **Optimize imports** to reduce bundle size and improve tree-shaking\n`;
  report += `- **Use bundle analyzers** to identify optimization opportunities\n\n`;
  
  return report;
}

function printCodeQualityToConsole(qualityReport: CodeQualityReport) {
  const totalIssues = qualityReport.duplicateCode.length + qualityReport.unusedImports.length + 
                     qualityReport.deadCode.length + qualityReport.magicNumbers.length;
  
  console.log('\n🔍 CODE QUALITY ANALYSIS');
  console.log('========================');
  
  if (totalIssues === 0) {
    console.log('✅ No code quality issues detected!');
    return;
  }
  
  console.log(`Found ${totalIssues} code quality issue(s):\n`);
  
  if (qualityReport.duplicateCode.length > 0) {
    console.log(`📋 DUPLICATE CODE: ${qualityReport.duplicateCode.length} issues`);
  }
  if (qualityReport.unusedImports.length > 0) {
    console.log(`📦 UNUSED IMPORTS: ${qualityReport.unusedImports.length} issues`);
  }
  if (qualityReport.deadCode.length > 0) {
    console.log(`💀 DEAD CODE: ${qualityReport.deadCode.length} issues`);
  }
  if (qualityReport.magicNumbers.length > 0) {
    console.log(`🔢 MAGIC NUMBERS: ${qualityReport.magicNumbers.length} issues`);
  }
}

function printExtraToConsole(extraReport: ExtraReport) {
  console.log('\n📊 EXTRA ANALYSIS');
  console.log('=================');
  
  // Technical Debt
  console.log(`\n💳 TECHNICAL DEBT: ${extraReport.technicalDebt.length} items`);
  if (extraReport.technicalDebt.length > 0) {
    const debtByType = extraReport.technicalDebt.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(debtByType).forEach(([type, count]) => {
      const typeIcon = type === 'TODO' ? '📝' : type === 'FIXME' ? '🔧' : type === 'HACK' ? '⚠️' : '❌';
      console.log(`  ${typeIcon} ${type}: ${count} items`);
    });
  }
  
  // Bundle Size Impact
  console.log(`\n📦 BUNDLE IMPACT ANALYSIS`);
  const totalSize = extraReport.bundleImpact.reduce((sum, item) => sum + item.sizeBytes, 0);
  const largestFile = extraReport.bundleImpact[0];
  const mostComplexFile = extraReport.bundleImpact.reduce((max, item) => 
    item.complexity > max.complexity ? item : max, extraReport.bundleImpact[0]);
  
  console.log(`  📈 Total codebase size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  📄 Total files analyzed: ${extraReport.bundleImpact.length}`);
  if (largestFile) {
    console.log(`  🔥 Largest file: ${largestFile.filePath} (${(largestFile.sizeBytes / 1024).toFixed(1)} KB)`);
  }
  if (mostComplexFile) {
    console.log(`  🧩 Most complex file: ${mostComplexFile.filePath} (complexity: ${mostComplexFile.complexity})`);
  }
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
    console.log('Analyzing code health...');
    console.log('- Checking file lengths...');
    const violations = checkFileLengths();
    
    console.log('- Analyzing code quality...');
    const qualityReport = analyzeCodeQuality();
    
    console.log('- Analyzing technical debt and bundle impact...');
    const extraReport = analyzeExtra();
    
    const report = generateReport(violations, qualityReport, extraReport);
    
    const outputPath = path.join(process.cwd(), 'readme', 'CODE_HEALTH.md');
    fs.writeFileSync(outputPath, report);
    
    console.log(`\nReport generated: ${outputPath}`);
    
    printTableToConsole(violations);
    printCodeQualityToConsole(qualityReport);
    printExtraToConsole(extraReport);
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { checkFileLengths, analyzeCodeQuality, analyzeExtra, generateReport };