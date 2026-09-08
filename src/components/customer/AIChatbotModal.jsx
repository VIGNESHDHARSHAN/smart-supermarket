import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Truck, 
  Plus, 
  Check, 
  Navigation,
  Subtitles,
  AlertCircle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';



import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { soundEffects } from '../../lib/audio';
import { generateAIResponse } from '../../lib/aiChatEngine';
import StoreAisleMapModal from './StoreAisleMapModal';

export default function AIChatbotModal({ isOpen, onClose }) {
  const { 
    products, 
    orders, 
    popularRecipes, 
    addToShoppingList, 
    addRecipeToCart, 
    shoppingList,
    storeSettings
  } = useSupermarket();
  
  const { language, t, currentLangMeta } = useLanguage();
  const { isDark } = useTheme();

  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(storeSettings?.voiceAssistantEnabled !== false);
  const [liveCaptionEnabled, setLiveCaptionEnabled] = useState(true);
  
  // Live caption state
  const [liveCaption, setLiveCaption] = useState({
    active: false,
    type: 'ai', // 'ai' | 'user'
    text: '',
    isInterim: false
  });
  
  // Voice error state
  const [voiceError, setVoiceError] = useState(null);

  const [messages, setMessages] = useState(() => [
    {
      id: 'm_welcome',
      sender: 'bot',
      text: t('ai_greeting', 'Hello! I am your SmartMart AI Shopping Assistant. How can I help you today?'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '🥛 Where is Fresh Milk?',
        '🍛 Paneer Butter Masala Recipe',
        '🥦 Organic Veggies & Greens',
        '🛵 Track My Order',
        '⏰ Store Timings & Payment'
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mapModalProduct, setMapModalProduct] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const captionClearTimerRef = useRef(null);

  // Audio level visualizer state for real microphone input
  const [audioLevel, setAudioLevel] = useState(0);
  const [showVoiceHub, setShowVoiceHub] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioStreamRef = useRef(null);
  const animFrameRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clean up all audio streams and speech on unmount/close
  const cleanupAudioStreams = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Clean up speech synthesis & recognition on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      soundEffects.stopSpeaking();
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      cleanupAudioStreams();
      setIsListening(false);
      setShowVoiceHub(false);
      setLiveCaption({ active: false, type: 'ai', text: '', isInterim: false });
      setVoiceError(null);
    }
    return () => {
      cleanupAudioStreams();
    };
  }, [isOpen, isListening, cleanupAudioStreams]);

  // Start real-time audio analysis from device microphone
  const startAudioVisualizer = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      }
      return stream;
    } catch (e) {
      console.warn("Audio visualizer stream error:", e);
      return null;
    }
  };

  // Handle Speech Recognition Result & Lifecycle
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Recognition stop error:", e);
      }
    }
    cleanupAudioStreams();
    setIsListening(false);
  }, [cleanupAudioStreams]);

  const handleSendMessage = useCallback((textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    // Stop active listening and speech when user sends
    stopListening();
    soundEffects.stopSpeaking();
    setShowVoiceHub(false);

    // Special chip trigger: Open 2D Store Map
    if (query.includes('2D Store Map') || query.includes('Store Map')) {
      const defaultProduct = products[0];
      setMapModalProduct(defaultProduct);
    }

    soundEffects.playScanBeep();
    const userMsg = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setVoiceError(null);

    // Show User Live Caption briefly if CC enabled
    if (liveCaptionEnabled) {
      setLiveCaption({
        active: true,
        type: 'user',
        text: query,
        isInterim: false
      });
      clearTimeout(captionClearTimerRef.current);
      captionClearTimerRef.current = setTimeout(() => {
        setLiveCaption(prev => prev.type === 'user' ? { ...prev, active: false } : prev);
      }, 3000);
    }

    setTimeout(() => {
      const aiResponse = generateAIResponse(query, {
        products,
        orders,
        popularRecipes,
        shoppingList,
        language,
        t
      });

      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);

      const spokenText = aiResponse.spokenText || aiResponse.text;

      // Update Live Caption for AI
      if (liveCaptionEnabled) {
        setLiveCaption({
          active: true,
          type: 'ai',
          text: spokenText,
          isInterim: false
        });
      }

      // Speak response if voiceEnabled
      if (voiceEnabled && spokenText) {
        soundEffects.speakText(spokenText, currentLangMeta?.speechLang || 'en-US', {
          onStart: () => {
            if (liveCaptionEnabled) {
              setLiveCaption({
                active: true,
                type: 'ai',
                text: spokenText,
                isInterim: false
              });
            }
          },
          onEnd: () => {
            clearTimeout(captionClearTimerRef.current);
            captionClearTimerRef.current = setTimeout(() => {
              setLiveCaption(prev => prev.type === 'ai' ? { ...prev, active: false } : prev);
            }, 4000);
          },
          onError: () => {
            clearTimeout(captionClearTimerRef.current);
            captionClearTimerRef.current = setTimeout(() => {
              setLiveCaption(prev => prev.type === 'ai' ? { ...prev, active: false } : prev);
            }, 3000);
          }
        });
      } else {
        soundEffects.playNotificationPing();
        clearTimeout(captionClearTimerRef.current);
        captionClearTimerRef.current = setTimeout(() => {
          setLiveCaption(prev => prev.type === 'ai' ? { ...prev, active: false } : prev);
        }, 5000);
      }
    }, 500);
  }, [inputMessage, products, orders, popularRecipes, shoppingList, language, t, liveCaptionEnabled, voiceEnabled, currentLangMeta, stopListening]);

  // Initialize Speech Recognition & Audio Capture
  const startListening = async () => {
    setVoiceError(null);
    soundEffects.stopSpeaking();

    // Start real-time hardware microphone visualizer
    await startAudioVisualizer();

    const SpeechRecognition = typeof window !== 'undefined' 
      ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
      : null;

    if (!SpeechRecognition) {
      setVoiceError("Your browser doesn't support Google Speech API. You can use our Voice Assistant Hub below!");
      setShowVoiceHub(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      const speechLang = currentLangMeta?.speechLang || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        soundEffects.playNotificationPing();
        if (liveCaptionEnabled) {
          setLiveCaption({
            active: true,
            type: 'user',
            text: 'Listening to your voice...',
            isInterim: true
          });
        }
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcriptText = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        const currentSaid = finalTranscript || interimTranscript;
        if (currentSaid) {
          setInputMessage(currentSaid);

          if (liveCaptionEnabled) {
            setLiveCaption({
              active: true,
              type: 'user',
              text: currentSaid,
              isInterim: !finalTranscript
            });
          }
        }

        if (finalTranscript && finalTranscript.trim().length > 0) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleSendMessage(finalTranscript.trim());
          }, 800);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setLiveCaption(prev => prev.type === 'user' ? { ...prev, active: false } : prev);
        
        if (event.error === 'network') {
          // In Brave or restrictive firewalls, Google speech server is blocked.
          setVoiceError("Google Speech Server was blocked by your browser/network (e.g. Brave Shields or offline). Select any voice command below or speak with Voice Hub!");
          setShowVoiceHub(true);
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError("Microphone permission was blocked. Please click the lock 🔒 in your browser URL bar to allow microphone.");
          setShowVoiceHub(true);
        } else if (event.error === 'no-speech') {
          setVoiceError("No speech detected. Select a voice prompt below or try speaking again.");
          setShowVoiceHub(true);
        } else {
          setVoiceError(`Voice input: ${event.error}. Use Voice Hub below.`);
          setShowVoiceHub(true);
        }
        setIsListening(false);
        cleanupAudioStreams();
      };

      recognition.onend = () => {
        setIsListening(false);
        cleanupAudioStreams();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition startup error:", err);
      setLiveCaption(prev => prev.type === 'user' ? { ...prev, active: false } : prev);
      setVoiceError("Could not connect to online speech service. Voice Hub activated below.");
      setShowVoiceHub(true);
      setIsListening(false);
      cleanupAudioStreams();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleQuickVoicePrompt = (promptText) => {
    handleSendMessage(promptText);
    setShowVoiceHub(false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[92vh] max-h-[720px] rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        
        {/* Chatbot Header */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-700 dark:from-primary-950 dark:via-slate-900 dark:to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-primary-500/20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Bot className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-primary-800 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">
                  {t('ai_genie', 'SmartMart AI Genie')}
                </h3>
                <span className="bg-yellow-400 text-charcoal-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI v3.0 NLP
                </span>
              </div>
              <p className="text-xs text-primary-100/90 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Multilingual In-Store Assistant • {currentLangMeta?.nativeName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Caption (CC) Toggle Button */}
            <button
              onClick={() => {
                setLiveCaptionEnabled(!liveCaptionEnabled);
                if (liveCaptionEnabled) {
                  setLiveCaption(prev => ({ ...prev, active: false }));
                }
              }}
              title={liveCaptionEnabled ? "Live Captions Active (Click to Hide)" : "Enable Live Captions (Subtitles)"}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                liveCaptionEnabled 
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-xs' 
                  : 'bg-white/10 text-white/70 border-white/15 hover:text-white'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">CC</span>
              {liveCaptionEnabled && <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></span>}
            </button>

            {/* Voice Audio Speaker Output Toggle */}
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) {
                  soundEffects.stopSpeaking();
                }
              }}
              title={voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
              className={`p-2 rounded-xl border transition-all ${voiceEnabled ? 'bg-white/20 border-white/30 text-yellow-300' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                soundEffects.stopSpeaking();
                stopListening();
                onClose();
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Caption Floating Banner Bar (When active and CC enabled) */}
        {liveCaptionEnabled && liveCaption.active && (
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 border-b border-primary-500/30 flex items-start gap-3 shadow-lg animate-in slide-in-from-top-2 duration-200 z-10">
            <div className="flex-shrink-0 mt-0.5">
              {liveCaption.type === 'ai' ? (
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-4 h-4 text-yellow-300 animate-pulse" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white animate-pulse shadow-xs">
                  <Mic className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    liveCaption.type === 'ai' 
                      ? 'bg-primary-500/30 text-primary-300 border border-primary-400/30' 
                      : 'bg-red-500/30 text-red-300 border border-red-400/30'
                  }`}>
                    {liveCaption.type === 'ai' ? '🤖 Live Caption • AI Genie' : '🎙️ Live Voice Input • Speaking'}
                  </span>

                  {/* Equalizer Sound Waves Animation */}
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-3"></span>
                    <span className="w-0.5 bg-yellow-400 rounded-full animate-bounce h-2 delay-75"></span>
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-3.5 delay-150"></span>
                    <span className="w-0.5 bg-yellow-400 rounded-full animate-bounce h-2.5 delay-100"></span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setLiveCaption(prev => ({ ...prev, active: false }));
                    soundEffects.stopSpeaking();
                  }}
                  className="text-slate-400 hover:text-white text-xs p-1"
                  title="Dismiss live caption"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed font-sans select-text">
                "{liveCaption.text}"
                {liveCaption.isInterim && <span className="inline-block w-1.5 h-4 ml-1 bg-yellow-400 animate-pulse align-middle"></span>}
              </p>
            </div>
          </div>
        )}

        {/* Voice Error Notification Alert */}
        {voiceError && (
          <div className="bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-900/60 p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 flex-1">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>{voiceError}</span>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => {
                  setVoiceError(null);
                  startListening();
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Mic</span>
              </button>
              <button
                onClick={() => setVoiceError(null)}
                className="p-1 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}


        {/* Chat History Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/60">
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%]">
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary-600 text-white rounded-br-xs shadow-md font-medium' 
                    : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 rounded-bl-xs shadow-sm border border-gray-200 dark:border-slate-800'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>

                  {/* Recipe Card Component */}
                  {msg.type === 'recipe' && msg.recipe && (
                    <div className="mt-3 bg-gradient-to-br from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={msg.recipe.image} 
                          alt={msg.recipe.name} 
                          className="w-14 h-14 rounded-xl object-cover border border-amber-200 dark:border-amber-800 shadow-xs" 
                        />
                        <div>
                          <div className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{msg.recipe.icon || '🍛'}</span> {msg.recipe.name}
                          </div>
                          <div className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                            ⏱️ {msg.recipe.time} • 👥 {msg.recipe.servings || msg.recipe.serves}
                          </div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                            Total Recipe Cost: <span className="font-mono text-primary-600 dark:text-primary-400">₹{msg.totalCost}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients list pills */}
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/50">
                        <div className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Fresh Ingredients Included:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.recipeProducts?.map(prod => (
                            <div key={prod.id} className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-100 dark:border-slate-700 text-xs">
                              <img src={prod.image} alt={prod.name} className="w-7 h-7 rounded-md object-cover" />
                              <div className="truncate flex-1">
                                <div className="font-semibold truncate">{prod.name}</div>
                                <div className="text-[10px] text-gray-400">Aisle {prod.aisle} • ₹{prod.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 1-Click Add All To Cart Action */}
                      <button
                        onClick={() => addRecipeToCart(msg.recipe)}
                        className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group active:scale-98"
                      >
                        <Plus className="w-4 h-4 group-hover:scale-120 transition-transform" />
                        <span>{t('ai_add_recipe_cart', 'Add All Ingredients to Cart')} (₹{msg.totalCost})</span>
                      </button>
                    </div>
                  )}

                  {/* Products Grid Component */}
                  {msg.type === 'products' && msg.products && (
                    <div className="mt-3 space-y-2">
                      {msg.isLocationSearch && (
                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 font-bold mb-2">
                          <span className="flex items-center gap-1.5">
                            <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>In-Store Supermarket Aisle Placement</span>
                          </span>
                          <button
                            onClick={() => setMapModalProduct(msg.products[0])}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" /> 2D Map
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.products.map(prod => {
                          const inCart = shoppingList.some(item => item.id === prod.id);
                          return (
                            <div 
                              key={prod.id} 
                              className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col justify-between gap-2 shadow-2xs hover:border-primary-400 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <img src={prod.image} alt={prod.name} className="w-11 h-11 rounded-lg object-cover bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{prod.name}</div>
                                  <div className="text-[11px] font-bold text-primary-600 dark:text-primary-400 font-mono">₹{prod.price} / {prod.unit}</div>
                                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" /> Aisle {prod.aisle}, Shelf {prod.shelf}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-slate-700">
                                <button
                                  onClick={() => addToShoppingList(prod, 1)}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                    inCart 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                                  }`}
                                >
                                  {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                  <span>{inCart ? 'Added' : 'Add to Cart'}</span>
                                </button>

                                <button
                                  onClick={() => setMapModalProduct(prod)}
                                  title="Locate on 2D store map"
                                  className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 text-[11px] font-bold transition-colors"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Status Card Component */}
                  {msg.type === 'order' && msg.order && (
                    <div className="mt-3 bg-blue-50/80 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300">{msg.order.id}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                          {msg.order.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        🛵 ETA: <span className="font-bold text-gray-900 dark:text-white">{msg.order.etaMinutes || 12} mins</span> • Rider: <span className="font-semibold">{msg.order.rider?.name || 'Assigned Delivery Partner'}</span>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${msg.order.rider?.progressPercent || 45}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 text-right mt-1.5">
                    {msg.timestamp}
                  </div>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2.5 ml-11 flex flex-wrap gap-1.5">
                  {msg.suggestions.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="text-xs bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-950/70 hover:text-primary-700 dark:hover:text-primary-300 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-gray-400 text-xs italic ml-11">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce delay-200"></span>
              <span>AI Genie is searching store aisles...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Assistant Hub & Real-time Audio Level Bar */}
        {showVoiceHub && (
          <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 border-t border-primary-500/30 p-3 sm:p-4 text-white animate-in slide-in-from-bottom-3 duration-200 z-20 shadow-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Voice Assistant & Quick Prompts</span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">1-Tap Voice</span>
                  </h4>
                </div>
              </div>

              {/* Hardware Mic Sound Level Bar if active */}
              {audioLevel > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Mic Volume:</span>
                  <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-75"
                      style={{ width: `${Math.max(10, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowVoiceHub(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-primary-200/80 mb-2">
              Tap any spoken command below to speak with AI Genie with full live captions & voice:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                { icon: '🥛', text: 'Where is Fresh Milk & Dairy?' },
                { icon: '🍛', text: 'Paneer Butter Masala Recipe' },
                { icon: '🥦', text: 'Show fresh Organic Vegetables' },
                { icon: '🛵', text: 'Track status of my active order' },
                { icon: '🛒', text: 'Add 1kg Basmati Rice to cart' },
                { icon: '⏰', text: 'Store opening hours and payment modes' }
              ].map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickVoicePrompt(cmd.text)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-primary-600/50 hover:border-primary-400 border border-white/10 text-left transition-all text-xs active:scale-98 group"
                >
                  <span className="text-base group-hover:scale-120 transition-transform">{cmd.icon}</span>
                  <span className="font-semibold text-slate-100 flex-1 truncate">{cmd.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar & Live Voice Mic */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 relative">
          
          {/* Active Listening Indicator Pill */}
          {isListening && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>Listening to your voice ({currentLangMeta?.name || 'English'})...</span>
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }} 
            className="flex items-center gap-2"
          >
            {/* Mic Speech-to-Text Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center relative ${
                isListening 
                  ? 'bg-red-500 text-white shadow-lg ring-4 ring-red-400/40 animate-pulse' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600'
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak to AI (Click to activate voice input or quick voice hub)"}
            >
              {isListening ? (
                <div className="relative flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                  <span className="absolute -inset-1 rounded-full border-2 border-white animate-ping opacity-75"></span>
                </div>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Input Text Box */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? t('ai_listening', 'Listening to your voice...') : t('ai_ask_placeholder', 'Ask AI (e.g. "Where is milk?", "Paneer recipe", "Store timings")...')}
              className={`flex-1 h-12 px-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                isListening ? 'border-red-400 dark:border-red-500 ring-2 ring-red-300/30' : 'border-gray-200 dark:border-slate-700'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="h-12 px-5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>{t('ai_send', 'Send')}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* Embedded In-Store Aisle Map Modal */}
      {mapModalProduct && (
        <StoreAisleMapModal
          isOpen={!!mapModalProduct}
          onClose={() => setMapModalProduct(null)}
          selectedProduct={mapModalProduct}
        />
      )}

    </div>
  );
}


