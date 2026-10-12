import { useState, useEffect } from "react";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  // Signature motion: subtle scroll-triggered reveal for hero ingredient
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Respect reduced motion preference
  const useReducedMotion = typeof window !== "undefined" && 
                           window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (useReducedMotion) {
    return <LandingStatic />;
  }

  return (
    <>
      {/* Hero with signature gradient band */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle gradient accent bar */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${
            useReducedMotion ? "" : "from-[#FF6B35] via-[#84CEEB] to-[#FF6B35]"
          } transition-all duration-700 ease-out ${
            scrollY > 0 ? "-translate-y-full" : "opacity-0 scale-x-125"
          }`} 
          aria-hidden="true"
        />
        
        {/* Hero content */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-serif text-[#1F2937] mb-6 leading-tight">
            Cook something new.
            <br />
            <span className="text-[#FF6B35]">Every day.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#6B7280] max-w-xl mb-8 leading-relaxed">
            A recipe companion that grows with your kitchen. Discover dishes, 
            plan meals, and build habits that make cooking feel effortless—not like another chore.
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#recipes"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#e55a2b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2"
            >
              Browse recipes
            </a>
            
            <a 
              href="#how-it-works"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#1F2937] font-medium rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F2937] focus:ring-offset-2"
            >
              How it works
            </a>
          </div>
        </div>

        {/* Subtle floating ingredient animation - signature element */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <div 
            className={`transition-transform duration-5000 ease-out ${
              scrollY > 100 ? "translate-x-20 scale-90 opacity-60" : ""
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 200 200" width="320" height="320">
              <defs>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#84CEEB", stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: "#FF6B35", stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              {/* Abstract leaf shape */}
              <path d="M100,20 C140,20 160,50 150,90 C140,130 100,150 70,140 C40,130 30,90 40,50 C50,10 80,-10 100,20Z" 
                    fill="url(#leafGrad)" opacity="0.6"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="recipes" className="bg-[#FFFDF5]">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <article className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <span className="text-xl" aria-hidden="true">📖</span>
              </div>
              <h2 className="text-2xl font-serif text-[#1F2937]">Curated recipes</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Hand-selected dishes from home cooks around the world. From weeknight dinners to special occasions, find inspiration that matches your skill level and dietary needs.
              </p>
            </article>

            {/* Feature 2 */}
            <article className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <span className="text-xl" aria-hidden="true">🥕</span>
              </div>
              <h2 className="text-2xl font-serif text-[#1F2937]">Ingredient-focused</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Build meals around what's in your fridge. Smart suggestions help you use leftovers and plan for the week ahead without waste.
              </p>
            </article>

            {/* Feature 3 */}
            <article className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <span className="text-xl" aria-hidden="true">⏱️</span>
              </div>
              <h2 className="text-2xl font-serif text-[#1F2937]">Time-smart cooking</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Prep lists, timer controls, and step-by-step guidance keep you in the flow. Cooking becomes a conversation with your food, not a race against the clock.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-serif text-[#1F2937] mb-6 leading-tight">
              "This app changed how I think about cooking. I used to avoid the kitchen entirely, now it's my favorite place to be."
            </blockquote>
            <cite className="text-[#6B7280] not-italic">— Anna K., verified home cook</cite>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1F2937] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-serif mb-4">Start cooking something new today</h2>
            <p className="text-[#9CA3AF] mb-8 leading-relaxed">
              Join thousands of home cooks discovering their confidence in the kitchen, one recipe at a time.
            </p>
            <a 
              href="#download"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#e55a2b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 focus:ring-offset-[#1F2937]"
            >
              Get the app
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB]">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-sm text-[#6B7280]">
            <a href="#" className="hover:text-[#FF6B35] transition-colors">Recipes</a>
            <a href="#" className="hover:text-[#FF6B35] transition-colors">About</a>
            <a href="#" className="hover:text-[#FF6B35] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#FF6B35] transition-colors">Contact</a>
          </nav>
          <p className="text-center text-xs text-[#9CA3AF] mt-4">
            © {new Date().getFullYear()} Recipe-LLM. Built with care for home cooks everywhere.
          </p>
        </div>
      </footer>
    </>
  );
}

// Static fallback for accessibility
function LandingStatic() {
  return (
    <>
      <section className="relative bg-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-serif text-[#1F2937] mb-6 leading-tight">
            Cook something new.
            <br />
            <span className="text-[#FF6B35]">Every day.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#6B7280] max-w-xl mb-8 leading-relaxed">
            A recipe companion that grows with your kitchen. Discover dishes, 
            plan meals, and build habits that make cooking feel effortless—not like another chore.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#recipes"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#e55a2b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2"
            >
              Browse recipes
            </a>
            <a 
              href="#how-it-works"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#1F2937] font-medium rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F2937] focus:ring-offset-2"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <section id="recipes" className="bg-[#FFFDF5]">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <span className="text-xl" aria-hidden="true">📖</span>
              </div>
              <h2 className="text-2xl font-serif text-[#1F2937]">Curated recipes</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Hand-selected dishes from home cooks around the world. From weeknight dinners to special occasions, find inspiration that matches your skill level and dietary needs.
              </p>
            </article>

            <article className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <span className="text-xl" aria-hidden="true">🥕</span>
              </div>
              <h2 className="text-2xl font-serif text-[#1F2937]">Ingredient-focused</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Build meals around what's in your fridge. Smart suggestions help you use leftovers and plan for the week ahead without waste.
              </p>
            </article>

            <article className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                <span className="text-xl" aria-hidden="true">⏱️</span>
              </div>
              <h2 className="text-2xl font-serif text-[#1F2937]">Time-smart cooking</h2>
              <p className="text-[#6B7280] leading-relaxed">
                Prep lists, timer controls, and step-by-step guidance keep you in the flow. Cooking becomes a conversation with your food, not a race against the clock.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-serif text-[#1F2937] mb-6 leading-tight">
              "This app changed how I think about cooking. I used to avoid the kitchen entirely, now it's my favorite place to be."
            </blockquote>
            <cite className="text-[#6B7280] not-italic">— Anna K., verified home cook</cite>
          </div>
        </div>
      </section>

      <section className="bg-[#1F2937] text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-serif mb-4">Start cooking something new today</h2>
            <p className="text-[#9CA3AF] mb-8 leading-relaxed">
              Join thousands of home cooks discovering their confidence in the kitchen, one recipe at a time.
            </p>
            <a 
              href="#download"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#e55a2b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 focus:ring-offset-[#1F2937]"
            >
              Get the app
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-[#E5E7EB]">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-sm text-[#6B7280]">
            <a href="#" className="hover:text-[#FF6B35] transition-colors">Recipes</a>
            <a href="#" className="hover:text-[#FF6B35] transition-colors">About</a>
            <a href="#" className="hover:text-[#FF6B35] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#FF6B35] transition-colors">Contact</a>
          </nav>
          <p className="text-center text-xs text-[#9CA3AF] mt-4">
            © {new Date().getFullYear()} Recipe-LLM. Built with care for home cooks everywhere.
          </p>
        </div>
      </footer>
    </>
  );
}