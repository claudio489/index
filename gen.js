const fs=require("fs");const c=`
export interface Gas{fO2:number;fHe:number;name:string;mod?:number}
export interface DecoStop{depth:number;time:number;gas:Gas;gasName?:string}
export interface DiveTimelinePoint{time:number;depth:number;event:string;gas:string;gasName?:string;pO2?:number}
export type TimelineEntry=DiveTimelinePoint
export interface DivePlan{runTime:number;totalDecoTime:number;stops:DecoStop[];timeline:DiveTimelinePoint[];ceilings:number[];maxCeiling:number;tissues:number[];cnsTotal:number;otuTotal:number}
export interface DiveInput{depth:number;bottomTime:number;bottomGas:Gas;decoGases:Gas[];gfLow:number;gfHigh:number;descentRate:number;ascentRate:number}
const W=0.627,S=1.013
const Z=[[4,1.2599,0.505],[8,1,0.6514],[12.5,0.8618,0.7222],[18.5,0.7562,0.7825],[27,0.6667,0.8126],[38.3,0.5933,0.8434],[54.3,0.5282,0.8693],[77,0.4701,0.891],[109,0.4187,0.9092],[146,0.3798,0.9222],[187,0.3497,0.9319],[239,0.3223,0.9403],[305,0.2971,0.9477],[390,0.2737,0.9544],[498,0.2523,0.9602],[635,0.2327,0.9653]]
function a(d:number){return S+d/10}
function v(d:number,g:Gas,t:string="N2"){return(a(d)-W)*(t==="N2"?1-g.fO2-g.fHe:g.fHe)}
function h(p0:number,pa:number,ht:number,ti:number){if(ti<=0)return p0;const k=Math.LN2/ht;return pa+(p0-pa)*Math.exp(-k*ti)}
function sc(p0:number,ps:number,pe:number,ht:number,ti:number){if(ti<=0)return p0;const k=Math.LN2/ht,R=(pe-ps)/ti,et=Math.exp(-k*ti);return ps+(p0-ps)*et+R*(ti-(1-et)/k)}
function m(t:number[],gf:number){let mx=0;for(let i=0;i<16;i++){const[,aa,b]=Z[i] as [number,number,number];const p=(t[i]-aa*gf)/(gf/b+1-gf);if(p>mx)mx=p}return mx}
function pd(p:number){return Math.max(0,(p-S)*10)}
function gf_(cd:number,fs:number,gl:number,gh:number){if(cd<=0)return gh;if(cd>=fs)return gl;return gl+(gh-gl)*(1-cd/fs)}
function sg(d:number,dg:Gas[],cg:Gas){const ag=[...dg,cg].filter(g=>(g.mod??999)>=d&&g.fO2<=1);if(ag.length===0)return cg;ag.sort((a,b)=>b.fO2-a.fO2);return ag[0]!}
function pp(d:number,f:number){return(a(d))*f}
function cn(d:number,f:number,t:number){const p=pp(d,f);if(p<=0.5)return 0;const l=p>1.6?1:p>1.5?5:p>1.4?12:p>1.3?24:p>1.2?45:p>1.1?75:p>1.0?120:p>0.9?180:240;return(t/l)*100}
function ot(d:number,f:number,t:number){const p=pp(d,f);if(p<=0.5)return 0;return Math.pow(0.5/(p-0.5),-0.83)*t}
`;
const c2=`
export function calculateDivePlan(i:DiveInput):DivePlan{
const{depth:de,bottomTime:bt,bottomGas:bg,decoGases:dg,gfLow:gl,gfHigh:gh,descentRate:dr,ascentRate:ar}=i;
const tl:DiveTimelinePoint[]=[];let ct=0,ca=0,oa=0;
const ps=v(0,bg,"N2");const t:number[]=Z.map(()=>ps);
const b2:Gas={...bg,mod:bg.mod??Math.floor((1.4/bg.fO2-1)*10)};
const dst=de/dr,pds=v(0,b2,"N2"),pde=v(de,b2,"N2");
for(let i=0;i<16;i++){const[ht]=Z[i];t[i]=sc(t[i],pds,pde,ht,dst)}
ct+=dst;ca+=cn(de/2,b2.fO2,dst);oa+=ot(de/2,b2.fO2,dst);
tl.push({time:0,depth:0,event:"Start",gas:b2.name,gasName:b2.name,pO2:pp(0,b2.fO2)});
tl.push({time:Math.round(ct),depth:de,event:"Descent",gas:b2.name,gasName:b2.name,pO2:pp(de,b2.fO2)});
const pb=v(de,b2,"N2");
for(let i=0;i<16;i++){const[ht]=Z[i];t[i]=h(t[i],pb,ht,bt)}
ct+=bt;ca+=cn(de,b2.fO2,bt);oa+=ot(de,b2.fO2,bt);
tl.push({time:Math.round(ct),depth:de,event:"Bottom",gas:b2.name,gasName:b2.name,pO2:pp(de,b2.fO2)});
const s:DecoStop[]=[];const c:number[]=[];
const cl=m(t,gl/100);const fsd=Math.ceil(pd(cl)/3)*3;
if(fsd<=0){const at=de/ar;ct+=at;tl.push({time:Math.round(ct),depth:0,event:"Surface",gas:b2.name,gasName:b2.name,pO2:pp(0,b2.fO2)});return{runTime:Math.round(ct),totalDecoTime:0,stops:[],timeline:tl,ceilings:[0],maxCeiling:0,tissues:[...t],cnsTotal:Math.round(ca),otuTotal:Math.round(oa)}}
let wd=de,td=fsd,cg=b2,lsd=-1,sc=0;
while(td>0&&wd>0&&sc<50){sc++;const g=gf_(td,fsd,gl/100,gh/100);const cp=m(t,g);c.push(Math.round(pd(cp)));const nd=Math.max(0,td-3);const bg2=sg(td,dg,cg);if(bg2.name!==cg.name&&td<=(bg2.mod??999)&&lsd!==td){cg=bg2;lsd=td;tl.push({time:Math.round(ct),depth:td,event:"Gas to "+bg2.name,gas:bg2.name,gasName:bg2.name,pO2:pp(td,bg2.fO2)})}if(wd>td){const as=(wd-td)/ar,pas=v(wd,cg,"N2"),pae=v(td,cg,"N2");for(let i=0;i<16;i++){const[ht]=Z[i];t[i]=sc(t[i],pas,pae,ht,as)}ct+=as;wd=td;ca+=cn((wd+td)/2,cg.fO2,as);oa+=ot((wd+td)/2,cg.fO2,as)}const pas=v(td,cg,"N2");let st=0;const sti=[...t];const ic=m(sti,g),icd=pd(ic),tcd=nd;if(icd>tcd&&td>0){while(st<300){for(let i=0;i<16;i++){const[ht]=Z[i];sti[i]=h(sti[i],pas,ht,1)}st++;const cc=m(sti,g);if(pd(cc)<=tcd)break}if(st>0){s.push({depth:td,time:st,gas:{...cg},gasName:cg.name});tl.push({time:Math.round(ct+st),depth:td,event:td+"m x "+st+"min",gas:cg.name,gasName:cg.name,pO2:pp(td,cg.fO2)});for(let i=0;i<16;i++){const[ht]=Z[i];t[i]=h(t[i],pas,ht,st)}ct+=st;ca+=cn(td,cg.fO2,st);oa+=ot(td,cg.fO2,st)}}td=nd}if(wd>0){const ft=wd/ar;ct+=ft}tl.push({time:Math.round(ct),depth:0,event:"Surface",gas:cg.name,gasName:cg.name,pO2:pp(0,cg.fO2)});
const tdt=s.reduce((a,b)=>a+b.time,0);
return{runTime:Math.round(ct),totalDecoTime:tdt,stops:s,timeline:tl,ceilings:c,maxCeiling:fsd,tissues:[...t],cnsTotal:Math.round(ca),otuTotal:Math.round(oa)}}
export function calculateNo50Plan(input:DiveInput):DivePlan{return calculateDivePlan({...input,decoGases:[]})}
export function calculateNDL(d:number,g:Gas,gl:number=30,gh:number=70){let l=0,h=180;while(h-l>1){const m=(l+h)>>1;const p=calculateDivePlan({depth:d,bottomTime:m,bottomGas:g,decoGases:[],gfLow:gl,gfHigh:gh,descentRate:18,ascentRate:9});p.stops.length===0?(l=m):(h=m)}return l}
export{Z as ZHL16C_TISSUES}
`;fs.writeFileSync("src/lib/buhlmann.ts",c+c2,"utf-8");console.log("OK: buhlmann.ts written");
