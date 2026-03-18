import { Suspense } from "react";
import AnalyzerClient from "@/components/AnalyzerClient";

export default function AnalyzerPage() {
  return (
    <div className="container">
      <Suspense fallback={<div>Loading analyzer...</div>}>
        <AnalyzerClient />
      </Suspense>
    </div>
  );
}
