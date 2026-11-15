import { useEffect, useRef } from "react";
import { usePreference } from "./preferences";

// The scrolling noise field bends and breaks the flame front as hot gas rises.
const fragment = `
precision mediump float;
uniform float time;
varying vec2 uv;
float hash(vec2 p){return fract(sin(mod(dot(p,vec2(17.1,41.7)),6.2831))*481.23);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
float field(vec2 p){
  return .55*noise(p)+.27*noise(p*2.12)+.13*noise(p*4.23)+.05*noise(p*8.51);
}
void main(){
  vec2 p=vec2(uv.x*8.-uv.y*1.8,uv.y*3.-time*.63);
  float warp=field(p+vec2(0.,-time*.18));
  float flame=field(p+vec2(2.5*warp,warp));
  float base=.75*exp(-pow((uv.x-.66-uv.y*.15)*3.4,2.));
  float heat=base-uv.y*.84+(flame-.53)*1.7;
  vec3 col=vec3(.026,.033,.041)+vec3(1.,.17,.012)*smoothstep(.06,.72,heat)
    +vec3(.36,.47,.065)*smoothstep(.48,.91,heat);
  gl_FragColor=vec4(col,1.);
}`;
export default function LiveFire() {
  const [motionPreference] = usePreference("ignis_motion", "system");
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { alpha: true, antialias: false });
    if (!canvas || !gl) return;
    const program = gl.createProgram();
    if (!program) return;
    const shaders = [ [gl.VERTEX_SHADER, "attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}"], [gl.FRAGMENT_SHADER,fragment] ] as const;
    for(const [type, source] of shaders){
      const shader=gl.createShader(type);
      if(!shader) continue;
      gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,"position");
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const time=gl.getUniformLocation(program,"time");
    const motion=matchMedia("(prefers-reduced-motion: reduce)");
    let frame=0, last=-100, visible=true;
    function draw(now:number){
      if(!gl || !canvas) return;
      if(now-last>=32 || motion.matches){
        const width=Math.max(1,Math.round(canvas.clientWidth*.55)), height=Math.max(1,Math.round(canvas.clientHeight*.55));
        if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;}
        gl.viewport(0,0,width,height);gl.uniform1f(time,(now/1000)%4096);gl.drawArrays(gl.TRIANGLES,0,3);last=now;
      }
      if(!motion.matches && motionPreference !== "reduced" && visible && !document.hidden) frame=requestAnimationFrame(draw);
    }
    function refresh(){cancelAnimationFrame(frame);if(visible && !document.hidden) frame=requestAnimationFrame(draw);}
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;refresh();});
    observer.observe(canvas);
    motion.addEventListener("change",refresh);document.addEventListener("visibilitychange",refresh);
    refresh();
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();motion.removeEventListener("change",refresh);document.removeEventListener("visibilitychange",refresh);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
  },[motionPreference]);
  return <canvas aria-hidden="true" className="live-fire" ref={ref}/>;
}
