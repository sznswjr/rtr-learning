import { createGpuTimer } from "../../render/gpu-query.js?v=20260803-9";
import { createPostprocessPass } from "../../render/postprocess.js?v=20260803-9";
import { resizeCanvasToDisplaySize } from "../../render/webgl.js?v=20260803-9";

const fragmentSource = `#version 300 es
precision highp float;
uniform vec4 uTimes; uniform float uWork; uniform float uOverdraw; uniform int uStage;
in vec2 vUv; out vec4 outColor;
float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return 1.0-smoothstep(0.0,0.012,max(d.x,d.y));}
void main(){
  vec2 uv=vUv; vec3 color=mix(vec3(0.025,0.035,0.038),vec3(0.075,0.10,0.105),uv.y);
  vec2 grid=abs(fract(uv*vec2(16.0,9.0))-0.5); color+=step(0.488,max(grid.x,grid.y))*0.025;
  if(uv.y>0.48){
    for(int i=0;i<4;i++){float x=0.14+float(i)*0.24;float t=uTimes[i];float fill=box(vec2(uv.x-x,(uv.y-0.52)-t*0.22),vec2(0.068,t*0.22));
      vec3 c=i==0?vec3(0.27,0.72,0.64):i==1?vec3(0.25,0.52,0.88):i==2?vec3(0.96,0.48,0.18):vec3(0.76,0.50,0.92);
      color=mix(color,c,fill*(i==uStage?1.0:0.62));
      float cap=box(vec2(uv.x-x,uv.y-(0.52+t*0.44)),vec2(0.082,0.006));color=mix(color,vec3(0.96,0.85,0.52),cap*(i==uStage?1.0:0.0));
    }
  }else{
    vec2 p=(uv-vec2(0.5,0.23))*vec2(2.3,4.0); float acc=0.0; vec2 z=p;
    for(int i=0;i<16;i++){if(float(i)>=uWork)break;z=abs(z)/max(dot(z,z),0.18)-vec2(0.72,0.58);acc+=exp(-5.0*abs(dot(z,z)-0.42));}
    float layers=0.45+0.55*sin((p.x+p.y)*18.0*uOverdraw);vec3 heat=mix(vec3(0.04,0.33,0.30),vec3(1.0,0.32,0.08),clamp(acc/5.0+layers*0.22,0.0,1.0));
    color=mix(color,heat,smoothstep(0.02,0.9,acc)*0.72);
  }
  outColor=vec4(pow(max(color,vec3(0)),vec3(1.0/2.2)),1.0);
}`;

const state={draws:620,triangles:780,fragments:10,overdraw:18,preset:"balanced"};
const ui={canvas:document.querySelector("#bottleneckCanvas"),draws:document.querySelector("#bottleneckDraws"),drawsValue:document.querySelector("#bottleneckDrawsValue"),fps:document.querySelector("#bottleneckFps"),fragment:document.querySelector("#bottleneckFragments"),fragmentValue:document.querySelector("#bottleneckFragmentsValue"),frame:document.querySelector("#bottleneckFrame"),overdraw:document.querySelector("#bottleneckOverdraw"),overdrawValue:document.querySelector("#bottleneckOverdrawValue"),preset:document.querySelector("#bottleneckPreset"),section:document.querySelector("#gpu-bottleneck"),stage:document.querySelector("#bottleneckStage"),strip:[...document.querySelectorAll(".bottleneck-stage-strip [data-stage]")],timer:document.querySelector("#bottleneckTimer"),triangles:document.querySelector("#bottleneckTriangles"),trianglesValue:document.querySelector("#bottleneckTrianglesValue")};
const stages=["application","geometry","fragment","bandwidth"],stageNames={application:"应用 / 提交",geometry:"几何",fragment:"片元",bandwidth:"带宽 / 合并"};
function model(){const o=state.overdraw/10;const times=[0.45+state.draws/330,0.55+state.triangles/360,0.65+state.fragments*o*0.24,0.45+o*1.35];const max=Math.max(...times),stage=times.indexOf(max),frame=max+0.8;return{frame,stage,times:times.map(x=>x/Math.max(8,max))};}
class Renderer{constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext("webgl2",{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!this.gl)throw new Error("当前浏览器不支持 WebGL2。");this.pass=createPostprocessPass(this.gl,fragmentSource);this.timer=createGpuTimer(this.gl);this.loc={overdraw:this.gl.getUniformLocation(this.pass.program,"uOverdraw"),stage:this.gl.getUniformLocation(this.pass.program,"uStage"),times:this.gl.getUniformLocation(this.pass.program,"uTimes"),work:this.gl.getUniformLocation(this.pass.program,"uWork")};}render(s,m){const gl=this.gl,{width,height}=resizeCanvasToDisplaySize(this.canvas);const old=this.timer.poll();this.timer.begin("diagnostic");this.pass.draw({configure:()=>{gl.uniform4fv(this.loc.times,m.times);gl.uniform1f(this.loc.work,Math.min(16,s.fragments/2));gl.uniform1f(this.loc.overdraw,s.overdraw/10);gl.uniform1i(this.loc.stage,m.stage);},width,height});this.timer.end();return old;}}
function fail(message){ui.section?.classList.add("is-unavailable");const p=document.createElement("p");p.className="webgl-fallback";p.textContent=`瓶颈诊断实验无法启动：${message}`;ui.canvas?.closest(".viewport-panel")?.prepend(p);}
function syncInputs(){ui.draws.value=state.draws;ui.triangles.value=state.triangles;ui.fragment.value=state.fragments;ui.overdraw.value=state.overdraw;}
export function initGpuBottleneckLab(){if(!ui.canvas||!ui.preset)return;let renderer;try{renderer=new Renderer(ui.canvas);}catch(error){fail(error.message);return;}let frame=0,polls=0;const render=()=>{frame=0;const m=model(),result=renderer.render(state,m);ui.drawsValue.value=state.draws.toLocaleString("zh-CN");ui.trianglesValue.value=`${(state.triangles/1000).toFixed(2)} M`;ui.fragmentValue.value=`${state.fragments} 次`;ui.overdrawValue.value=`${(state.overdraw/10).toFixed(1)}×`;ui.stage.textContent=stageNames[stages[m.stage]];ui.frame.textContent=`${m.frame.toFixed(1)} ms`;ui.fps.textContent=Math.round(1000/m.frame);ui.timer.textContent=result?.milliseconds!=null?`${result.milliseconds.toFixed(2)} ms`:renderer.timer.available?"EXT 可用":"CPU 模型";ui.strip.forEach(x=>x.classList.toggle("is-active",x.dataset.stage===stages[m.stage]));if(renderer.timer.available&&polls++<2)setTimeout(schedule,40);};const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};ui.preset.addEventListener("change",()=>{state.preset=ui.preset.value;const p={balanced:[620,780,10,18],submission:[2100,480,6,13],geometry:[420,2200,7,14],fragment:[360,620,30,44],bandwidth:[520,760,8,58]}[state.preset];[state.draws,state.triangles,state.fragments,state.overdraw]=p;syncInputs();polls=0;schedule();});[[ui.draws,"draws"],[ui.triangles,"triangles"],[ui.fragment,"fragments"],[ui.overdraw,"overdraw"]].forEach(([e,k])=>e.addEventListener("input",()=>{state[k]=Number(e.value);ui.preset.value="balanced";polls=0;schedule();}));addEventListener("resize",schedule);render();}
