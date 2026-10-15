import {initialState,clock,tick} from './lease-engine.js';
export const KEY='accesslease-lifecycle-v2';
export function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s?.version===2&&Array.isArray(s.requests)&&Array.isArray(s.events))return s;}catch{}return initialState();}
export function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new Event('lease-change'));}
export function mutate(fn){const s=load();const now=clock(s);tick(s,now);const result=fn(s,now);save(s);return result;}
