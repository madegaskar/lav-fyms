/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, RefreshCw, Zap, Star, ChevronRight, User, Info, Loader2 } from "lucide-react";
import { UserData, ScanResult, Gender } from "./types";
import { analyzeFace } from "./lib/gemini";
import { generatePortrait } from "./lib/canvas";

import { godImages } from "./lib/godImages";
import lavLogo from "./assets/LAV Logo.png";

const pantheon = [
  { name: "Zeus", title: "Raja Para Dewa", desc: "Penguasa langit, petir, dan hukum.", row: 0, col: 0, faceScale: 2.4, faceY: 12 },
  { name: "Hera", title: "Ratu Para Dewa", desc: "Dewi pernikahan, wanita, dan keluarga.", row: 0, col: 1, faceScale: 2.4, faceY: 12 },
  { name: "Poseidon", title: "Dewa Laut", desc: "Dewa laut, gempa bumi, dan kuda.", row: 0, col: 2, faceScale: 2.3, faceY: 10 },
  { name: "Demeter", title: "Dewi Pertanian", desc: "Panen dan kesuburan tanah.", row: 0, col: 3, faceScale: 2.4, faceY: 12 },
  { name: "Athena", title: "Dewi Kebijaksanaan", desc: "Strategi perang dan kerajinan tangan.", row: 0, col: 4, faceScale: 2.1, faceY: 8 },
  { name: "Apollon", title: "Dewa Seni & Cahaya", desc: "Seni, musik, ramalan, dan cahaya.", row: 0, col: 5, faceScale: 2.4, faceY: 12 },
  { name: "Artemis", title: "Dewi Perburuan", desc: "Perburuan, alam liar, dan bulan.", row: 1, col: 0, faceScale: 2.4, faceY: 12 },
  { name: "Ares", title: "Dewa Perang", desc: "Keberanian, peperangan, dan kemarahan.", row: 1, col: 1, faceScale: 2.2, faceY: 10 },
  { name: "Aphrodite", title: "Dewi Cinta", desc: "Kecantikan, gairah, dan keinginan.", row: 1, col: 2, faceScale: 2.4, faceY: 12 },
  { name: "Hephaestus", title: "Dewa Pandai Besi", desc: "Api, pertukangan, dan kerajinan.", row: 1, col: 3, faceScale: 2.4, faceY: 10 },
  { name: "Hermes", title: "Dewa Pembawa Pesan", desc: "Perdagangan, penjelajah, dan pencuri.", row: 1, col: 4, faceScale: 2.1, faceY: 8 },
  { name: "Dionysus", title: "Dewa Anggur", desc: "Anggur, pesta, teater, dan kesenangan.", row: 1, col: 5, faceScale: 2.4, faceY: 12 },
  { name: "Hades", title: "Dewa Dunia Bawah", desc: "Penguasa dunia orang mati dan kekayaan.", row: 2, col: 1, faceScale: 2.4, faceY: 10 },
  { name: "Hestia", title: "Dewi Perapian", desc: "Rumah tangga, keluarga, dan ketertiban.", row: 2, col: 2, faceScale: 2.4, faceY: 12 },
  { name: "Persephone", title: "Ratu Dunia Bawah", desc: "Dewi musim semi dan pembawa kehidupan.", row: 2, col: 3, faceScale: 2.4, faceY: 12 },
  { name: "Eros", title: "Dewa Cinta", desc: "Cinta, gairah, dan dorongan seksual.", row: 2, col: 4, faceScale: 2.4, faceY: 12 },
  { name: "Nike", title: "Dewi Kemenangan", desc: "Keberhasilan dan kemenangan.", row: 2, col: 5, faceScale: 2.4, faceY: 12 },
];

export default function App() {
  const [step, setStep] = useState<"bio" | "analyzing" | "result">("bio");
  const [userData, setUserData] = useState<UserData>({ nama: "", umur: "", gender: Gender.MALE });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraActive && !streamRef.current) {
      const setup = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
          setIsCameraActive(false);
        }
      };
      setup();
    }

    return () => {
      if (!isCameraActive && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive]);

  const startCamera = () => {
    setIsCameraActive(true);
  };

  const doScan = async () => {
    if (!videoRef.current || !userData.nama || !userData.umur) return;
    
    // Capturing frame
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg");
    setCapturedPhoto(imageBase64);
    
    // Show overlay
    setIsAnalyzing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 50);

    try {
      const godResult = await analyzeFace(imageBase64, userData.gender);
      const scanResult: ScanResult = {
        user: userData,
        god: godResult,
        photoUrl: imageBase64,
        matchPercentage: Math.floor(Math.random() * (99 - 85 + 1)) + 85
      };
      
      // Wait for progress to finish if AI was faster
      while (progress < 100) {
        await new Promise(r => setTimeout(r, 100));
      }

      setResult(scanResult);
      setStep("result");

      // Close camera on success
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      setIsAnalyzing(false);
      setScanProgress(0);
    } catch (err: any) {
      setError(err?.message || "Gagal menganalisis wajah. Silakan coba lagi.");
      setIsAnalyzing(false);
      setScanProgress(0);
    }
  };

  const downloadCard = async () => {
    if (!result) return;
    const matched = pantheon.find(g => g.name.toLowerCase() === result.god.godName.toLowerCase()) || pantheon[0];
    const dataUrl = await generatePortrait(result, matched);
    const link = document.createElement("a");
    link.download = `LAV_Oracle_${result.user.nama.replace(/\s+/g, '_')}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const reset = () => {
    setStep("bio");
    setResult(null);
    setError(null);
    setIsCameraActive(false);
    setUserData({ nama: "", umur: "", gender: Gender.MALE });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="bg-animation-container">
        <div className="god-rays"></div>
        <div className="orb w-[400px] h-[400px] bg-gold/10 -top-[10%] -left-[10%]" />
        <div className="orb w-[500px] h-[500px] bg-accent/10 -bottom-[15%] -right-[10%] [animation-duration:18s] [animation-delay:-5s]" />
        <div className="orb w-[300px] h-[300px] bg-gold/5 top-[40%] left-[60%] [animation-duration:15s] [animation-delay:-2s]" />
      </div>

      <div className="container mx-auto max-w-[900px] px-6 pb-20 relative z-10">
        {/* Header */}
        <header className="text-center pt-8 pb-6 border-b border-gold/30 mb-8">
          <img src={lavLogo} alt="LAV Logo" className="h-8 mx-auto mb-4 object-contain brightness-110" />
          
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="h-px bg-gradient-to-r from-transparent to-gold w-24 opacity-50" />
            <div className="text-gold text-sm">⚡</div>
            <div className="h-px bg-gradient-to-l from-transparent to-gold w-24 opacity-50" />
          </div>

          <h1 className="font-gow text-3xl md:text-4xl text-cream tracking-widest uppercase mb-1 drop-shadow-md">
            FIND YOUR <span className="text-gold">MYTHIC</span> SOUL
          </h1>
          <p className="text-text-muted text-[10px] tracking-[0.3em] uppercase font-mono mt-3">
            Discover your divine archetype through facial analysis
          </p>
        </header>

        <AnimatePresence mode="wait">
          {step === "bio" && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-7"
            >
              {/* Bio Section */}
              <section className="bg-dark-mid/60 border border-gold/20 rounded-sm p-8 backdrop-blur-md relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-gold before:to-transparent">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 border border-gold text-gold text-[10px] font-mono flex items-center justify-center">I</div>
                  <h2 className="font-display font-semibold text-xs tracking-[0.3em] uppercase text-gold">Biodata Diri</h2>
                  <div className="flex-1 h-px bg-gold/30" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 flex flex-col gap-2">
                    <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Nama Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama lengkap..."
                      value={userData.nama}
                      onChange={e => setUserData({...userData, nama: e.target.value})}
                      className="bg-dark/80 border border-gold/25 text-cream p-3 font-serif focus:border-gold outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Umur</label>
                    <input 
                      type="number" 
                      placeholder="Usia"
                      value={userData.umur}
                      onChange={e => setUserData({...userData, umur: e.target.value})}
                      className="bg-dark/80 border border-gold/25 text-cream p-3 font-serif focus:border-gold outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] text-text-muted tracking-widest uppercase">Gender</label>
                    <select 
                      value={userData.gender}
                      onChange={e => setUserData({...userData, gender: e.target.value as Gender})}
                      className="bg-dark/80 border border-gold/25 text-cream p-3 font-serif focus:border-gold outline-none transition-colors appearance-none"
                    >
                      <option value={Gender.MALE}>Pria</option>
                      <option value={Gender.FEMALE}>Wanita</option>
                      <option value={Gender.OTHER}>Lainnya</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Camera Section */}
              <section className="bg-dark-mid/60 border border-gold/20 rounded-sm p-8 backdrop-blur-md relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-gold before:to-transparent">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 border border-gold text-gold text-[10px] font-mono flex items-center justify-center">II</div>
                  <h2 className="font-display font-semibold text-xs tracking-[0.3em] uppercase text-gold">Kamera & Scan Wajah</h2>
                  <div className="flex-1 h-px bg-gold/30" />
                </div>

                <div className="aspect-[4/3] bg-black border border-gold/20 relative overflow-hidden rounded-sm mb-6 flex items-center justify-center">
                  {!isCameraActive ? (
                    <div className="flex flex-col items-center gap-4 text-text-muted">
                      <div className="w-16 h-16 rounded-full border-2 border-gold/30 flex items-center justify-center">
                        <Camera size={30} className="opacity-40" />
                      </div>
                      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-center px-4">
                        Kamera Belum Aktif
                      </span>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}
                  
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold/70" />
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold/70" />
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold/70" />
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold/70" />
                      <div className="face-guide" />
                      <div className="scan-line" />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-sm mb-6 flex items-start gap-3 backdrop-blur-sm">
                    <div className="text-red-400 mt-1">⚠️</div>
                    <div className="text-sm font-mono tracking-wide leading-relaxed">
                      {error}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={startCamera}
                    disabled={isCameraActive}
                    className="flex-1 min-w-[200px] border border-gold/40 text-gold font-display text-[11px] font-bold tracking-[0.3em] uppercase py-3 px-5 transition-all hover:bg-gold/10 disabled:opacity-40"
                  >
                    ⊕ {isCameraActive ? "KAMERA AKTIF" : "Aktifkan Kamera"}
                  </button>
                  <button 
                    onClick={doScan}
                    disabled={!isCameraActive || !userData.nama || !userData.umur}
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-gold-dark to-gold text-dark font-display text-[11px] font-black tracking-[0.3em] uppercase py-3 px-5 transition-all hover:brightness-110 active:translate-y-px disabled:opacity-40"
                  >
                    ⚡ Scan Wajah
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-7 w-full"
            >
              <section className="bg-dark-mid/60 border border-gold/20 rounded-sm p-8 backdrop-blur-md relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-gold before:to-transparent">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-6 h-6 border border-gold text-gold text-[10px] font-mono flex items-center justify-center">III</div>
                  <h2 className="font-display font-semibold text-xs tracking-[0.3em] uppercase text-gold">Hasil Penyelarasan Bintang</h2>
                  <div className="flex-1 h-px bg-gold/30" />
                </div>

                {/* God Hero Section */}
                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-10 items-start mb-10">
                  <div className="relative mx-auto md:mx-0">
                    <div className="w-[240px] h-[320px] border-2 border-gold bg-dark overflow-hidden relative group shadow-[0_0_40px_rgba(201,168,76,0.15)]">
                      <img 
                        src={result.photoUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                        alt="Scanned Face" 
                      />
                      <div className="absolute inset-0 bg-gold/10 mix-blend-overlay" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gold text-dark font-mono text-[10px] font-bold py-1.5 px-4 whitespace-nowrap tracking-widest border border-dark-mid shadow-lg">
                      PRESENTASE KEMIRIPAN {result.matchPercentage}%
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                  <div className="text-center flex flex-col items-center">
                    {(() => {
                      const matched = pantheon.find(g => g.name.toLowerCase() === result.god.godName.toLowerCase()) || pantheon[0];
                      return (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gold/40 mb-4 shadow-[0_0_20px_rgba(201,168,76,0.2)]">
                          <img 
                            src={godImages[matched.name]}
                            alt={matched.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      <h2 className="font-gow text-4xl text-gold uppercase leading-none tracking-wider drop-shadow-sm">{result.god.godName}</h2>
                      <p className="font-mono text-[11px] text-text-muted tracking-[0.25em] uppercase border-b border-gold/20 pb-4">{result.god.title}</p>
                    </div>
                  </div>

                    <div className="flex flex-wrap gap-2">
                      {result.god.traits.map((t, i) => (
                        <div key={i} className="border border-gold/30 px-3 py-1 font-mono text-[9px] text-gold-light tracking-widest uppercase bg-gold/5">
                          ✦ {t}
                        </div>
                      ))}
                    </div>

                    <p className="text-cream text-[15px] leading-relaxed italic border-l-2 border-gold/40 pl-6 py-2 opacity-90">
                      {result.god.description}
                    </p>
                  </div>
                </div>

                {/* Ornament Divider */}
                <div className="flex items-center justify-center gap-4 my-10">
                  <div className="h-px bg-gradient-to-r from-transparent to-gold/40 flex-1" />
                  <div className="text-gold text-xs">◆</div>
                  <div className="h-px bg-gradient-to-l from-transparent to-gold/40 flex-1" />
                </div>

                {/* Info Blocks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-dark/40 border border-gold/15 p-6 hover:border-gold/30 transition-colors">
                    <h4 className="font-display text-[11px] font-bold tracking-[0.3em] text-gold uppercase mb-4 flex items-center gap-2">
                      <Star size={10} /> Karakter & Kepribadian
                    </h4>
                    <p className="text-cream text-sm leading-relaxed italic opacity-80 font-light">
                      Analisis biometrik Anda menunjukkan resonansi energetik dengan {result.god.godName}. Sifat alami Anda mencerminkan perpaduan magis antara intuisi dan otoritas yang bersumber langsung dari Olympus.
                    </p>
                  </div>
                  <div className="bg-dark/40 border border-gold/15 p-6 hover:border-gold/30 transition-colors">
                    <h4 className="font-display text-[11px] font-bold tracking-[0.3em] text-gold uppercase mb-4 flex items-center gap-2">
                      <Star size={10} /> Rekomendasi Karir
                    </h4>
                    <ul className="space-y-3">
                      {result.god.careers.map((c, i) => (
                        <li key={i} className="text-cream text-sm flex items-center gap-3 italic font-light group">
                          <span className="text-gold group-hover:scale-125 transition-transform">◆</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-gold/20 space-y-4">
                  <button 
                    onClick={downloadCard}
                    className="w-full bg-gradient-to-r from-accent via-gold-dark to-gold text-dark font-display text-sm font-black tracking-[0.4em] uppercase py-5 shadow-[0_12px_40px_rgba(201,168,76,0.3)] hover:scale-[1.01] transition-all active:scale-100 group overflow-hidden relative"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Unduh Kartu Ramalan <Star size={14} className="animate-pulse" />
                    </span>
                  </button>
                  <button 
                    onClick={reset}
                    className="w-full border border-gold/30 text-gold/60 font-display text-[10px] font-bold tracking-[0.4em] uppercase py-4 hover:bg-gold/5 hover:text-gold transition-all"
                  >
                    System Reset ⚡
                  </button>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery Section */}
        <div className="mt-20 pt-16 border-t border-gold/20 relative z-10 transition-all duration-1000">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent to-gold/50 w-20" />
              <div className="w-4 h-4 border border-gold rotate-45" />
              <div className="h-px bg-gradient-to-l from-transparent to-gold/50 w-20" />
            </div>
            <h3 className="font-display text-2xl font-black text-gold uppercase tracking-widest">Pantheon Yunani</h3>
            <p className="text-text-muted text-xs font-mono tracking-widest mt-3 uppercase">Kenali Dewa & Dewi Dalam Dirimu</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
            {pantheon.map((god) => (
              <div key={god.name} className="border border-gold/15 bg-dark/40 p-5 flex flex-col items-center text-center group hover:bg-gold/5 transition-colors duration-500 hover:border-gold/40">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-gold/30 mb-4 shadow-[0_0_15px_rgba(201,168,76,0.05)] group-hover:border-gold/80 transition-colors duration-500 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] flex items-center justify-center">
                  <img 
                    src={godImages[god.name]}
                    alt={god.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-display font-bold text-[15px] text-cream tracking-wider uppercase mb-1">{god.name}</h4>
                <p className="font-mono text-[9px] text-gold tracking-[0.2em] uppercase mb-3 px-2 py-0.5 border-b border-gold/20">{god.title}</p>
                <p className="text-text-muted text-[11px] font-sans mt-auto leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{god.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/95 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="max-w-xs w-full text-center space-y-10">
              <p className="font-mono text-[10px] text-text-muted tracking-[0.4em] uppercase">Analisis Wajah Berjalan</p>
              
              <div className="relative aspect-square w-64 mx-auto flex items-center justify-center">
                {/* Rings */}
                <div className="absolute inset-0 border-2 border-transparent border-t-gold rounded-full animate-spin" />
                <div className="absolute inset-4 border-2 border-transparent border-r-gold rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse] opacity-60" />
                <div className="absolute inset-8 border-2 border-transparent border-t-gold rounded-full animate-spin [animation-duration:2s] opacity-30" />
                
                {result ? (
                  <img src={result.photoUrl} alt="Preview" className="w-[120px] h-[120px] rounded-full object-cover border-2 border-gold/40" />
                ) : (
                  <div className="w-[140px] h-[140px] rounded-full bg-dark/80 border-2 border-gold/30 flex items-center justify-center overflow-hidden relative group shadow-[0_0_30px_rgba(201,168,76,0.3)]">
                    {capturedPhoto && (
                      <img src={capturedPhoto} alt="Captured" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity" />
                    )}
                    {Array.from({ length: 18 }).map((_, i) => {
                      const angle = (i / 18) * Math.PI * 2;
                      // Map 18 items over our 17 pantheon gods (looping Eros/Nike or just modulo correctly)
                      // The index maps to row/col but now we can just map directly to a pantheon god for accurate framing
                      const pantheonGod = pantheon[i % pantheon.length];
                      const bgPosX = (pantheonGod.col / 5) * 100;
                      const bgPosY = (pantheonGod.row / 2) * 100;
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ 
                            opacity: 0, 
                            x: Math.cos(angle) * 80, 
                            y: Math.sin(angle) * 80,
                            scale: 0.2 
                          }}
                          animate={{ 
                            opacity: [0, 1, 0], 
                            x: [Math.cos(angle) * 80, 0], 
                            y: [Math.sin(angle) * 80, 0],
                            scale: [0.2, 1.2, 0] 
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            delay: i * (1.5 / 18), // Stagger effect
                            ease: "easeInOut" 
                          }}
                          className="absolute w-12 h-12 rounded-full overflow-hidden border border-gold/40 shadow-[0_0_10px_rgba(201,168,76,0.5)] flex items-center justify-center"
                        >
                          <img 
                            src={godImages[pantheonGod.name]}
                            alt={pantheonGod.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      );
                    })}
                    
                    {/* Center glow effect where they merge */}
                    <div className="absolute w-10 h-10 rounded-full bg-gold/40 blur-xl animate-pulse [animation-duration:1s]" />

                    {/* Inner Rotating Ring */}
                    <div className="absolute inset-0 border-t-2 border-gold/20 rounded-full animate-spin [animation-duration:3s]" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="h-0.5 bg-gold/20 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    className="h-full bg-gold" 
                  />
                </div>
                <p className="font-mono text-[11px] text-gold tracking-[0.3em] uppercase animate-pulse">
                  {scanProgress < 50 ? "Mendeteksi Geometri Wajah..." : "Menyelaraskan Tarian Bintang..."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
