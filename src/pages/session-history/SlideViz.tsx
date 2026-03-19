import React from "react";
import { BarChartViz } from "@/components/visualizations/BarChartViz";
import { WordCloudViz } from "@/components/visualizations/WordCloudViz";
import { ResponseFeed } from "@/components/visualizations/ResponseFeed";
import type { Tables } from "@/integrations/supabase/types";

type SlideRow = Tables<"slides">;
type ResponseRow = Tables<"responses">;

export function SlideViz({ activeSlide, slideResponses, options, responsesLoading }: Readonly<{
  activeSlide: SlideRow | undefined;
  slideResponses: ResponseRow[];
  options: string[];
  responsesLoading: boolean;
}>) {
  let vizContent: React.ReactNode;

  if (responsesLoading) {
    vizContent = (
      <div className="p-8">
        <div className="h-48 w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  } else if (activeSlide) {
    const responseBody = slideResponses.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-white/40 text-sm">No responses for this slide</p>
      </div>
    ) : (
      <>
        {activeSlide.type === "multiple_choice" && <BarChartViz options={options} responses={slideResponses} />}
        {activeSlide.type === "word_cloud" && <WordCloudViz responses={slideResponses} />}
        {activeSlide.type === "open_text" && <ResponseFeed responses={slideResponses} />}
      </>
    );
    vizContent = (
      <>
        <div className="p-6 border-b border-white/5">
          <p className="text-lg font-semibold text-white">{activeSlide.question || "Untitled question"}</p>
          <p className="text-xs text-white/40 mt-1">
            {slideResponses.length} response{slideResponses.length === 1 ? "" : "s"} · {activeSlide.type.replaceAll("_", " ")}
          </p>
        </div>
        <div className="p-6">{responseBody}</div>
      </>
    );
  } else {
    vizContent = (
      <div className="flex items-center justify-center py-16 text-white/30 text-sm">
        Select a slide to view results
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 overflow-hidden">
      {vizContent}
    </div>
  );
}
