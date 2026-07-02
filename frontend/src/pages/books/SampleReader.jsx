import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiMaximize, FiMinimize, FiDownload, FiPlay, FiPause, FiSquare } from 'react-icons/fi';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

const extractTextFromPdf = async (arrayBuffer) => {
    const pdfDocument = await getDocument({ data: arrayBuffer }).promise;
    const allText = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
        if (pageText) {
            allText.push(pageText);
        }
    }

    return allText.join('\n\n');
};

const SampleReader = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('fileName') || 'Sample';
    const title = searchParams.get('title') || 'Book Sample';
    const author = searchParams.get('author') || 'Unknown Author';
    
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fileContent, setFileContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileType, setFileType] = useState('pdf');
    const [isTtsPlaying, setIsTtsPlaying] = useState(false);
    const [ttsUtterance, setTtsUtterance] = useState(null);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [isExtractingText, setIsExtractingText] = useState(false);
    const [ttsError, setTtsError] = useState(null);

    // web speech api
    useEffect(() => {
        const synth = window.speechSynthesis;
        const updateVoices = () => {
            const availableVoices = synth.getVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0 && !selectedVoice) {
                setSelectedVoice(availableVoices[0]);
            }
        };

        updateVoices();
        synth.onvoiceschanged = updateVoices;

        return () => {
            synth.onvoiceschanged = null;
        };
    }, [selectedVoice]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        setIsTtsPlaying(false);
        setTtsUtterance(null);
    }, [fileUrl, fileName]);

    useEffect(() => {
        if (!fileUrl) {
            setError('No file URL provided');
            setIsLoading(false);
            return;
        }

        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        setError(null);
        setFileContent(null);
        setTtsError(null);

        if (['txt', 'text'].includes(extension)) {
            setFileType('text');
            setIsLoading(true);
            setIsExtractingText(false);
            fetch(fileUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load file');
                    return response.text();
                })
                .then(text => {
                    setFileContent(text);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error('Error loading text file:', err);
                    setError('Failed to load text file');
                    setIsLoading(false);
                });
        } else {
            setFileType('pdf');
            setIsLoading(false);
            setIsExtractingText(true);
            fetch(fileUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load PDF');
                    return response.arrayBuffer();
                })
                .then(async buffer => {
                    const extractedText = await extractTextFromPdf(buffer);
                    if (extractedText) {
                        setFileContent(extractedText);
                    } else {
                        setTtsError('No readable text found in PDF for text-to-speech.');
                    }
                })
                .catch(err => {
                    console.error('Error extracting PDF text:', err);
                    setTtsError('Unable to extract text from PDF for text-to-speech.');
                })
                .finally(() => {
                    setIsExtractingText(false);
                });
        }
    }, [fileUrl, fileName]);

    useEffect(() => {
        if (!fileContent) {
            setTtsUtterance(null);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(fileContent);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onend = () => setIsTtsPlaying(false);
        utterance.onerror = () => setIsTtsPlaying(false);
        setTtsUtterance(utterance);

        return () => {
            speechSynthesis.cancel();
            utterance.onend = null;
            utterance.onerror = null;
        };
    }, [fileContent, selectedVoice]);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 10, 50));
    };

    const handleResetZoom = () => {
        setZoom(100);
    };

    const handleTtsPlay = () => {
        if (!ttsUtterance) return;

        if (speechSynthesis.paused && speechSynthesis.speaking) {
            speechSynthesis.resume();
        } else {
            speechSynthesis.cancel();
            speechSynthesis.speak(ttsUtterance);
        }
        setIsTtsPlaying(true);
    };

    const handleTtsPause = () => {
        speechSynthesis.pause();
        setIsTtsPlaying(false);
    };

    const handleTtsStop = () => {
        speechSynthesis.cancel();
        setIsTtsPlaying(false);
    };

    const handleVoiceChange = (event) => {
        const voice = voices.find(v => v.name === event.target.value);
        setSelectedVoice(voice);
        if (isTtsPlaying) {
            speechSynthesis.cancel();
            setIsTtsPlaying(false);
        }
    };


    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!fileUrl) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">No File</h2>
                    <p className="text-gray-600 mb-4">No file URL provided.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                                <span>Back</span>
                            </button>
                            <div className="border-l border-gray-300 pl-4">
                                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-600">by {author}</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-2">
                            {/* Zoom Controls */}
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1">
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 50}
                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Zoom Out"
                                >
                                    <FiZoomOut className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleResetZoom}
                                    className="px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded"
                                    title="Reset Zoom"
                                >
                                    {zoom}%
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 200}
                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Zoom In"
                                >
                                    <FiZoomIn className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Fullscreen Toggle */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? (
                                    <FiMinimize className="w-5 h-5" />
                                ) : (
                                    <FiMaximize className="w-5 h-5" />
                                )}
                            </button>

                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Download"
                            >
                                <FiDownload className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* TTS Controls */}
                    {(fileType === 'text' || fileType === 'pdf') && (
                        <div className="mt-4 flex items-center justify-start space-x-4 border-t pt-4">
                            {ttsUtterance ? (
                                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1">
                                    {!isTtsPlaying ? (
                                        <button
                                            onClick={handleTtsPlay}
                                            className="p-1 rounded hover:bg-gray-200"
                                            title="Play TTS"
                                        >
                                            <FiPlay className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleTtsPause}
                                            className="p-1 rounded hover:bg-gray-200"
                                            title="Pause TTS"
                                        >
                                            <FiPause className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleTtsStop}
                                        className="p-1 rounded hover:bg-gray-200"
                                        title="Stop TTS"
                                    >
                                        <FiSquare className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    {isExtractingText
                                        ? 'Extracting text for text-to-speech...'
                                        : 'Text-to-speech will be ready once the text loads.'}
                                </div>
                            )}
                            {voices.length > 0 && (
                                <div className="bg-gray-100 rounded-lg px-2 py-1">
                                    <select
                                        onChange={handleVoiceChange}
                                        value={selectedVoice ? selectedVoice.name : ''}
                                        className="bg-transparent text-sm text-gray-700 focus:outline-none"
                                    >
                                        {voices.map((voice) => (
                                            <option key={voice.name} value={voice.name}>
                                                {voice.name} ({voice.lang})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {ttsError && (
                                <span className="text-sm text-red-600">
                                    {ttsError}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600">Loading file...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : fileType === 'pdf' ? (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <iframe
                            src={fileUrl}
                            className="w-full"
                            style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
                            title={fileName}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div
                            className="prose prose-lg max-w-none"
                            style={{ fontSize: `${zoom}%` }}
                        >
                            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                                {fileContent}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SampleReader;

