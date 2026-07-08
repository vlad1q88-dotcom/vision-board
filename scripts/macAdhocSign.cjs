// electron-builder afterPack hook: ad-hoc sign the macOS bundle.
//
// The app ships unsigned (no Apple Developer certificate), and repacking invalidates the
// ad-hoc signature Electron's binaries come with. Intel Macs tolerate that, but Apple
// Silicon refuses to launch code with a broken signature at all — users just get a blunt
// "cannot open the app" with no Gatekeeper override. Re-signing ad-hoc ("codesign -s -")
// restores a valid (still unverified) signature, so macOS falls back to the normal
// "unidentified developer" flow with an "Open Anyway" escape hatch.
const { execSync } = require('node:child_process')
const path = require('node:path')

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return
  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)
  execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' })
  execSync(`codesign --verify --deep --strict "${appPath}"`, { stdio: 'inherit' })
}
