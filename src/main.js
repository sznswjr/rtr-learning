import { renderHomeNav } from "./app/home-nav.js?v=20260628-4";
import { initPipelineLab } from "./labs/chapter-2/pipeline.js?v=20260628-4";
import { initAntiAliasingLab } from "./labs/chapter-5/anti-aliasing.js?v=20260628-4";
import { initDisplayEncodingLab } from "./labs/chapter-5/display-encoding.js?v=20260628-4";
import { initLightAttenuationLab } from "./labs/chapter-5/light-attenuation.js?v=20260628-4";
import { initSamplingPatternsLab } from "./labs/chapter-5/sampling-patterns.js?v=20260628-4";
import { initShadingFrequencyLab } from "./labs/chapter-5/shading-frequency.js?v=20260628-4";
import { initShadingModelsLab } from "./labs/chapter-5/shading-models.js?v=20260628-4";
import { initTransparencyCompositingLab } from "./labs/chapter-5/transparency-compositing.js?v=20260628-4";

function init() {
  renderHomeNav();
  initPipelineLab();
  initShadingModelsLab();
  initLightAttenuationLab();
  initShadingFrequencyLab();
  initAntiAliasingLab();
  initSamplingPatternsLab();
  initTransparencyCompositingLab();
  initDisplayEncodingLab();
}

init();
