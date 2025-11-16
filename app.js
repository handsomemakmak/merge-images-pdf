import React, { useState, useRef } from 'react';
import { Upload, X, GripVertical, FileDown, Loader2 } from 'lucide-react';

// Import jsPDF from CDN (loaded via script tag in HTML)
const { jsPDF } = window.jspdf || {};

const MergeImagesToPDF = () => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);
  const MAX_IMAGES = null; // null = ไม่จำกัด

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => 
      file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'
    );

    // ไม่มีการจำกัดจำนวนไฟล์แล้ว
    // Convert files to base64 for preview
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle drag and drop upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // Handle image reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverImage = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Remove image
  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  // Convert images to PDF
  const convertToPDF = async () => {
    if (images.length === 0) {
      alert('กรุณาอัปโหลดภาพก่อนแปลงเป็น PDF');
      return;
    }

    setIsConverting(true);

    try {
      let pdf = null;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        // Load image to get dimensions
        const imgElement = new Image();
        imgElement.src = img.preview;
        
        await new Promise((resolve) => {
          imgElement.onload = () => {
            const imgWidth = imgElement.width;
            const imgHeight = imgElement.height;
            
            // Convert pixels to mm (assuming 96 DPI)
            const mmWidth = (imgWidth * 25.4) / 96;
            const mmHeight = (imgHeight * 25.4) / 96;
            
            // Create PDF with exact image dimensions for first image
            if (i === 0) {
              pdf = new jsPDF({
                orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [mmWidth, mmHeight]
              });
            } else {
              // Add new page with dimensions matching current image
              pdf.addPage([mmWidth, mmHeight], mmWidth > mmHeight ? 'landscape' : 'portrait');
            }
            
            // Add image at full page size (no margins, no white borders)
            pdf.addImage(img.preview, 'JPEG', 0, 0, mmWidth, mmHeight);
            resolve();
          };
        });
      }

      // Save PDF
      pdf.save('merged-images.pdf');
    } catch (error) {
      console.error('Error converting to PDF:', error);
      alert('เกิดข้อผิดพลาดในการแปลงเป็น PDF');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Merge Images to PDF
          </h1>
          <p className="text-gray-600 text-lg">
            รวมภาพหลายรูปเป็นไฟล์ PDF เดียว ใช้งานง่าย ไม่ต้องสมัครสมาชิก
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-4 border-dashed rounded-2xl p-8 md:p-12 mb-6 transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              อัปโหลดภาพของคุณ
            </h2>
            <p className="text-gray-500 mb-4">
              ลากและวางไฟล์ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              เลือกไฟล์
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <p className="text-sm text-gray-400 mt-4">
              รองรับ PNG และ JPG • ไม่จำกัดจำนวนไฟล์
            </p>
          </div>
        </div>

        {/* Image Counter */}
        {images.length > 0 && (
          <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="text-lg font-medium text-gray-700">
              <span className="text-blue-600 font-bold">{images.length}</span> ภาพ
            </div>
            <button
              onClick={convertToPDF}
              disabled={isConverting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังแปลง...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  แปลงเป็น PDF
                </>
              )}
            </button>
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                ภาพที่อัปโหลด (ลากเพื่อจัดเรียงลำดับ)
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOverImage(e, index)}
                  onDragEnd={handleDragEnd}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden cursor-move hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 left-2 bg-white rounded px-2 py-1 text-xs font-bold text-gray-700 shadow">
                    {index + 1}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeImage(image.id)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-5 h-5 text-white drop-shadow" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {images.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              วิธีใช้งาน
            </h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">1</span>
                <span>อัปโหลดภาพ PNG หรือ JPG ไม่จำกัดจำนวนไฟล์</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">2</span>
                <span>ลากและวางภาพเพื่อจัดเรียงลำดับตามที่ต้องการ</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">3</span>
                <span>คลิกปุ่ม "แปลงเป็น PDF" เพื่อสร้างไฟล์ PDF</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold">4</span>
                <span>ดาวน์โหลดไฟล์ PDF ได้ทันที ไม่ต้องสมัครสมาชิก</span>
              </li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">
                <strong>หมายเหตุ:</strong> การประมวลผลทั้งหมดทำงานบนเครื่องของคุณ 
                ไฟล์ของคุณจะไม่ถูกส่งไปยังเซิร์ฟเวอร์ใดๆ เพื่อความปลอดภัยและความเป็นส่วนตัว
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>ปลอดภัย • ไม่เก็บข้อมูล • ประมวลผลบนเครื่องของคุณ</p>
        </div>
      </div>

      {/* Load jsPDF from CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    </div>
  );
};

export default MergeImagesToPDF;