"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
const word = "TASKFLOW";
const sideImages = [
  {
    src: "/images/hero1.png",
    alt: "TaskFlow Interface 1",
    position: "left",
    span: 1,
  },
  {
    src: "/images/hero2.png",
    alt: "TaskFlow Interface 2",
    position: "left",
    span: 1,
  },
  {
    src: "/images/hero3.png",
    alt: "TaskFlow Interface 3",
    position: "right",
    span: 1,
  },
  {
    src: "/images/hero4.png",
    alt: "TaskFlow Interface 4",
    position: "right",
    span: 1,
  },
];
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 2;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const textOpacity = Math.max(0, 1 - (scrollProgress / 0.2));
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));
  const centerWidth = 100 - (imageProgress * 58); 
  const centerHeight = 100 - (imageProgress * 30); 
  const sideWidth = imageProgress * 22; 
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + (imageProgress * 100); 
  const sideTranslateRight = 100 - (imageProgress * 100); 
  const borderRadius = imageProgress * 24; 
  const gap = imageProgress * 16; 
  const sideTranslateY = 0; 
  return (
    <section ref={sectionRef} className="relative bg-background overflow-x-clip">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          <div 
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ 
              gap: `${gap}px`, 
              padding: `${imageProgress * 16}px`, 
              paddingTop: `${imageProgress * 140}px`, 
              paddingBottom: `${imageProgress * 40}px` 
            }}
          >
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "left").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div 
              className="relative overflow-hidden will-change-transform bg-background border border-border shadow-2xl shadow-primary/5"
              style={{
                width: `${centerWidth}%`,
                height: `${centerHeight}%`,
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
                style={{
                  opacity: isHovered ? 1 : 0,
                  maskImage: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, black 40%, transparent 100%)`,
                  WebkitMaskImage: `radial-gradient(circle 200px at ${mousePos.x}px ${mousePos.y}px, black 40%, transparent 100%)`,
                }}
              >
                <Image
                  src="/images/tech-task-center.png"
                  alt="TaskFlow UI Preview"
                  fill
                  className="object-cover object-top opacity-30"
                  priority
                />
              </div>
              <div 
                className="absolute inset-0 flex items-end overflow-hidden pointer-events-none"
                style={{ opacity: textOpacity }}
              >
                <h1 className="w-full text-[17vw] font-medium leading-[0.8] tracking-tighter text-foreground drop-shadow-sm">
                  {word.split("").map((letter, index) => (
                    <span
                      key={index}
                      className="inline-block animate-[slideUp_0.8s_ease-out_forwards] opacity-0"
                      style={{
                        animationDelay: `${index * 0.08}s`,
                        transition: 'all 1.5s',
                        transitionTimingFunction: 'cubic-bezier(0.86, 0, 0.07, 1)',
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </h1>
              </div>
            </div>
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "right").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-[200vh]" />
      <div className="relative z-10 bg-background px-6 pt-32 pb-28 md:pt-48 md:px-12 md:pb-36 lg:px-20 lg:pt-56 lg:pb-44">
        <p className="mx-auto max-w-2xl text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          Assign tasks, track progress,
          <br />
          and reward your team.
        </p>
      </div>
    </section>
  );
}
