import { chromium } from '../../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
const out = 'C:/IGNIS_AI/artifacts/ux-review';
await fs.mkdir(out,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page = await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const results=[];const checks=[];
async function capture(name){await page.screenshot({path:`${out}/${name}.png`,fullPage:true});results.push({name,...await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1,h2')].map(e=>e.textContent),alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent),selects:[...document.querySelectorAll('select')].map(e=>({label:e.closest('label')?.textContent.trim(),width:e.getBoundingClientRect().width,scroll:e.scrollWidth,options:e.options.length})),smallTargets:[...document.querySelectorAll('button,summary,a,input[type=checkbox]')].filter(e=>{let r=e.getBoundingClientRect();return r.width&&r.height&&r.height<24}).map(e=>({text:e.textContent||e.getAttribute('aria-label'),height:e.getBoundingClientRect().height})).slice(0,20)}))});}
await page.route('**/ai/**',r=>r.fulfill({status:503,json:{detail:'Database unavailable'}}));
for(const route of process.env.UX_FOLLOWUP ? [] : ['experiments','analytics','settings','mission-advisor']){await page.goto(`http://127.0.0.1:5174/${route}`);await page.waitForTimeout(600);if(route==='mission-advisor'){await page.getByRole('button',{name:'Rank research',exact:true}).click();await page.waitForTimeout(300);}await capture(`offline-${route}`);}
await page.unroute('**/ai/**');
const experiments=Array.from({length:16},(_,i)=>({experiment_code:`ZARM-${144+i}`,investigation_title:'Flame spread in microgravity under varied atmospheric conditions',investigation_code:'ZARM-FLARE',fuel_material:'Cotton fabric',gravity_condition:'microgravity',oxygen_percent:21+i,pressure_pa:101325,airflow_m_s:i/10,experiment_date:'2026-01-01',completeness_score:0.95}));
let count=16,failCompare=false;
await page.route('**/ai/**',async r=>{const u=new URL(r.request().url());let json={};switch(u.pathname){
case '/ai/health':json={status:'ok',text_model:'test',vision_model:'test',embedding_model:'test'};break;
case '/ai/mission/health':json={status:'ok',investigations_in_db:1};break;
case '/ai/data/experiments':{let offset=Number(u.searchParams.get('offset')||0),limit=Number(u.searchParams.get('limit')||100);json={total:16,offset,limit,experiments:experiments.slice(offset,offset+limit)};break;}
case '/ai/data/facets':json={investigations:[{code:'ZARM-FLARE',title:experiments[0].investigation_title}],fuel_material:['Cotton fabric'],gravity_condition:['microgravity']};break;
case '/ai/data/stats':json={totals:{experiments:16,measurements:81,sources:2,verified_sources:2},investigations:[{code:'ZARM-FLARE',title:experiments[0].investigation_title,experiment_count:16,measurement_count:81}]};break;
case '/ai/data/variables':json={variables:[{variable_name:'flame_spread_rate',unit:'mm/s',experiment_count:16,observation_count:81},{variable_name:'temperature',unit:'K',experiment_count:16,observation_count:16}]};break;
case '/ai/data/documents':json=[{filename:'Flame_Spread_Microgravity_Research_Report.pdf',file_type:'pdf',passages:24,source_url:null,verification_status:'verified'}];break;
case '/ai/data/compare':if(failCompare)return r.fulfill({status:503,json:{detail:'Comparison unavailable'}});json={measurements:Array.from({length:count},(_,i)=>({experiment_code:`ZARM-${144+i%3}`,value:1+i*0.12,unit:'mm/s',uncertainty:0.1,oxygen_percent:21+i,pressure_pa:101325+i*100,airflow_m_s:i/10,timestamp_s:i,filename:'measurements.csv',source_row:i+1,verification_status:'verified'}))};break;
case '/ai/mission/analyze':json={scenario:{environment:'pressurized_lunar_rover',oxygen_percent:32},weights:{oxygen:40,pressure:30,fuel:30},ranked_nasa_investigations:[{investigation_title:'Flame Extinguishment in Microgravity',investigation_code:'FLEX',experiment_code:null,investigation_url:null,ranking_score:81,evidence_coverage_percent:67,experiment_conditions:{oxygen_percent:32,pressure_psi:12.2},score_dimensions:{oxygen:0.9,pressure:0.8,fuel:null},source_file_count:3,reviewed_source_count:2,limitations:['Fuel match is not established.']}],related_external_research:[],warnings:[],result_status:'ok'};break;
case '/ai/ask-hybrid':return r.fulfill({status:503,json:{detail:'Inference unavailable'}});
case '/ai/inference/test':json={ok:false,checks:{chat:{ok:false,message:'Provider unreachable'}}};break;
case '/ai/vision/search':json={results:[{filename:'flame.png',description:'A spherical flame around the sample.',verification_status:'unverified',experiment_code:'ZARM-144'}]};break;
case '/ai/data/experiments/ZARM-144':json={experiment:experiments[0],measurements:[]};break;
default:return r.fulfill({status:503,json:{detail:'Not configured in review'}});
}await r.fulfill({json});});
for(const width of process.env.UX_FOLLOWUP ? [] : [1440,390]){await page.setViewportSize({width,height:1000});for(const route of ['','experiments','analytics','assistant','media','media/library','mission-advisor','investigations','sources','settings']){await page.goto(`http://127.0.0.1:5174/${route}`);await page.waitForTimeout(400);await capture(`${width}-${route.replaceAll('/','-')||'dashboard'}`);}}
if(!process.env.UX_FOLLOWUP){
await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5174/analytics');await page.getByRole('checkbox').first().check();await page.getByRole('button',{name:'Compare measurements',exact:true}).click();await page.locator('.plot').waitFor();await capture('chart-bars-16');await page.getByLabel('Horizontal axis').selectOption('oxygen_percent');await capture('chart-scatter');await page.locator('.recharts-scatter-symbol').first().hover();await capture('chart-tooltip');
await page.setViewportSize({width:390,height:844});await capture('chart-mobile');
await page.setViewportSize({width:1440,height:1000});count=81;await page.getByRole('button',{name:'Compare measurements',exact:true}).click();await page.waitForTimeout(300);await capture('chart-81');
count=4;await page.getByRole('button',{name:'Compare measurements',exact:true}).click();await page.waitForTimeout(300);await page.getByLabel('Horizontal axis').selectOption('experiment');await capture('chart-bars-4');
failCompare=true;await page.getByRole('button',{name:'Compare measurements',exact:true}).click();await page.waitForTimeout(300);await capture('chart-error');
}
await page.goto('http://127.0.0.1:5174/assistant');await page.getByLabel('Research question').fill('What evidence is available?');await page.getByRole('button',{name:'Send question'}).click();await page.waitForTimeout(300);await capture('assistant-error');
await page.goto('http://127.0.0.1:5174/settings');await page.getByRole('button',{name:'Test inference connection'}).click();await page.waitForTimeout(300);await capture('inference-failed-check');
await page.goto('http://127.0.0.1:5174/mission-advisor');await page.getByLabel(/^Environment/).focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');checks.push({name:'native dropdown keyboard',value:await page.getByLabel(/^Environment/).inputValue()});await page.getByRole('button',{name:'Rank research',exact:true}).click();await page.getByRole('heading',{name:'NASA investigations'}).waitFor();await page.getByText('Experimental conditions and score breakdown',{exact:true}).click();await capture('mission-results');
await page.goto('http://127.0.0.1:5174/experiments/ZARM-144');await page.waitForTimeout(300);await capture('experiment-detail');
await page.goto('http://127.0.0.1:5174/media/library');await page.getByLabel('Describe a visual observation').fill('Spherical flame');await page.getByRole('button',{name:'Search library'}).click();await page.getByLabel(/^Verification/).waitFor();await page.getByLabel(/^Verification/).selectOption('unverified');await capture('library-results');
await page.goto('http://127.0.0.1:5174/media');await page.locator('input[type=file]').setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024)});checks.push({name:'advertised 10 MiB upload rejects 5 MiB silently',buttonDisabled:await page.getByRole('button',{name:'Analyze only',exact:true}).isDisabled(),alerts:await page.getByRole('alert').count()});await capture('upload-rejected');
await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Open navigation'}).click();checks.push({name:'mobile drawer opens',visible:await page.getByRole('dialog').isVisible()});await page.keyboard.press('Escape');checks.push({name:'mobile drawer Escape closes',visible:await page.getByRole('dialog').count()});
await page.goto('http://127.0.0.1:5174/experiments');await page.getByText('Columns',{exact:true}).click();await page.getByLabel('Completeness',{exact:true}).uncheck();checks.push({name:'columns toggle',headerVisible:await page.getByRole('columnheader',{name:'Completeness',exact:true}).count()});await capture('columns-expanded');
await fs.writeFile(`${out}/${process.env.UX_FOLLOWUP?'followup':'observations'}.json`,JSON.stringify({results,checks,errors},null,2));await browser.close();console.log(`Saved ${results.length} review captures to ${out}`);

