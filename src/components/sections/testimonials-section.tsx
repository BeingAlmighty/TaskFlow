"use client";
import Image from "next/image";
export function TestimonialsSection() {
  return (
    <section id="about" className="bg-background">
      <div className="px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40">
        <p className="mx-auto max-w-5xl text-2xl leading-relaxed text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          TaskFlow combines role-based efficiency with gamified leaderboards — 
          designed for modern teams who refuse to compromise on transparency, quality, or performance.
        </p>
      </div>
      <div className="relative aspect-[32/9] w-full">
        <Image
          src="/images/tech-task-center.png"
          alt="Task Management Center"
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
    </section>
  );
}
