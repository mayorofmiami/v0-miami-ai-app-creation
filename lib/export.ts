import type { Citation } from "@/types"

export function exportToMarkdown(query: string, response: string, citations: Citation[], mode: string): string {
  let markdown = `# ${query}\n\n`
  markdown += `**Mode:** ${mode === "quick" ? "Quick Search" : "Deep Research"}\n\n`
  markdown += `**Date:** ${new Date().toLocaleDateString()}\n\n`
  markdown += `## Response\n\n${response}\n\n`

  if (citations && citations.length > 0) {
    markdown += `## Sources\n\n`
    citations.forEach((citation, index) => {
      markdown += `${index + 1}. [${citation.title}](${citation.url})\n`
      if (citation.snippet) {
        markdown += `   > ${citation.snippet}\n\n`
      }
    })
  }

  return markdown
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToText(query: string, response: string, citations: Citation[], mode: string): string {
  let text = `${query}\n\n`
  text += `Mode: ${mode === "quick" ? "Quick Search" : "Deep Research"}\n`
  text += `Date: ${new Date().toLocaleDateString()}\n\n`
  text += `Response:\n${response}\n\n`

  if (citations && citations.length > 0) {
    text += `Sources:\n`
    citations.forEach((citation, index) => {
      text += `${index + 1}. ${citation.title}\n   ${citation.url}\n`
      if (citation.snippet) {
        text += `   ${citation.snippet}\n\n`
      }
    })
  }

  return text
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
