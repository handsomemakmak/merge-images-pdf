// Global variables
let images = [];
let draggedIndex = null;

// Wait for DOM and jsPDF to load
window.addEventListener('load', function() {
    console.log('Page loaded');
    console.log('jsPDF available:', typeof window.jspdf !== 'undefined');
    initializeApp();
});

function initializeApp() {
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

    console.log('Elements found:', {
        uploadArea: !!uploadArea,
        fileInput: !!fileInput,
        convertBtn: !!convertBtn
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        console.log('Files selected:', e.target.files.length);
        handleFiles(e.target.files);
    });

    // Click upload area to select files
    uploadArea.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragging');
        console.log('Files dropped:', e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files);
    });

    // Convert button
    convertBtn.addEventListener('click', function() {
        console.log('Convert button clicked');
        convertToPDF();
    });

    function handleFiles(files) {
        console.log('Handling files:', files.length);
        
        if (files.length === 0) {
            console.log('No files selected');
            return;
        }

        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(file => {
            const isImage = file.type === 'image/png' || 
                           file.type === 'image/jpeg' || 
                           file.type === 'image/jpg';
            console.log('File:', file.name, 'Type:', file.type, 'Is image:', isImage);
            return isImage;
        });

        console.log('Valid image files:', imageFiles.length);

        if (imageFiles.length === 0) {
            alert('กรุณาเลือกไฟล์ภาพ PNG หรือ JPG เท่านั้น');
            return;
        }

        imageFiles.forEach(function(file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    preview: e.target.result,
                    name: file.name
                };
                images.push(imageData);
                console.log('Image added. Total images:', images.length);
                updateUI();
            };

            reader.onerror = function(error) {
                console.error('Error reading file:', error);
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + file.name);
            };

            reader.readAsDataURL(file);
        });
    }

    function updateUI() {
        console.log('Updating UI. Images count:', images.length);
        
        // Update counter
        imageCount.textContent = images.length;

        // Show/hide elements
        if (images.length > 0) {
            actionBar.style.display = 'flex';
            imagesContainer.style.display = 'block';
            instructions.style.display = 'none';
            console.log('Showing images container');
        } else {
            actionBar.style.display = 'none';
            imagesContainer.style.display = 'none';
            instructions.style.display = 'block';
            console.log('Showing instructions');
        }

        // Render images
        renderImages();
    }

    function renderImages() {
        console.log('Rendering images');
        imagesGrid.innerHTML = '';

        images.forEach(function(image, index) {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.draggable = true;
            imageItem.dataset.index = index;

            imageItem.innerHTML = `
                <img src="${image.preview}" alt="${image.name}">
                <div class="image-number">${index + 1}</div>
                <button class="image-remove" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div class="image-name">${image.name}</div>
            `;

            // Remove button event
            const removeBtn = imageItem.querySelector('.image-remove');
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.index);
                console.log('Removing image at index:', idx);
                removeImage(idx);
            });

            // Drag events for reordering
            imageItem.addEventListener('dragstart', handleDragStart);
            imageItem.addEventListener('dragover', handleDragOver);
            imageItem.addEventListener('drop', handleDrop);
            imageItem.addEventListener('dragend', handleDragEnd);

            imagesGrid.appendChild(imageItem);
        });

        console.log('Images rendered:', images.length);
    }

    function removeImage(index) {
        console.log('Removing image at index:', index);
        images.splice(index, 1);
        updateUI();
    }

    function handleDragStart(e) {
        const item = e.target.closest('.image-item');
        if (item) {
            draggedIndex = parseInt(item.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
            console.log('Drag start:', draggedIndex);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        const item = e.target.closest('.image-item');
        
        if (item && draggedIndex !== null) {
            const dropIndex = parseInt(item.dataset.index);
            console.log('Drop at index:', dropIndex, 'from:', draggedIndex);
            
            if (draggedIndex !== dropIndex) {
                const draggedImage = images[draggedIndex];
                images.splice(draggedIndex, 1);
                images.splice(dropIndex, 0, draggedImage);
                updateUI();
            }
        }
    }

    function handleDragEnd() {
        draggedIndex = null;
        console.log('Drag end');
    }

    async function convertToPDF() {
        console.log('Starting PDF conversion');
        
        if (images.length === 0) {
            alert('กรุณาอัปโหลดภาพก่อนแปลงเป็น PDF');
            return;
        }

        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            alert('ไม่สามารถโหลด jsPDF library ได้ กรุณาลองรีเฟรชหน้าเว็บ');
            console.error('jsPDF is not loaded');
            return;
        }

        // Show loading
        loadingOverlay.style.display = 'flex';
        convertBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            let pdf = null;

            console.log('Converting', images.length, 'images to PDF');

            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                console.log('Processing image', i + 1, '/', images.length);
                
                // Load image to get dimensions
                const imgElement = new Image();
                imgElement.src = img.preview;
                
                await new Promise((resolve, reject) => {
                    imgElement.onload = function() {
                        try {
                            const imgWidth = imgElement.width;
                            const imgHeight = imgElement.height;
                            
                            console.log('Image dimensions:', imgWidth, 'x', imgHeight);
                            
                            // Convert pixels to points (72 DPI standard for PDF)
                            const ptWidth = imgWidth * (72 / 96);
                            const ptHeight = imgHeight * (72 / 96);
                            
                            console.log('PDF page size:', ptWidth, 'x', ptHeight, 'pt');
                            
                            // Create or add page with exact image dimensions
                            if (i === 0) {
                                pdf = new jsPDF({
                                    orientation: ptWidth > ptHeight ? 'l' : 'p',
                                    unit: 'pt',
                                    format: [ptWidth, ptHeight],
                                    compress: true
                                });
                                console.log('PDF created');
                            } else {
                                pdf.addPage([ptWidth, ptHeight], ptWidth > ptHeight ? 'l' : 'p');
                                console.log('Page added');
                            }
                            
                            // Add image at full page size (no margins)
                            pdf.addImage(img.preview, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
                            console.log('Image added to PDF');
                            resolve();
                        } catch (error) {
                            console.error('Error processing image:', error);
                            reject(error);
                        }
                    };
                    
                    imgElement.onerror = function() {
                        console.error('Failed to load image');
                        reject(new Error('Failed to load image: ' + img.name));
                    };
                });
            }

            // Save PDF
            console.log('Saving PDF');
            pdf.save('merged-images.pdf');
            
            // Success message
            setTimeout(function() {
                alert('✅ แปลงเป็น PDF สำเร็จ! ไฟล์กำลังดาวน์โหลด');
            }, 500);

        } catch (error) {
            console.error('Error converting to PDF:', error);
            alert('❌ เกิดข้อผิดพลาดในการแปลงเป็น PDF: ' + error.message);
        } finally {
            // Hide loading
            loadingOverlay.style.display = 'none';
            convertBtn.disabled = false;
            console.log('PDF conversion finished');
        }
    }
}