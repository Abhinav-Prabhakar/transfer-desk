// Seed the Transfer Desk dataset. Usage:
//   SANITY_PROJECT_TOKEN=sk... node seed/seed.mjs
if (!TOKEN) { console.error('set SANITY_PROJECT_TOKEN'); process.exit(1); }
// Seed Transfer Desk dataset via project token
const TOKEN = process.env.SANITY_PROJECT_TOKEN;
const PROJECT = process.env.SANITY_PROJECT_ID || 'tu8ddemy';
const API = `https://${PROJECT}.api.sanity.io/v2025-02-19/data/mutate/production`;

const currencies = [
  {_id:'cur-amex', _type:'pointsCurrency', name:'Amex Membership Rewards', issuer:'American Express', url:'https://www.americanexpress.com/en-us/rewards/membership-rewards/'},
  {_id:'cur-chase', _type:'pointsCurrency', name:'Chase Ultimate Rewards', issuer:'JPMorgan Chase', url:'https://ultimaterewards.chase.com/'},
  {_id:'cur-citi', _type:'pointsCurrency', name:'Citi ThankYou Points', issuer:'Citibank', url:'https://www.thankyou.com/'},
  {_id:'cur-cap1', _type:'pointsCurrency', name:'Capital One Miles', issuer:'Capital One', url:'https://www.capitalone.com/credit-cards/rewards/'},
  {_id:'cur-bilt', _type:'pointsCurrency', name:'Bilt Points', issuer:'Bilt Rewards', url:'https://www.biltrewards.com/'},
  {_id:'cur-wells', _type:'pointsCurrency', name:'Wells Fargo Rewards', issuer:'Wells Fargo', url:'https://www.wellsfargo.com/'},
  {_id:'cur-marriott', _type:'pointsCurrency', name:'Marriott Bonvoy', issuer:'Marriott', url:'https://www.marriott.com/loyalty.mi'},
];
const programs = [
  {_id:'prog-ua', _type:'program', name:'United MileagePlus', kind:'airline', alliance:'Star Alliance'},
  {_id:'prog-aa', _type:'program', name:'American AAdvantage', kind:'airline', alliance:'oneworld'},
  {_id:'prog-delta', _type:'program', name:'Delta SkyMiles', kind:'airline', alliance:'SkyTeam'},
  {_id:'prog-ba', _type:'program', name:'British Airways Executive Club (Avios)', kind:'airline', alliance:'oneworld'},
  {_id:'prog-fb', _type:'program', name:'Air France-KLM Flying Blue', kind:'airline', alliance:'SkyTeam'},
  {_id:'prog-ac', _type:'program', name:'Air Canada Aeroplan', kind:'airline', alliance:'Star Alliance'},
  {_id:'prog-vs', _type:'program', name:'Virgin Atlantic Flying Club', kind:'airline', alliance:'SkyTeam'},
  {_id:'prog-sq', _type:'program', name:'Singapore Airlines KrisFlyer', kind:'airline', alliance:'Star Alliance'},
  {_id:'prog-ana', _type:'program', name:'ANA Mileage Club', kind:'airline', alliance:'Star Alliance'},
  {_id:'prog-ek', _type:'program', name:'Emirates Skywards', kind:'airline', alliance:'none'},
  {_id:'prog-ey', _type:'program', name:'Etihad Guest', kind:'airline', alliance:'none'},
  {_id:'prog-ke', _type:'program', name:'Korean Air SkyPass', kind:'airline', alliance:'SkyTeam'},
  {_id:'prog-am', _type:'program', name:'Aeromexico Rewards', kind:'airline', alliance:'SkyTeam'},
  {_id:'prog-as', _type:'program', name:'Alaska Airlines Mileage Plan', kind:'airline', alliance:'oneworld'},
  {_id:'prog-jb', _type:'program', name:'JetBlue TrueBlue', kind:'airline', alliance:'none'},
  {_id:'prog-wn', _type:'program', name:'Southwest Rapid Rewards', kind:'airline', alliance:'none'},
  {_id:'prog-tk', _type:'program', name:'Turkish Airlines Miles&Smiles', kind:'airline', alliance:'Star Alliance'},
  {_id:'prog-hyatt', _type:'program', name:'World of Hyatt', kind:'hotel'},
  {_id:'prog-hilton', _type:'program', name:'Hilton Honors', kind:'hotel'},
  {_id:'prog-mb', _type:'program', name:'Marriott Bonvoy (hotel side)', kind:'hotel'},
  {_id:'prog-ihg', _type:'program', name:'IHG One Rewards', kind:'hotel'},
  {_id:'prog-wyndham', _type:'program', name:'Wyndham Rewards', kind:'hotel'},
  {_id:'prog-choice', _type:'program', name:'Choice Privileges', kind:'hotel'},
];
// claims: each asserts a transfer relationship state as of a date, from a named source.
// Deliberately includes stale sources contradicting current ones — that is the point of the demo.
const claim = (id, from, to, ratio, status, asOf, sourceName, sourceType, sourceUrl, notes) => ({
  _id:'claim-'+id, _type:'transferClaim',
  from:{_ref:'cur-'+from, _type:'reference'}, to:{_ref:'prog-'+to, _type:'reference'},
  ratio, status, asOf, source:{name:sourceName, type:sourceType, url:sourceUrl}, notes});
const claims = [
  // ---- Chase -> Korean Air SkyPass: REMOVED 2018; stale blogs still claim it
  claim('chase-ke-official','chase','ke','not offered','inactive','2026-09-01','Chase Ultimate Rewards partner list','official','https://ultimaterewards.chase.com/','Korean Air SkyPass no longer appears on the current partner list.'),
  claim('chase-ke-removed','chase','ke','1:1','removed','2026-09-01','The Points Guy - Chase transfer partners (updated)','secondary','https://thepointsguy.com/guide/chase-transfer-partners/','SkyPass was removed as a Chase transfer partner in 2018.'),
  claim('chase-ke-stale','chase','ke','1:1','active','2018-07-30','MileValue blog (archived snapshot)','archived','https://milevalue.com/','Old guide still lists instant 1:1 transfers to SkyPass.'),
  // ---- Bilt -> American: REMOVED June 2024
  claim('bilt-aa-official','bilt','aa','not offered','inactive','2026-09-01','Bilt app transfer partner list','official','https://www.biltrewards.com/','American AAdvantage is absent from the current Bilt transfer partner list.'),
  claim('bilt-aa-removed','bilt','aa','1:1','removed','2024-06-24','View from the Wing','secondary','https://viewfromthewing.com/','Bilt ended AAdvantage transfers June 24, 2024.'),
  claim('bilt-aa-stale','bilt','aa','1:1','active','2023-11-10','Frequent Miler (archived)','archived','https://frequentmiler.com/','Archived guide from before the cutoff still lists AA as a Bilt partner.'),
  // ---- Citi -> AA: ADDED July 2024; older guides say impossible
  claim('citi-aa-official','citi','aa','1:1','active','2026-09-01','Citi ThankYou transfer page','official','https://www.thankyou.com/','American Airlines AAdvantage is listed as a current Citi transfer partner.'),
  claim('citi-aa-added','citi','aa','1:1','added','2024-07-28','The Points Guy - Citi adds AA','secondary','https://thepointsguy.com/','Citi added AAdvantage as a transfer partner in July 2024.'),
  claim('citi-aa-stale','citi','aa','not offered','inactive','2023-05-15','Upgraded Points (archived)','archived','https://upgradedpoints.com/','Pre-2024 guides state Citi has no AA transfer option.'),
  // ---- Amex -> Aeromexico: ratio devalued 1:1.6 -> 1:1, then removed
  claim('amex-am-official','amex','am','not offered','inactive','2026-09-01','Amex MR transfer partners page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/','Aeromexico no longer appears on the Amex partner list.'),
  claim('amex-am-deval','amex','am','1:1','removed','2023-08-01','LoyaltyLobby','secondary','https://www.loyaltylobby.com/','Aeromexico transfers first devalued from 1:1.6 to 1:1, then the partner was removed.'),
  claim('amex-am-stale','amex','am','1:1.6','active','2019-03-01','One Mile at a Time (archived)','archived','https://onemileatatime.com/','Archived guide lists 1000 MR = 1600 Aeromexico points.'),
  // ---- Cap1 ratio: old 2:1.5 vs current 1:1 for most partners
  claim('cap1-tk-official','cap1','tk','1:1','active','2026-09-01','Capital One transfer page','official','https://www.capitalone.com/','Most partners including Miles&Smiles now transfer 1:1.'),
  claim('cap1-tk-stale','cap1','tk','2:1.5','active','2020-12-01','Doctor of Credit (archived)','archived','https://www.doctorofcredit.com/','Legacy guides cite the old 2:1.5 ratio that applied to the original partner list.'),
  // ---- Amex -> Hilton: standard 1:2, blogs cite 1:1 promos
  claim('amex-hilton-official','amex','hilton','1:2','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/','Standard ratio 1000 MR = 2000 Hilton Honors.'),
  claim('amex-hilton-stale','amex','hilton','1:1','active','2017-06-01','Outdated forum wiki','archived','https://www.flyertalk.com/','An old wiki still shows 1:1 from a targeted promo era.'),
  // ---- current, non-conflicting anchor claims
  claim('chase-ua','chase','ua','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/','Instant transfers.'),
  claim('chase-hyatt','chase','hyatt','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/','Near-instant; best hotel transfer value.'),
  claim('chase-ba','chase','ba','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/',''),
  claim('amex-ba','amex','ba','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/','Usually posts within a day.'),
  claim('amex-fb','amex','fb','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/',''),
  claim('amex-delta','amex','delta','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/',''),
  claim('amex-ana','amex','ana','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/','Transfers take ~48h, plan ahead.'),
  claim('amex-vs','amex','vs','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/',''),
  claim('amex-ek','amex','ek','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/',''),
  claim('amex-sq','amex','sq','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/',''),
  claim('amex-ac','amex','ac','1:1','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/',''),
  claim('amex-jb','amex','jb','5:4','active','2026-09-01','Amex MR transfer page','official','https://www.americanexpress.com/en-us/rewards/membership-rewards/transfer-points/','250 MR = 200 TrueBlue, a devalued ratio.'),
  claim('chase-sq','chase','sq','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/',''),
  claim('chase-vs','chase','vs','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/',''),
  claim('chase-wn','chase','wn','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/',''),
  claim('chase-ihg','chase','ihg','1:1','active','2026-09-01','Chase Ultimate Rewards','official','https://ultimaterewards.chase.com/','Poor value vs Hyatt.'),
  claim('citi-vs','citi','vs','1:1','active','2026-09-01','Citi ThankYou','official','https://www.thankyou.com/',''),
  claim('citi-fb','citi','fb','1:1','active','2026-09-01','Citi ThankYou','official','https://www.thankyou.com/',''),
  claim('citi-ey','citi','ey','1:1','active','2026-09-01','Citi ThankYou','official','https://www.thankyou.com/',''),
  claim('cap1-ac','cap1','ac','1:1','active','2026-09-01','Capital One','official','https://www.capitalone.com/',''),
  claim('cap1-ba','cap1','ba','1:1','active','2026-09-01','Capital One','official','https://www.capitalone.com/',''),
  claim('cap1-ey','cap1','ey','1:1','active','2026-09-01','Capital One','official','https://www.capitalone.com/',''),
  claim('cap1-wyndham','cap1','wyndham','1:1','active','2026-09-01','Capital One','official','https://www.capitalone.com/',''),
  claim('bilt-hyatt','bilt','hyatt','1:1','active','2026-09-01','Bilt app','official','https://www.biltrewards.com/',''),
  claim('bilt-ua','bilt','ua','1:1','active','2026-09-01','Bilt app','official','https://www.biltrewards.com/',''),
  claim('bilt-as','bilt','as','1:1','active','2026-09-01','Bilt app','official','https://www.biltrewards.com/','Alaska is a rare, valuable Bilt exclusive.'),
  claim('bilt-ac','bilt','ac','1:1','active','2026-09-01','Bilt app','official','https://www.biltrewards.com/',''),
  claim('wells-fb','wells','fb','1:1','active','2026-09-01','Wells Fargo Rewards','official','https://www.wellsfargo.com/','Wells launched transfers in 2024.'),
  claim('mb-universal','marriott','ua','3:1','active','2026-09-01','Marriott Bonvoy airline transfer page','official','https://www.marriott.com/loyalty/redeem/travel.mi','Marriott points convert to most airline miles 3:1, plus 5,000 bonus miles per 60,000 points.'),
];
// stale Marriott claim (SPG-era)
claims.push(claim('mb-spg-stale','marriott','delta','1:1','active','2017-02-01','SPG-era blog (archived)','archived','https://thepointsguy.com/','Pre-merger guides describe SPG 1:1 airline transfers, which no longer exists.'));

// scenario docs = demo questions with expected behaviour
const scenarios = [
  {_id:'scen-ke', _type:'scenario', question:'Can I transfer Chase Ultimate Rewards to Korean Air SkyPass?', expected:'No. Removed 2018. KB must surface the stale blog claim AND the current official list side by side.', tags:['removed-partner','stale-source']},
  {_id:'scen-bilt-aa', _type:'scenario', question:'Transfer Bilt points to American Airlines?', expected:'No since June 2024. Old guides disagree — surface both.', tags:['removed-partner']},
  {_id:'scen-citi-aa', _type:'scenario', question:'Transfer Citi ThankYou points to American?', expected:'Yes — added July 2024. Older guides saying impossible are stale.', tags:['added-partner']},
  {_id:'scen-amex-am', _type:'scenario', question:'Amex to Aeromexico?', expected:'Not any more — was 1:1.6, devalued, then removed.', tags:['removed-partner','ratio-change']},
  {_id:'scen-cap1', _type:'scenario', question:'Do Capital One miles transfer at 2:1.5?', expected:'No — current cards transfer 1:1 to most partners.', tags:['ratio-change']},
  {_id:'scen-hyatt', _type:'scenario', question:'Best hotel transfer for Chase points?', expected:'Hyatt 1:1 — contrast with poor-value IHG 1:1.', tags:['recommendation']},
];

const docs = [...currencies, ...programs, ...claims, ...scenarios];
const mutations = docs.map(d => ({createOrReplace: d}));
const r = await fetch(API, {method:'POST', headers:{Authorization:`Bearer ${TOKEN}`,'Content-Type':'application/json'}, body: JSON.stringify({mutations})});
console.log(r.status, (await r.text()).slice(0,600));
const q = await fetch(`https://${PROJECT}.api.sanity.io/v2025-02-19/data/query/production?query=count(*)`, {headers:{Authorization:`Bearer ${TOKEN}`}});
console.log('doc count:', await q.text());
