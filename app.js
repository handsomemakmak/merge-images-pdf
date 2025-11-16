const { useState, useRef } = React;

// Lucide Icons Components
const Upload = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
);

const X = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const GripVertical = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="1"/>
        <circle cx="9" cy="5" r="1"/>
        <circle cx="9" cy="19" r="1"/>
        <circle cx="15" cy="12" r="1"/>
        <circle cx="15" cy="5" r="1"/>
        <circle cx="15" cy="19" r="1"/>
    </svg>
);

const FileDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 18 15 15"/>
    </svg>
);

const Loader2 = () => (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

const MergeImagesToPDF = () => {
    const [images, setImages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (files) => {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(file => 
            file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'
        );

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

    const removeImage = (id) => {
        setImages(images.filter(img => img.id !== id));
    };

    const convertToPDF = async () => {
        if (images.length === 0) {
            alert('กรุณาอัปโหลดภาพก่อนแปลงเป็น PDF');
            return;
        }

        setIsConverting(true);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;

            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                
                const imgElement = new Image();
                imgElement.src = img.preview;
                
                await new Promise((resolve) => {
                    imgElement.onload = () => {
                        const imgWidth = imgElement.width;
                        const imgHeight = imgElement.height;
                        
                        let width = pageWidth - (2 * margin);
                        let height = (imgHeight * width) / imgWidth;
                        
                        if (height > pageHeight - (2 * margin)) {
                            height = pageHeight - (2 * margin);
                            width = (imgWidth * height) / imgHeight;
                        }
                        
                        const x = (pageWidth - width) / 2;
                        const y = (pageHeight - height) / 2;
                        
                        if (i > 0) {
                            pdf.addPage();
                        }
                        
                        pdf.addImage(img.preview, 'JPEG', x, y, width, height);
                        resolve();
                    };
                });
            }

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
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                        Merge Images to PDF
                    </h1>
                    <p className="text-gray-600 text-lg">
                        รวมภาพหลายรูปเป็นไฟล์ PDF เดียว ใช้งานง่าย ไม่ต้องสมัครสมาชิก
                    </p>
                </div>

                <div
                    className={`border-4 border-dashed rounded-2xl p-8 md:p-12 mb-6 transition-all ${
                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="text-center">
                        <div className="flex justify-center mb-4 text-gray-400">
                            <Upload />
                        </div>
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
                                    <Loader2 />
                                    กำลังแปลง...
                                </>
                            ) : (
                                <>
                                    <FileDown />
                                    แปลงเป็น PDF
                                </>
                            )}
                        </button>
                    </div>
                )}

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
                                            <X />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                        {image.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {images.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">วิธีใช้งาน</h3>
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

                <div className="text-center mt-8 text-gray-600 text-sm">
                    <p>ปลอดภัย • ไม่เก็บข้อมูล • ประมวลผลบนเครื่องของคุณ</p>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<MergeImagesToPDF />, document.getElementById('root'));