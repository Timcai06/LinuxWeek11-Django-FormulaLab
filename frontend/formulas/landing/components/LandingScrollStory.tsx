import { useRef } from "react";

import { ScrollDirector } from "./ScrollDirector";
import { StoryStage } from "./StoryStage";

export function LandingScrollStory() {
  const scrollProgressRef = useRef(0);

  return (
    <ScrollDirector scrollProgressRef={scrollProgressRef}>
      <StoryStage scrollProgressRef={scrollProgressRef} />
    </ScrollDirector>
  );
}
