import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { getLectureStream } from "../../services/lectureSerivce";
import {
  LuPlay,
  LuPause,
  LuVolume2,
  LuVolumeX,
  LuSettings,
  LuMaximize,
  LuMinimize,
  LuLoader,
  LuRotateCcw,
  LuCircleAlert,
} from "react-icons/lu";

const HlsPlayer = ({ lectureId, fallbackSrc, className = "", onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Video data state
  const [streamUrl, setStreamUrl] = useState(null);
  const [apiResolutions, setApiResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Playback control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // HLS levels / resolution state
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(-1); // -1 = Auto

  /* ════════════════════════════════════════════
     1. FETCH STREAM DATA FROM ENDPOINT
     ════════════════════════════════════════════ */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let isMounted = true;

    if (!lectureId) {
      if (fallbackSrc) {
        setStreamUrl(fallbackSrc);
        setLoading(false);
      } else {
        setErrorMsg("No video source provided.");
        setLoading(false);
      }
      return;
    }

    const fetchStreamInfo = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getLectureStream(lectureId);
        if (isMounted) {
          setStreamUrl(data.streamUrl);
          if (Array.isArray(data.resolutions)) {
            setApiResolutions(data.resolutions);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading stream:", err);
          
          if (fallbackSrc && err.status !== 400) {
            console.log("Stream API returned error, falling back to direct playlist URL:", fallbackSrc);
            setStreamUrl(fallbackSrc);
            return;
          }

          if (err.status === 400) {
            setErrorMsg("Video is still processing. Please try again in a few minutes.");
          } else if (err.status === 403) {
            setErrorMsg("You are not enrolled in this course or do not have access to this video.");
          } else if (err.status === 404) {
            setErrorMsg("Video playlist not found or is currently unavailable.");
          } else {
            setErrorMsg(err.message || "Failed to load video stream.");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStreamInfo();

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lectureId, fallbackSrc]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ════════════════════════════════════════════
     2. INITIALIZE HLS.JS OR FALLBACKS
     ════════════════════════════════════════════ */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // Reset video states
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const isHls = streamUrl.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Collect parsed levels from the master playlist
        setHlsLevels(hls.levels);
        // Default to Auto quality
        setSelectedQualityIndex(-1);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, attempting recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal HLS Error, destroying instance:", data);
              hls.destroy();
              setErrorMsg("An error occurred while loading video segments.");
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari/iOS)
      video.src = streamUrl;
    } else {
      // Standard video format fallback
      video.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  /* ════════════════════════════════════════════
     3. USER INTERACTION & CONTROLS TIMEOUT
     ════════════════════════════════════════════ */
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowQualityMenu(false);
      }, 3000);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
  }, [isPlaying]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  /* ════════════════════════════════════════════
     4. CONTROLS IMPLEMENTATION
     ════════════════════════════════════════════ */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => console.log("Play interrupted:", err));
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleSeekChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Number(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen error:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  // Fullscreen state listener (for escape key or standard window adjustments)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const selectQuality = (levelIndex) => {
    setSelectedQualityIndex(levelIndex);
    setShowQualityMenu(false);

    if (hlsRef.current) {
      // hls.js resolution selection
      hlsRef.current.currentLevel = levelIndex;
    } else if (levelIndex !== -1 && apiResolutions[levelIndex]) {
      // Safari / native fallback resolution selection
      const video = videoRef.current;
      if (video) {
        const prevTime = video.currentTime;
        const wasPlaying = isPlaying;
        const resUrl = apiResolutions[levelIndex].playlistUrl;
        
        video.src = resUrl;
        video.currentTime = prevTime;
        
        if (wasPlaying) {
          video.play().catch((err) => console.log("Safari quality switch play interrupted:", err));
        }
      }
    } else if (levelIndex === -1 && streamUrl) {
      // Safari / native fallback return to auto master playlist
      const video = videoRef.current;
      if (video) {
        const prevTime = video.currentTime;
        const wasPlaying = isPlaying;
        
        video.src = streamUrl;
        video.currentTime = prevTime;
        
        if (wasPlaying) {
          video.play().catch((err) => console.log("Safari quality auto switch play interrupted:", err));
        }
      }
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Keyboard controls helper
  const handleKeyDown = (e) => {
    const video = videoRef.current;
    if (!video) return;

    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      video.currentTime = Math.max(video.currentTime - 10, 0);
    } else if (e.code === "ArrowUp") {
      e.preventDefault();
      const newVol = Math.min(video.volume + 0.1, 1);
      video.volume = newVol;
      setVolume(newVol);
      setIsMuted(newVol === 0);
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      const newVol = Math.max(video.volume - 0.1, 0);
      video.volume = newVol;
      setVolume(newVol);
      setIsMuted(newVol === 0);
    } else if (e.code === "KeyF") {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  /* ════════════════════════════════════════════
     5. RENDER STATES
     ════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className={`w-full aspect-video bg-gray-950 flex flex-col items-center justify-center gap-3 text-white ${className}`}>
        <LuLoader size={36} className="animate-spin text-purple-500" />
        <span className="text-sm font-medium tracking-wide text-gray-300">Retrieving stream...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className={`w-full aspect-video bg-gray-950 flex flex-col items-center justify-center p-6 text-center text-white ${className}`}>
        <LuCircleAlert size={40} className="text-amber-500 mb-3" />
        <p className="text-sm font-semibold max-w-md mb-2">{errorMsg}</p>
        <p className="text-xs text-gray-500">Contact support or refresh the page if this persists.</p>
        {lectureId && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-xs font-bold rounded-lg transition"
          >
            <LuRotateCcw size={12} /> Reload Page
          </button>
        )}
      </div>
    );
  }

  // Quality labels list helper
  const getQualityLabel = (lvl, idx) => {
    if (lvl.height) return `${lvl.height}p`;
    if (lvl.attrs?.RESOLUTION) {
      const match = lvl.attrs.RESOLUTION.split("x");
      if (match.length === 2) return `${match[1]}p`;
    }
    return `Quality ${idx + 1}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowQualityMenu(false);
        }
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`relative w-full aspect-video bg-black overflow-hidden group select-none outline-none ${className}`}
    >
      {/* Actual Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onVideoEnd}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Control Overlay Wrapper */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 flex flex-col justify-end transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Play/Pause center overlay button (only shown when hover/paused) */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
          >
            <div className="w-16 h-16 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg transform scale-100 hover:scale-105 active:scale-95 transition-all duration-200">
              <LuPlay size={30} className="ml-1" />
            </div>
          </div>
        )}

        {/* Control Bar Container */}
        <div className="px-4 pb-4 pt-10 flex flex-col gap-3">
          
          {/* Progress Seek Bar */}
          <div className="flex items-center gap-2 group/slider w-full">
            <span className="text-xs font-medium text-gray-300 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="flex-1 h-1.5 rounded-lg appearance-none bg-white/20 cursor-pointer accent-purple-500 outline-none hover:h-2 transition-all duration-150"
              style={{
                background: `linear-gradient(to right, #a435f0 0%, #a435f0 ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
            <span className="text-xs font-medium text-gray-300 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              {/* Play / Pause Toggle */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-purple-400 p-1.5 rounded-lg hover:bg-white/10 transition active:scale-90"
              >
                {isPlaying ? <LuPause size={20} /> : <LuPlay size={20} />}
              </button>

              {/* Mute/Volume Row */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-purple-400 p-1.5 rounded-lg hover:bg-white/10 transition active:scale-90"
                >
                  {isMuted || volume === 0 ? <LuVolumeX size={20} /> : <LuVolume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 h-1 appearance-none bg-white/20 accent-purple-500 rounded-lg cursor-pointer transition-all duration-300 outline-none"
                  style={{
                    background: `linear-gradient(to right, #a435f0 0%, #a435f0 ${
                      (isMuted ? 0 : volume) * 100
                    }%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 relative">
              {/* Quality Selector Button */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((m) => !m)}
                  className="flex items-center gap-1.5 text-white hover:text-purple-400 p-1.5 rounded-lg hover:bg-white/10 transition text-sm font-semibold"
                >
                  <LuSettings size={18} className={showQualityMenu ? "rotate-45 transition-transform" : "transition-transform"} />
                  <span>
                    {selectedQualityIndex === -1
                      ? "Auto"
                      : hlsLevels[selectedQualityIndex]
                      ? getQualityLabel(hlsLevels[selectedQualityIndex], selectedQualityIndex)
                      : apiResolutions[selectedQualityIndex]
                      ? apiResolutions[selectedQualityIndex].resolution
                      : "Auto"}
                  </span>
                </button>

                {/* Quality Options Dropdown */}
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-32 bg-gray-900/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col z-50 py-1 font-semibold backdrop-blur-md">
                    {/* Auto Option */}
                    <button
                      onClick={() => selectQuality(-1)}
                      className={`text-left px-3 py-2 text-xs transition ${
                        selectedQualityIndex === -1
                          ? "bg-purple-600 text-white"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Auto
                    </button>

                    {/* Available levels from HLS */}
                    {hlsLevels.length > 0
                      ? hlsLevels.map((lvl, index) => (
                          <button
                            key={index}
                            onClick={() => selectQuality(index)}
                            className={`text-left px-3 py-2 text-xs transition ${
                              selectedQualityIndex === index
                                ? "bg-purple-600 text-white"
                                : "text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {getQualityLabel(lvl, index)}
                          </button>
                        ))
                      : /* Native fallback/API resolutions */
                        apiResolutions.map((res, index) => (
                          <button
                            key={res.resolution || index}
                            onClick={() => selectQuality(index)}
                            className={`text-left px-3 py-2 text-xs transition ${
                              selectedQualityIndex === index
                                ? "bg-purple-600 text-white"
                                : "text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {res.resolution}
                          </button>
                        ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-purple-400 p-1.5 rounded-lg hover:bg-white/10 transition active:scale-90"
              >
                {isFullscreen ? <LuMinimize size={20} /> : <LuMaximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HlsPlayer;
