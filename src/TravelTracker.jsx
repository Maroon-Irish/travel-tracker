import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

// ── DATA ──────────────────────────────────────────────────────────────────────
function s(str) { return str.split(","); }

const REGION_DEFS = {
  us: {
    label:"US States", emoji:"🇺🇸", color:"#3b82f6", total:50, mapSrc:"us",
    items: s("Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming"),
  },
  india: {
    label:"Indian States", emoji:"🇮🇳", color:"#f59e0b", total:36,
    items: s("Andhra Pradesh,Arunachal Pradesh,Assam,Bihar,Chhattisgarh,Goa,Gujarat,Haryana,Himachal Pradesh,Jharkhand,Karnataka,Kerala,Madhya Pradesh,Maharashtra,Manipur,Meghalaya,Mizoram,Nagaland,Odisha,Punjab,Rajasthan,Sikkim,Tamil Nadu,Telangana,Tripura,Uttar Pradesh,Uttarakhand,West Bengal,Andaman and Nicobar Islands,Chandigarh,Dadra and Nagar Haveli and Daman and Diu,Delhi,Jammu and Kashmir,Ladakh,Lakshadweep,Puducherry"),
    groups: [{ label:"States (28)", slice:[0,28] }, { label:"Union Territories (8)", slice:[28,36] }]
  },
  canada: {
    label:"Canadian Provinces", emoji:"🇨🇦", color:"#ef4444", total:13,
    items: s("Alberta,British Columbia,Manitoba,New Brunswick,Newfoundland and Labrador,Northwest Territories,Nova Scotia,Nunavut,Ontario,Prince Edward Island,Quebec,Saskatchewan,Yukon"),
  },
  china: {
    label:"Chinese Provinces", emoji:"🇨🇳", color:"#dc2626", total:34,
    items: s("Anhui,Beijing,Chongqing,Fujian,Gansu,Guangdong,Guangxi,Guizhou,Hainan,Hebei,Heilongjiang,Henan,Hong Kong,Hubei,Hunan,Inner Mongolia,Jiangsu,Jiangxi,Jilin,Liaoning,Macau,Ningxia,Qinghai,Shaanxi,Shandong,Shanghai,Shanxi,Sichuan,Taiwan,Tianjin,Tibet,Xinjiang,Yunnan,Zhejiang"),
  },
  australia: {
    label:"Australian States", emoji:"🇦🇺", color:"#10b981", total:8,
    items: s("Australian Capital Territory,New South Wales,Northern Territory,Queensland,South Australia,Tasmania,Victoria,Western Australia"),
  },
  japan: {
    label:"Japanese Prefectures", emoji:"🇯🇵", color:"#f43f5e", total:47,
    items: s("Aichi,Akita,Aomori,Chiba,Ehime,Fukui,Fukuoka,Fukushima,Gifu,Gunma,Hiroshima,Hokkaido,Hyogo,Ibaraki,Ishikawa,Iwate,Kagawa,Kagoshima,Kanagawa,Kochi,Kumamoto,Kyoto,Mie,Miyagi,Miyazaki,Nagano,Nagasaki,Nara,Niigata,Oita,Okayama,Okinawa,Osaka,Saga,Saitama,Shiga,Shimane,Shizuoka,Tochigi,Tokushima,Tokyo,Tottori,Toyama,Wakayama,Yamagata,Yamaguchi,Yamanashi"),
  },
};

const CONTINENTS = {
  Africa: s("Algeria,Angola,Benin,Botswana,Burkina Faso,Burundi,Cabo Verde,Cameroon,Central African Republic,Chad,Comoros,Congo,Cote dIvoire,DR Congo,Djibouti,Egypt,Equatorial Guinea,Eritrea,Eswatini,Ethiopia,Gabon,Gambia,Ghana,Guinea,Guinea-Bissau,Kenya,Lesotho,Liberia,Libya,Madagascar,Malawi,Mali,Mauritania,Mauritius,Morocco,Mozambique,Namibia,Niger,Nigeria,Rwanda,Sao Tome and Principe,Senegal,Seychelles,Sierra Leone,Somalia,South Africa,South Sudan,Sudan,Togo,Tunisia,Uganda,United Republic of Tanzania,Zambia,Zimbabwe"),
  Asia: s("Afghanistan,Armenia,Azerbaijan,Bahrain,Bangladesh,Bhutan,Brunei Darussalam,Cambodia,China,Cyprus,North Korea,Georgia,India,Indonesia,Iran,Iraq,Israel,Japan,Jordan,Kazakhstan,Kuwait,Kyrgyzstan,Lao PDR,Lebanon,Malaysia,Maldives,Mongolia,Myanmar,Nepal,Oman,Pakistan,Philippines,Qatar,South Korea,Saudi Arabia,Singapore,Sri Lanka,State of Palestine,Syria,Tajikistan,Thailand,Timor-Leste,Turkiye,Turkmenistan,United Arab Emirates,Uzbekistan,Viet Nam,Yemen"),
  Europe: s("Albania,Andorra,Austria,Belarus,Belgium,Bosnia and Herzegovina,Bulgaria,Croatia,Czechia,Denmark,Estonia,Finland,France,Germany,Greece,Holy See,Hungary,Iceland,Ireland,Italy,Latvia,Liechtenstein,Lithuania,Luxembourg,Malta,Monaco,Montenegro,Netherlands,North Macedonia,Norway,Poland,Portugal,Republic of Moldova,Romania,Russian Federation,San Marino,Serbia,Slovakia,Slovenia,Spain,Sweden,Switzerland,Ukraine,United Kingdom"),
  "North America": s("Antigua and Barbuda,Bahamas,Barbados,Belize,Canada,Costa Rica,Cuba,Dominica,Dominican Republic,El Salvador,Grenada,Guatemala,Haiti,Honduras,Jamaica,Mexico,Nicaragua,Panama,Saint Kitts and Nevis,Saint Lucia,Saint Vincent and the Grenadines,Trinidad and Tobago,United States of America"),
  "South America": s("Argentina,Bolivia,Brazil,Chile,Colombia,Ecuador,Guyana,Paraguay,Peru,Suriname,Uruguay,Venezuela"),
  Oceania: s("Australia,Fiji,Kiribati,Marshall Islands,Micronesia,Nauru,New Zealand,Palau,Papua New Guinea,Samoa,Solomon Islands,Tonga,Tuvalu,Vanuatu"),
};
const ALL_CO = Object.values(CONTINENTS).flat();
const CONT_COL = {Africa:"#f59e0b",Asia:"#10b981",Europe:"#3b82f6","North America":"#8b5cf6","South America":"#ec4899",Oceania:"#06b6d4"};

const ISO_RAW = "004:Afghanistan,008:Albania,012:Algeria,024:Angola,028:Antigua and Barbuda,032:Argentina,036:Australia,040:Austria,031:Azerbaijan,044:Bahamas,048:Bahrain,050:Bangladesh,051:Armenia,052:Barbados,056:Belgium,084:Belize,204:Benin,064:Bhutan,068:Bolivia,070:Bosnia and Herzegovina,072:Botswana,076:Brazil,096:Brunei Darussalam,100:Bulgaria,854:Burkina Faso,108:Burundi,132:Cabo Verde,116:Cambodia,120:Cameroon,124:Canada,140:Central African Republic,148:Chad,152:Chile,170:Colombia,174:Comoros,178:Congo,180:DR Congo,188:Costa Rica,191:Croatia,192:Cuba,196:Cyprus,203:Czechia,208:Denmark,262:Djibouti,212:Dominica,214:Dominican Republic,218:Ecuador,818:Egypt,222:El Salvador,226:Equatorial Guinea,232:Eritrea,233:Estonia,748:Eswatini,231:Ethiopia,242:Fiji,246:Finland,250:France,266:Gabon,270:Gambia,268:Georgia,276:Germany,288:Ghana,300:Greece,308:Grenada,320:Guatemala,324:Guinea,624:Guinea-Bissau,328:Guyana,332:Haiti,336:Holy See,340:Honduras,348:Hungary,352:Iceland,356:India,360:Indonesia,364:Iran,368:Iraq,372:Ireland,376:Israel,380:Italy,388:Jamaica,392:Japan,400:Jordan,398:Kazakhstan,404:Kenya,296:Kiribati,414:Kuwait,417:Kyrgyzstan,418:Lao PDR,428:Latvia,422:Lebanon,426:Lesotho,430:Liberia,434:Libya,438:Liechtenstein,440:Lithuania,442:Luxembourg,450:Madagascar,454:Malawi,458:Malaysia,462:Maldives,466:Mali,470:Malta,584:Marshall Islands,478:Mauritania,480:Mauritius,484:Mexico,583:Micronesia,498:Republic of Moldova,492:Monaco,496:Mongolia,499:Montenegro,504:Morocco,508:Mozambique,104:Myanmar,516:Namibia,520:Nauru,524:Nepal,528:Netherlands,554:New Zealand,558:Nicaragua,562:Niger,566:Nigeria,578:Norway,512:Oman,586:Pakistan,585:Palau,591:Panama,598:Papua New Guinea,600:Paraguay,604:Peru,608:Philippines,616:Poland,620:Portugal,634:Qatar,410:South Korea,642:Romania,643:Russian Federation,646:Rwanda,659:Saint Kitts and Nevis,662:Saint Lucia,670:Saint Vincent and the Grenadines,882:Samoa,674:San Marino,678:Sao Tome and Principe,682:Saudi Arabia,686:Senegal,694:Sierra Leone,690:Seychelles,703:Slovakia,705:Slovenia,090:Solomon Islands,706:Somalia,710:South Africa,724:Spain,144:Sri Lanka,729:Sudan,740:Suriname,752:Sweden,756:Switzerland,760:Syria,762:Tajikistan,764:Thailand,626:Timor-Leste,768:Togo,776:Tonga,780:Trinidad and Tobago,788:Tunisia,792:Turkiye,795:Turkmenistan,798:Tuvalu,800:Uganda,804:Ukraine,784:United Arab Emirates,826:United Kingdom,834:United Republic of Tanzania,840:United States of America,858:Uruguay,860:Uzbekistan,548:Vanuatu,862:Venezuela,704:Viet Nam,887:Yemen,894:Zambia,716:Zimbabwe,275:State of Palestine,408:North Korea,807:North Macedonia,688:Serbia,728:South Sudan,454:Cote dIvoire";
const ISO_NUM = {};
ISO_RAW.split(",").forEach(p => { const i = p.indexOf(":"); ISO_NUM[p.slice(0,i)] = p.slice(i+1); });

const US_FIPS_RAW = "Alabama:01,Alaska:02,Arizona:04,Arkansas:05,California:06,Colorado:08,Connecticut:09,Delaware:10,Florida:12,Georgia:13,Hawaii:15,Idaho:16,Illinois:17,Indiana:18,Iowa:19,Kansas:20,Kentucky:21,Louisiana:22,Maine:23,Maryland:24,Massachusetts:25,Michigan:26,Minnesota:27,Mississippi:28,Missouri:29,Montana:30,Nebraska:31,Nevada:32,New Hampshire:33,New Jersey:34,New Mexico:35,New York:36,North Carolina:37,North Dakota:38,Ohio:39,Oklahoma:40,Oregon:41,Pennsylvania:42,Rhode Island:44,South Carolina:45,South Dakota:46,Tennessee:47,Texas:48,Utah:49,Vermont:50,Virginia:51,Washington:53,West Virginia:54,Wisconsin:55,Wyoming:56";
const FIPS_US = {};
US_FIPS_RAW.split(",").forEach(p => { const i = p.indexOf(":"); FIPS_US[p.slice(i+1)] = p.slice(0,i); });

const US_AB_RAW = "Alabama:AL,Alaska:AK,Arizona:AZ,Arkansas:AR,California:CA,Colorado:CO,Connecticut:CT,Delaware:DE,Florida:FL,Georgia:GA,Hawaii:HI,Idaho:ID,Illinois:IL,Indiana:IN,Iowa:IA,Kansas:KS,Kentucky:KY,Louisiana:LA,Maine:ME,Maryland:MD,Massachusetts:MA,Michigan:MI,Minnesota:MN,Mississippi:MS,Missouri:MO,Montana:MT,Nebraska:NE,Nevada:NV,New Hampshire:NH,New Jersey:NJ,New Mexico:NM,New York:NY,North Carolina:NC,North Dakota:ND,Ohio:OH,Oklahoma:OK,Oregon:OR,Pennsylvania:PA,Rhode Island:RI,South Carolina:SC,South Dakota:SD,Tennessee:TN,Texas:TX,Utah:UT,Vermont:VT,Virginia:VA,Washington:WA,West Virginia:WV,Wisconsin:WI,Wyoming:WY";
const US_AB = {}, AB_US = {};
US_AB_RAW.split(",").forEach(p => { const i = p.indexOf(":"); US_AB[p.slice(0,i)] = p.slice(i+1); AB_US[p.slice(i+1)] = p.slice(0,i); });

const SGRID = {AK:[0,0],ME:[0,10],NH:[1,10],VT:[1,9],WA:[1,0],MT:[1,2],ND:[1,3],MN:[1,4],WI:[1,5],MI:[1,6],NY:[1,8],MA:[1,11],OR:[2,0],ID:[2,1],SD:[2,3],IA:[2,4],IL:[2,5],IN:[2,6],OH:[2,7],PA:[2,8],NJ:[2,9],CT:[2,10],RI:[2,11],CA:[3,0],NV:[3,1],WY:[3,2],NE:[3,3],MO:[3,4],KY:[3,5],WV:[3,6],VA:[3,7],MD:[3,8],DE:[3,9],AZ:[4,1],UT:[4,2],CO:[4,3],KS:[4,4],AR:[4,5],TN:[4,6],NC:[4,7],SC:[4,8],NM:[5,2],OK:[5,4],LA:[5,5],MS:[5,6],AL:[5,7],GA:[5,8],TX:[6,3],FL:[6,9],HI:[7,1]};

const INDIA_GEO = {
  "Andhra Pradesh":"Andhra Pradesh","Arunachal Pradesh":"Arunachal Pradesh","Assam":"Assam",
  "Bihar":"Bihar","Chhattisgarh":"Chhattisgarh","Goa":"Goa","Gujarat":"Gujarat","Haryana":"Haryana",
  "Himachal Pradesh":"Himachal Pradesh","Jharkhand":"Jharkhand","Karnataka":"Karnataka","Kerala":"Kerala",
  "Madhya Pradesh":"Madhya Pradesh","Maharashtra":"Maharashtra","Manipur":"Manipur","Meghalaya":"Meghalaya",
  "Mizoram":"Mizoram","Nagaland":"Nagaland","Odisha":"Odisha","Punjab":"Punjab","Rajasthan":"Rajasthan",
  "Sikkim":"Sikkim","Tamil Nadu":"Tamil Nadu","Telangana":"Telangana","Tripura":"Tripura",
  "Uttar Pradesh":"Uttar Pradesh","Uttarakhand":"Uttarakhand","West Bengal":"West Bengal",
  "Andaman & Nicobar Island":"Andaman and Nicobar Islands","Chandigarh":"Chandigarh",
  "Dadra and Nagar Haveli":"Dadra and Nagar Haveli and Daman and Diu",
  "Daman and Diu":"Dadra and Nagar Haveli and Daman and Diu",
  "NCT of Delhi":"Delhi","Delhi":"Delhi",
  "Jammu & Kashmir":"Jammu and Kashmir","Jammu and Kashmir":"Jammu and Kashmir",
  "Ladakh":"Ladakh","Lakshadweep":"Lakshadweep","Puducherry":"Puducherry","Pondicherry":"Puducherry"
};

const GEO_MAPS = {
  canada: {"Alberta":"Alberta","British Columbia":"British Columbia","Manitoba":"Manitoba","New Brunswick":"New Brunswick","Newfoundland and Labrador":"Newfoundland and Labrador","Northwest Territories":"Northwest Territories","Nova Scotia":"Nova Scotia","Nunavut":"Nunavut","Ontario":"Ontario","Prince Edward Island":"Prince Edward Island","Quebec":"Quebec","Saskatchewan":"Saskatchewan","Yukon":"Yukon"},
  china: {"Anhui":"Anhui","Beijing":"Beijing","Chongqing":"Chongqing","Fujian":"Fujian","Gansu":"Gansu","Guangdong":"Guangdong","Guangxi":"Guangxi","Guizhou":"Guizhou","Hainan":"Hainan","Hebei":"Hebei","Heilongjiang":"Heilongjiang","Henan":"Henan","Hongkong":"Hong Kong","Hong Kong":"Hong Kong","Hubei":"Hubei","Hunan":"Hunan","Inner Mongol":"Inner Mongolia","Inner Mongolia":"Inner Mongolia","Jiangsu":"Jiangsu","Jiangxi":"Jiangxi","Jilin":"Jilin","Liaoning":"Liaoning","Macau":"Macau","Macao":"Macau","Ningxia":"Ningxia","Qinghai":"Qinghai","Shaanxi":"Shaanxi","Shandong":"Shandong","Shanghai":"Shanghai","Shanxi":"Shanxi","Sichuan":"Sichuan","Taiwan":"Taiwan","Tianjin":"Tianjin","Tibet":"Tibet","Xinjiang":"Xinjiang","Yunnan":"Yunnan","Zhejiang":"Zhejiang"},
  australia: {"Australian Capital Territory":"Australian Capital Territory","New South Wales":"New South Wales","Northern Territory":"Northern Territory","Queensland":"Queensland","South Australia":"South Australia","Tasmania":"Tasmania","Victoria":"Victoria","Western Australia":"Western Australia"},
  japan: {"Aichi":"Aichi","Akita":"Akita","Aomori":"Aomori","Chiba":"Chiba","Ehime":"Ehime","Fukui":"Fukui","Fukuoka":"Fukuoka","Fukushima":"Fukushima","Gifu":"Gifu","Gunma":"Gunma","Hiroshima":"Hiroshima","Hokkaido":"Hokkaido","Hyogo":"Hyogo","Ibaraki":"Ibaraki","Ishikawa":"Ishikawa","Iwate":"Iwate","Kagawa":"Kagawa","Kagoshima":"Kagoshima","Kanagawa":"Kanagawa","Kochi":"Kochi","Kumamoto":"Kumamoto","Kyoto":"Kyoto","Mie":"Mie","Miyagi":"Miyagi","Miyazaki":"Miyazaki","Nagano":"Nagano","Nagasaki":"Nagasaki","Nara":"Nara","Niigata":"Niigata","Oita":"Oita","Okayama":"Okayama","Okinawa":"Okinawa","Osaka":"Osaka","Saga":"Saga","Saitama":"Saitama","Shiga":"Shiga","Shimane":"Shimane","Shizuoka":"Shizuoka","Tochigi":"Tochigi","Tokushima":"Tokushima","Tokyo":"Tokyo","Tottori":"Tottori","Toyama":"Toyama","Wakayama":"Wakayama","Yamagata":"Yamagata","Yamaguchi":"Yamaguchi","Yamanashi":"Yamanashi"},
};

const MAP_URLS = {
  us: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
  india: "https://cdn.jsdelivr.net/gh/geohacker/india@master/state/india_telengana.geojson",
  canada: "https://cdn.jsdelivr.net/npm/canada-provinces-topo@1.0.0/canada.json",
  china: "https://cdn.jsdelivr.net/npm/china-geojson@1.0.0/china.json",
  australia: "https://cdn.jsdelivr.net/npm/australia-topo@1.0.0/au.json",
  japan: "https://cdn.jsdelivr.net/gh/dataofjapan/land@master/japan.geojson",
};

// ── STORAGE ───────────────────────────────────────────────────────────────────
const LS = "tt_v6";
function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem(LS) || "{}");
    const visited = {};
    Object.keys(REGION_DEFS).forEach(k => { visited[k] = new Set((d.visited || {})[k] || []); });
    visited.co = new Set((d.visited || {}).co || []);
    return {
      visited,
      recent: d.recent || [],
      activeTabs: d.activeTabs || ["us", "india", "countries"],
    };
  } catch (e) {
    const visited = {};
    Object.keys(REGION_DEFS).forEach(k => { visited[k] = new Set(); });
    visited.co = new Set();
    return { visited, recent: [], activeTabs: ["us", "india", "countries"] };
  }
}
function persist(d) {
  const visited = {};
  Object.keys(d.visited).forEach(k => { visited[k] = [...d.visited[k]]; });
  localStorage.setItem(LS, JSON.stringify({ visited, recent: d.recent, activeTabs: d.activeTabs }));
}

// ── TOPOJSON LOADER ───────────────────────────────────────────────────────────
let topoLoaded = false;
const topoCallbacks = [];
function ensureTopojson(cb) {
  if (window.topojson) { cb(); return; }
  topoCallbacks.push(cb);
  if (topoLoaded) return;
  topoLoaded = true;
  const sc = document.createElement("script");
  sc.src = "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js";
  sc.onload = () => { topoCallbacks.forEach(f => f()); topoCallbacks.length = 0; };
  document.head.appendChild(sc);
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#0f172a", card:"#1e293b", border:"#334155", border2:"#475569",
  text:"#e2e8f0", muted:"#64748b", accent:"#3b82f6",
};
const cardStyle = { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:14 };
const btnStyle = (v="primary") => {
  const b = { padding:"6px 13px", borderRadius:8, border:"none", cursor:"pointer", fontSize:".81rem", fontWeight:600 };
  if (v==="sm") return {...b, padding:"4px 10px", fontSize:".78rem", background:"transparent", color:C.muted, border:`1px solid ${C.border}`};
  if (v==="ghost") return {...b, background:"transparent", color:C.muted, border:`1px solid ${C.border}`};
  if (v==="danger") return {...b, background:"#ef4444", color:"#fff"};
  if (v==="green") return {...b, background:"#10b981", color:"#fff"};
  return {...b, background:C.accent, color:"#fff"};
};
const pillStyle = (on, col="#3b82f6") => ({
  display:"inline-block", padding:"4px 10px", borderRadius:99, fontSize:".77rem", fontWeight:500,
  cursor:"pointer", border:`1.5px solid ${on?col:C.border}`, background:on?col:C.card,
  color:on?"#fff":C.muted, margin:2, userSelect:"none",
});
const inputStyle = { background:C.bg, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"7px 12px", fontSize:".85rem", outline:"none", width:"100%" };
const mapWrapStyle = { width:"100%", background:"#162032", borderRadius:10, overflow:"hidden", position:"relative", border:`1px solid ${C.border}` };
const zbtnStyle = { width:28, height:28, borderRadius:6, border:`1px solid ${C.border2}`, background:C.card, color:"#cbd5e1", cursor:"pointer", fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center" };

// ── GEO MAP ───────────────────────────────────────────────────────────────────
function GeoMap({ regionKey, visited, onToggle, setTip, highlightColor }) {
  const svgRef = useRef(null);
  const stRef = useRef({ built: false });
  const [msg, setMsg] = useState("Loading map...");

  useEffect(() => {
    if (stRef.current.built || !svgRef.current) return;
    stRef.current.built = true;
    const svgEl = svgRef.current;
    const isWorld = regionKey === "co";
    const H = {us:500, india:650, japan:650, canada:500, china:500, australia:500, co:450}[regionKey] || 500;
    const W = 800;
    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.select("g");
    const zb = d3.zoom().scaleExtent([1,12]).on("zoom", e => g.attr("transform", e.transform));
    svg.call(zb);
    stRef.current = { svg, zb, built: true };

    const build = (data) => {
      let features, pathGen;
      if (regionKey === "us") {
        features = window.topojson.feature(data, data.objects.states).features;
        const proj = d3.geoAlbersUsa().fitSize([W,H], {type:"FeatureCollection",features});
        pathGen = d3.geoPath().projection(proj);
      } else if (isWorld) {
        const proj = d3.geoNaturalEarth1().fitSize([W,H], {type:"Sphere"});
        pathGen = d3.geoPath().projection(proj);
        g.append("path").datum({type:"Sphere"}).attr("d",pathGen).attr("fill","#0f172a");
        g.append("path").datum(d3.geoGraticule()()).attr("d",pathGen).attr("fill","none").attr("stroke","#1e2d45").attr("stroke-width",.3);
        features = window.topojson.feature(data, data.objects.countries).features;
      } else {
        let geo = data;
        if (data.type === "Topology") {
          const key = Object.keys(data.objects)[0];
          geo = window.topojson.feature(data, data.objects[key]);
        }
        features = geo.features || [];
        const proj = d3.geoMercator().fitSize([W,H], {type:"FeatureCollection",features});
        pathGen = d3.geoPath().projection(proj);
      }

      g.selectAll("path.feat").data(features).join("path")
        .attr("class","feat")
        .each(function(d) {
          let name = null;
          if (regionKey === "us") {
            name = FIPS_US[String(d.id).padStart(2,"0")] || null;
          } else if (isWorld) {
            name = ISO_NUM[String(d.id).padStart(3,"0")] || null;
          } else if (regionKey === "india") {
            const raw = d.properties.NAME_1 || d.properties.name || d.properties.ST_NM || "";
            name = INDIA_GEO[raw] || null;
          } else {
            const gm = GEO_MAPS[regionKey];
            const raw = d.properties.name || d.properties.NAME_1 || d.properties.NAME || d.properties.province || d.properties.NAME_EN || "";
            name = (gm && gm[raw]) || null;
          }
          d._name = name;
        })
        .attr("data-name", d => d._name)
        .attr("d", pathGen)
        .attr("fill", d => d._name && visited.has(d._name) ? highlightColor : C.border)
        .attr("stroke", C.bg).attr("stroke-width", 0.5).style("cursor","pointer")
        .on("mouseenter", (e,d) => { if(d._name) setTip(d._name); else setTip(null); })
        .on("mouseleave", () => setTip(null))
        .on("click", (e,d) => { if(d._name) onToggle(d._name); });

      svgEl.style.opacity = "1";
      setMsg(null);
    };

    const url = isWorld
      ? "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
      : MAP_URLS[regionKey];

    const doFetch = () => fetch(url).then(r => r.json()).then(build).catch(() => setMsg("Map unavailable — use List view."));

    if (regionKey === "us" || isWorld) ensureTopojson(doFetch);
    else doFetch();
  }, []);

  useEffect(() => {
    if (!svgRef.current || msg) return;
    d3.select(svgRef.current).selectAll("path.feat[data-name]").each(function() {
      const n = this.getAttribute("data-name");
      if (n) d3.select(this).attr("fill", visited.has(n) ? highlightColor : C.border);
    });
  }, [visited]);

  const zoom = k => { const st = stRef.current; if (st.svg) st.svg.transition().call(st.zb.scaleBy, k); };
  const reset = () => { const st = stRef.current; if (st.svg) st.svg.transition().call(st.zb.transform, d3.zoomIdentity); };
  const aspect = {co:"16/9",us:"8/5",india:"4/3",japan:"3/4",canada:"4/3",china:"5/4",australia:"4/3"}[regionKey] || "4/3";

  return (
    <div style={{...mapWrapStyle, aspectRatio:aspect}}>
      {msg && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:".85rem",pointerEvents:"none",zIndex:1}}>{msg}</div>}
      <svg ref={svgRef} style={{width:"100%",display:"block",opacity:0,cursor:"grab"}}><g/></svg>
      <div style={{position:"absolute",bottom:10,right:10,display:"flex",flexDirection:"column",gap:4}}>
        <button style={zbtnStyle} onClick={()=>zoom(1.5)}>+</button>
        <button style={zbtnStyle} onClick={()=>zoom(0.67)}>−</button>
        <button style={{...zbtnStyle,fontSize:".6rem"}} onClick={reset}>↺</button>
      </div>
    </div>
  );
}

// ── CHECKLIST ─────────────────────────────────────────────────────────────────
function Checklist({ items, visited, onToggle, q="" }) {
  const filtered = q ? items.filter(x => x.toLowerCase().includes(q.toLowerCase())) : items;
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:5}}>
      {filtered.map(name => {
        const on = visited.has(name);
        return (
          <div key={name} onClick={()=>onToggle(name)} tabIndex={0}
            onKeyDown={e=>e.key===" "&&onToggle(name)}
            style={{display:"flex",alignItems:"center",gap:7,padding:"5px 7px",borderRadius:7,cursor:"pointer",fontSize:".83rem",color:on?"#93c5fd":C.muted}}>
            <div style={{width:15,height:15,borderRadius:4,border:`2px solid ${on?"#3b82f6":C.border2}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,background:on?"#3b82f6":"transparent",color:"#fff"}}>{on&&"✓"}</div>
            {name}
          </div>
        );
      })}
    </div>
  );
}

// ── TILE MAP ──────────────────────────────────────────────────────────────────
function TileMap({ visited, onToggle, setTip }) {
  const grid = Array.from({length:8},()=>Array(12).fill(null));
  Object.entries(SGRID).forEach(([ab,[r,c]])=>{ grid[r][c]=ab; });
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:3}}>
      {grid.flat().map((ab,i) => {
        if (!ab) return <div key={i} style={{aspectRatio:1,visibility:"hidden"}}/>;
        const name=AB_US[ab], on=visited.has(name);
        return (
          <button key={ab} onClick={()=>onToggle(name)}
            onMouseEnter={()=>setTip(name)} onMouseLeave={()=>setTip(null)}
            style={{aspectRatio:1,borderRadius:5,border:on?"none":`1px solid ${C.border}`,background:on?"#3b82f6":C.card,cursor:"pointer",fontSize:".58rem",fontWeight:700,color:on?"#fff":C.muted}}>
            {ab}
          </button>
        );
      })}
    </div>
  );
}

// ── REGION TAB ────────────────────────────────────────────────────────────────
function RegionTab({ regionKey, data, tog, selAll, setTip }) {
  const def = REGION_DEFS[regionKey];
  const visited = data.visited[regionKey];
  const [view, setView] = useState("map");
  const [q, setQ] = useState("");
  const count = visited.size;
  const isUS = regionKey === "us";

  return (
    <div style={cardStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:0}}>
          {def.emoji} {def.label}
          <span style={{display:"inline-block",padding:"2px 8px",borderRadius:99,fontSize:".73rem",fontWeight:700,background:def.color+"22",color:def.color,marginLeft:8}}>{count}/{def.total}</span>
        </h2>
        <div style={{display:"flex",gap:4}}>
          {(isUS ? ["map","tile","list"] : ["map","list"]).map(v => (
            <button key={v}
              style={{padding:"5px 13px",borderRadius:7,border:"none",cursor:"pointer",fontSize:".81rem",fontWeight:600,background:view===v?"#334155":"transparent",color:view===v?"#e2e8f0":C.muted}}
              onClick={()=>setView(v)}>{v[0].toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        <button style={btnStyle("sm")} onClick={()=>selAll(regionKey,true)}>Select All</button>
        <button style={btnStyle("sm")} onClick={()=>selAll(regionKey,false)}>Clear All</button>
        <input style={{...inputStyle,maxWidth:200}} placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      {view==="map" && <>
        <GeoMap regionKey={regionKey} visited={visited} onToggle={n=>tog(regionKey,n)} setTip={setTip} highlightColor={def.color}/>
        <div style={{marginTop:6,fontSize:".72rem",color:C.muted,textAlign:"center"}}>Click to toggle · Scroll to zoom · Drag to pan</div>
      </>}
      {isUS && view==="tile" && <TileMap visited={visited} onToggle={n=>tog("us",n)} setTip={setTip}/>}
      {view==="list" && (
        def.groups && !q
          ? def.groups.map(g => (
              <div key={g.label} style={{marginBottom:12}}>
                <div style={{fontSize:".78rem",fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>{g.label}</div>
                <Checklist items={def.items.slice(g.slice[0],g.slice[1])} visited={visited} onToggle={n=>tog(regionKey,n)} q=""/>
              </div>
            ))
          : <Checklist items={def.items} visited={visited} onToggle={n=>tog(regionKey,n)} q={q}/>
      )}
    </div>
  );
}

// ── COUNTRIES TAB ─────────────────────────────────────────────────────────────
function CountriesTab({ data, tog, selAll, selCont, setTip }) {
  const visited = data.visited.co;
  const [view, setView] = useState("map");
  const [q, setQ] = useState("");
  const [openC, setOpenC] = useState({"North America":true});

  return (
    <div style={cardStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:0}}>
          🌍 Countries
          <span style={{display:"inline-block",padding:"2px 8px",borderRadius:99,fontSize:".73rem",fontWeight:700,background:"#064e3b",color:"#6ee7b7",marginLeft:8}}>{visited.size}/195</span>
        </h2>
        <div style={{display:"flex",gap:4}}>
          {["map","list"].map(v=>(
            <button key={v}
              style={{padding:"5px 13px",borderRadius:7,border:"none",cursor:"pointer",fontSize:".81rem",fontWeight:600,background:view===v?"#334155":"transparent",color:view===v?"#e2e8f0":C.muted}}
              onClick={()=>setView(v)}>{v[0].toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
        <button style={btnStyle("sm")} onClick={()=>selAll("co",true)}>Select All</button>
        <button style={btnStyle("sm")} onClick={()=>selAll("co",false)}>Clear All</button>
        <input style={{...inputStyle,maxWidth:200}} placeholder="Search countries..." value={q} onChange={e=>setQ(e.target.value)}/>
      </div>
      {view==="map" && <>
        <GeoMap regionKey="co" visited={visited} onToggle={n=>tog("co",n)} setTip={setTip} highlightColor="#10b981"/>
        <div style={{marginTop:6,fontSize:".72rem",color:C.muted,textAlign:"center"}}>Click to toggle · Scroll to zoom · Drag to pan</div>
      </>}
      {view==="list" && (
        q
          ? <div style={{display:"flex",flexWrap:"wrap"}}>
              {ALL_CO.filter(c=>c.toLowerCase().includes(q.toLowerCase())).map(c=>(
                <span key={c} style={pillStyle(visited.has(c),"#10b981")} onClick={()=>tog("co",c)}>{c}</span>
              ))}
            </div>
          : Object.entries(CONTINENTS).map(([cont,list])=>{
              const v=list.filter(c=>visited.has(c)).length;
              const col=CONT_COL[cont];
              const open=openC[cont];
              return (
                <div key={cont} style={{marginBottom:5}}>
                  <div
                    onClick={()=>setOpenC(p=>({...p,[cont]:!p[cont]}))}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 11px",borderRadius:9,cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#334155"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:9,height:9,borderRadius:"50%",background:col,display:"inline-block"}}/>
                      <span style={{fontWeight:600,fontSize:".88rem"}}>{cont}</span>
                      <span style={{display:"inline-block",padding:"2px 8px",borderRadius:99,fontSize:".73rem",fontWeight:700,background:col+"33",color:col}}>{v}/{list.length}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button style={btnStyle("sm")} onClick={e=>{e.stopPropagation();selCont(cont,true);}}>All</button>
                      <button style={btnStyle("sm")} onClick={e=>{e.stopPropagation();selCont(cont,false);}}>None</button>
                      <span style={{color:C.muted,fontSize:".75rem"}}>{open?"▲":"▼"}</span>
                    </div>
                  </div>
                  {open && <div style={{display:"flex",flexWrap:"wrap",padding:"0 4px 8px"}}>
                    {list.map(c=><span key={c} style={pillStyle(visited.has(c),"#10b981")} onClick={()=>tog("co",c)}>{c}</span>)}
                  </div>}
                </div>
              );
            })
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ data, activeTabs }) {
  const regionKeys = activeTabs.filter(t => t !== "countries");
  const total = regionKeys.reduce((s,k)=>s+data.visited[k].size,0) + data.visited.co.size;

  return <>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:14}}>
      {regionKeys.map(k => {
        const def=REGION_DEFS[k], n=data.visited[k].size, pct=Math.round(n/def.total*100);
        return (
          <div key={k} style={cardStyle}>
            <div style={{fontSize:"1.7rem",fontWeight:800,color:"#f8fafc",lineHeight:1}}>{n}<span style={{fontSize:".9rem",color:C.muted}}>/{def.total}</span></div>
            <div style={{fontSize:".72rem",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:3}}>{def.emoji} {def.label}</div>
            <div style={{height:6,background:C.bg,borderRadius:99,overflow:"hidden",margin:"5px 0 2px"}}><div style={{height:"100%",borderRadius:99,width:pct+"%",background:def.color}}/></div>
            <div style={{fontSize:".72rem",color:C.muted}}>{pct}% · {def.total-n} left</div>
          </div>
        );
      })}
      {activeTabs.includes("countries") && (()=>{
        const n=data.visited.co.size, pct=Math.round(n/195*100);
        return (
          <div style={cardStyle}>
            <div style={{fontSize:"1.7rem",fontWeight:800,color:"#f8fafc",lineHeight:1}}>{n}<span style={{fontSize:".9rem",color:C.muted}}>/195</span></div>
            <div style={{fontSize:".72rem",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:3}}>🌍 Countries</div>
            <div style={{height:6,background:C.bg,borderRadius:99,overflow:"hidden",margin:"5px 0 2px"}}><div style={{height:"100%",borderRadius:99,width:pct+"%",background:"#10b981"}}/></div>
            <div style={{fontSize:".72rem",color:C.muted}}>{pct}% · {195-n} left</div>
          </div>
        );
      })()}
      <div style={{...cardStyle,display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:"1.7rem",fontWeight:800,color:"#f8fafc"}}>{total}</div>
        <div style={{fontSize:".72rem",color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginTop:3}}>Total Places</div>
      </div>
    </div>
    {activeTabs.includes("countries") && (
      <div style={cardStyle}>
        <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:10}}>Countries by Continent</h2>
        {Object.entries(CONTINENTS).map(([cont,list])=>{
          const v=list.filter(c=>data.visited.co.has(c)).length, col=CONT_COL[cont];
          return (
            <div key={cont} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:".82rem",marginBottom:2}}>
                <span><span style={{width:9,height:9,borderRadius:"50%",background:col,display:"inline-block",marginRight:6}}/>{cont}</span>
                <span style={{color:"#94a3b8"}}>{v}/{list.length}</span>
              </div>
              <div style={{height:8,background:C.bg,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,width:Math.round(v/list.length*100)+"%",background:col}}/></div>
            </div>
          );
        })}
      </div>
    )}
    {data.recent.length > 0 && (
      <div style={cardStyle}>
        <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:10}}>Recently Added</h2>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {data.recent.map(p=><span key={p} style={{padding:"3px 9px",background:"#1e3a5f",color:"#93c5fd",borderRadius:99,fontSize:".73rem",fontWeight:500}}>{p}</span>)}
        </div>
      </div>
    )}
  </>;
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsTab({ data, setData, activeTabs, setActiveTabs }) {
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);

  const ALL_TABS = ["us","india","canada","china","australia","japan","countries"];
  const TAB_LABELS = {us:"🇺🇸 US States",india:"🇮🇳 Indian States",canada:"🇨🇦 Canadian Provinces",china:"🇨🇳 Chinese Provinces",australia:"🇦🇺 Australian States",japan:"🇯🇵 Japanese Prefectures",countries:"🌍 Countries"};

  const toggleTab = t => {
    const next = activeTabs.includes(t) ? activeTabs.filter(x=>x!==t) : [...activeTabs, t];
    setActiveTabs(next);
    const nd = {...data, activeTabs:next};
    setData(nd); persist(nd);
  };

  return <>
    <div style={cardStyle}>
      <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:10}}>Active Tabs</h2>
      <p style={{fontSize:".83rem",color:C.muted,marginBottom:12}}>Choose which region trackers appear in the navigation.</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {ALL_TABS.map(t => {
          const on = activeTabs.includes(t);
          return (
            <label key={t} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",fontSize:".88rem",color:on?"#e2e8f0":C.muted}}>
              <div onClick={()=>toggleTab(t)}
                style={{width:36,height:20,borderRadius:99,background:on?"#3b82f6":C.border,position:"relative",cursor:"pointer",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:on?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
              </div>
              {TAB_LABELS[t]}
            </label>
          );
        })}
      </div>
    </div>
    <div style={cardStyle}>
      <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:10}}>Export</h2>
      <button style={btnStyle()} onClick={()=>{
        const visited={};
        Object.keys(data.visited).forEach(k=>{visited[k]=[...data.visited[k]];});
        setExportText(JSON.stringify({visited,recent:data.recent,activeTabs},null,2));
      }}>Generate JSON</button>
      {exportText && <textarea style={{...inputStyle,marginTop:10,height:130,fontFamily:"monospace",fontSize:".73rem"}} readOnly value={exportText}/>}
    </div>
    <div style={cardStyle}>
      <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:10}}>Import</h2>
      <textarea style={{...inputStyle,height:100,fontFamily:"monospace",fontSize:".73rem",marginBottom:8}}
        placeholder='{"visited":{...},"recent":[...]}' value={importText} onChange={e=>setImportText(e.target.value)}/>
      <button style={btnStyle("green")} onClick={()=>{
        try {
          const p = JSON.parse(importText);
          const visited={};
          Object.keys(REGION_DEFS).forEach(k=>{visited[k]=new Set((p.visited||{})[k]||[]);});
          visited.co=new Set((p.visited||{}).co||[]);
          const nd={...data,visited,recent:(p.recent||[]).slice(0,10)};
          setData(nd); persist(nd);
          setImportMsg("✓ Import successful.");
        } catch { setImportMsg("✗ Invalid JSON."); }
      }}>Import</button>
      {importMsg && <div style={{marginTop:8,fontSize:".82rem",color:importMsg.startsWith("✓")?"#6ee7b7":"#fca5a5"}}>{importMsg}</div>}
    </div>
    <div style={cardStyle}>
      <h2 style={{fontSize:"1.05rem",fontWeight:600,color:"#cbd5e1",marginBottom:10}}>Reset All Data</h2>
      <p style={{fontSize:".82rem",color:C.muted,marginBottom:10}}>Clears all selections. Cannot be undone.</p>
      {!resetConfirm
        ? <button style={btnStyle("danger")} onClick={()=>setResetConfirm(true)}>Reset All</button>
        : <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:".82rem",color:"#fca5a5"}}>Sure?</span>
            <button style={btnStyle("danger")} onClick={()=>{
              const visited={};
              Object.keys(REGION_DEFS).forEach(k=>{visited[k]=new Set();}); visited.co=new Set();
              const nd={...data,visited,recent:[]};
              setData(nd); persist(nd); setResetConfirm(false);
            }}>Yes, Reset</button>
            <button style={btnStyle("ghost")} onClick={()=>setResetConfirm(false)}>Cancel</button>
          </div>
      }
    </div>
  </>;
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function TravelTracker() {
  const [data, setData] = useState(loadData);
  const [activeTabs, setActiveTabs] = useState(() => loadData().activeTabs);
  const [tab, setTab] = useState("dashboard");
  const [tip, setTip] = useState(null);
  const tipPos = useRef({x:0,y:0});

  const tog = useCallback((type, name) => {
    setData(prev => {
      const set = new Set(prev.visited[type]);
      const was = set.has(name);
      was ? set.delete(name) : set.add(name);
      const recent = was
        ? prev.recent.filter(x=>x!==name)
        : [name,...prev.recent.filter(x=>x!==name)].slice(0,10);
      const next = {...prev, visited:{...prev.visited,[type]:set}, recent};
      persist(next);
      return next;
    });
  }, []);

  const selAll = useCallback((type, on) => {
    setData(prev => {
      const items = type==="co" ? ALL_CO : REGION_DEFS[type].items;
      const next = {...prev, visited:{...prev.visited,[type]:on?new Set(items):new Set()}};
      persist(next);
      return next;
    });
  }, []);

  const selCont = useCallback((cont, on) => {
    setData(prev => {
      const co = new Set(prev.visited.co);
      CONTINENTS[cont].forEach(c => on?co.add(c):co.delete(c));
      const next = {...prev, visited:{...prev.visited,co}};
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const navTabs = ["dashboard",...activeTabs,"settings"];
    if (!navTabs.includes(tab)) setTab("dashboard");
  }, [activeTabs]);

  const NAV = ["dashboard",...activeTabs,"settings"];
  const NAV_LABELS = {
    dashboard:"Dashboard", countries:"Countries", settings:"Settings",
    ...Object.fromEntries(Object.entries(REGION_DEFS).map(([k,v])=>[k,v.label]))
  };

  return (
    <div
      style={{maxWidth:1100,margin:"0 auto",padding:16,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}
      onMouseMove={e=>{tipPos.current={x:e.clientX,y:e.clientY};}}>
      {tip && (
        <div style={{position:"fixed",background:C.bg,border:`1px solid ${C.border2}`,color:C.text,padding:"4px 10px",borderRadius:6,fontSize:".75rem",pointerEvents:"none",zIndex:9999,whiteSpace:"nowrap",left:tipPos.current.x+12,top:tipPos.current.y-8}}>
          {tip}
        </div>
      )}

      <div style={{marginBottom:14}}>
        <div style={{fontSize:"1.5rem",fontWeight:800,color:"#f8fafc",letterSpacing:"-.02em"}}>✈️ Travel Tracker</div>
        <div style={{fontSize:".78rem",color:C.muted,marginTop:2}}>
          {Object.values(data.visited).reduce((s,v)=>s+v.size,0)} places visited
        </div>
      </div>

      <div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
        {NAV.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"7px 14px",borderRadius:8,border:tab===t?"none":`1px solid ${C.border}`,cursor:"pointer",fontSize:".83rem",fontWeight:600,background:tab===t?"#3b82f6":C.card,color:tab===t?"#fff":C.muted}}>
            {NAV_LABELS[t]||t}
          </button>
        ))}
      </div>

      {tab==="dashboard" && <Dashboard data={data} activeTabs={activeTabs}/>}
      {activeTabs.filter(t=>t!=="countries").map(k=>
        tab===k && <RegionTab key={k} regionKey={k} data={data} tog={tog} selAll={selAll} setTip={setTip}/>
      )}
      {tab==="countries" && activeTabs.includes("countries") && (
        <CountriesTab data={data} tog={tog} selAll={selAll} selCont={selCont} setTip={setTip}/>
      )}
      {tab==="settings" && (
        <SettingsTab
          data={data} setData={setData}
          activeTabs={activeTabs}
          setActiveTabs={tabs=>{
            setActiveTabs(tabs);
            setData(prev=>{ const nd={...prev,activeTabs:tabs}; persist(nd); return nd; });
          }}
        />
      )}
    </div>
  );
}
