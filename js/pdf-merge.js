// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const mergeBtn = document.getElementById('mergeBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sortBtn = document.getElementById('sortBtn');
const removeAllBtn = document.getElementById('removeAllBtn');
const reorderBtn = document.getElementById('reorderBtn');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loadingStatus');
const previewSection = document.getElementById('previewSection');
const previewContainer = document.getElementById('previewContainer');
const stats = document.getElementById('stats');

// Stats elements
const fileCountEl = document.getElementById('fileCount');
const totalPagesEl = document.getElementById('totalPages');
const totalSizeEl = document.getElementById('totalSize');
const statusEl = document.getElementById('status');

// Options
const pageOrderSelect = document.getElementById('pageOrder');
const orientationSelect = document.getElementById('orientation');
const compressOption = document.getElementById('compressOption');

// State variables
let pdfFiles = [];
let sortableInstance = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF Merger initialized');
    
    // Set up event listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    mergeBtn.addEventListener('click', mergePDFs);
    clearBtn.addEventListener('click', resetApp);
    downloadBtn.addEventListener('click', downloadMergedPDF);
    sortBtn.addEventListener('click', toggleSortMode);
    removeAllBtn.addEventListener('click', removeAllFiles);
    reorderBtn.addEventListener('click', applyReorder);
    
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
        handleFiles(Array.from(files));
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFiles(files) {
    const validFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    
    if (validFiles.length === 0) {
        alert('Please select PDF files only');
        return;
    }
    
    validFiles.forEach(file => {
        const isDuplicate = pdfFiles.some(f => 
            f.name === file.name && 
            f.size === file.size
        );
        
        if (!isDuplicate) {
            pdfFiles.push(file);
        }
    });
    
    updateUI();
    loadPDFPreviews();
}

async function loadPDFPreviews() {
    previewContainer.innerHTML = '';
    
    for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.setAttribute('data-id', i);
        previewItem.innerHTML = `
            <div class="preview-header">
                <span class="preview-filename">${file.name}</span>
                <button class="remove-btn" data-index="${i}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="pdf-preview">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="preview-info">
                <p>${(file.size / 1024).toFixed(2)} KB</p>
                <p>File ${i + 1}</p>
            </div>
        `;
        
        previewContainer.appendChild(previewItem);
        
        const removeBtn = previewItem.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.currentTarget.getAttribute('data-index'));
            removeFile(index);
        });
    }
    
    // Initialize sortable
    if (pdfFiles.length > 0 && !sortableInstance) {
        sortableInstance = Sortable.create(previewContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: updateFileOrder
        });
    }
    
    // Update stats
    const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    fileCountEl.textContent = pdfFiles.length;
    totalPagesEl.textContent = 'N/A'; // Would need to parse PDF to get page count
    totalSizeEl.textContent = `${totalSizeMB} MB`;
    statusEl.textContent = `${pdfFiles.length} PDF file(s) loaded`;
}

function removeFile(index) {
    if (index < 0 || index >= pdfFiles.length) return;
    
    pdfFiles.splice(index, 1);
    updateUI();
    loadPDFPreviews();
}

function removeAllFiles() {
    pdfFiles = [];
    previewContainer.innerHTML = '';
    updateUI();
}

function updateFileOrder() {
    const newOrder = Array.from(previewContainer.children).map(child => {
        return parseInt(child.getAttribute('data-id'));
    });
    
    const reorderedFiles = newOrder.map(id => pdfFiles[id]);
    pdfFiles = reorderedFiles;
    
    statusEl.textContent = 'Reordered';
    setTimeout(() => {
        statusEl.textContent = `${pdfFiles.length} PDF file(s) loaded`;
    }, 2000);
}

function applyReorder() {
    updateFileOrder();
}

function toggleSortMode() {
    if (sortableInstance) {
        const isDisabled = !sortableInstance.option('disabled');
        sortableInstance.option('disabled', isDisabled);
        
        sortBtn.innerHTML = isDisabled 
            ? '<i class="fas fa-sort"></i> Enable Sorting' 
            : '<i class="fas fa-sort"></i> Disable Sorting';
        
        sortBtn.classList.toggle('btn-secondary', !isDisabled);
        statusEl.textContent = isDisabled ? 'Sorting disabled' : 'Sorting enabled';
    }
}

function updateUI() {
    const hasFiles = pdfFiles.length > 0;
    
    mergeBtn.disabled = !hasFiles;
    clearBtn.disabled = !hasFiles;
    sortBtn.disabled = !hasFiles;
    downloadBtn.disabled = !hasFiles;
    removeAllBtn.disabled = !hasFiles;
    reorderBtn.disabled = !hasFiles;
    
    if (hasFiles) {
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <p class="upload-text">${pdfFiles.length} PDF file(s) loaded</p>
            <p class="upload-subtext">Ready to merge</p>
            <button class="btn btn-secondary" id="addMoreBtn">
                <i class="fas fa-plus"></i> Add More PDFs
            </button>
        `;
        
        const addMoreBtn = document.getElementById('addMoreBtn');
        if (addMoreBtn) {
            addMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }
        
        previewSection.classList.remove('hidden');
        stats.classList.remove('hidden');
    } else {
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <p class="upload-text">Drag & Drop your PDF files here</p>
            <p class="upload-subtext">or click to browse files (PDF only)</p>
            <button class="btn" id="browseBtn">Browse PDF Files</button>
        `;
        
        const newBrowseBtn = document.getElementById('browseBtn');
        if (newBrowseBtn) {
            newBrowseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }
        
        previewSection.classList.add('hidden');
        stats.classList.add('hidden');
    }
}

async function mergePDFs() {
    if (pdfFiles.length === 0) {
        alert('Please add some PDF files first!');
        return;
    }
    
    if (pdfFiles.length === 1) {
        alert('You need at least 2 PDF files to merge!');
        return;
    }
    
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Merging PDF files...';
    mergeBtn.disabled = true;
    
    try {
        // Load pdf-lib
        const { PDFDocument } = PDFLib;
        
        // Create new PDF
        const mergedPdf = await PDFDocument.create();
        
        // Add each PDF
        for (let i = 0; i < pdfFiles.length; i++) {
            loadingStatus.textContent = `Processing PDF ${i + 1} of ${pdfFiles.length}...`;
            
            const file = pdfFiles[i];
            const fileBytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        
        // Save merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const pdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const fileName = `merged_${Date.now()}.pdf`;
        
        // Download
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        loading.classList.add('hidden');
        statusEl.textContent = 'PDFs Merged Successfully';
        
        setTimeout(() => {
            mergeBtn.disabled = false;
            statusEl.textContent = `${pdfFiles.length} PDF file(s) loaded`;
        }, 2000);
        
    } catch (error) {
        console.error('Error merging PDFs:', error);
        loadingStatus.textContent = 'Error merging PDFs';
        statusEl.textContent = 'Error';
        alert('Error merging PDF files. Please try again.');
        loading.classList.add('hidden');
        mergeBtn.disabled = false;
    }
}

function downloadMergedPDF() {
    mergePDFs();
}

function resetApp() {
    pdfFiles = [];
    previewContainer.innerHTML = '';
    
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
    
    fileInput.value = '';
    updateUI();
    
    fileCountEl.textContent = '0';
    totalPagesEl.textContent = '0';
    totalSizeEl.textContent = '0 MB';
    statusEl.textContent = 'Ready';
    
    loading.classList.add('hidden');
    sortBtn.innerHTML = '<i class="fas fa-sort"></i> Reorder Files';
    sortBtn.classList.remove('btn-secondary');
}

function initApp() {
    resetApp();
}
