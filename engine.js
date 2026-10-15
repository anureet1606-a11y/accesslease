export const BASE_DATE = '2026-10-15';
const day = 86400000;
export const dateValue = s => Date.parse(`${s}T00:00:00Z`);
export const addDays = (s,n) => new Date(dateValue(s)+n*day).toISOString().slice(0,10);
export function demoData(){
 return {
  identities:[{id:'u1',name:'Maya Kapoor',type:'Visiting researcher'},{id:'u2',name:'Arjun Mehta',type:'Event volunteer'},{id:'u3',name:'Sara Ahmed',type:'External contractor'},{id:'u4',name:'Dev Patel',type:'Lab assistant'},{id:'u5',name:'Isha Rao',type:'Faculty'},{id:'u6',name:'Nikhil Sen',type:'Student researcher'}],
  roles:[{id:'research',name:'Research fellows',members:['u1','u6']},{id:'events',name:'Event operations',members:['u2']},{id:'lab',name:'Lab operators',members:['u4','u5']}],
  resources:[{id:'archive',name:'Research archive',sensitivity:'High'},{id:'cloud',name:'Cloud console',sensitivity:'Critical'},{id:'finance',name:'Finance vault',sensitivity:'Critical'},{id:'events',name:'Event workspace',sensitivity:'Medium'},{id:'lab',name:'Robotics lab',sensitivity:'High'}],
  policy:{id:'INST-2026.1',name:'Institutional temporary access policy',rules:[{type:'Visiting researcher',resource:'archive',allowed:['read']},{type:'Student researcher',resource:'archive',allowed:['read']},{type:'Event volunteer',resource:'events',allowed:['read','write']},{type:'External contractor',resource:'cloud',allowed:['read']},{type:'Lab assistant',resource:'lab',allowed:['read','write']},{type:'Faculty',resource:'lab',allowed:['read','write','admin']},{type:'Faculty',resource:'archive',allowed:['read','write']}]},
  grants:[
   {id:'G-101',subject:'research',subjectType:'role',resource:'archive',permissions:['read'],owner:'Dr. Kavita Sharma',purpose:'Summer research fellowship',expires:'2026-09-30',status:'active'},
   {id:'G-102',subject:'u3',subjectType:'identity',resource:'cloud',permissions:['read','write','admin'],owner:'IT Operations',purpose:'Cloud migration support',expires:'2026-11-01',status:'active'},
   {id:'G-103',subject:'events',subjectType:'role',resource:'events',permissions:['read','write'],owner:'',purpose:'Annual campus festival',expires:'2026-10-12',status:'active'},
   {id:'G-104',subject:'u2',subjectType:'identity',resource:'finance',permissions:['read'],owner:'',purpose:'',expires:null,status:'active'},
   {id:'G-105',subject:'lab',subjectType:'role',resource:'lab',permissions:['read','write'],owner:'Prof. R. Bose',purpose:'Robotics practicals',expires:'2026-10-20',status:'active'},
   {id:'G-106',subject:'u5',subjectType:'identity',resource:'archive',permissions:['read','write'],owner:'Research Office',purpose:'Publication review',expires:'2026-12-01',status:'active'},
   {id:'G-107',subject:'u4',subjectType:'identity',resource:'archive',permissions:['read'],owner:'Research Office',purpose:'Delegated archive review',expires:'2026-11-15',status:'active',delegatedFrom:'G-106'},
   {id:'G-108',subject:'u1',subjectType:'identity',resource:'archive',permissions:['read'],owner:'Dr. Kavita Sharma',purpose:'Follow-up publication',expires:'2026-11-10',status:'active'}
  ]
 };
}
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(dateValue(s))&&new Date(dateValue(s)).toISOString().slice(0,10)===s;
export function validate(data){
 if(!data||typeof data!=='object')throw Error('Expected a dataset object.');
 for(const key of ['identities','roles','resources','grants'])if(!Array.isArray(data[key])||data[key].length>200)throw Error(`${key} must be an array with at most 200 entries.`);
 if(!data.identities.length||!data.resources.length)throw Error('Include at least one identity and resource.');
 if(!data.policy||typeof data.policy.id!=='string'||!Array.isArray(data.policy.rules)||data.policy.rules.length>500)throw Error('Include policy.id and policy.rules (maximum 500 rules).');
 for(const key of ['identities','roles','resources','grants']){
  const ids=new Set();for(const row of data[key]){if(!row||typeof row.id!=='string'||!row.id||row.id.length>80||ids.has(row.id))throw Error(`${key} IDs must be unique nonempty strings (max 80 characters).`);ids.add(row.id);}
 }
 const ids=new Set(data.identities.map(x=>x.id)), roles=new Set(data.roles.map(x=>x.id)), resources=new Set(data.resources.map(x=>x.id)), grants=new Map(data.grants.map(x=>[x.id,x]));
 for(const x of [...data.identities,...data.roles,...data.resources])if(typeof x.name!=='string'||!x.name||x.name.length>150)throw Error('Names must be nonempty strings, max 150 characters.');
 for(const x of data.identities)if(typeof x.type!=='string'||x.type.length>150)throw Error('Each identity needs a type.');
 for(const x of data.resources)if(!['Medium','High','Critical'].includes(x.sensitivity))throw Error('Resource sensitivity must be Medium, High or Critical.');
 for(const x of data.roles)if(!Array.isArray(x.members)||x.members.length>200||x.members.some(id=>!ids.has(id))||new Set(x.members).size!==x.members.length)throw Error('Role members must be unique known identity IDs.');
 const perms=p=>Array.isArray(p)&&p.length>0&&p.length<=3&&new Set(p).size===p.length&&p.every(v=>['read','write','admin'].includes(v));
 const keys=new Set();for(const r of data.policy.rules){const k=JSON.stringify([r.type,r.resource]);if(typeof r.type!=='string'||!resources.has(r.resource)||!perms(r.allowed)||keys.has(k))throw Error('Policy rules need a type, known resource and unique allowed permissions; duplicate type/resource rules are not supported.');keys.add(k);}
 for(const g of data.grants){
  if(!['identity','role'].includes(g.subjectType)||!(g.subjectType==='role'?roles:ids).has(g.subject)||!resources.has(g.resource)||!perms(g.permissions)||!['active','revoked'].includes(g.status))throw Error(`Invalid subject, resource, permissions or status in ${g.id}.`);
  for(const f of ['owner','purpose'])if(g[f]!=null&&(typeof g[f]!=='string'||g[f].length>500))throw Error(`${g.id}: ${f} must be text (max 500 characters) or null.`);
  if(g.expires!=null&&g.expires!==''&&!isDate(g.expires))throw Error(`${g.id}: expiry must be YYYY-MM-DD or null.`);
  if(g.delegatedFrom!=null){if(typeof g.delegatedFrom!=='string'||!grants.has(g.delegatedFrom))throw Error(`${g.id}: unknown delegation source.`);const seen=new Set([g.id]);let p=g;while(p.delegatedFrom){if(seen.has(p.delegatedFrom))throw Error('Delegation cycles are not allowed.');seen.add(p.delegatedFrom);p=grants.get(p.delegatedFrom);if(!p)throw Error('Unknown delegation source.');}}
 }
 return data;
}
export function recipients(data,g){return g.subjectType==='role'?data.roles.find(r=>r.id===g.subject).members:[g.subject];}
// Active is the simulated system state. An expired grant remains effective until revoked.
export function effective(data){return data.grants.filter(g=>g.status==='active').flatMap(g=>recipients(data,g).map(id=>({identity:id,resource:g.resource,permissions:[...g.permissions],grant:g.id,path:g.delegatedFrom?'delegated':g.subjectType==='role'?'inherited':'direct'})));}
export function audit(data,asOf){
 const results=[];
 for(const g of data.grants.filter(g=>g.status==='active')){
  const resource=data.resources.find(r=>r.id===g.resource), users=recipients(data,g).map(id=>data.identities.find(u=>u.id===id));
  const add=(code,title,classification,evidence,recommendation)=>results.push({id:`${g.id}:${code}`,grant:g.id,code,title,classification,evidence,recommendation,resource:resource.name,users:users.map(u=>u.name),score:(classification==='Confirmed violation'?60:30)+({Critical:25,High:15,Medium:5}[resource.sensitivity])+(code==='EXPIRED'?10:0)});
  if(g.expires&&dateValue(g.expires)<=dateValue(asOf))add('EXPIRED','Access outlived its lease','Confirmed violation',`Expiry ${g.expires} is on or before the simulated date ${asOf}; the grant is still active. ${users.length} identity/identities retain access.`, 'Revoke the stale grant, or explicitly renew with a documented reason.');
  const excessive=users.flatMap(u=>{const rule=data.policy.rules.find(r=>r.type===u.type&&r.resource===g.resource);return rule?g.permissions.filter(p=>!rule.allowed.includes(p)).map(p=>`${u.name}: ${p} is outside [${rule.allowed.join(', ')}]`):[];});
  if(excessive.length)add('SCOPE','Permissions exceed policy','Confirmed violation',excessive.join('; '),'Reduce permissions to the permitted scope or revoke this grant.');
  const unknown=users.filter(u=>!data.policy.rules.some(r=>r.type===u.type&&r.resource===g.resource));
  if(unknown.length)add('POLICY','Policy coverage is missing','Needs review',`No type/resource rule exists for ${unknown.map(u=>u.name).join(', ')} on ${resource.name}. Absence of a rule is not proof of a violation.`, 'Ask the policy owner to establish an applicable rule.');
  if(!g.owner?.trim())add('OWNER','No accountable owner','Needs review',`${g.id} has no owner recorded. Ownership cannot be inferred from the recipient.`, 'Assign an accountable owner before making a policy decision.');
  if(!g.purpose?.trim())add('PURPOSE','Business purpose is missing','Needs review',`${g.id} has no documented justification.`, 'Request a documented business purpose.');
  if(!g.expires)add('EXPIRY','Lease has no expiry','Needs review',`${g.id} has no expiry metadata; its intended duration is unknown.`, 'Confirm the intended duration and record an expiry.');
  if(g.delegatedFrom){const chain=[];let p=g;while(p.delegatedFrom){p=data.grants.find(x=>x.id===p.delegatedFrom);chain.push(p);}const bad=chain.filter(p=>p.status!=='active'||(p.expires&&dateValue(p.expires)<=dateValue(asOf))||p.resource!==g.resource||g.permissions.some(v=>!p.permissions.includes(v))||(g.expires&&p.expires&&dateValue(g.expires)>dateValue(p.expires)));if(bad.length)add('DELEGATION','Delegation exceeds its source','Confirmed violation',`Source grant(s) ${bad.map(p=>p.id).join(', ')} are revoked, expired, for a different resource, narrower in scope, or expire before the delegated grant.`, 'Revoke or align the delegation with every source grant.');}
 }
 return results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export function applyReview(data,grantId,action,fields,asOf){
 const next=structuredClone(data),g=next.grants.find(x=>x.id===grantId);if(!g)throw Error('Grant not found.');
 const before=structuredClone(g);if(action==='revoke')g.status='revoked';
 else if(action==='renew'){if(!isDate(fields.expires)||dateValue(fields.expires)<=dateValue(asOf))throw Error('Choose an expiry after the simulated date.');g.expires=fields.expires;}
 else if(action==='metadata'){if(!fields.owner?.trim()||!fields.purpose?.trim())throw Error('Provide both an owner and purpose.');g.owner=fields.owner.trim();g.purpose=fields.purpose.trim();}
 else if(action==='scope'){if(!fields.permissions?.length)throw Error('Select at least one permission.');g.permissions=fields.permissions;}
 else throw Error('Unknown action.');validate(next);return {data:next,before,after:structuredClone(g)};
}
