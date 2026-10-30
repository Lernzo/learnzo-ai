"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

// Scene definitions matching the official script
const SCENES = [
  {
    id: 1,
    start: 0,
    end: 8,
    title: "THE MAGICAL WORLD",
    duration: "00–08s",
    subtitle: "Welcome to Rainbow Town",
    narration: "Welcome to a magical world filled with colours, friendship and exciting adventures!",
    speaker: "Narrator",
    color: "from-violet-500 via-fuchsia-400 to-pink-400",
  },
  {
    id: 2,
    start: 8,
    end: 16,
    title: "CAPTAIN RAINBOW",
    duration: "08–16s",
    subtitle: "Meet our hero",
    narration: "Hello, little heroes! I'm Captain Rainbow! Welcome to our amazing rescue team!",
    speaker: "Captain Rainbow",
    color: "from-sky-400 via-blue-500 to-indigo-600",
  },
  {
    id: 3,
    start: 16,
    end: 32,
    title: "MEET OUR RESCUE FRIENDS",
    duration: "16–32s",
    subtitle: "Four brave helpers",
    narration: "Meet Ruby, Officer Blue, Sunny and Greenie — ready for fun and ready to help!",
    speaker: "Team",
    color: "from-red-400 via-orange-400 to-amber-400",
  },
  {
    id: 4,
    start: 32,
    end: 47,
    title: "WHAT WILL WE LEARN?",
    duration: "32–47s",
    subtitle: "Colours, songs, numbers & more",
    narration: "Together, we'll discover beautiful colours, sing happy songs, count numbers, learn new things and help our friends!",
    speaker: "Captain Rainbow",
    color: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  {
    id: 5,
    start: 47,
    end: 55,
    title: "THE ADVENTURE BEGINS",
    duration: "47–55s",
    subtitle: "Someone needs help!",
    narration: "Did you hear that? Come on, team! Someone needs our help! Let's go!",
    speaker: "All",
    color: "from-amber-400 via-orange-500 to-red-500",
  },
  {
    id: 6,
    start: 55,
    end: 60,
    title: "LEARNZO BRAND ENDING",
    duration: "55–60s",
    subtitle: "Brought to you by Learnzo",
    narration: "Rainbow Rescue Team! An exciting world of learning and fun, brought to you by Learnzo!",
    speaker: "Narrator",
    color: "from-blue-900 via-indigo-800 to-violet-900",
  },
];

const CHARACTERS = [
  {
    id: "ruby",
    name: "Ruby",
    role: "The RED Fire Truck",
    line: "I'm Ruby, the RED fire truck! Let's have some fun!",
    color: "bg-red-500",
    light: "bg-red-400",
    accent: "border-red-200",
    bg: "from-red-50 to-orange-50",
    emoji: "🚒",
    letter: "R",
    delay: 0,
  },
  {
    id: "blue",
    name: "Officer Blue",
    role: "The BLUE Police Car",
    line: "I'm Officer Blue, the BLUE police car! I'm ready to help!",
    color: "bg-blue-600",
    light: "bg-blue-400",
    accent: "border-blue-200",
    bg: "from-blue-50 to-sky-50",
    emoji: "🚓",
    letter: "B",
    delay: 150,
  },
  {
    id: "sunny",
    name: "Sunny",
    role: "The YELLOW Ambulance",
    line: "Hello! I'm Sunny, the YELLOW ambulance! Helping friends makes me happy!",
    color: "bg-amber-400",
    light: "bg-yellow-300",
    accent: "border-amber-200",
    bg: "from-amber-50 to-yellow-50",
    emoji: "🚑",
    letter: "S",
    delay: 300,
  },
  {
    id: "greenie",
    name: "Greenie",
    role: "The GREEN Rescue Jeep",
    line: "And I'm Greenie, the GREEN rescue jeep! Let's go on an adventure!",
    color: "bg-emerald-500",
    light: "bg-emerald-400",
    accent: "border-emerald-200",
    bg: "from-emerald-50 to-teal-50",
    emoji: "🚙",
    letter: "G",
    delay: 450,
  },
];

export default function RainbowRescuePage() {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentScene = SCENES.find((s) => time >= s.start && time < s.end) ?? SCENES[SCENES.length - 1];
  const progress = (time / 60) * 100;

  const audioMap: Record<number, string> = {
    1: "/rainbow-rescue/audio/scene1-narrator.mp3",
    2: "/rainbow-rescue/audio/scene2-captain.mp3",
    3: "/rainbow-rescue/audio/scene3-ruby.mp3",
    4: "/rainbow-rescue/audio/scene4-captain.mp3",
    5: "/rainbow-rescue/audio/scene5-captain.mp3",
    6: "/rainbow-rescue/audio/scene1-narrator.mp3",
  };

  const startPlayback = useCallback(() => {
    setHasStarted(true);
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTime((t) => {
          if (t >= 60) {
            setIsPlaying(false);
            return 60;
          }
          return t + 0.1;
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // Rotate character spotlight in scene 3
  useEffect(() => {
    if (currentScene.id !== 3 || !isPlaying) return;
    const id = setInterval(() => {
      setActiveCharacter((c) => (c + 1) % 4);
    }, 2000);
    return () => clearInterval(id);
  }, [currentScene.id, isPlaying]);

  // Audio sync — play narration for current scene when scene changes
  useEffect(() => {
    if (!hasStarted || isMuted) return;
    const src = audioMap[currentScene.id];
    if (audioRef.current && src) {
      audioRef.current.src = src;
      audioRef.current.play().catch(() => {});
    }
  }, [currentScene.id, hasStarted, isMuted]);

  const seekTo = (sceneId: number) => {
    const sc = SCENES.find((s) => s.id === sceneId);
    if (sc) {
      setTime(sc.start + 0.1);
      setHasStarted(true);
      setIsPlaying(true);
    }
  };

  const replay = () => {
    setTime(0);
    setIsPlaying(true);
    setHasStarted(true);
  };

  const togglePlay = () => {
    if (time >= 60) {
      replay();
      return;
    }
    if (!hasStarted) {
      startPlayback();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a1f] text-white selection:bg-fuchsia-500 selection:text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050a1f]/80 border-b border-white/10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                <Image src="/learnzo-logo.png" alt="Learnzo" width={36} height={36} className="object-contain" />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-[0.18em] text-white/60 leading-none">LEARNZO PRESENTS</div>
                <div className="text-[15px] font-black tracking-tight leading-none mt-0.5">RAINBOW RESCUE TEAM</div>
              </div>
            </Link>
            <span className="hidden sm:inline-flex ml-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-[11px] font-black tracking-widest">OFFICIAL INTRO • S01 E01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-white/50 mr-2">60-second premiere</span>
            <Link href="/kids" className="hidden sm:inline-flex rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-bold hover:bg-white/90 transition">Explore Kids Zone</Link>
            <Link href="/solve" className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-900/20">Try Learnzo Free</Link>
          </div>
        </div>
      </header>

      {/* Hero intro bar */}
      <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 via-30% to-amber-400 h-[3px] w-full" />
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Series Introduction • Now Streaming
          </span>
          <span className="hidden lg:inline text-xs text-white/60">A magical world of colours, friendship and exciting adventures</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white/10 px-3 py-1.5 border border-white/10">Ages 2–6</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 border border-white/10">3D Animation</span>
          <span className="rounded-full bg-emerald-500 text-white px-3 py-1.5 font-bold">✓ Learnzo Original</span>
        </div>
      </div>

      {/* Main theater */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-12 gap-6">
          {/* Stage */}
          <div className="col-span-12 xl:col-span-8">
            <div
              ref={stageRef}
              className="relative overflow-hidden rounded-[24px] bg-black border border-white/10 shadow-[0_20px_80px_-20px_rgba(124,58,237,0.5)] aspect-[16/9] flex flex-col"
            >
              {/* Scene background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${currentScene.color} transition-all duration-700`} />
              
              {/* Decorative orbs */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-white/15 blur-[60px]" />
                <div className="absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-white/10 blur-[70px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-white/5 to-transparent blur-3xl" />
              </div>

              {/* SCENE 1: Magical World */}
              {currentScene.id === 1 && (
                <div className="absolute inset-0 flex flex-col">
                  {/* Poster image as fly-through background */}
                  <div className="absolute inset-0">
                    <Image src="/rainbow-rescue/poster.jpg" alt="Rainbow Town" fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-fuchsia-500/20" />
                  </div>

                  {/* Rainbow arch overlay for extra magic */}
                  <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[70%] h-[30%] opacity-60 pointer-events-none">
                    <svg viewBox="0 0 800 220" className="w-full h-full">
                      <path d="M 80 200 A 320 320 0 0 1 720 200" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="18" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Flying camera indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur px-3 py-1.5 border border-white/15 text-[11px] font-bold tracking-widest">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> REC • FLY-THROUGH • 3D TOWN
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/35 backdrop-blur border border-white/15 px-3 py-1.5 text-[11px] font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Camera flying through Rainbow Town
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-[18%] inset-x-0 text-center pointer-events-none px-4">
                    <div className="inline-flex flex-col items-center gap-1 bg-black/30 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-xl">
                      <span className="text-[11px] font-black tracking-[0.2em] text-amber-200">RAINBOW TOWN • POP. FRIENDSHIP</span>
                      <span className="text-xl sm:text-2xl font-black drop-shadow-lg text-white">A Magical World of Colours!</span>
                      <span className="text-[11px] font-semibold text-white/70">Colourful houses • Sparkling roads • Huge rainbow</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 2: Captain Rainbow */}
              {currentScene.id === 2 && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative w-full max-w-[520px]">
                    {/* Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-yellow-300/30 via-white/20 to-sky-300/30 blur-3xl rounded-full" />
                    
                    {/* Captain */}
                    <div className="relative flex flex-col items-center animate-[float_3s_ease-in-out_infinite]">
                      {/* Cape */}
                      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[140px] h-[110px] bg-gradient-to-b from-red-500 via-yellow-400 via-green-400 via-blue-500 to-violet-600 rounded-b-[40px] opacity-90 blur-[0.5px] -z-10 rotate-1" />
                      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[120px] h-[100px] bg-gradient-to-b from-red-400 to-violet-500 rounded-b-[32px] -z-10" />
                      
                      {/* Body */}
                      <div className="relative">
                        <div className="h-[88px] w-[88px] rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-[4px] border-white shadow-xl flex items-center justify-center text-4xl">🦸</div>
                        <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-[10px] font-black shadow-md">★</div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white text-slate-900 rounded-full px-3 py-1 text-[10px] font-black shadow-lg border border-slate-200">CAPTAIN</div>
                      </div>
                      <div className="mt-2 h-16 w-28 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 border-2 border-white/80 shadow-xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        <span className="text-white font-black text-sm tracking-widest">RAINBOW</span>
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500" />
                      </div>
                      <div className="flex gap-2 mt-1">
                        <div className="h-8 w-10 rounded-full bg-amber-800 border-2 border-white shadow-md" />
                        <div className="h-8 w-10 rounded-full bg-amber-800 border-2 border-white shadow-md" />
                      </div>
                      
                      {/* Sparkles */}
                      <span className="absolute top-4 left-8 text-yellow-300 animate-pulse text-xl">✦</span>
                      <span className="absolute top-10 right-6 text-white animate-pulse text-lg [animation-delay:400ms]">✦</span>
                      <span className="absolute bottom-10 left-2 text-yellow-200 animate-pulse text-base [animation-delay:800ms]">✦</span>
                    </div>

                    {/* Speech bubble */}
                    <div className="mt-6 bg-white text-slate-900 rounded-[20px] rounded-bl-[6px] px-5 py-4 shadow-2xl border border-slate-100 relative max-w-[92%] mx-auto">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 bg-white rotate-45 border-l border-t border-slate-100" />
                      <p className="text-[13px] font-black tracking-widest text-violet-600 leading-none">CAPTAIN RAINBOW</p>
                      <p className="mt-1.5 text-[15px] sm:text-[17px] font-bold leading-snug">“Hello, little heroes! I&apos;m Captain Rainbow! Welcome to our amazing rescue team!”</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Speaking directly to you
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 3: Meet Rescue Friends */}
              {currentScene.id === 3 && (
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col">
                  <div className="text-center">
                    <span className="inline-flex rounded-full bg-white text-slate-900 px-3 py-1 text-[11px] font-black tracking-widest shadow">MEET THE TEAM • 4 HEROES</span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                    {CHARACTERS.map((c, i) => (
                      <div
                        key={c.id}
                        className={`relative rounded-[18px] bg-white text-slate-900 p-3 sm:p-4 shadow-xl border-2 transition-all duration-500 flex flex-col items-center text-center
                          ${activeCharacter === i ? "scale-[1.03] border-violet-400 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.4)] z-10" : "border-white/80 scale-[0.98] opacity-95"}
                        `}
                        style={{ transformOrigin: "center" }}
                      >
                        {activeCharacter === i && (
                          <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">●</span>
                        )}
                        {/* Vehicle illustration */}
                        <div className={`h-16 w-24 sm:h-20 sm:w-32 rounded-2xl ${c.color} border-[3px] border-white shadow-lg relative flex items-center justify-center overflow-hidden`}>
                          <div className="absolute inset-x-0 top-0 h-1/2 bg-white/18" />
                          <div className="absolute bottom-1 left-1 right-1 h-2 bg-black/15 rounded-full blur-[2px]" />
                          {/* Windows */}
                          <div className="flex gap-1">
                            <div className="h-6 w-6 rounded-md bg-sky-200 border-2 border-white shadow-inner flex items-center justify-center text-[10px]">◯</div>
                            <div className="h-6 w-6 rounded-md bg-sky-200 border-2 border-white shadow-inner hidden sm:flex items-center justify-center text-[10px]">◯</div>
                          </div>
                          {/* Eyes */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-3">
                            <span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-900 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-slate-900" /></span>
                            <span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-900 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-slate-900" /></span>
                          </div>
                          {/* Smile */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 h-1.5 w-6 rounded-full bg-white/90 border border-white" />
                          {/* Siren / light */}
                          <div className={`absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-6 rounded-full ${c.light} border-2 border-white shadow`} />
                          {/* Wheels */}
                          <div className="absolute -bottom-1 left-2 h-5 w-5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                          </div>
                          <div className="absolute -bottom-1 right-2 h-5 w-5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                          </div>
                        </div>

                        <div className={`mt-2 h-6 w-6 rounded-full ${c.color} text-white flex items-center justify-center text-[11px] font-black border-2 border-white shadow`}>{c.letter}</div>
                        <div className="mt-1 font-black text-[13px] leading-none">{c.name}</div>
                        <div className="text-[11px] font-bold text-slate-500 leading-tight">{c.role}</div>
                        <div className="mt-2 bg-slate-50 rounded-xl px-2.5 py-2 border border-slate-100 w-full">
                          <p className="text-[11px] font-semibold leading-snug text-slate-700">“{c.line}”</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-center gap-1.5">
                    {CHARACTERS.map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full transition-all ${activeCharacter === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* SCENE 4: What will we learn */}
              {currentScene.id === 4 && (
                <div className="absolute inset-0 p-5 flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur border border-white/20 px-4 py-1.5 text-xs font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> LEARNING ADVENTURE
                    </div>
                    <h3 className="mt-3 text-[22px] sm:text-[26px] font-black leading-tight drop-shadow">Together, we&apos;ll discover!</h3>
                    
                    <div className="mt-4 grid grid-cols-4 gap-2 w-full max-w-[520px]">
                      {[
                        { icon: "🎨", label: "Colours", sub: "Red, Blue...", col: "bg-white" },
                        { icon: "🎵", label: "Songs", sub: "Sing along", col: "bg-white" },
                        { icon: "🔢", label: "Numbers", sub: "1,2,3...", col: "bg-white" },
                        { icon: "🤝", label: "Help", sub: "Be kind", col: "bg-white" },
                      ].map((item, i) => (
                        <div key={i} className={`${item.col} rounded-2xl p-3 text-slate-900 shadow-xl border border-white/80 flex flex-col items-center gap-1 animate-[bounce_1.8s_ease-in-out_infinite]`} style={{ animationDelay: `${i * 150}ms` }}>
                          <span className="text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black leading-none">{item.label}</span>
                          <span className="text-[10px] font-semibold text-slate-500 leading-none">{item.sub}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dancing vehicles */}
                    <div className="mt-5 flex items-end justify-center gap-2 sm:gap-3">
                      {CHARACTERS.map((c, i) => (
                        <div key={c.id} className={`h-10 w-14 sm:h-12 sm:w-16 rounded-xl ${c.color} border-2 border-white shadow-lg flex items-center justify-center relative animate-[dance_${1+i*0.1}s_ease-in-out_infinite]`} style={{ animationDelay: `${i*100}ms` }}>
                          <span className="text-white text-[10px] font-black">{c.letter}</span>
                          <div className={`absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full ${c.light} border border-white`} />
                        </div>
                      ))}
                    </div>

                    {/* Floating numbers/shapes */}
                    <div className="absolute top-8 left-6 text-white/80 font-black text-lg animate-[float_2s_ease-in-out_infinite]">★</div>
                    <div className="absolute top-12 right-8 text-yellow-200 font-black text-xl animate-[float_2.5s_ease-in-out_infinite]">5</div>
                    <div className="absolute bottom-20 left-8 text-white/70 font-black animate-[float_2.2s_ease-in-out_infinite]">●</div>
                    <div className="absolute bottom-24 right-10 text-white/70 font-black animate-[float_2.8s_ease-in-out_infinite]">▲</div>
                    <div className="absolute top-1/2 left-4 text-pink-200 font-black text-sm animate-[float_3s_ease-in-out_infinite]">♥</div>
                  </div>

                  <div className="bg-white text-slate-900 rounded-2xl px-4 py-3 shadow-2xl border border-slate-100 mt-4">
                    <p className="text-xs font-black tracking-widest text-violet-600">CAPTAIN RAINBOW</p>
                    <p className="text-sm font-bold leading-snug mt-1">“Together, we&apos;ll discover beautiful colours, sing happy songs, count numbers, learn new things and help our friends!”</p>
                  </div>
                </div>
              )}

              {/* SCENE 5: Adventure begins */}
              {currentScene.id === 5 && (
                <div className="absolute inset-0 p-6 flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {/* Kitten */}
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-white shadow-2xl border-4 border-white flex items-center justify-center text-4xl animate-[wiggle_0.6s_ease-in-out_infinite]">🐱</div>
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 rounded-full px-2.5 py-1 text-xs font-black shadow border-2 border-white animate-pulse">Meow~ ♪</div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-slate-900 rounded-full px-3 py-1 text-[10px] font-bold border border-slate-200 shadow">Somewhere near...</div>
                      {/* Sound waves */}
                      <span className="absolute top-1/2 -right-6 h-2 w-2 rounded-full border-2 border-white/70 animate-ping" />
                      <span className="absolute top-1/2 -right-8 h-3 w-3 rounded-full border border-white/50 animate-ping [animation-delay:200ms]" />
                      <span className="absolute top-1/2 -left-6 h-2 w-2 rounded-full border-2 border-white/70 animate-ping [animation-delay:400ms]" />
                    </div>

                    <div className="mt-6 w-full max-w-[520px] space-y-2">
                      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-xl border border-slate-100 flex gap-3 items-start">
                        <span className="h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">R</span>
                        <div>
                          <p className="text-[11px] font-black tracking-widest text-red-600">RUBY</p>
                          <p className="text-sm font-bold text-slate-900">“Did you hear that?”</p>
                        </div>
                        <span className="ml-auto text-slate-400 text-xs">🔊</span>
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl rounded-br-md px-4 py-3 shadow-xl border border-white/20 text-white">
                        <p className="text-[11px] font-black tracking-widest text-white/90">CAPTAIN RAINBOW</p>
                        <p className="text-sm font-bold">“Come on, team! Someone needs our help!”</p>
                      </div>
                      <div className="bg-emerald-500 rounded-2xl px-4 py-3 shadow-xl border-2 border-white text-white text-center">
                        <p className="text-sm font-black tracking-widest">ALL VEHICLES — “Let&apos;s go!” 🚀</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center gap-2">
                    {CHARACTERS.map((c) => (
                      <div key={c.id} className={`h-1 w-12 rounded-full ${c.color} animate-pulse`} />
                    ))}
                  </div>
                </div>
              )}

              {/* SCENE 6: Brand ending */}
              {currentScene.id === 6 && (
                <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center">
                  {/* Rainbow behind */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border-[18px] border-red-500/40" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border-[18px] border-yellow-400/40" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border-[18px] border-green-400/40" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-[18px] border-blue-500/40" />
                  </div>

                  <div className="relative">
                    <div className="flex justify-center -space-x-2">
                      {CHARACTERS.map((c) => (
                        <div key={c.id} className={`h-14 w-16 sm:h-16 sm:w-20 rounded-2xl ${c.color} border-[3px] border-white shadow-xl flex items-center justify-center relative`}>
                          <span className="text-white font-black">{c.letter}</span>
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm">👋</span>
                        </div>
                      ))}
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 border-[3px] border-white shadow-xl flex items-center justify-center text-xl">🦸</div>
                    </div>
                    
                    <div className="mt-6 bg-white rounded-[20px] px-6 py-5 shadow-2xl border border-slate-100 max-w-[560px]">
                      <div className="flex items-center justify-center gap-3">
                        <Image src="/learnzo-logo.png" alt="Learnzo" width={140} height={40} className="h-10 w-auto object-contain" />
                      </div>
                      <h3 className="mt-3 text-[18px] sm:text-[20px] font-black text-slate-900 leading-tight">Rainbow Rescue Team!</h3>
                      <p className="mt-1 text-[13px] font-semibold text-slate-600">An exciting world of learning and fun, brought to you by Learnzo!</p>
                      <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2">
                        <span className="text-xs font-black tracking-[0.18em]">LEARNZO</span>
                        <span className="h-1 w-1 rounded-full bg-white/50" />
                        <span className="text-xs font-semibold tracking-wide">Learn. Understand. Grow.</span>
                      </div>
                    </div>

                    <div className="mt-4 inline-flex rounded-full bg-white/15 backdrop-blur border border-white/20 px-4 py-1.5 text-xs font-bold text-white">
                      ✨ New episodes every week on Learnzo Kids
                    </div>
                  </div>
                </div>
              )}

              {/* Play overlay */}
              {!hasStarted && (
                <div className="absolute inset-0 bg-[#050a1f]/55 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> OFFICIAL SERIES INTRODUCTION • 60 SECONDS
                  </div>
                  <h2 className="mt-4 text-[30px] sm:text-[40px] font-black leading-[0.9] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                    Welcome to<br />
                    <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-violet-400 bg-clip-text text-transparent">Rainbow Town</span>
                  </h2>
                  <p className="mt-3 max-w-[560px] text-sm sm:text-[15px] font-medium text-white/80 leading-relaxed">
                    Join Captain Rainbow and the Rescue Friends on a magical adventure filled with colours, songs, numbers and kindness.
                  </p>
                  <button
                    onClick={startPlayback}
                    className="mt-6 inline-flex items-center gap-3 rounded-full bg-white text-slate-900 px-7 py-3.5 text-[15px] font-black shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition"
                  >
                    <span className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center">▶</span>
                    Play Premiere
                    <span className="hidden sm:inline text-xs font-bold text-slate-500 border-l border-slate-200 pl-3 ml-1">00:60 • HD • Captions</span>
                  </button>
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
                    <span>Tap to start with sound</span>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span>Auto-plays all 6 scenes</span>
                  </div>
                </div>
              )}

              {/* Finished overlay */}
              {time >= 60 && (
                <div className="absolute inset-0 bg-[#050a1f]/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-white rounded-[20px] p-6 shadow-2xl max-w-[420px] w-full text-slate-900">
                    <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl">✓</div>
                    <h3 className="mt-3 text-xl font-black">Premiere complete! 🎉</h3>
                    <p className="mt-1 text-sm text-slate-600">You watched the full Rainbow Rescue introduction. Ready to explore?</p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button onClick={replay} className="rounded-full bg-slate-900 text-white px-4 py-2.5 text-sm font-bold">↺ Replay Intro</button>
                      <Link href="/coloring" className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white px-4 py-2.5 text-sm font-bold text-center">Start Coloring</Link>
                    </div>
                    <Link href="/kids" className="mt-3 inline-flex text-xs font-bold text-violet-600 hover:underline">Go to Kids Activities →</Link>
                  </div>
                </div>
              )}

              {/* Hidden audio element */}
              <audio ref={audioRef} preload="auto" muted={isMuted} />

              {/* Top HUD */}
              <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-black/40 backdrop-blur border border-white/15 px-2.5 py-1 text-[11px] font-black tracking-widest text-white/90">
                    SCENE {currentScene.id}/6 • {currentScene.title}
                  </span>
                  <span className="hidden sm:inline-flex rounded-full bg-white text-slate-900 px-2.5 py-1 text-[11px] font-black">{currentScene.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold border backdrop-blur transition ${!isMuted ? "bg-white text-slate-900 border-white" : "bg-black/30 text-white border-white/20"}`}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? "🔇" : "🔊"}
                  </button>
                  <button
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold border backdrop-blur transition ${showCaptions ? "bg-white text-slate-900 border-white" : "bg-black/30 text-white border-white/20"}`}
                  >
                    CC
                  </button>
                  <span className="hidden sm:inline rounded-full bg-black/40 backdrop-blur border border-white/15 px-3 py-1.5 text-xs font-bold text-white">
                    {Math.floor(time).toString().padStart(2, "0")}:{(Math.round((time % 1) * 10) * 10).toString().padStart(2, "0").slice(0,2)} / 01:00
                  </span>
                </div>
              </div>

              {/* Captions */}
              {hasStarted && showCaptions && time < 60 && (
                <div className="absolute bottom-[56px] inset-x-0 flex justify-center px-3 sm:px-6 pointer-events-none">
                  <div className="bg-black/75 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 max-w-[640px] w-full text-center shadow-2xl">
                    <p className="text-[11px] font-black tracking-widest text-amber-300 leading-none">{currentScene.speaker.toUpperCase()}</p>
                    <p className="mt-1 text-[13px] sm:text-[14px] font-semibold leading-snug text-white">“{currentScene.narration}”</p>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3">
                {/* Progress */}
                <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden backdrop-blur">
                  <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={togglePlay} className="h-9 w-9 rounded-full bg-white text-slate-900 flex items-center justify-center font-black text-sm shadow hover:scale-105 transition">
                      {isPlaying ? "❚❚" : "▶"}
                    </button>
                    <button onClick={replay} className="hidden sm:inline-flex h-9 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white px-3 text-xs font-bold hover:bg-white/20">↺ Replay</button>
                    <span className="hidden lg:inline text-xs font-bold text-white/80 ml-1">
                      {isPlaying ? "Playing" : hasStarted ? "Paused" : "Ready"} • {currentScene.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline text-xs text-white/60 mr-1">Scenes:</span>
                    {SCENES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => seekTo(s.id)}
                        className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full text-[11px] font-black border transition ${
                          currentScene.id === s.id
                            ? "bg-white text-slate-900 border-white shadow"
                            : "bg-white/10 text-white border-white/15 backdrop-blur hover:bg-white/15"
                        }`}
                        aria-label={`Go to scene ${s.id}`}
                      >
                        {s.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scene strip */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SCENES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => seekTo(s.id)}
                  className={`rounded-2xl p-3 text-left border-2 transition text-white relative overflow-hidden ${
                    currentScene.id === s.id ? "border-white shadow-lg scale-[1.02]" : "border-white/10 bg-white/5 backdrop-blur hover:border-white/20"
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-${currentScene.id === s.id ? "100" : "60"}`} />
                  <div className="relative">
                    <div className="text-[10px] font-black tracking-widest text-white/90">SCENE {s.id}</div>
                    <div className="text-xs font-black leading-tight mt-0.5 line-clamp-2">{s.title}</div>
                    <div className="text-[11px] font-semibold text-white/70 mt-1">{s.duration}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Mobile action row */}
            <div className="mt-4 flex gap-2 xl:hidden">
              <Link href="/paint" className="flex-1 rounded-full bg-white text-slate-900 px-4 py-3 text-center text-sm font-black">🎨 Color Online</Link>
              <Link href="/coloring" className="flex-1 rounded-full bg-slate-900 text-white border border-white/10 px-4 py-3 text-center text-sm font-bold">📄 Coloring Book</Link>
            </div>
          </div>

          {/* Right rail */}
          <div className="col-span-12 xl:col-span-4 space-y-4">
            {/* Script */}
            <div className="rounded-[20px] bg-white text-slate-900 border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-[13px] tracking-widest">OFFICIAL SCRIPT • 60s</h3>
                <span className="rounded-full bg-amber-400 text-slate-900 px-2.5 py-1 text-[11px] font-black">PREMIERE</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-auto">
                {SCENES.map((s) => (
                  <div key={s.id} className={`p-4 flex gap-3 ${currentScene.id === s.id ? "bg-violet-50" : "bg-white"}`}>
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border ${currentScene.id === s.id ? "bg-violet-600 text-white border-violet-600" : "bg-slate-900 text-white border-slate-900"}`}>
                      {s.id}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-widest text-slate-900">{s.title}</span>
                        <span className="text-[11px] font-bold text-slate-500">{s.duration}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-600 leading-snug">{s.subtitle}</p>
                      <p className="mt-2 text-[13px] font-medium leading-snug text-slate-800">“{s.narration}”</p>
                      <p className="mt-1 text-[11px] font-bold text-violet-600">{s.speaker}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total runtime • 60 seconds</span>
                <button onClick={replay} className="rounded-full bg-slate-900 text-white px-3 py-1.5 text-xs font-bold">Play from start</button>
              </div>
            </div>

            {/* Characters */}
            <div className="rounded-[20px] bg-gradient-to-br from-slate-900 to-[#0b122e] border border-white/10 p-5 text-white">
              <h3 className="font-black text-sm tracking-wide flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> MEET THE RESCUE FRIENDS
              </h3>
              <p className="mt-1 text-xs text-white/60">Four brave vehicles — each with a big heart and a special colour.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {CHARACTERS.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-white text-slate-900 p-3 border border-slate-200">
                    <div className={`h-10 w-full rounded-xl ${c.color} border-2 border-white shadow flex items-center justify-center text-white font-black text-xs`}>
                      {c.name.toUpperCase()}
                    </div>
                    <div className="mt-2 text-xs font-black leading-none">{c.name}</div>
                    <div className="text-[11px] font-semibold text-slate-500">{c.role}</div>
                    <div className="mt-2 text-[11px] font-medium leading-snug text-slate-700 line-clamp-3">“{c.line}”</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-3 flex gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 border-2 border-white flex items-center justify-center text-lg flex-shrink-0">🦸</div>
                <div>
                  <div className="text-xs font-black">Captain Rainbow</div>
                  <div className="text-[11px] text-white/70">Leader of the Rescue Team • Brave, kind and full of ideas</div>
                </div>
              </div>
            </div>

            {/* What will we learn */}
            <div className="rounded-[20px] bg-white border border-slate-200 p-5 shadow-sm">
              <h3 className="font-black text-sm text-slate-900">What will we learn?</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { k: "Colours", d: "Red, blue, yellow, green", c: "from-red-500 to-orange-500" },
                  { k: "Songs", d: "Happy sing-alongs", c: "from-violet-500 to-fuchsia-500" },
                  { k: "Numbers", d: "Counting & shapes", c: "from-blue-500 to-cyan-500" },
                  { k: "Kindness", d: "Helping friends", c: "from-emerald-500 to-teal-500" },
                ].map((i) => (
                  <div key={i.k} className="rounded-2xl border border-slate-200 p-3 flex gap-2.5 items-start">
                    <span className={`h-8 w-8 rounded-xl bg-gradient-to-br ${i.c} flex-shrink-0`} />
                    <div>
                      <div className="text-xs font-black text-slate-900">{i.k}</div>
                      <div className="text-[11px] font-medium text-slate-500">{i.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-bold text-amber-900">🎯 Perfect for ages 2–6 • Play-based learning • No ads</p>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-[20px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-[1.5px]">
              <div className="rounded-[18px] bg-white p-5">
                <h3 className="font-black text-slate-900">Continue the adventure</h3>
                <p className="mt-1 text-xs text-slate-600">Print, colour and play with the Rainbow Rescue characters.</p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <Link href="/coloring" className="rounded-full bg-slate-900 text-white text-center py-2.5 text-sm font-black">Download Coloring Book • Free</Link>
                  <Link href="/paint" className="rounded-full bg-white border-2 border-slate-900 text-slate-900 text-center py-2.5 text-sm font-bold">Color Online in Browser</Link>
                  <Link href="/games" className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-center py-2.5 text-sm font-bold">Play 10 Free Games</Link>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span>Brought to you by</span>
                  <Image src="/learnzo-logo.png" alt="Learnzo" width={80} height={24} className="h-5 w-auto object-contain" />
                  <span className="hidden sm:inline">• Learn. Understand. Grow.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Learnzo brand bar */}
        <div className="mt-8 rounded-[20px] bg-white border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/learnzo-logo-full.png" alt="Learnzo" width={160} height={70} className="h-12 sm:h-14 w-auto object-contain" />
            <div className="hidden sm:block h-10 w-px bg-slate-200" />
            <div>
              <div className="text-sm font-black text-slate-900">LEARNZO — Learn. Understand. Grow.</div>
              <div className="text-xs text-slate-600">Rainbow Rescue Team is a Learnzo Original for early learners. Free printables, games and shows at learnzo.ai</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/about" className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-bold">About Learnzo</Link>
            <Link href="/kids" className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-900">Kids Zone</Link>
          </div>
        </div>

        {/* Poster download section */}
        <div className="mt-6 rounded-[24px] bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-[420px_1fr] gap-0">
            <div className="relative aspect-[3/4] md:aspect-[4/5] bg-slate-50 overflow-hidden">
              <Image src="/rainbow-rescue/poster.jpg" alt="Rainbow Rescue Team Poster" fill className="object-cover" />
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <a href="/rainbow-rescue/poster.jpg" download className="flex-1 rounded-full bg-white text-slate-900 px-4 py-2.5 text-center text-sm font-black shadow-lg flex items-center justify-center gap-2">
                  ⬇ Download Poster
                </a>
                <a href="/rainbow-rescue/poster.jpg" target="_blank" className="rounded-full bg-slate-900 text-white px-4 py-2.5 text-sm font-bold">View full</a>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <span className="inline-flex rounded-full bg-violet-600 text-white px-3 py-1 text-[11px] font-black tracking-widest">OFFICIAL POSTER • 4K • FREE</span>
              <h3 className="mt-3 text-2xl font-black text-slate-900 leading-tight">Take Rainbow Town home</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">Print the official Rainbow Rescue Team poster for your classroom, bedroom wall or play area. Featuring Captain Rainbow, Ruby, Officer Blue, Sunny and Greenie on the sparkling Rainbow Road.</p>
              
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-black text-slate-900">🖨️ Print ready</div>
                  <div className="text-xs text-slate-600 mt-1">A3 or A4 • 300 DPI • Bright colours</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-black text-slate-900">🎨 Colour guide</div>
                  <div className="text-xs text-slate-600 mt-1">Use with Learnzo coloring book</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-black text-slate-900">🏫 For classrooms</div>
                  <div className="text-xs text-slate-600 mt-1">Teachers welcome to print</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-black text-slate-900">💜 Free forever</div>
                  <div className="text-xs text-slate-600 mt-1">No signup, no watermark</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <a href="/rainbow-rescue/poster.jpg" download className="rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm font-black">Download poster JPG</a>
                <Link href="/coloring" className="rounded-full bg-white border-2 border-slate-900 text-slate-900 px-5 py-2.5 text-sm font-bold">Get Coloring Book PDF</Link>
              </div>
              <p className="mt-3 text-xs text-slate-500">Tip: Print on glossy photo paper for the most vibrant rainbow.</p>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-[1.5px]">
                <div className="rounded-[14px] bg-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image src="/learnzo-logo.png" alt="Learnzo" width={90} height={28} className="h-7 w-auto" />
                    <span className="text-xs font-bold text-slate-600">Learn. Understand. Grow.</span>
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-violet-600">LEARNZO ORIGINALS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">© {new Date().getFullYear()} Learnzo. Rainbow Rescue Team is an original Learnzo Kids production. All characters and stories are fictional and created for educational purposes.</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        * { font-family: 'Nunito', system-ui, sans-serif; }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes wiggle { 0%,100% { transform: rotate(-1deg); } 50% { transform: rotate(1deg); } }
        @keyframes dance { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-6px) rotate(1deg); } }
      `}</style>
    </div>
  );
}
