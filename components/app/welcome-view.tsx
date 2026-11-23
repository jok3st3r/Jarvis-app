'use client';
/* eslint-disable prettier/prettier -- Tailwind class order isn't checked here */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const SKILLS = ['Calendar', 'Bills & reserve', 'Dispatch jobs', 'Reminders', 'Notion memory'];

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
    <div className="relative mb-8 flex size-24 items-center justify-center">
      <span className="bg-primary/15 absolute inset-0 animate-ping rounded-full [animation-duration:3s]" />
      <span className="border-primary/40 absolute inset-0 rounded-full border" />
      <span className="border-primary/25 absolute inset-2 rounded-full border" />
      <span className="bg-card text-primary relative flex size-16 items-center justify-center rounded-full font-display text-3xl font-semibold shadow-[0_8px_30px_rgba(120,85,50,0.18)]">
        J
      </span>
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
      <section className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <Monogram />

        <p className="text-primary font-mono text-[11px] font-bold tracking-[0.3em] uppercase">
          Jarvis &middot; Personal assistant
        </p>

        <h1 className="text-foreground mt-4 font-display text-4xl leading-tight font-medium tracking-tight md:text-5xl">
          {greeting}, Eli.
        </h1>

        <p className="text-muted-foreground mt-3 max-w-md text-base leading-7 text-pretty">
          Your schedule, money, jobs and notes in one place. Just talk.
        </p>

        <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
          {SKILLS.map((skill) => (
            <span
              key={skill}
              className="border-border bg-card/70 text-foreground/80 rounded-full border px-3 py-1 text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>

        <Button
          size="lg"
          onClick={onStartCall}
          className="mt-10 h-12 w-64 rounded-full font-mono text-xs font-bold tracking-wider uppercase shadow-[0_10px_30px_rgba(120,85,50,0.25)]"
        >
          {startButtonText}
        </Button>
      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center px-6">
        <p className="text-muted-foreground max-w-prose text-center text-xs leading-5 text-pretty">
          Loud room? Start with &ldquo;Jarvis&rdquo; or hold to talk. Say &ldquo;bye Jarvis&rdquo;
          to hang up.
        </p>
      </div>
    </div>
  );
};
