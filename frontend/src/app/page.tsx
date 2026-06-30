"use client";

import { useState } from "react";
import Navbar from "@/components/nav/Navbar";
import Hero from "@/components/hero/Hero";
import TrustStrip from "@/components/trust/TrustStrip";
import HowItWorks from "@/components/steps/HowItWorks";
import CredentialFlow from "@/components/flows/CredentialFlow";
import PayrollFlow from "@/components/flows/PayrollFlow";
import VotingFlow from "@/components/flows/VotingFlow";
import TechStack from "@/components/stack/TechStack";
import Footer from "@/components/footer/Footer";

interface Credential {
  nullifier: string;
  issuedAt: string;
}

export default function Home() {
  const [credential, setCredential] = useState<Credential | null>(null);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* 1. Nav */}
      <Navbar />

      {/* 2. Hero — Asymmetric split */}
      <Hero />

      {/* 3. Trust strip — logo rail */}
      <TrustStrip />

      {/* 4. How it works — vertical steps */}
      <HowItWorks />

      {/* 5. Flow 1: ZK Credentials — split panel */}
      <CredentialFlow onCredentialIssued={setCredential} />

      {/* 6. Flow 2: Private Payroll — full-width stacked */}
      <PayrollFlow credentialNullifier={credential?.nullifier ?? null} />

      {/* 7. Flow 3: DAO Voting — asymmetric grid */}
      <VotingFlow credentialNullifier={credential?.nullifier ?? null} />

      {/* 8. Tech Stack — gap-px fact grid */}
      <TechStack />

      {/* 9. Footer — 2-col */}
      <Footer />
    </div>
  );
}
