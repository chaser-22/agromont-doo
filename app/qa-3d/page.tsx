import type { Metadata } from "next";
import { SupplyChainExperience } from "@/components/supply-chain-experience";

export const metadata: Metadata = {
  title: "AGROMONT 3D QA",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default function Qa3DPage() {
  return (
    <main className="qa-3d-shell">
      <SupplyChainExperience qaMode />
    </main>
  );
}
