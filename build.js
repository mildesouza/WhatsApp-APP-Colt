// build.js
import { build } from 'esbuild';
import { copyFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Função para copiar arquivos estáticos
async function copyStaticFiles() {
  try {
    // Criar pasta images em dist se não existir
    await mkdir(join(__dirname, 'dist', 'images'), { recursive: true });
    
    // Copiar manifest.json atualizado
    const manifest = {
      "manifest_version": 3,
      "name": "WhatsApp Orçamentos",
      "version": "1.0",
      "description": "Extrair o telefone do contato ativo e gerenciar orçamentos",
      "icons": {
        "16": "images/icon16.png",
        "48": "images/icon48.png",
        "128": "images/icon128.png"
      },
      "action": {
        "default_popup": "popup.html",
        "default_icon": {
          "16": "images/icon16.png",
          "48": "images/icon48.png",
          "128": "images/icon128.png"
        }
      },
      "permissions": [
        "activeTab",
        "scripting",
        "storage",
        "tabs"
      ],
      "host_permissions": [
        "https://web.whatsapp.com/*"
      ],
      "background": {
        "service_worker": "background.bundle.js",
        "type": "module"
      },
      "content_scripts": [
        {
          "matches": ["https://web.whatsapp.com/*"],
          "js": ["content.bundle.js"],
          "run_at": "document_idle"
        }
      ]
    };
    
    await writeFile(
      join(__dirname, 'dist', 'manifest.json'), 
      JSON.stringify(manifest, null, 2)
    );
    
    // Copiar HTML e imagens
    await copyFile(join(__dirname, 'src', 'popup.html'), join(__dirname, 'dist', 'popup.html'));
    await copyFile(join(__dirname, 'src', 'images', 'icon16.png'), join(__dirname, 'dist', 'images', 'icon16.png'));
    await copyFile(join(__dirname, 'src', 'images', 'icon48.png'), join(__dirname, 'dist', 'images', 'icon48.png'));
    await copyFile(join(__dirname, 'src', 'images', 'icon128.png'), join(__dirname, 'dist', 'images', 'icon128.png'));
    
    // Copiar CSS se existir
    await mkdir(join(__dirname, 'dist', 'css'), { recursive: true });
    await copyFile(join(__dirname, 'src', 'css', 'popup.css'), join(__dirname, 'dist', 'css', 'popup.css'));
    
    console.log('✅ Arquivos estáticos copiados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao copiar arquivos estáticos:', error);
    process.exit(1);
  }
}

// Build dos arquivos TypeScript
async function buildTypeScript() {
  try {
    for (const name of ['content', 'background', 'popup']) {
      await build({
        entryPoints: [`src/${name}.ts`],
        bundle: true,
        outfile: `dist/${name}.bundle.js`,
        sourcemap: true,
        minify: true,
        platform: 'browser'
      });
    }
    console.log('✅ Build TypeScript concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no build TypeScript:', error);
    process.exit(1);
  }
}

// Executa build e cópia
async function main() {
  await buildTypeScript();
  await copyStaticFiles();
  console.log('🎉 Build completo!');
}

main();
