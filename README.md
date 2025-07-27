# Conv3rt

A minimal, client-side image conversion tool.

## Features

- Convert images between JPEG, PNG, and WebP formats
- Adjust quality settings for output images
- Modern tabbed interface for conversion and compression options
- Clean white-on-black design with no unnecessary borders or shadows
- Fully client-side processing (no server uploads)

## Usage

1. Open `index.html` in a web browser
2. Drag and drop an image file or click to select one
3. Choose conversion options:
   - Select output format (JPEG, PNG, WebP)
   - Adjust quality level
4. Switch to the "Compress" tab for compression options
5. Click "Process Image" to convert
6. Download the converted image

## Technical Details

- Pure client-side implementation using HTML5 Canvas
- No external dependencies or server requirements
- All processing happens in the browser

## Limitations

- Gzip/Brotli compression is indicated in the UI but not implemented due to client-side limitations
- Large images may take longer to process
- Some browsers may have restrictions on certain image operations

## Browser Support

Works in all modern browsers that support HTML5 Canvas and the File API.
