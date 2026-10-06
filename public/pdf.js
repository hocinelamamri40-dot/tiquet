// PDF local, sans service externe. Les polices PDF standard utilisent WinAnsi.
function ticketPdf(list, filters) {
  const pages = [[]];
  const special = {'€':128,'œ':156,'Œ':140,'’':146,'‘':145,'“':147,'”':148,'–':150,'—':151,'…':133};
  const encode = text => Array.from(String(text), c => {
    const code = c.codePointAt(0);
    return String.fromCharCode(special[c] ?? (code <= 255 ? code : 63));
  }).join('');
  const literal = text => encode(text).replace(/([\\()])/g, '\\$1');
  const line = (text, size = 10) => {
    if (pages.at(-1).length >= 46) pages.push([]);
    pages.at(-1).push({text, size});
  };
  const wrap = (text, width = 86) => {
    for (const paragraph of String(text ?? '').split(/\r?\n/)) {
      let remaining = paragraph;
      while (remaining.length > width) {
        let cut = remaining.lastIndexOf(' ', width);
        if (cut < width / 2) cut = width;
        line(remaining.slice(0, cut));
        remaining = remaining.slice(cut).trimStart();
      }
      line(remaining);
    }
  };
  line('HI Rungis Plus - Récapitulatif des tickets 2026', 16);
  line('Édité le ' + new Date().toLocaleString('fr-FR'));
  wrap(filters);
  const clos = list.filter(closed).length;
  const enCours = list.filter(t => !closed(t) && progress(t)).length;
  line(`Total : ${list.length} | Ouverts : ${list.length - clos - enCours} | En cours : ${enCours} | Clos : ${clos}`);
  line('');
  if (!list.length) line('Aucun ticket pour ces critères.');
  for (const ticket of list) {
    if (pages.at(-1).length > 39) pages.push([]);
    wrap(`${ticket.id} - ${ticket.equipment}`);
    wrap(`Date : ${displayDate(ticket.date)} | Type : ${ticket.type || '—'} | Statut : ${ticket.status}`);
    wrap('Motif : ' + ticket.title);
    if (ticket.comment) wrap('Commentaire : ' + ticket.comment);
    line('');
  }
  const objects = [null, '<< /Type /Catalog /Pages 2 0 R >>', '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'];
  const ids = [];
  pages.forEach((lines, index) => {
    const pageId = objects.length, contentId = pageId + 1;
    ids.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    let content = 'BT\n';
    lines.forEach(({text, size}, i) => {
      content += `/F1 ${size} Tf 1 0 0 1 36 ${800 - i * 16} Tm (${literal(text)}) Tj\n`;
    });
    content += `/F1 9 Tf 1 0 0 1 36 28 Tm (Page ${index + 1} / ${pages.length}) Tj\nET\n`;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  });
  objects[2] = `<< /Type /Pages /Count ${ids.length} /Kids [${ids.map(id => id + ' 0 R').join(' ')}] >>`;
  let pdf = '%PDF-1.4\n', offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([Uint8Array.from(pdf, c => c.charCodeAt(0))], {type:'application/pdf'});
}
