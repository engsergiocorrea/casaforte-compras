import type { Browser } from 'puppeteer'

// Browser do Puppeteer é reaproveitado entre chamadas (container persistente
// no Railway), evitando o custo de iniciar um novo Chromium a cada PDF.
let browserPromise: Promise<Browser> | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const puppeteer = await import('puppeteer')
    browserPromise = puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  try {
    return await browserPromise
  } catch (error) {
    browserPromise = null
    throw error
  }
}

/**
 * Renderiza um HTML em PDF real (buffer binário) usando Chromium headless.
 * Aguarda fontes/imagens externas (logo, Google Fonts) antes de imprimir.
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 })
    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}
