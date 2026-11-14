"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import FabricCanvas from "@/components/fabric/FabricCanvas";
import Swatch from "@/components/Swatch";
import Wordmark from "@/components/Wordmark";
import { stageTint } from "@/lib/color";
import { MATERIALS, type MaterialId } from "@/lib/materials";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** The looks the hero cloth cycles through. */
const SHOWREEL: { id: MaterialId; swatch: number }[] = [
  { id: "velvet", swatch: 0 },
  { id: "silk", swatch: 4 },
  { id: "linen", swatch: 0 },
  { id: "satin", swatch: 2 },
  { id: "denim", swatch: 1 },
  { id: "wool", swatch: 3 },
  { id: "leather", swatch: 0 },
  { id: "cotton", swatch: 6 },
];

const STEPS = [
  {
    title: "Choose a material",
    body: "Eight fabrics, each with its own weave, weight and way of catching light. The cloth re-hangs itself to match.",
  },
  {
    title: "Dye it any colour",
    body: "Start from a range curated for that material, or dial in any shade. Each fabric remembers the colour you gave it.",
  },
  {
    title: "Turn it in the light",
    body: "Orbit and zoom the drape. See how matte cotton, glossy satin and deep velvet carry the very same hue differently.",
  },
];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState(0);
  const current = SHOWREEL[look];
  const material = MATERIALS.find((m) => m.id === current.id)!;
  const swatch = material.palette[current.swatch];

  useEffect(() => {
    const timer = window.setInterval(
      () => setLook((index) => (index + 1) % SHOWREEL.length),
      3600,
    );
    return () => window.clearInterval(timer);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .from("[data-hero-line]", { yPercent: 115, duration: 1.1, stagger: 0.1 })
          .from("[data-hero-fade]", { opacity: 0, y: 16, duration: 0.8, stagger: 0.08 }, "-=0.6")
          .from("[data-hero-stage]", { opacity: 0, scale: 0.96, duration: 1.2 }, 0.2);

        gsap.to("[data-marquee]", {
          xPercent: -50,
          duration: 28,
          ease: "none",
          repeat: -1,
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        gsap.from("[data-step]", {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: "[data-steps]", start: "top 80%" },
        });

        gsap.fromTo(
          "[data-cta-text]",
          { xPercent: 6 },
          {
            xPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-cta]",
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      gsap.fromTo(
        "[data-look]",
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
      );
    },
    { dependencies: [look], scope: root },
  );

  return (
    <div ref={root} className="overflow-x-clip">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 lg:px-10 lg:py-7">
        <Wordmark />
        <Link
          href="/studio"
          className="rounded-full border border-ink px-5 py-2 text-sm transition-colors hover:bg-ink hover:text-paper"
        >
          Open studio
        </Link>
      </header>

      {/* Hero */}
      <section
        className="relative grid min-h-dvh items-end gap-6 px-5 pb-10 pt-28 transition-colors duration-1000 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:px-10 lg:pb-16"
        style={{ background: stageTint(swatch.hex) }}
      >
        <div className="relative z-[1]">
          <p data-hero-fade className="eyebrow mb-5">
            Real-time fabric visualiser
          </p>
          <h1 className="font-display text-[clamp(3.2rem,9vw,8.5rem)] leading-[0.92] tracking-tight">
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block">
                See the cloth
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <span data-hero-line className="block italic">
                before it&rsquo;s cut.
              </span>
            </span>
          </h1>
          <p data-hero-fade className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Pick a material, give it a colour, and watch a draped length of it
            change in front of you — weave, sheen, fold and all.
          </p>
          <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/studio"
              className="rounded-full bg-ink px-7 py-3.5 text-paper transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start designing
            </Link>
            <a href="#materials" className="text-sm underline underline-offset-4">
              Browse the materials
            </a>
          </div>
        </div>

        <div
          data-hero-stage
          className="relative order-first h-[46dvh] min-h-[320px] lg:order-none lg:h-[82dvh]"
        >
          <FabricCanvas materialId={current.id} color={swatch.hex} interactive={false} />
          <div className="absolute bottom-0 right-0 overflow-hidden text-right">
            <p data-look className="text-sm">
              <span className="font-display text-2xl">{material.name}</span>
              <span className="ml-2 text-muted">in {swatch.name}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-line py-5" aria-hidden="true">
        <div data-marquee className="flex w-max font-display text-4xl lg:text-5xl">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {MATERIALS.map((m, index) => (
                <span key={m.id} className={`px-6 ${index % 2 ? "italic text-muted" : ""}`}>
                  {m.name} <span className="pl-10 text-muted">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Materials */}
      <section id="materials" className="px-5 py-20 lg:px-10 lg:py-32">
        <div data-reveal className="mb-12 flex flex-wrap items-end justify-between gap-6 lg:mb-16">
          <h2 className="font-display text-5xl leading-none tracking-tight lg:text-7xl">
            Eight materials,
            <br />
            <span className="italic">endless colour.</span>
          </h2>
          <p className="max-w-sm text-muted">
            Every surface is generated thread by thread, so each fabric reacts
            to light the way the real thing does. Choose one to open it in the
            studio.
          </p>
        </div>

        <ul className="border-t border-line">
          {MATERIALS.map((m, index) => (
            <li key={m.id} data-reveal className="border-b border-line">
              <Link
                href={`/studio?m=${m.id}`}
                className="group grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 py-6 transition-[padding] duration-500 hover:px-3 lg:grid-cols-[3rem_14rem_1fr_auto_7rem] lg:gap-x-8"
              >
                <span className="eyebrow hidden lg:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Swatch
                  material={m}
                  color={m.palette[0].hex}
                  zoom={1.4}
                  className="row-span-2 h-20 w-20 rounded-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3 lg:order-last lg:row-span-1 lg:h-24 lg:w-28"
                />
                <h3 className="font-display text-4xl leading-none lg:text-5xl">{m.name}</h3>
                <p className="col-start-2 max-w-xl text-sm leading-relaxed text-muted lg:col-start-auto">
                  <span className="text-ink">{m.tagline}.</span> {m.description}
                </p>
                <span className="col-span-2 flex gap-1.5 lg:col-span-1">
                  {m.palette.map((p) => (
                    <span
                      key={p.hex}
                      title={p.name}
                      className="h-4 w-4 rounded-full border border-line"
                      style={{ background: p.hex }}
                    />
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="bg-ink px-5 py-20 text-paper lg:px-10 lg:py-32">
        <p className="eyebrow mb-10 !text-paper/60">How it works</p>
        <ol data-steps className="grid gap-12 lg:grid-cols-3 lg:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} data-step className="border-t border-paper/25 pt-6">
              <span className="font-display text-6xl italic text-paper/40">{index + 1}</span>
              <h3 className="mt-4 font-display text-3xl">{step.title}</h3>
              <p className="mt-3 max-w-sm leading-relaxed text-paper/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Call to action */}
      <section data-cta className="overflow-hidden px-5 py-24 text-center lg:py-36">
        <p
          data-cta-text
          className="whitespace-nowrap font-display text-[clamp(4rem,16vw,15rem)] leading-none tracking-tight"
        >
          Your cloth, <span className="italic">your colour.</span>
        </p>
        <Link
          href="/studio"
          className="mt-12 inline-block rounded-full bg-ink px-9 py-4 text-lg text-paper transition-transform duration-300 hover:-translate-y-0.5"
        >
          Open the studio
        </Link>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-6 text-sm text-muted lg:px-10">
        <Wordmark />
        <span>Built with Next.js, Three.js, GSAP and chroma.js</span>
      </footer>
    </div>
  );
}
