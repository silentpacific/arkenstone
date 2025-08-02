import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadSection = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, processing, complete, error
  const [processingSteps, setProcessingSteps] = useState([]);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Please upload an image smaller than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setUploadedImage({
      file,
      preview,
      name: file.name,
      size: file.size
    });

    // Start processing immediately
    startProcessing(file);
  }, []);

  const startProcessing = async (file) => {
    setProcessingStatus('processing');
    setProcessingSteps([]);
    
    const steps = [
      'Analyzing jewelry image...',
      'Removing background...',
      'Increasing resolution 4x...',
      'Removing dirt and scratches...',
      'Eliminating shadows and reflections...',
      'Enhancing colors and brightness...',
      'Finalizing professional enhancement...'
    ];

    // Show steps one by one
    for (let i = 0; i < steps.length; i++) {
      setProcessingSteps(prev => [...prev, { text: steps[i], status: 'processing' }]);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingSteps(prev => 
        prev.map((step, index) => 
          index === i ? { ...step, status: 'complete' } : step
        )
      );
    }

    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch('/.netlify/functions/process-jewelry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          filename: file.name
        })
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();
      setProcessingResult(result);
      setEnhancedImage(result.enhancedImage || uploadedImage.preview);
      setProcessingStatus('complete');
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus('error');
      setProcessingSteps(prev => [...prev, { text: 'Enhancement failed', status: 'error' }]);
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

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = `enhanced_${uploadedImage.name}`;
    link.click();
  };

  const resetUploader = () => {
    setUploadedImage(null);
    setProcessingStatus('idle');
    setProcessingSteps([]);
    setEnhancedImage(null);
    setProcessingResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  // Processing view
  if (processingStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🏔️ Arkenstone</h1>
            <p className="text-blue-200">Enhancing your jewelry photo...</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20">
            {/* Original image */}
            <div className="text-center mb-6">
              <img 
                src={uploadedImage.preview} 
                alt="Processing" 
                className="mx-auto max-h-48 rounded-lg shadow-lg"
              />
              <p className="text-white mt-2">{uploadedImage.name}</p>
            </div>

            {/* Processing steps */}
            <div className="space-y-3">
              {processingSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    step.status === 'complete' ? 'bg-green-400' :
                    step.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                    'bg-red-400'
                  }`} />
                  <span className={`${
                    step.status === 'complete' ? 'text-green-400' :
                    step.status === 'processing' ? 'text-blue-400' :
                    'text-red-400'
                  }`}>
                    {step.text}
                  </span>
                  {step.status === 'complete' && <span className="text-green-400 ml-auto">✓</span>}
                  {step.status === 'processing' && <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (processingStatus === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🏔️ Arkenstone</h1>
            <p className="text-green-400 text-xl">✨ Enhancement Complete!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Before */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 text-center">Before</h3>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                <img 
                  src={uploadedImage.preview} 
                  alt="Before" 
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>
            </div>

            {/* After */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 text-center">After</h3>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
                <img 
                  src={enhancedImage} 
                  alt="Enhanced" 
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                <div className="text-center mt-2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Enhanced
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="text-center space-y-4">
            <button 
              onClick={downloadImage}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg mr-4"
            >
              📥 Download Enhanced Image
            </button>
            
            <button 
              onClick={resetUploader}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg transition-colors"
            >
              📸 Upload Another Image
            </button>
          </div>

          {/* API Call Stats */}
          {processingResult?.apiStats && (
            <div className="mt-8">
              <details className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                <summary className="text-blue-300 cursor-pointer font-medium">API Call Statistics</summary>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(processingResult.apiStats).map(([service, stats]) => (
                    <div key={service} className="bg-white/5 rounded-lg p-3">
                      <h4 className="text-white font-medium mb-2">{service}</h4>
                      <div className="space-y-1 text-blue-200">
                        <p>Calls: {stats.calls}</p>
                        <p>Success: {stats.successful}</p>
                        <p>Failed: {stats.failed}</p>
                        <p>Purpose: {stats.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Upload view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">🏔️ ARKENSTONE</h1>
          <p className="text-xl text-blue-200 mb-2">Transform your jewelry photos</p>
          <p className="text-blue-300">AI-powered enhancement in seconds</p>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive 
              ? 'border-blue-400 bg-blue-900/20 scale-105' 
              : 'border-blue-500/50 bg-white/5 hover:border-blue-400 hover:bg-blue-900/10'
            }
            backdrop-blur-sm
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl">📸</div>
            <div className="text-white">
              <p className="text-2xl font-medium mb-2">
                {isDragActive ? 'Drop your jewelry photo here!' : 'Drop your jewelry photo here'}
              </p>
              <p className="text-blue-300">or click to browse</p>
            </div>
            <div className="text-sm text-blue-400">
              <p>Supports: JPG, PNG, WEBP • Max size: 10MB</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-blue-300 text-sm">
          Upload an image to see automatic enhancement in action
        </div>
      </div>
    </div>
  );
};

export default UploadSection;