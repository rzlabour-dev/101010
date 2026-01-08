// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const convertBtn = document.getElementById('convertBtn');
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
const imageCountEl = document.getElementById('imageCount');
const totalSizeEl = document.getElementById('totalSize');
const pdfPagesEl = document.getElementById('pdfPages');
const statusEl = document.getElementById('status');

// Options
const pageSizeSelect = document.getElementById('pageSize');
const orientationSelect = document.getElementById('orientation');
const marginSelect = document.getElementById('margin');
const imageOrderCheckbox = document.getElementById('imageOrder');
const compressImagesCheckbox = document.getElementById('compressImages');
const addPageNumbersCheckbox = document.getElementById('addPageNumbers');

// State variables
let images = [];
let imageFiles = [];
let sortableInstance = null;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (convertBtn) convertBtn.addEventListener('click', convertToPdf);
    if (clearBtn) clearBtn.addEventListener('click', resetApp);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadPdf);
    if (sortBtn) sortBtn.addEventListener('click', toggleSortMode);
    if (removeAllBtn) removeAllBtn.addEventListener('click', removeAllImages);
    if (reorderBtn) reorderBtn.addEventListener('click', applyReorder);
    
    // Set up drag and drop
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
    }
    
    // Initialize app
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

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFiles(Array.from(files));
    }
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Process image files
function handleFiles(files) {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
        alert('Please select image files only (JPG, PNG, WebP, etc.)');
        return;
    }
    
    // Add new files to existing ones
    validFiles.forEach(file => {
        if (!imageFiles.some(f => f.name === file.name && f.size === file.size)) {
            imageFiles.push(file);
        }
    });
    
    updateUI();
    loadImagePreviews();
}

// Load image previews
function loadImagePreviews() {
    images = [];
    
    imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            images.push({
                id: index,
                src: e.target.result,
                name: file.name,
                size: file.size,
                file: file
            });
            
            // Create preview item
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.setAttribute('data-id', index);
            previewItem.innerHTML = `
                <div class="preview-header">
                    <span>${file.name}</span>
                    <button class="remove-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <img src="${e.target.result}" alt="${file.name}" class="preview-img">
                <div class="preview-info">
                    <p>${(file.size / 1024).toFixed(2)} KB</p>
                    <p>Page ${index + 1}</p>
                </div>
            `;
            
            previewContainer.appendChild(previewItem);
            
            // Add event listener to remove button
            const removeBtn = previewItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(index);
            });
        };
        
        reader.readAsDataURL(file);
    });
    
    // Initialize sortable if not already done
    if (!sortableInstance) {
        sortableInstance = Sortable.create(previewContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: function() {
                updateImageOrder();
            }
        });
    }
    
    // Update stats
    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    imageCountEl.textContent = imageFiles.length;
    totalSizeEl.textContent = `${totalSizeMB} MB`;
    pdfPagesEl.textContent = imageFiles.length;
    statusEl.textContent = `${imageFiles.length} images loaded`;
}

// Remove single image
function removeImage(index) {
    imageFiles.splice(index, 1);
    images = images.filter(img => img.id !== index);
    
    // Reassign IDs
    images.forEach((img, i) => img.id = i);
    
    updateUI();
    refreshPreviews();
}

// Remove all images
function removeAllImages() {
    imageFiles = [];
    images = [];
    previewContainer.innerHTML = '';
    updateUI();
}

// Update image order after drag & drop
function updateImageOrder() {
    const newOrder = Array.from(previewContainer.children).map(child => {
        return parseInt(child.getAttribute('data-id'));
    });
    
    // Reorder imageFiles array based on new order
    const reorderedFiles = newOrder.map(id => imageFiles[id]);
    imageFiles = reorderedFiles;
    
    // Update image IDs
    images.forEach((img, i) => img.id = i);
    
    refreshPreviews();
}

// Refresh previews
function refreshPreviews() {
    previewContainer.innerHTML = '';
    loadImagePreviews();
}

// Apply reorder
function applyReorder() {
    updateImageOrder();
    alert('Image order has been updated!');
}

// Toggle sort mode
function toggleSortMode() {
    if (sortableInstance) {
        sortableInstance.option('disabled', !sortableInstance.option('disabled'));
        sortBtn.innerHTML = sortableInstance.option('disabled') 
            ? '<i class="fas fa-sort"></i> Enable Sorting' 
            : '<i class="fas fa-sort"></i> Disable Sorting';
    }
}

// Update UI based on state
function updateUI() {
    const hasImages = imageFiles.length > 0;
    
    convertBtn.disabled = !hasImages;
    clearBtn.disabled = !hasImages;
    sortBtn.disabled = !hasImages;
    
    if (hasImages) {
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-images"></i>
            </div>
            <p class="upload-text">${imageFiles.length} image(s) loaded</p>
            <p class="upload-subtext">Ready to convert to PDF</p>
            <button class="btn btn-secondary" id="addMoreBtn">
                <i class="fas fa-plus"></i> Add More Images
            </button>
        `;
        
        // Add event listener to add more button
        document.getElementById('addMoreBtn').addEventListener('click', () => {
            fileInput.click();
        });
        
        previewSection.classList.remove('hidden');
        stats.classList.remove('hidden');
    } else {
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <p class="upload-text">Drag & Drop your images here</p>
            <p class="upload-subtext">or click to browse files (JPG, PNG, WebP supported)</p>
            <button class="btn" id="browseBtn">Browse Images</button>
        `;
        
        previewSection.classList.add('hidden');
        stats.classList.add('hidden');
    }
}

// Convert images to PDF
async function convertToPdf() {
    if (images.length === 0) return;
    
    // Show loading state
    loading.classList.remove('hidden');
    loadingStatus.textContent = 'Creating PDF document...';
    convertBtn.disabled = true;
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        const pageSize = pageSizeSelect.value;
        const orientation = orientationSelect.value;
        const margin = parseInt(marginSelect.value);
        const compress = compressImagesCheckbox.checked;
        const addNumbers = addPageNumbersCheckbox.checked;
        
        // Set PDF properties
        let pageWidth, pageHeight;
        
        switch(pageSize) {
            case 'a4':
                pageWidth = 210;
                pageHeight = 297;
                break;
            case 'letter':
                pageWidth = 215.9;
                pageHeight = 279.4;
                break;
            case 'legal':
                pageWidth = 215.9;
                pageHeight = 355.6;
                break;
            default:
                pageWidth = 210;
                pageHeight = 297;
        }
        
        if (orientation === 'landscape') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }
        
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);
        
        // Add each image as a page
        for (let i = 0; i < images.length; i++) {
            loadingStatus.textContent = `Adding image ${i + 1} of ${images.length}...`;
            
            if (i > 0) {
                pdf.addPage();
            }
            
            const image = images[i];
            
            // Calculate image dimensions to fit content area
            let imgWidth, imgHeight;
            
            if (pageSize === 'auto') {
                // Auto fit - use image's aspect ratio
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const tempImg = new Image();
                
                await new Promise((resolve) => {
                    tempImg.onload = function() {
                        const aspectRatio = tempImg.width / tempImg.height;
                        
                        if (orientation === 'landscape') {
                            imgHeight = contentHeight;
                            imgWidth = imgHeight * aspectRatio;
                            
                            if (imgWidth > contentWidth) {
                                imgWidth = contentWidth;
                                imgHeight = imgWidth / aspectRatio;
                            }
                        } else {
                            imgWidth = contentWidth;
                            imgHeight = imgWidth / aspectRatio;
                            
                            if (imgHeight > contentHeight) {
                                imgHeight = contentHeight;
                                imgWidth = imgHeight * aspectRatio;
                            }
                        }
                        
                        resolve();
                    };
                    tempImg.src = image.src;
                });
            } else {
                // Fit to content area maintaining aspect ratio
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = function() {
                        const aspectRatio = img.width / img.height;
                        
                        if (img.width > img.height) {
                            imgWidth = contentWidth;
                            imgHeight = imgWidth / aspectRatio;
                        } else {
                            imgHeight = contentHeight;
                            imgWidth = imgHeight * aspectRatio;
                        }
                        
                        if (imgWidth > contentWidth) {
                            imgWidth = contentWidth;
                            imgHeight = imgWidth / aspectRatio;
                        }
                        
                        if (imgHeight > contentHeight) {
                            imgHeight = contentHeight;
                            imgWidth = imgHeight * aspectRatio;
                        }
                        
                        resolve();
                    };
                    img.src = image.src;
                });
            }
            
            // Center image on page
            const x = margin + (contentWidth - imgWidth) / 2;
            const y = margin + (contentHeight - imgHeight) / 2;
            
            // Add image to PDF
            pdf.addImage(
                image.src, 
                'JPEG', // format
                x, y, 
                imgWidth, imgHeight,
                image.name,
                compress ? 'FAST' : 'NONE'
            );
            
            // Add page number if enabled
            if (addNumbers) {
                pdf.setFontSize(10);
                pdf.setTextColor(128, 128, 128);
                pdf.text(
                    `Page ${i + 1} of ${images.length}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        }
        
        // Save PDF
        pdf.save('converted_images.pdf');
        
        // Hide loading and update status
        loading.classList.add('hidden');
        statusEl.textContent = 'PDF Created Successfully';
        
        // Re-enable convert button
        setTimeout(() => {
            convertBtn.disabled = false;
        }, 1000);
        
    } catch (error) {
        console.error('Error creating PDF:', error);
        loadingStatus.textContent = 'Error creating PDF';
        statusEl.textContent = 'Error';
        alert('Error creating PDF: ' + error.message);
        loading.classList.add('hidden');
        convertBtn.disabled = false;
    }
}

// Download PDF
function downloadPdf() {
    convertToPdf();
}

// Reset the application
function resetApp() {
    imageFiles = [];
    images = [];
    previewContainer.innerHTML = '';
    sortableInstance = null;
    
    // Reset file input
    fileInput.value = '';
    
    // Reset UI
    updateUI();
    
    // Reset stats
    imageCountEl.textContent = '0';
    totalSizeEl.textContent = '0 MB';
    pdfPagesEl.textContent = '0';
    statusEl.textContent = 'Ready';
    
    // Hide sections
    loading.classList.add('hidden');
}

// Initialize the app
function initApp() {
    resetApp();
}
