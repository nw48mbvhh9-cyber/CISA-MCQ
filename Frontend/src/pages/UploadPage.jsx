import React from 'react';
import { Upload } from 'lucide-react';

export const UploadPage = ({ onFileUpload }) => {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                onFileUpload(json);
            } catch (err) {
                alert("Error parsing JSON file: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e) => e.preventDefault();

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/30">
            <div
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/60 rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl hover:border-blue-500 hover:bg-white/90 transition-all cursor-pointer animate-in zoom-in-95 duration-500 max-w-xl w-full mx-auto"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Quiz Data</h3>
                <p className="text-gray-500 mb-6 text-center max-w-sm">
                    Drag and drop your CISA JSON file here, or click to browse.
                </p>
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors cursor-pointer">
                    Browse Files
                    <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </div>
        </div>
    );
};
