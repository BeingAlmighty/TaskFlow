"use client";
const specs = [
  { label: "Engine", value: "Next.js" },
  { label: "Data", value: "Prisma" },
  { label: "Security", value: "JWT Auth" },
  { label: "Speed", value: "Edge Network" },
];
export function EditorialSection() {
  return (
    <section className="bg-background">
      <div className="flex items-center justify-center gap-6 pb-20">
      </div>
      <div className="grid grid-cols-2 border-t border-border md:grid-cols-4">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="border-b border-r border-border p-8 text-center last:border-r-0 md:border-b-0"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              {spec.label}
            </p>
            <p className="font-medium text-foreground text-2xl md:text-3xl whitespace-nowrap">
              {spec.value}
            </p>
          </div>
        ))}
      </div>
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src="/video/video.mp4"
        />
      </div>
    </section>
  );
}
