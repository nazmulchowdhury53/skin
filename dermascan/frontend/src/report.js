import { jsPDF } from 'jspdf'
import { CATEGORY, INFO } from './data.js'

// Builds the PDF fully in the browser; nothing is uploaded or stored.
export function downloadReport(result, originalDataUrl) {
  const d = new jsPDF({ unit: 'mm', format: 'a4' }), W = 210, M = 16
  let y = 18
  const line = (t, size = 10, bold = false, gap = 5.5) => {
    d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size)
    d.splitTextToSize(t, W - 2 * M).forEach(l => { if (y > 280) { d.addPage(); y = 18 } d.text(l, M, y); y += gap })
  }
  d.setFillColor(15, 118, 110); d.rect(0, 0, W, 12, 'F')
  d.setTextColor(255); d.setFont('helvetica', 'bold'); d.setFontSize(11); d.text('DermaScan AI - Analysis report', M, 8); d.setTextColor(20); y = 24
  line('For research and educational use only. Not a medical diagnosis. Consult a qualified dermatologist.', 10, true)
  y += 2
  if (result.demo) line('DEMO DATA: the analysis server was not connected, so this result is a placeholder.', 10, true)
  line(`Generated: ${new Date().toLocaleString()}`, 9)
  y += 2
  line(`Top prediction: ${result.top_class}`, 14, true, 7)
  line(`Confidence: ${(result.confidence * 100).toFixed(1)}%   |   Category: ${CATEGORY[result.category]?.label ?? result.category}`)
  line(`Malignancy score (P[melanoma] + P[BCC] + P[SCC]): ${(result.malignancy_score * 100).toFixed(1)}%`)
  if (result.low_confidence) line('Low confidence (< 50%): result unreliable.', 10, true)
  y += 2; line('Top 5 probabilities', 11, true)
  result.top5.forEach(t => line(`  ${t.label}: ${(t.prob * 100).toFixed(1)}%`))
  y += 2
  try {
    d.addImage(originalDataUrl, 'JPEG', M, y, 55, 55); d.addImage(`data:image/png;base64,${result.gradcam_overlay_base64}`, 'PNG', M + 62, y, 55, 55)
    d.setFontSize(8); d.text('Original', M, y + 59); d.text('Grad-CAM overlay', M + 62, y + 59); y += 66
  } catch { /* image embed is best-effort */ }
  const info = INFO[result.top_class]
  if (info) { line('About this condition', 11, true); line(info.what); y += 1; line('When to see a dermatologist', 11, true); line(info.see) }
  y += 2
  line('Model: ResNet50 (ImageNet pretrained, fine-tuned), 224x224, flip test-time augmentation; 14 classes; test accuracy 97.71%. No treatment or medication advice is given. Images are processed in memory and not stored.', 8, false, 4.2)
  d.save('dermascan-report.pdf')
}
