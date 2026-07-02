import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiSkipBack, FiSkipForward, FiArrowLeft } from 'react-icons/fi';

const AudioPlayer = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const audioRef = useRef(null);
    
    const audioUrl = searchParams.get('url');
    const title = searchParams.get('title') || 'Audio Sample';
    const author = searchParams.get('author') || 'Unknown Author';
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const handleEnded = () => setIsPlaying(false);
        const handleError = (e) => {
            console.error('Audio error:', e);
            setError('Failed to load audio file. Please check the file URL.');
            setIsLoading(false);
            setIsPlaying(false);
        };
        const handleCanPlay = () => {
            setIsLoading(false);
        };
        const handleLoadStart = () => {
            setIsLoading(true);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('loadstart', handleLoadStart);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('loadstart', handleLoadStart);
        };
    }, [audioUrl]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.playbackRate = playbackRate;
    }, [playbackRate]);

    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
                setError(null);
            }
        } catch (err) {
            console.error('Error playing audio:', err);
            setError('Failed to play audio. Please try again.');
            setIsPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio) return;
        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const skip = (seconds) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!audioUrl) {
        return (
            <div className="flex items-center justify-center bg-gray-50 py-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">No Audio File</h2>
                    <p className="text-gray-600 mb-4">No audio file URL provided.</p>
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
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 pb-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                        <p className="text-xl text-gray-600">{author}</p>
                    </div>
                </div>

                {/* Audio Player */}
                <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                            <p className="text-red-500 text-xs mt-2">URL: {audioUrl}</p>
                        </div>
                    )}
                    {isLoading && !error && (
                        <div className="mb-4 text-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                            <p className="text-gray-600 text-sm mt-2">Loading audio...</p>
                        </div>
                    )}
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        preload="metadata"
                        crossOrigin="anonymous"
                    />

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            style={{
                                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                            }}
                        />
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center space-y-6">
                        {/* Main Controls */}
                        <div className="flex items-center justify-center space-x-6">
                            <button
                                onClick={() => skip(-10)}
                                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Skip back 10 seconds"
                            >
                                <FiSkipBack className="w-6 h-6 text-gray-700" />
                            </button>
                            
                            <button
                                onClick={togglePlayPause}
                                disabled={isLoading || !!error}
                                className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : isPlaying ? (
                                    <FiPause className="w-8 h-8" />
                                ) : (
                                    <FiPlay className="w-8 h-8 ml-1" />
                                )}
                            </button>
                            
                            <button
                                onClick={() => skip(10)}
                                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Skip forward 10 seconds"
                            >
                                <FiSkipForward className="w-6 h-6 text-gray-700" />
                            </button>
                        </div>

                        {/* Volume and Speed Controls */}
                        <div className="w-full flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                            {/* Volume Control */}
                            <div className="flex items-center space-x-3 w-full md:w-auto">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    {isMuted || volume === 0 ? (
                                        <FiVolumeX className="w-5 h-5 text-gray-700" />
                                    ) : (
                                        <FiVolume2 className="w-5 h-5 text-gray-700" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="flex-1 md:w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <span className="text-sm text-gray-600 w-12">
                                    {Math.round((isMuted ? 0 : volume) * 100)}%
                                </span>
                            </div>

                            {/* Playback Speed */}
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-600 font-medium">Speed:</span>
                                <div className="flex space-x-2">
                                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => setPlaybackRate(rate)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                playbackRate === rate
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;

