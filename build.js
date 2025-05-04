// build.js
import { build } from 'vite'
import { resolve } from 'path'
import fs from 'fs-extra'

async function buildExtension() {
  try {
    const rootDir = process.cwd()
    const srcDir = resolve(rootDir, 'src')
    const distDir = resolve(rootDir, 'dist')
    
    console.log('🚀 Iniciando build da extensão...')
    console.log('📂 Diretórios:')
    console.log('   Root:', rootDir)
    console.log('   Src:', srcDir)
    console.log('   Dist:', distDir)
    
    // Limpa o diretório dist
    console.log('\n🧹 Limpando diretório dist...')
    await fs.remove(distDir)
    await fs.ensureDir(distDir)
    await fs.ensureDir(resolve(distDir, 'js'))
    
    // Build do content script
    console.log('\n🛠️ Iniciando build do content script...')
    await build({
      configFile: resolve(rootDir, 'vite.content.config.js'),
      mode: 'production'
    })
    
    // Build do popup e outros assets
    console.log('\n🛠️ Iniciando build do popup...')
    await build({
      configFile: resolve(rootDir, 'vite.config.js'),
      mode: 'production'
    })

    // Move o popup.html se estiver no local errado
    const popupSrcPath = resolve(distDir, 'src', 'popup.html')
    const popupDestPath = resolve(distDir, 'popup.html')
    if (await fs.pathExists(popupSrcPath)) {
      console.log('\n📦 Movendo popup.html para o local correto...')
      await fs.move(popupSrcPath, popupDestPath, { overwrite: true })
      await fs.remove(resolve(distDir, 'src'))
    }

    // Move o content.js se necessário
    const contentSrcPath = resolve(distDir, 'js', 'content.js')
    const contentDestPath = resolve(distDir, 'js', 'content.js')
    if (await fs.pathExists(contentSrcPath) && contentSrcPath !== contentDestPath) {
      console.log('\n📦 Movendo content.js para o local correto...')
      await fs.move(contentSrcPath, contentDestPath, { overwrite: true })
    }

    // Cria diretório de imagens se não existir
    await fs.ensureDir(resolve(distDir, 'images'))

    // Copia o manifest.json
    console.log('\n📄 Copiando manifest.json...')
    const manifestSrc = resolve(srcDir, 'manifest.json')
    const manifestDest = resolve(distDir, 'manifest.json')
    
    console.log('   De:', manifestSrc)
    console.log('   Para:', manifestDest)
    
    await fs.copy(manifestSrc, manifestDest)
    console.log('✅ manifest.json copiado com sucesso')
    
    // Copia os ícones
    console.log('\n🖼️ Copiando ícones...')
    const iconSizes = [16, 32, 48, 128]
    for (const size of iconSizes) {
      const iconSrc = resolve(srcDir, 'images', `icon${size}.png`)
      const iconDest = resolve(distDir, 'images', `icon${size}.png`)
      
      console.log(`\n   Copiando ícone ${size}x${size}:`)
      console.log('   De:', iconSrc)
      console.log('   Para:', iconDest)
      
      if (await fs.pathExists(iconSrc)) {
        await fs.copy(iconSrc, iconDest)
        console.log(`   ✅ Ícone ${size}x${size} copiado`)
      } else {
        console.warn(`   ⚠️ Ícone ${size}x${size} não encontrado em ${iconSrc}`)
      }
    }

    // Verifica os arquivos gerados
    console.log('\n🔍 Verificando arquivos gerados...')
    const files = await fs.readdir(distDir, { recursive: true })
    console.log('📁 Arquivos em dist:', files)

    // Verifica se os arquivos essenciais existem
    const requiredFiles = [
      'manifest.json',
      'popup.html',
      'js/content.js',
      'js/popup.js'
    ]
    
    for (const file of requiredFiles) {
      const filePath = resolve(distDir, file)
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Arquivo essencial faltando: ${file}`)
      }
    }

    console.log('\n✨ Build concluído com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro durante o build:', error)
    process.exit(1)
  }
}

buildExtension()
