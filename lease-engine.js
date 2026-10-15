// Pure policy model for fictional resources. This is not a server security boundary.
export const RESOURCES = [
 {id:'handbook',name:'Campus handbook',public:true,category:'PUBLIC',summary:'Campus services, library hours and research guidelines.',content:'Welcome to the campus knowledge hub. Library: 08:00–00:00. Research enquiries: contact the department office. All information in this demo is fictional.'},
 {id:'archive',name:'Research archive',category:'RESEARCH',summary:'Project notes and unpublished research. Approval required.',content:'FICTIONAL RESEARCH RECORD · Project Helix\nReview stage: internal\nNext milestone: laboratory validation\nAccess scope: read only.'},
 {id:'cloud',name:'Cloud operations',category:'INFRASTRUCTURE',summary:'Sample infrastructure reports. Approval required.',content:'FICTIONAL CLOUD REPORT · Sandbox environment\nService health: operational\nStorage utilisation: 42%\nNo Azure tenant is connected.'},
 {id:'lab',name:'Robotics lab',category:'ENGINEERING',summary:'Internal equipment and lab schedules. Approval required.',content:'FICTIONAL LAB RECORD · Robotics laboratory\nEquipment: training arm, optical bench\nNext supervised session: Monday, 10:00\nAccess scope: read only.'}
];
export const initialState=()=>({version:2,offset:0,lastClock:0,skipCleanup:false,requests:[],events:[]});
export function clock(s,wall=Date.now()){s.lastClock=Math.max(s.lastClock||0,wall+s.offset);return s.lastClock;}
export function record(s,type,actor,resource,detail,now){const e={id:globalThis.crypto.randomUUID(),type,actor,resource,detail,at:now};s.events.push(e);return e;}
export function request(s,actor,resource,purpose,duration,now){
 if(!RESOURCES.some(r=>r.id===resource&&!r.public))throw Error('Choose a protected resource.');
 if(!purpose?.trim()||purpose.trim().length>300)throw Error('Add a purpose (1–300 characters).');
 if(![60,300,3600,86400].includes(duration))throw Error('Choose a supported duration.');
 if(s.requests.some(r=>r.actor===actor&&r.resource===resource&&['pending','active','suspended'].includes(r.status)&&(!r.expiresAt||r.expiresAt>now)))throw Error('An open request already exists for this resource.');
 const r={id:globalThis.crypto.randomUUID(),actor,resource,purpose:purpose.trim(),duration,status:'pending',createdAt:now};s.requests.push(r);record(s,'REQUESTED',actor,resource,r.purpose,now);return r;
}
export function review(s,id,action,reason,duration,idleSeconds,now){
 const r=s.requests.find(r=>r.id===id);if(!r)throw Error('Request not found.');
 if(!reason?.trim()||reason.length>300)throw Error('Add a decision reason (1–300 characters).');
 if(['approve','deny'].includes(action)&&r.status!=='pending')throw Error('This request has already been reviewed.');
 if(action==='approve'){
  if(![60,300,3600,86400].includes(duration)||duration>r.duration)throw Error('Grant no longer than the requested duration.');
  if(![30,120,300].includes(idleSeconds))throw Error('Choose an inactivity limit.');
  Object.assign(r,{status:'active',approvedAt:now,expiresAt:now+duration*1000,lastActivity:now,idleSeconds,grantedDuration:duration});
 }else if(action==='deny')r.status='denied';
 else if(action==='suspend'||action==='revoke'){
  if(!['active','suspended'].includes(r.status))throw Error('Only an active or suspended lease can be changed.');
  r.status=action==='suspend'?'suspended':'revoked';
 }else throw Error('Unknown decision.');
 r.reason=reason.trim();record(s,action.toUpperCase(),r.actor,r.resource,r.reason,now);return r;
}
export function tick(s,now){
 let changed=false;
 for(const r of s.requests){
  if(r.status!=='active')continue;
  if(now>=r.expiresAt){if(!s.skipCleanup){r.status='expired';record(s,'EXPIRED',r.actor,r.resource,'Lease deadline reached; normal expiry worker completed.',now);changed=true;}continue;}
  if(now-r.lastActivity>=r.idleSeconds*1000){r.status='suspended';record(s,'IDLE_SUSPEND',r.actor,r.resource,'Inactivity threshold reached. Fresh approval is required after revocation.',now);changed=true;}
 }return changed;
}
export function access(s,actor,resource,now){
 const item=RESOURCES.find(r=>r.id===resource);if(!item)throw Error('Resource not found.');
 if(item.public){record(s,'PUBLIC_READ',actor,resource,'Public information opened.',now);return {allowed:true,content:item.content};}
 tick(s,now);
 const matches=s.requests.filter(r=>r.actor===actor&&r.resource===resource);
 const valid=matches.find(r=>r.status==='active'&&now<r.expiresAt&&now-r.lastActivity<r.idleSeconds*1000);
 if(valid){valid.lastActivity=now;record(s,'ALLOWED',actor,resource,'Read allowed: scope, lease deadline and inactivity checks passed.',now);return {allowed:true,content:item.content};}
 const r=matches.at(-1);let detail='No approved permission exists.';
 if(r?.expiresAt&&now>=r.expiresAt){detail=s.skipCleanup&&r.status==='active'?'Expiry cleanup failed; independent deadline check caught stale active access.':'Attempted access after the lease deadline.';r.status='blocked';}
 else if(r&&['suspended','revoked','blocked','expired'].includes(r.status)){detail=`Activity resumed after ${r.status}. Request denied and lease blocked.`;r.status='blocked';}
 record(s,'BLOCKED',actor,resource,detail,now);return {allowed:false,reason:detail};
}
