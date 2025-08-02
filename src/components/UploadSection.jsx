import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadSection = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, processing, complete, error
  const [processingResult, setProcessingResult] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Please upload an image smaller than 10MB');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setUploadedImage({
        file,
        preview,
        name: file.name,
        size: file.size
      });

      console.log('Image uploaded, starting processing...');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const startProcessing = async () => {
    if (!uploadedImage) return;
    
    console.log('Starting processing...');
    setProcessingStatus('processing');
    
    try {
      // Convert file to base64 for API
      const base64 = await fileToBase64(uploadedImage.file);
      
      console.log('Calling processing API...');
      
      // Call our processing function
      const response = await fetch('/.netlify/functions/process-jewelry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          filename: uploadedImage.name
        })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Processing failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Processing result:', result);
      
      setProcessingResult(result);
      setProcessingStatus('complete');
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus('error');
      alert('Enhancement failed. Please try again.');
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePayment = () => {
    console.log('Payment button clicked!');
    alert('Payment processing coming soon! For now, this confirms the enhancement worked.');
  };

  const resetUploader = () => {
    setUploadedImage(null);
    setProcessingStatus('idle');
    setProcessingResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  if (processingStatus === 'processing') {
    return <ProcessingStatus />;
  }

  if (processingStatus === 'complete' && processingResult) {
    return (
      <ProcessingResults 
        uploadedImage={uploadedImage} 
        processingResult={processingResult}
        onPayment={handlePayment}
        onReset={resetUploader}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏔️ ARKENSTONE
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            Transform your jewelry photos into treasures
          </p>
          <p className="text-blue-300">
            ✨ Professional enhancement in 60 seconds • 💎 4x higher resolution • 🎯 Perfect for e-commerce
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive 
              ? 'border-blue-400 bg-blue-900/20 scale-105' 
              : 'border-blue-500/50 bg-white/5 hover:border-blue-400 hover:bg-blue-900/10'
            }
            backdrop-blur-sm
          `}
        >
          <input {...getInputProps()} />
          
          {uploadedImage ? (
            <div className="space-y-4">
              <img 
                src={uploadedImage.preview} 
                alt="Preview" 
                className="mx-auto max-h-64 rounded-lg shadow-lg"
              />
              <div className="text-white">
                <p className="font-medium">{uploadedImage.name}</p>
                <p className="text-blue-300 text-sm">{formatFileSize(uploadedImage.size)}</p>
              </div>
              <div className="space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startProcessing();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                >
                  ✨ Enhance for $15
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetUploader();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Upload Different Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-6xl">📸</div>
              <div className="text-white">
                <p className="text-xl font-medium mb-2">
                  {isDragActive ? 'Drop your jewelry photo here!' : 'Drop your jewelry photo here'}
                </p>
                <p className="text-blue-300">
                  or click to browse
                </p>
              </div>
              <div className="text-sm text-blue-400">
                <p>Supports: JPG, PNG, WEBP</p>
                <p>Max size: 10MB • Min resolution: 500x500</p>
              </div>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
              Uploading...
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mt-8 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-xl font-semibold text-white mb-2">Professional Enhancement</h3>
            <div className="text-3xl font-bold text-blue-400 mb-2">$15</div>
            <div className="text-blue-300 text-sm space-y-1">
              <p>✓ AI background removal</p>
              <p>✓ Professional lighting</p>
              <p>✓ 4x resolution upscaling</p>
              <p>✓ Gemstone sparkle enhancement</p>
              <p>✓ Multiple download formats</p>
            </div>
          </div>
        </div>

        {/* Example Gallery */}
        <div className="mt-8 text-center">
          <p className="text-blue-300 text-sm">
            👀 <button className="underline hover:text-blue-200">See example transformations</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Processing Status Component
const ProcessingStatus = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { name: "Analyzing jewelry type...", icon: "🔍" },
    { name: "Removing background...", icon: "🧹" },
    { name: "Enhancing lighting...", icon: "💡" },
    { name: "Boosting sparkle...", icon: "✨" },
    { name: "Upscaling to 4K...", icon: "🔍" },
    { name: "Final polish...", icon: "💎" }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 3; // Faster progress
        const newStep = Math.floor(newProgress / 16.67); // 6 steps = 100/6 = 16.67% each
        setCurrentStep(Math.min(newStep, steps.length - 1));
        return Math.min(newProgress, 100);
      });
    }, 150); // Update every 150ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            🏔️ Arkenstone Processing
          </h2>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-blue-300 text-sm mt-2">{Math.round(progress)}% complete</p>
          </div>

          {/* Current Step */}
          <div className="mb-6">
            <div className="text-4xl mb-2">{steps[currentStep]?.icon}</div>
            <p className="text-white font-medium">{steps[currentStep]?.name}</p>
          </div>

          {/* Steps List */}
          <div className="space-y-2 text-left">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center space-x-3 text-sm ${
                index < currentStep ? 'text-green-400' :
                index === currentStep ? 'text-blue-400' :
                'text-slate-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  index < currentStep ? 'bg-green-400' :
                  index === currentStep ? 'bg-blue-400' :
                  'bg-slate-600'
                }`} />
                <span>{step.name}</span>
                {index < currentStep && <span className="ml-auto text-green-400">✓</span>}
              </div>
            ))}
          </div>

          <div className="mt-6 text-blue-300 text-sm">
            ⏱️ Estimated time: {Math.max(10 - Math.round(progress * 0.1), 1)} seconds
          </div>
        </div>
      </div>
    </div>
  );
};

// Processing Results Component
const ProcessingResults = ({ uploadedImage, processingResult, onPayment, onReset }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            🎉 Your jewelry photo has been transformed!
          </h2>
          <p className="text-blue-300">
            {processingResult.analysis}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Before */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Before</h3>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
              <img 
                src={uploadedImage.preview} 
                alt="Before" 
                className="w-full max-h-80 object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
          
          {/* After */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">After</h3>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
              <div className="w-full max-h-80 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center aspect-square">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="font-semibold">Enhanced version will appear here</p>
                  <p className="text-sm opacity-75 mt-2">4K resolution • Professional quality</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button 
            onClick={onPayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
          >
            💳 Pay $15 & Download High-Quality Version
          </button>
          
          <div className="space-x-4">
            <button 
              onClick={onReset}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Upload Another Image
            </button>
          </div>
        </div>

        {/* Debug info */}
        {processingResult.debug && (
          <div className="mt-8 text-center">
            <details className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
              <summary className="text-blue-300 cursor-pointer">Debug Info</summary>
              <pre className="text-left text-xs text-blue-200 mt-2 overflow-auto">
                {JSON.stringify(processingResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSection;