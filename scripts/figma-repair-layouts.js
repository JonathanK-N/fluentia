// CORRECTIF PRÉPARÉ, NON EXÉCUTÉ : quota Figma Starter atteint le 24 octobre 2026.
// Reprendre dans le fichier et la session autorisés, puis contrôler les six captures.
const page = await figma.getNodeByIdAsync('0:1');
await figma.setCurrentPageAsync(page);
for (const style of ['Regular', 'Medium', 'SemiBold']) await figma.loadFontAsync({ family: 'Poppins', style });
const roots = await Promise.all(['12:83','12:205','12:328','12:451','12:573','12:696','12:819'].map(id => figma.getNodeByIdAsync(id)));
const changed = [];
for (const root of roots) {
  for (const n of root.findAll(n => n.type === 'FRAME')) {
    if (n.layoutMode === 'HORIZONTAL' && (n.layoutWrap === 'WRAP' || n.children.every(c => c.type === 'FRAME'))) {
      n.primaryAxisSizingMode = 'FIXED';
      n.counterAxisSizingMode = 'AUTO';
      changed.push(n.id);
    }
  }
  for (const n of root.findAll(n => n.type === 'INSTANCE')) {
    const available = n.width;
    for (const child of n.children) {
      if (child.type === 'FRAME' && child.width > available) {
        child.resize(available, child.height);
        changed.push(child.id);
      }
      if (child.type === 'TEXT' && child.width > available) {
        child.resize(available, child.height);
        child.textAutoResize = 'HEIGHT';
        changed.push(child.id);
      }
    }
  }
}
return { mutatedNodeIds: changed, status: 'Nécessite une nouvelle revue visuelle ; ne constitue pas une validation.' };
