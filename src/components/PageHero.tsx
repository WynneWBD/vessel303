interface PageHeroProps {
  label?: string;
  title: string;
  titleGold?: string;
  subtitle?: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export default function PageHero({ label, title, titleGold, subtitle, breadcrumb }: PageHeroProps) {
  return (
    <section className="relative pt-32 pb-20 bg-[#0a0a0a] overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none hero-grid opacity-60"
      />
      {/* Gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />

      {/* Corner accents */}
      <div className="absolute top-24 left-6 w-10 h-10 border-t border-l border-[#c9a84c]/25" />
      <div className="absolute top-24 right-6 w-10 h-10 border-t border-r border-[#c9a84c]/25" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        {breadcrumb && (
          <div className="flex items-center gap-2 mb-6 text-xs text-white/30 tracking-wider">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-[#c9a84c] transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-white/50">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {label && (
          <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-4 font-medium">
            {label}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
          <span className="text-white">{title}</span>
          {titleGold && (
            <>
              <br />
              <span className="text-gold-gradient">{titleGold}</span>
            </>
          )}
        </h1>

        {subtitle && (
          <p className="text-white/45 text-sm sm:text-base max-w-2xl leading-relaxed tracking-wide">
            {subtitle}
          </p>
        )}

        {/* Gold line */}
        <div className="mt-8 w-16 h-0.5 bg-gradient-to-r from-[#c9a84c] to-transparent" />
      </div>
    </section>
  );
}
