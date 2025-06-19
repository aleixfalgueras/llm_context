import { marked } from 'marked'
import puppeteer from 'puppeteer'
import chromium from '@sparticuz/chromium'

export async function generatePdfFromMarkdown(markdownContent: string): Promise<Buffer> {
  // Convert markdown to HTML
  const html = marked(markdownContent)

  // Create PDF with environment-specific puppeteer configuration
  const browser = process.env.NODE_ENV === 'production'
    ? await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    : await puppeteer.launch({ headless: true })

  const page = await browser.newPage()
  await page.setContent(`
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #2563eb;
            margin-top: 24px;
            margin-bottom: 16px;
          }
          h1 { 
            font-size: 2em; 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 8px; 
          }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.3em; }
          p { margin-bottom: 16px; }
          ul, ol { 
            margin-bottom: 16px; 
            padding-left: 30px; 
          }
          li { margin-bottom: 8px; }
          blockquote {
            border-left: 4px solid #2563eb;
            padding-left: 16px;
            margin: 16px 0;
            font-style: italic;
            background: #f8fafc;
            padding: 12px 16px;
          }
          code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
          }
          pre {
            background: #f1f5f9;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;
          }
          pre code {
            background: none;
            padding: 0;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `)

  const pdf = await page.pdf({
    format: 'A4',
    margin: { 
      top: '20mm', 
      right: '20mm', 
      bottom: '20mm', 
      left: '20mm' 
    },
    printBackground: true,
  })

  await browser.close()

  return Buffer.from(pdf)
} 