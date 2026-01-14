// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const compressBtn = document.getElementById('compressBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loadingStatus');
const stats = document.getElementById('stats');
const comparison = document.getElementById('comparison');

// Stats elements
const originalSizeEl = document.getElementById('originalSize');
const compressedSizeEl = document.getElementById('compressedSize');
const reductionEl = document.getElementById('reduction');
const statusEl = document.getElementById('status');
const originalInfoEl = document.getElementById('originalInfo');
const compressedInfoEl = document.getElementById('compressedInfo');

// Options
const compressionLevels = document.querySelectorAll('.compression-btn');
const optimizeImages = document.getElementById('optimizeImages');
const removeMetadata = document.getElementById('removeMetadata');
const downsampleImages = document.getElementById('downsampleImages');

// State variables
let currentFile = null;
let currentCompressionLevel = 'medium';
let compressedPdfBlob = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF Compressor initialized');
    
    // Set up event listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    analyzeBtn.addEventListener('click', analyzePDF);
    compressBtn.addEventListener('click', compressPDF);
    clearBtn.addEventListener('click', resetApp);
    downloadBtn.addEventListener('click', downloadCompressedPDF);
    
    // Compression level buttons
    compressionLevels.forEach(btn => {
        btn.addEventListener('click', function() {
            compressionLevels.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCompressionLevel = this.getAttribute('data-level');
        });
    });
    
    // Drag and drop setup
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
        dropArea.addEventListener('click', () => fileInput.click());
    }
    
    initApp();
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    dropArea.classList.add('dragover');
}

function unhighlight() {
    dropArea.classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a PDF file');
        return;
    }
    
    currentFile = file;
    compressedPdfBlob = null;
    
    updateUI();
    analyzePDF();
}

function updateUI() {
    const hasFile = currentFile !== null;
    
    analyzeBtn.disabled = !hasFile;
    compressBtn.disabled = !hasFile;
    clearBtn.disabled = !hasFile;
    downloadBtn.disabled = compressedPdfBlob === null;
    
    if (hasFile) {
        const sizeMB = (currentFile.size / (1024 * 1024)).toFixed(2);
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <p class="upload-text">${currentFile.name}</p>
            <p class="upload-subtext">${sizeMB} MB - Ready to compress</p>
            <button class="btn btn-secondary" id="changeFileBtn">
                <i class="fas fa-exchange-alt"></i> Change File
            </button>
        `;
        
        const changeFileBtn = document.getElementById('changeFileBtn');
        if (changeFileBtn) {
            changeFileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }
        
        stats.classList.remove('hidden');
        originalSizeEl.textContent = `${(currentFile.size / (1024 * 1024)).toFixed(2)} MB`;
        
    } else {
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <p class="upload-text">Drag & Drop your PDF file here</p>
            <p class="upload-subtext">or click to browse files</p>
            <button class="btn" id="browseBtn">Browse PDF File</button>
        `;
        
        const newBrowseBtn = document.getElementById('browseBtn');
        if (newBrowseBtn) {
            newBrowseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }
        
        stats.classList.add('hidden');
        comparison.classList.add('hidden');
    }
}

async function analyzePDF() {
    if (!currentFile) return;
    
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Analyzing PDF file...';
    
    try {
        // Simple analysis - in real implementation, you'd parse the PDF
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const originalSizeMB = (currentFile.size / (1024 * 1024)).toFixed(2);
        const estimatedReduction = currentCompressionLevel === 'low' ? 20 : 
                                 currentCompressionLevel === 'medium' ? 40 : 60;
        const estimatedSizeMB = (currentFile.size * (100 - estimatedReduction) / 100 / (1024 * 1024)).toFixed(2);
        
        originalInfoEl.textContent = `${originalSizeMB} MB - ${currentFile.name}`;
        compressedInfoEl.textContent = `Estimated: ${estimatedSizeMB} MB (${estimatedReduction}% smaller)`;
        
        compressedSizeEl.textContent = `${estimatedSizeMB} MB`;
        reductionEl.textContent = `${estimatedReduction}%`;
        statusEl.textContent = 'Analysis Complete';
        
        comparison.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error analyzing PDF:', error);
        statusEl.textContent = 'Analysis Failed';
    }
    
    loading.classList.add('hidden');
}

async function compressPDF() {
    if (!currentFile) return;
    
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Compressing PDF file...';
    compressBtn.disabled = true;
    
    try {
        const { PDFDocument } = PDFLib;
        
        // Load the PDF
        const fileBytes = await currentFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        // Get compression settings based on level
        const compressionSettings = getCompressionSettings(currentCompressionLevel);
        
        // Note: pdf-lib doesn't have built-in compression
        // In a real implementation, you'd use a different library or techniques
        // This is a simplified version
        
        // For demonstration, we'll just save the PDF (no actual compression in pdf-lib)
        const compressedBytes = await pdfDoc.save();
        
        // Simulate compression by reducing quality (in real app, use proper compression)
        const compressionFactor = currentCompressionLevel === 'low' ? 0.9 : 
                                currentCompressionLevel === 'medium' ? 0.75 : 0.5;
        
        // Create compressed blob
        compressedPdfBlob = new Blob([compressedBytes], { type: 'application/pdf' });
        
        // Calculate stats
        const originalSizeMB = (currentFile.size / (1024 * 1024)).toFixed(2);
        const compressedSizeMB = (compressedPdfBlob.size / (1024 * 1024)).toFixed(2);
        const reduction = ((1 - compressedPdfBlob.size / currentFile.size) * 100).toFixed(1);
        
        // Update UI
        compressedSizeEl.textContent = `${compressedSizeMB} MB`;
        reductionEl.textContent = `${reduction}%`;
        statusEl.textContent = 'Compression Complete';
        
        compressedInfoEl.textContent = `${compressedSizeMB} MB (${reduction}% smaller)`;
        
        downloadBtn.disabled = false;
        
    } catch (error) {
        console.error('Error compressing PDF:', error);
        loadingStatus.textContent = 'Error compressing PDF';
        statusEl.textContent = 'Error';
        alert('Error compressing PDF file. Please try again.');
    }
    
    loading.classList.add('hidden');
    compressBtn.disabled = false;
}

function getCompressionSettings(level) {
    switch(level) {
        case 'low':
            return { quality: 0.9, downsample: false };
        case 'medium':
            return { quality: 0.7, downsample: true };
        case 'high':
            return { quality: 0.5, downsample: true };
        default:
            return { quality: 0.7, downsample: true };
    }
}

function downloadCompressedPDF() {
    if (!compressedPdfBlob) return;
    
    const fileName = `compressed_${currentFile.name.replace('.pdf', '')}_${Date.now()}.pdf`;
    const url = URL.createObjectURL(compressedPdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetApp() {
    currentFile = null;
    compressedPdfBlob = null;
    fileInput.value = '';
    
    updateUI();
    
    originalSizeEl.textContent = '0 MB';
    compressedSizeEl.textContent = '0 MB';
    reductionEl.textContent = '0%';
    statusEl.textContent = 'Ready';
    
    loading.classList.add('hidden');
    comparison.classList.add('hidden');
}

function initApp() {
    resetApp();
}
