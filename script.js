document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const outputColumn = document.getElementById('output-column');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const resultImage = document.getElementById('resultImage');
    const fileInfo = document.getElementById('fileInfo');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const container = document.querySelector('.container');

    // State
    let selectedFile = null;
    let processedBlob = null;
    let activeTab = 'convert';

    // Initialize Brotli WASM
    try {
        await window.brotli.init();
    } catch (err) {
        console.error('Failed to initialize Brotli WASM:', err);
        // Disable brotli option if it fails to load
        const brotliOption = document.querySelector('#compress-format option[value="br"]');
        if (brotliOption) brotliOption.disabled = true;
    }

    // Event Listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => e.preventDefault());
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
    processBtn.addEventListener('click', handleProcess);
    downloadBtn.addEventListener('click', handleDownload);
    qualitySlider.addEventListener('input', () => qualityValue.textContent = `${qualitySlider.value}%`);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    function switchTab(tabId) {
        activeTab = tabId;
        tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        tabContents.forEach(c => c.classList.toggle('active', c.id === `${tabId}-tab`));
        
        // Update file input constraints
        fileInput.accept = tabId === 'convert' ? 'image/*' : '*/*';
        resetState();
    }

    function handleFileDrop(e) {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            processFile(e.dataTransfer.files[0]);
        }
    }

    function handleFileSelect(e) {
        if (e.target.files.length) {
            processFile(e.target.files[0]);
        }
    }

    function processFile(file) {
        selectedFile = file;
        resultImage.style.display = 'none';
        downloadBtn.disabled = true;

        if (activeTab === 'convert' && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                resultImage.src = e.target.result;
                resultImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
            fileInfo.textContent = `Ready to convert ${file.name}`;
        } else {
            fileInfo.textContent = `Ready to process ${file.name}`;
        }

        handleProcess();
    }

    function resetState() {
        selectedFile = null;
        processedBlob = null;
        outputColumn.style.display = 'none';
        fileInput.value = '';
        container.classList.add('centered');
    }

    async function handleProcess() {
        if (!selectedFile) return;

        if (activeTab === 'convert') {
            await convertImage();
        } else {
            await compressFile();
        }

        outputColumn.style.display = 'flex';
        container.classList.remove('centered');
    }

    function convertImage() {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const format = document.getElementById('format').value;
                    const quality = parseInt(qualitySlider.value) / 100;
                    const mimeType = `image/${format}`;

                    canvas.toBlob((blob) => {
                        processedBlob = blob;
                        updateFileInfo(selectedFile.size, blob.size, `Converted to ${format.toUpperCase()}`);
                        downloadBtn.disabled = false;
                        resultImage.src = URL.createObjectURL(blob);
                        resultImage.style.display = 'block';
                        resolve();
                    }, mimeType, quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(selectedFile);
        });
    }

    function compressFile() {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const inputArray = new Uint8Array(e.target.result);
                const format = document.getElementById('compress-format').value;
                let outputArray;

                if (format === 'gz') {
                    outputArray = pako.gzip(inputArray);
                } else if (format === 'br') {
                    outputArray = window.brotli.compress(inputArray);
                }

                processedBlob = new Blob([outputArray]);
                updateFileInfo(selectedFile.size, processedBlob.size, `Compressed to ${format.toUpperCase()}`);
                downloadBtn.disabled = false;
                resolve();
            };
            reader.readAsArrayBuffer(selectedFile);
        });
    }

    function handleDownload() {
        if (!processedBlob) return;

        const baseName = selectedFile.name;
        let newFileName = baseName;

        if (activeTab === 'convert') {
            const format = document.getElementById('format').value;
            newFileName = `${baseName.substring(0, baseName.lastIndexOf('.')) || baseName}.${format}`;
        } else {
            const format = document.getElementById('compress-format').value;
            newFileName = `${baseName}.${format}`;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(processedBlob);
        link.download = newFileName;
        link.click();
    }

    function updateFileInfo(originalSize, newSize, message) {
        const reduction = 100 - (newSize / originalSize * 100);
        fileInfo.textContent = `${message} | ${formatBytes(originalSize)} -> ${formatBytes(newSize)} | Saved ${reduction.toFixed(1)}%`;
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Initial setup
    switchTab('convert');
    container.classList.add('centered');
});
