// Global variables
let images = [];
let draggedIndex = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagesContainer = document.getElementById('imagesContainer');
const imagesGrid = document.getElementById('imagesGrid');
const actionBar = document.getElementById('actionBar');
const imageCount = document.getElementById('imageCount');
const convertBtn = document.getElementById('convertBtn');
const instructions = document.getElementById('instructions');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        handleFiles(e.dataTransfer.files);
    });

    // Convert button
    convertBtn.addEventListener('click', convertToPDF);
}

function handleFiles(files) {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => 
        file.type === 'image/png' || 
        file.type === 'image/jpeg' || 
        file.type === 'image/jpg'
    );

    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                preview: e.target.result,
                name: file.name
            };
            images.push(imageData);
            updateUI();
        };
        reader.readAsDataURL(file);
    });
}

function updateUI() {
    // Update counter
    imageCount.textContent = images.length;

    // Show/hide elements
    if (images.length > 0) {
        actionBar.style.display = 'flex';
        imagesContainer.style.display = 'block';
        instructions.style.display = 'none';
    } else {
        actionBar.style.display = 'none';
        imagesContainer.style.display = 'none';
        instructions.style.display = 'block';
    }

    // Render images
    renderImages();
}

function renderImages() {
    imagesGrid.innerHTML = '';

    images.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.draggable = true;
        imageItem.dataset.index = index;

        imageItem.innerHTML = `
            <img src="${image.preview}" alt="${image.name}">
            <div class="image-number">${index + 1}</div>
            <button class="image-remove" onclick="removeImage(${index})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="image-name">${image.name}</div>
        `;

        // Drag events for reordering
        imageItem.addEventListener('dragstart', handleDragStart);
        imageItem.addEventListener('dragover', handleDragOver);
        imageItem.addEventListener('drop', handleDrop);
        imageItem.addEventListener('dragend', handleDragEnd);

        imagesGrid.appendChild(imageItem);
    });
}

function removeImage(index) {
    images.splice(index, 1);
    updateUI();
}

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.closest('.image-item').dataset.index);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const dropIndex = parseInt(e.target.closest('.image-item').dataset.index);
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        const draggedImage = images[draggedIndex];
        images.splice(draggedIndex, 1);
        images.splice(dropIndex, 0, draggedImage);
        updateUI();
    }
}

function handleDragEnd() {
    draggedIndex = null;
}

async function convertToPDF() {
    if (images.length === 0) {
        alert('กรุณาอัปโหลดภาพก่อนแปลงเป็น PDF');
        return;
    }

    // Show loading
    loadingOverlay.style.display = 'flex';
    convertBtn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        let pdf = null;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            
            // Load image to get dimensions
            const imgElement = new Image();
            imgElement.src = img.preview;
            
            await new Promise((resolve, reject) => {
                imgElement.onload = () => {
                    try {
                        const imgWidth = imgElement.width;
                        const imgHeight = imgElement.height;
                        
                        // Convert pixels to points (72 DPI standard for PDF)
                        const ptWidth = imgWidth * (72 / 96);
                        const ptHeight = imgHeight * (72 / 96);
                        
                        // Create or add page with exact image dimensions
                        if (i === 0) {
                            pdf = new jsPDF({
                                orientation: ptWidth > ptHeight ? 'l' : 'p',
                                unit: 'pt',
                                format: [ptWidth, ptHeight],
                                compress: true
                            });
                        } else {
                            pdf.addPage([ptWidth, ptHeight], ptWidth > ptHeight ? 'l' : 'p');
                        }
                        
                        // Add image at full page size (no margins)
                        pdf.addImage(img.preview, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                imgElement.onerror = reject;
            });
        }

        // Save PDF
        pdf.save('merged-images.pdf');
        
        // Success message
        setTimeout(() => {
            alert('✅ แปลงเป็น PDF สำเร็จ! ไฟล์กำลังดาวน์โหลด');
        }, 500);

    } catch (error) {
        console.error('Error converting to PDF:', error);
        alert('❌ เกิดข้อผิดพลาดในการแปลงเป็น PDF: ' + error.message);
    } finally {
        // Hide loading
        loadingOverlay.style.display = 'none';
        convertBtn.disabled = false;
    }
}