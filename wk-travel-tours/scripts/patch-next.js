/**
 * Reproducible build patch for Next.js 15 on Windows environments.
 * Addresses the Next.js bug where parallel webpack compilation overwrites
 * module-level page manifest entries in PagesManifestPlugin, causing
 * "Invariant: no direct app page entry found for /_not-found".
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(
  __dirname,
  '../node_modules/next/dist/build/webpack/plugins/pages-manifest-plugin.js'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Check if unmerged assignment exists
  const unpatchedSnippet = `        if (this.isEdgeRuntime) {
            edgeServerPages = pages;
            edgeServerAppPaths = appPaths;
        } else {
            nodeServerPages = pages;
            nodeServerAppPaths = appPaths;
        }`;

  const patchedSnippet = `        if (this.isEdgeRuntime) {
            edgeServerPages = { ...edgeServerPages, ...pages };
            edgeServerAppPaths = { ...edgeServerAppPaths, ...appPaths };
        } else {
            nodeServerPages = { ...nodeServerPages, ...pages };
            nodeServerAppPaths = { ...nodeServerAppPaths, ...appPaths };
        }`;

  if (content.includes(unpatchedSnippet)) {
    content = content.replace(unpatchedSnippet, patchedSnippet);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[scripts/patch-next.js] Successfully applied Windows parallel compilation patch to Next.js');
  } else {
    console.log('[scripts/patch-next.js] Next.js is already patched or up to date.');
  }
}

