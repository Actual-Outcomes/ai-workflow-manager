# Build Resources

This directory contains resources needed for building the application.

## Required Icons

To package the application, you'll need to add icons:

### Windows
- `icon.ico` - Windows icon file (256x256 or multi-size)

### macOS
- `icon.icns` - macOS icon file (512x512 recommended)

### Linux
- `icon.png` - PNG icon (512x512 recommended)

## Creating Icons

You can create icons from a single PNG source:

1. Create a 1024x1024 PNG with your app icon
2. Use online tools or:
   - **For .icns**: Use `png2icns` or `iconutil` (macOS)
   - **For .ico**: Use `convert` (ImageMagick) or online converters

## Temporary Solution

Until you add custom icons, electron-builder will use default Electron icons.

The app will still build and run without custom icons, but you'll see generic Electron icons.

