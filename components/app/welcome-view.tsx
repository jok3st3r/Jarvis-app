'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const SKILLS = ['Calendar', 'Bills & reserve', 'Dispatch jobs', 'Reminders', 'Notion memory'];

// Tailwind classes for the welcome screen, kept together so the look is easy to tweak.
const CLS = {
  ring: 'relative mb-8 flex size-24 items-center justify-center',
  ping: 'bg-primary/15 absolute inset-0 animate-ping rounded-full [animation-duration:3s]',
  outer: 'border-primary/40 absolute inset-0 rounded-full border',
  inner: 'border-primary/25 absolute inset-2 rounded-full border',
  letter:
    'bg-card text-primary font-display relative flex size-16 items-center justify-center rounded-full text-3xl font-semibold shadow-[0_8px_30px_rgba(120,85,50,0.18)]',
  section: 'flex min-h-svh flex-col items-center justify-center px-6 text-center',
  eyebrow: 'text-primary font-mono text-[11px] font-bold tracking-[0.3em] uppercase',
  title:
    'text-foreground font-display mt-4 text-4xl leading-tight font-medium tracking-tight md:text-5xl',
  subtitle: 'text-muted-foreground mt-3 max-w-md text-base leading-7 text-pretty',
  chips: 'mt-6 flex max-w-md flex-wrap justify-center gap-2',
  chip: 'border-border bg-card/70 text-foreground/80 rounded-full border px-3 py-1 text-xs font-medium',
  start:
    'mt-10 h-12 w-64 rounded-full font-mono text-xs font-bold tracking-wider uppercase shadow-[0_10px_30px_rgba(120,85,50,0.25)]',
  footer: 'fixed bottom-5 left-0 flex w-full items-center justify-center px-6',
  footerText: 'text-muted-foreground max-w-prose text-center text-xs leading-5 text-pretty',
};

function greetingFor(hour: number) {
  if (hour < 5) {
    return 'Up late';
  }
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function Monogram() {
  return (
    <div className={CLS.ring}>
      <span className={CLS.ping} />
      <span className={CLS.outer} />
      <span className={CLS.inner} />
      <span className={CLS.letter}>J</span>
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <div ref={ref}>
      <section className={CLS.section}>
        <Monogram />
        <p className={CLS.eyebrow}>Jarvis &middot; Personal assistant</p>
        <h1 className={CLS.title}>{greeting}, Eli.</h1>
        <p className={CLS.subtitle}>
          Your schedule, money, jobs and notes in one place. Just talk.
        </p>
        <div className={CLS.chips}>
          {SKILLS.map((skill) => (
            <span key={skill} className={CLS.chip}>
              {skill}
            </span>
          ))}
        </div>
        <Button size="lg" onClick={onStartCall} className={CLS.start}>
          {startButtonText}
        </Button>
      </section>

      <div className={CLS.footer}>
        <p className={CLS.footerText}>
          Loud room? Start with &ldquo;Jarvis&rdquo; or hold to talk. Say &ldquo;bye Jarvis&rdquo;
          to hang up.
        </p>
      </div>
    </div>
  );
};
