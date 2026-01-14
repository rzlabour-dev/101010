// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewBtn = document.getElementById('previewBtn');
const removeBtn = document.getElementById('removeBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const loading = document.getElementById('loading');
const loadingStatus = document.getElementById('loadingStatus');
const stats = document.getElementById('stats');
const previewSection = document.getElementById('previewSection');
const pageThumbnails = document.getElementById('pageThumbnails');
const pageSummary = document.getElementById('pageSummary');
const selectedCountEl = document.getElementById('selectedCount');
const totalPagesEl = document.getElementById('totalPages');

// Stats elements
const originalPagesEl = document.getElementById('originalPages');
const remainingPagesEl = document.getElementById('remainingPages');
const removedPagesEl = document.getElementById('removedPages');
const statusEl = document.getElementById('status');

// Options
const pageInput = document.getElementById('pageInput');
const keepOnlyCheckbox = document.getElementById('keepOnly');

// State variables
let currentFile = null;
let totalPages = 0;
let selectedPages = new Set();
let modifiedPdfBlob = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('PDF Page Remover initialized');
    
    // Set up event listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    previewBtn.addEventListener('click', previewPages);
    removeBtn.addEventListener('click', removePages);
    clearBtn.addEventListener('click', resetApp);
    downloadBtn.addEventListener('click', downloadModifiedPDF);
    selectAllBtn.addEventListener('click', selectAllPages);
    deselectAllBtn.addEventListener('click', deselectAllPages);
    
    // Page input change
    pageInput.addEventListener('input', parsePageInput);
    
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
    selectedPages.clear();
    modifiedPdfBlob = null;
    
    updateUI();
}

function updateUI() {
    const hasFile = currentFile !== null;
    
    previewBtn.disabled = !hasFile;
    removeBtn.disabled = !hasFile;
    clearBtn.disabled = !hasFile;
    downloadBtn.disabled = modifiedPdfBlob === null;
    selectAllBtn.disabled = !hasFile || totalPages === 0;
    deselectAllBtn.disabled = !hasFile || totalPages === 0;
    
    if (hasFile) {
        const sizeMB = (currentFile.size / (1024 * 1024)).toFixed(2);
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <p class="upload-text">${currentFile.name}</p>
            <p class="upload-subtext">${sizeMB} MB - Ready to edit pages</p>
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
        previewSection.classList.add('hidden');
    }
}

function parsePageInput() {
    const input = pageInput.value.trim();
    if (!input) return;
    
    selectedPages.clear();
    const parts = input.split(',');
    
    parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(num => parseInt(num.trim()));
            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    selectedPages.add(i - 1); // Convert to zero-based
                }
            }
        } else {
            const pageNum = parseInt(trimmed);
            if (!isNaN(pageNum)) {
                selectedPages.add(pageNum - 1); // Convert to zero-based
            }
        }
    });
    
    updatePageSummary();
}

async function previewPages() {
    if (!currentFile) return;
    
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Loading PDF pages...';
    
    try {
        // Load PDF to get page count
        const fileBytes = await currentFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(fileBytes).promise;
        
        totalPages = pdf.numPages;
        originalPagesEl.textContent = totalPages;
        totalPagesEl.textContent = totalPages;
        
        // Create thumbnail containers
        pageThumbnails.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'page-thumbnail';
            thumbnail.setAttribute('data-page', i - 1);
            
            if (selectedPages.has(i - 1)) {
                thumbnail.classList.add('selected');
            }
            
            thumbnail.innerHTML = `
                <div class="page-number">Page ${i}</div>
                <div class="page-preview">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="page-checkbox">
                    <input type="checkbox" id="page-${i}" ${selectedPages.has(i - 1) ? 'checked' : ''}>
                    <label for="page-${i}"></label>
                </div>
            `;
            
            pageThumbnails.appendChild(thumbnail);
            
            // Add click event
            thumbnail.addEventListener('click', function(e) {
                if (e.target.type === 'checkbox') return;
                
                const pageNum = parseInt(this.getAttribute('data-page'));
                const checkbox = this.querySelector('input[type="checkbox"]');
                
                if (selectedPages.has(pageNum)) {
                    selectedPages.delete(pageNum);
                    checkbox.checked = false;
                    this.classList.remove('selected');
                } else {
                    selectedPages.add(pageNum);
                    checkbox.checked = true;
                    this.classList.add('selected');
                }
                
                updatePageSummary();
            });
            
            // Checkbox change event
            const checkbox = thumbnail.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                const pageNum = parseInt(thumbnail.getAttribute('data-page'));
                
                if (this.checked) {
                    selectedPages.add(pageNum);
                    thumbnail.classList.add('selected');
                } else {
                    selectedPages.delete(pageNum);
                    thumbnail.classList.remove('selected');
                }
                
                updatePageSummary();
            });
        }
        
        updatePageSummary();
        previewSection.classList.remove('hidden');
        statusEl.textContent = 'Pages Loaded';
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        statusEl.textContent = 'Error Loading PDF';
    }
    
    loading.classList.add('hidden');
}

function updatePageSummary() {
    const selectedCount = selectedPages.size;
    const remainingCount = totalPages - selectedCount;
    
    selectedCountEl.textContent = selectedCount;
    remainingPagesEl.textContent = remainingCount;
    removedPagesEl.textContent = selectedCount;
    
    if (keepOnlyCheckbox.checked) {
        statusEl.textContent = `Keep ${selectedCount} pages`;
    } else {
        statusEl.textContent = `Remove ${selectedCount} pages`;
    }
}

function selectAllPages() {
    for (let i = 0; i < totalPages; i++) {
        selectedPages.add(i);
    }
    
    updateThumbnails();
    updatePageSummary();
}

function deselectAllPages() {
    selectedPages.clear();
    updateThumbnails();
    updatePageSummary();
}

function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.page-thumbnail');
    thumbnails.forEach(thumb => {
        const pageNum = parseInt(thumb.getAttribute('data-page'));
        const checkbox = thumb.querySelector('input[type="checkbox"]');
        
        if (selectedPages.has(pageNum)) {
            thumb.classList.add('selected');
            checkbox.checked = true;
        } else {
            thumb.classList.remove('selected');
            checkbox.checked = false;
        }
    });
}

async function removePages() {
    if (!currentFile || selectedPages.size === 0) {
        alert('Please select pages to remove!');
        return;
    }
    
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Removing selected pages...';
    removeBtn.disabled = true;
    
    try {
        const { PDFDocument } = PDFLib;
        
        // Load the PDF
        const fileBytes = await currentFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        // Get all page indices
        const pageIndices = Array.from({length: totalPages}, (_, i) => i);
        
        // Determine which pages to keep
        let pagesToKeep;
        if (keepOnlyCheckbox.checked) {
            // Keep only selected pages
            pagesToKeep = Array.from(selectedPages).sort((a, b) => a - b);
        } else {
            // Remove selected pages
            pagesToKeep = pageIndices.filter(index => !selectedPages.has(index));
        }
        
        // Create new PDF with selected pages
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        // Save the modified PDF
        const modifiedBytes = await newPdf.save();
        modifiedPdfBlob = new Blob([modifiedBytes], { type: 'application/pdf' });
        
        // Update stats
        const remainingPages = pagesToKeep.length;
        remainingPagesEl.textContent = remainingPages;
        statusEl.textContent = 'Pages Removed Successfully';
        
        downloadBtn.disabled = false;
        
    } catch (error) {
        console.error('Error removing pages:', error);
        loadingStatus.textContent = 'Error removing pages';
        statusEl.textContent = 'Error';
        alert('Error removing pages from PDF. Please try again.');
    }
    
    loading.classList.add('hidden');
    removeBtn.disabled = false;
}

function downloadModifiedPDF() {
    if (!modifiedPdfBlob) return;
    
    const fileName = `modified_${currentFile.name.replace('.pdf', '')}_${Date.now()}.pdf`;
    const url = URL.createObjectURL(modifiedPdfBlob);
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
    totalPages = 0;
    selectedPages.clear();
    modifiedPdfBlob = null;
    fileInput.value = '';
    pageInput.value = '';
    
    updateUI();
    
    originalPagesEl.textContent = '0';
    remainingPagesEl.textContent = '0';
    removedPagesEl.textContent = '0';
    statusEl.textContent = 'Ready';
    
    loading.classList.add('hidden');
    previewSection.classList.add('hidden');
    pageThumbnails.innerHTML = '';
}

function initApp() {
    resetApp();
}
