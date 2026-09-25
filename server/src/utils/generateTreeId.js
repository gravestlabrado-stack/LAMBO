const Tree = require('../models/Tree');

/**
 * Generates the next sequential Tree ID in format LMB-XXXX
 * e.g., LMB-0001, LMB-0002
 */
async function generateTreeId() {
  const lastTree = await Tree.findOne({ treeId: /^LMB-\d+$/ })
    .sort({ createdAt: -1 })
    .select('treeId');

  let nextNumber = 1;

  if (lastTree && lastTree.treeId) {
    const match = lastTree.treeId.match(/^LMB-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNumber).padStart(4, '0');
  return `LMB-${padded}`;
}

module.exports = generateTreeId;
