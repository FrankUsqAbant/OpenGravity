#!/usr/bin/env node

/**
 * Opengravity — Automated GitHub Repositories Sync
 * Fetches all public repos for FrankUsqAbant, discovers README images,
 * and updates both root and docs/ catalog scripts and counts (capped at 100).
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const USERNAME = 'FrankUsqAbant';
const MAX_PROJECTS = 100;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Opengravity-Catalog-Sync',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${url}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve) => {
    const headers = { 'User-Agent': 'Opengravity-Catalog-Sync' };
    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      } else {
        resolve(null);
      }
    }).on('error', () => resolve(null));
  });
}

async function extractImageFromReadme(repoName, branch) {
  const branches = [branch, 'main', 'master'];
  for (const b of branches) {
    if (!b) continue;
    const testPaths = ['preview.webp', 'preview.png', 'public/preview.webp', 'public/preview.png'];
    for (const tp of testPaths) {
      const rawUrl = `https://raw.githubusercontent.com/${USERNAME}/${repoName}/${b}/${tp}`;
      const exists = await fetchText(rawUrl);
      if (exists !== null && exists.length > 100) {
        return rawUrl;
      }
    }

    const readmeUrl = `https://raw.githubusercontent.com/${USERNAME}/${repoName}/${b}/README.md`;
    const readme = await fetchText(readmeUrl);
    if (readme) {
      const mdMatch = readme.match(/!\[.*?\]\((https:\/\/raw\.githubusercontent\.com\/[^\)]+|https:\/\/user-images\.githubusercontent\.com\/[^\)]+|https:\/\/github\.com\/[^\)]+\/raw\/[^\)]+)\)/i);
      if (mdMatch) return mdMatch[1];

      const htmlMatch = readme.match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i);
      if (htmlMatch) return htmlMatch[1];
    }
  }
  return null;
}

async function main() {
  console.log(`[Sync] Consultando repositorios públicos para @${USERNAME}...`);

  const existingScriptPath = path.resolve('script.js');
  let existingScript = fs.readFileSync(existingScriptPath, 'utf8');

  const readmeImagesMatch = existingScript.match(/const readmeImages = (\{[\s\S]*?\});/);
  const existingReadmeImages = readmeImagesMatch ? eval(`(${readmeImagesMatch[1]})`) : {};

  const reposUrl = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;
  const repos = await fetchJSON(reposUrl);

  console.log(`[Sync] Obtenidos ${repos.length} repositorios de la API de GitHub.`);

  // Filter out forks or user profile repo, capped to MAX_PROJECTS
  const validRepos = repos
    .filter(r => !r.fork && r.name !== 'FrankUsqAbant')
    .slice(0, MAX_PROJECTS);

  const newReadmeImages = { ...existingReadmeImages };
  const projectsList = [];

  for (const r of validRepos) {
    let img = newReadmeImages[r.name] || null;

    if (!img) {
      console.log(`[Sync] Buscando imagen para nuevo repo: ${r.name}...`);
      img = await extractImageFromReadme(r.name, r.default_branch);
      if (img) {
        newReadmeImages[r.name] = img;
        console.log(`  -> Encontrada imagen: ${img.slice(0, 60)}...`);
      }
    }

    let tags = [];
    if (r.topics && r.topics.length) {
      tags = r.topics.map(t => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 5);
    } else if (r.language) {
      tags = [r.language];
    } else {
      tags = ['Full-Stack'];
    }

    const proj = {
      name: r.name,
      description: r.description || `${r.name} — Proyecto y repositorio de código abierto en Opengravity.`,
      githubUrl: r.html_url,
      liveUrl: r.homepage || (r.has_pages ? `https://${USERNAME.toLowerCase()}.github.io/${r.name}/` : null),
      language: r.language || 'Code',
      stars: r.stargazers_count || 0,
      tags: tags,
      updatedAt: r.updated_at ? r.updated_at.split('T')[0] : '',
      createdAt: r.created_at ? r.created_at.split('T')[0] : ''
    };

    projectsList.push(proj);
  }

  console.log(`[Sync] Total de proyectos en catálogo: ${projectsList.length} (límite: ${MAX_PROJECTS})`);

  const imagesJSON = JSON.stringify(newReadmeImages, null, 2);
  const projectsJSON = JSON.stringify(projectsList, null, 2);

  const updateScriptContent = (content) => {
    let updated = content.replace(
      /const readmeImages = \{[\s\S]*?\};/,
      `const readmeImages = ${imagesJSON};`
    );
    updated = updated.replace(
      /const projects = \[[\s\S]*?\];/,
      `const projects = ${projectsJSON};`
    );
    return updated;
  };

  if (fs.existsSync('script.js')) {
    fs.writeFileSync('script.js', updateScriptContent(fs.readFileSync('script.js', 'utf8')));
  }
  if (fs.existsSync('docs/script.js')) {
    fs.writeFileSync('docs/script.js', updateScriptContent(fs.readFileSync('docs/script.js', 'utf8')));
  }

  const updateIndexHTML = (content) => {
    return content.replace(
      /<span>📂 \d+ Proyectos<\/span>/g,
      `<span>📂 ${projectsList.length} Proyectos</span>`
    );
  };

  if (fs.existsSync('index.html')) {
    fs.writeFileSync('index.html', updateIndexHTML(fs.readFileSync('index.html', 'utf8')));
  }
  if (fs.existsSync('docs/index.html')) {
    fs.writeFileSync('docs/index.html', updateIndexHTML(fs.readFileSync('docs/index.html', 'utf8')));
  }

  console.log(`[Sync] ¡Catálogo actualizado con éxito a ${projectsList.length} proyectos!`);
}

main().catch(err => {
  console.error('[Sync Error]', err);
  process.exit(1);
});
