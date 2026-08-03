import { createPostprocessPass } from "../../render/postprocess.js?v=20260803-6";
import { resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-6";

const fragmentSource = `#version 300 es
precision highp float;
uniform float uBands; uniform float uOutline; uniform float uHatch; uniform float uLight; uniform int uMode;
in vec2 vUv; out vec4 outColor;
void main(){
  vec2 p=(vUv*2.0-1.0)*vec2(1.62,1.0); vec3 color=mix(vec3(0.025,0.032,0.035),vec3(0.10,0.13,0.14),vUv.y);
  vec2 centers[3]=vec2[3](vec2(-0.93,0.02),vec2(0.0,0.05),vec2(0.93,0.0));
  vec3 bases[3]=vec3[3](vec3(0.11,0.76,0.62),vec3(0.94,0.43,0.14),vec3(0.30,0.42,0.95));
  float best=10.0; vec3 normal=vec3(0); vec3 base=vec3(0); float mask=0.0;
  for(int i=0;i<3;i++){ vec2 q=(p-centers[i])/vec2(0.55,0.67); float r=dot(q,q); if(r<1.0 && r<best){best=r; normal=normalize(vec3(q,sqrt(max(1.0-r,0.0)))); base=bases[i]; mask=1.0;} }
  float floorLine=1.0-smoothstep(0.0,0.018,abs(p.y+0.72)); color+=floorLine*vec3(0.12,0.25,0.23);
  if(mask>0.0){
    vec3 light=normalize(vec3(sin(radians(uLight)),0.75,0.65)); float diffuse=max(dot(normal,light),0.0); float quant=floor(diffuse*uBands)/(uBands-1.0);
    vec3 toon=base*(0.20+quant*0.95); float rim=pow(1.0-max(normal.z,0.0),3.0); toon+=rim*base*0.25;
    float edge=smoothstep(0.02*uOutline,0.11*uOutline,1.0-best); edge=1.0-edge;
    vec2 frag=gl_FragCoord.xy; float lineA=step(0.67,sin((frag.x+frag.y)*0.055*uHatch)+0.72); float lineB=step(0.72,sin((frag.x-frag.y)*0.047*uHatch)+0.78);
    float dark=1.0-smoothstep(0.15,0.62,diffuse); float hatch=clamp((lineA+lineB)*dark,0.0,1.0);
    if(uMode==1) color=toon;
    else if(uMode==2) color=mix(vec3(0.92),vec3(0.03),edge);
    else if(uMode==3) color=mix(vec3(0.91,0.87,0.73),vec3(0.09,0.12,0.12),hatch);
    else color=mix(toon*mix(1.0,0.38,hatch*0.55),vec3(0.015),edge);
  }
  outColor=vec4(pow(max(color,vec3(0)),vec3(1.0/2.2)),1.0);
}`;
const state={bands:4,hatch:72,light:24,mode:"combined",outline:85};
const ui={bands:document.querySelector("#stylizedBands"),bandsValue:document.querySelector("#stylizedBandsValue"),bandMetric:document.querySelector("#stylizedBandMetric"),canvas:document.querySelector("#stylizedCanvas"),hatch:document.querySelector("#stylizedHatch"),hatchValue:document.querySelector("#stylizedHatchValue"),layer:document.querySelector("#stylizedLayer"),light:document.querySelector("#stylizedLight"),lightValue:document.querySelector("#stylizedLightValue"),mode:document.querySelector("#stylizedMode"),outline:document.querySelector("#stylizedOutline"),outlineValue:document.querySelector("#stylizedOutlineValue"),section:document.querySelector("#stylized-rendering"),strip:[...document.querySelectorAll(".stylized-layer-strip [data-layer]")]};
class Renderer{constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext("webgl2",{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!this.gl)throw new Error("当前浏览器不支持 WebGL2。");this.pass=createPostprocessPass(this.gl,fragmentSource);this.loc={bands:this.gl.getUniformLocation(this.pass.program,"uBands"),hatch:this.gl.getUniformLocation(this.pass.program,"uHatch"),light:this.gl.getUniformLocation(this.pass.program,"uLight"),mode:this.gl.getUniformLocation(this.pass.program,"uMode"),outline:this.gl.getUniformLocation(this.pass.program,"uOutline")};}render(s){const gl=this.gl,{width,height}=resizeCanvasToDisplaySize(this.canvas);this.pass.draw({configure:()=>{gl.uniform1f(this.loc.bands,s.bands);gl.uniform1f(this.loc.hatch,s.hatch/10);gl.uniform1f(this.loc.light,s.light);gl.uniform1f(this.loc.outline,s.outline/100);gl.uniform1i(this.loc.mode,{combined:0,toon:1,outline:2,hatch:3}[s.mode]);},width,height});}}
function fail(message){ui.section?.classList.add("is-unavailable");const p=document.createElement("p");p.className="webgl-fallback";p.textContent=`风格化实验无法启动：${message}`;ui.canvas?.closest(".viewport-panel")?.prepend(p);}
export function initStylizedRenderingLab(){if(!ui.canvas||!ui.mode)return;let renderer;try{renderer=new Renderer(ui.canvas);}catch(error){fail(error.message);return;}let frame=0;const render=()=>{frame=0;renderer.render(state);const names={combined:"完整风格",toon:"卡通色阶",outline:"轮廓",hatch:"排线"};ui.bandsValue.value=`${state.bands} 级`;ui.outlineValue.value=`${(state.outline/100).toFixed(2)}×`;ui.hatchValue.value=`${state.hatch} lpi`;ui.lightValue.value=`${state.light}°`;ui.layer.textContent=names[state.mode];ui.bandMetric.textContent=state.bands;ui.strip.forEach(x=>x.classList.toggle("is-active",state.mode==="combined"||x.dataset.layer===state.mode));};const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};[[ui.mode,"change","mode",String],[ui.bands,"input","bands",Number],[ui.outline,"input","outline",Number],[ui.hatch,"input","hatch",Number],[ui.light,"input","light",Number]].forEach(([e,n,k,c])=>e.addEventListener(n,()=>{state[k]=c(e.value);schedule();}));addEventListener("resize",schedule);render();}
