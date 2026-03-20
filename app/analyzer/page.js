import { Suspense } from "react";
import AnalyzerClient from "@/components/AnalyzerClient";

export default function AnalyzerPage() {
  return (
    <section className="page-section">
      <Suspense fallback={<div className="page-loading">Loading analyzer...</div>}>
        <AnalyzerClient />
      </Suspense>
    </section>
  );
}