import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { generateBase64 } from "@/tools/compute/dev/base64";
import { decodeJwt } from "@/tools/compute/dev/jwt-decoder";
import { testRegex } from "@/tools/compute/dev/regex-tester";
import { convertTimestamp } from "@/tools/compute/dev/timestamp-converter";
import { generateUrlEncodeDecode } from "@/tools/compute/dev/url-encoder-decoder";
import { findAndReplace } from "@/tools/compute/text/find-and-replace";
import { jsonToCsv } from "@/tools/compute/text/json-to-csv";
import { csvToJson } from "@/tools/compute/text/csv-to-json";
import { generateDiff } from "@/tools/compute/text/text-diff-checker";
import { removeDuplicateLines } from "@/tools/compute/text/remove-duplicate-lines";
// import { subject } from "node:process";
import { testSubjectLine } from "@/tools/compute/marketing/subject-line";
import { computeEngagementRate } from "@/tools/compute/marketing/engagement-rate";
import { computeCpm } from "@/tools/compute/marketing/cpm";
import { computeRoas } from "@/tools/compute/marketing/roas";
import { analyzeHeadline } from "@/tools/compute/marketing/headline";
import { generateRobotsTxt } from "@/tools/compute/marketing/robots-txt";
import { buildUtmUrl } from "@/tools/compute/marketing/utm-builder";

const r = (fn:any, v:any)=>{const o=fn(v); return "error" in o ? {ERROR:o.error} : o;};
const out: string[] = [];
const P = (label:string, val:any)=>out.push(`${label}=${JSON.stringify(val)}`);
describe("probe", () => {
  it("probe all", () => {
    P("b64 empty-space", r(generateBase64,{text:"",mode:"encode"}));
    P("b64 trailing ws encode", r(generateBase64,{text:"abc ",mode:"encode"}));
    // jwt with valid data
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UifQ.sig";
    P("jwt", r(decodeJwt,{token:jwt}));
    // regex empty-match
    P("regex empty", r(testRegex,{pattern:"a*",flags:"",text:"bbb"}));
    P("regex flags dup", r(testRegex,{pattern:"a",flags:"gg",text:"aaa"}));
    // timestamp
    P("ts seconds", r(convertTimestamp,{input:"1751712000"}));
    P("ts now-empty", (()=>{const o=convertTimestamp({input:""}); if("error" in o)return {ERROR:o.error}; return o.results.map(x=>x.label+":"+x.value);})());
    // F&R plain $1
    P("fr plain dollar", r(findAndReplace,{text:"a1 a2",find:"a",replace:"$1"}));
    P("fr wholeword punct", r(findAndReplace,{text:"cat, cats cat",find:"cat",replace:"dog",wholeWord:true,caseSensitive:true}));
    // json-to-csv object value + quoting
    P("j2c nested", r(jsonToCsv,{json:'[{"name":"A.B"},{"name":"a,b"}]'}));
    // csv-to-json escaped quotes
    P("c2j escquote", r(csvToJson,{csv:'name,note\nA,"say ""hi"""',header:true}));
    P("c2j semicolon", r(csvToJson,{csv:"name;age\nA;30",delimiter:"semicolon",header:true}));
    // diff empty
    P("diff both empty", r(generateDiff,{original:"",changed:""}));
    P("diff one empty", r(generateDiff,{original:"a\nb",changed:""}));
    // dedupe
    P("dedupe", r(removeDuplicateLines,{text:"a\nb\nA\n",caseInsensitive:true,trim:true}));
    // subject line
    P("subject emoji", r(testSubjectLine,{subject:"Hi there 👋 how are you today friend"}));
    P("subject caps", r(testSubjectLine,{subject:"IMPORTANT update available for you"}));
    // engagement
    P("engage", r(computeEngagementRate,{engagements:"1000",followers:"5000",posts:"4"}));
    // cpm
    P("cpm only impressions", r(computeCpm,{cost:"500",impressions:"100000"}));
    // roas
    P("roas", r(computeRoas,{spend:"0",revenue:"1000"}));
    // headline
    P("headline", r(analyzeHeadline,{headline:"Best Free Tools to Save Money in 2026?"}));
    // robots crawl-delay
    P("robots delay", r(generateRobotsTxt,{mode:"allow",crawlDelay:"5",sitemap:"https://x.in/s"}));
    P("robots delay bad", r(generateRobotsTxt,{mode:"allow",crawlDelay:"-2"}));
    // utm
    P("utm", r(buildUtmUrl,{url:"https://x.in/p?a=1",source:"s",medium:"m",campaign:"c"}));
    writeFileSync("/tmp/probe2.txt", out.join("\n"));
  });
});
