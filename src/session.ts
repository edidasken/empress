import {useEffect,useState} from 'react';

export const sessionPrefix='empress-demo:v1:';

export function readSessionValue<T>(raw:string|null,fallback:T):T{
  if(raw===null)return fallback;
  try{return JSON.parse(raw) as T}catch{return fallback}
}

export function clearEmpressSession(storage:Pick<Storage,'key'|'length'|'removeItem'>=window.sessionStorage){
  const keys=Array.from({length:storage.length},(_,index)=>storage.key(index)).filter((key):key is string=>Boolean(key?.startsWith(sessionPrefix)));
  keys.forEach(key=>storage.removeItem(key));
}

export function useSessionState<T>(key:string,initial:T|(()=>T)){
  const storageKey=sessionPrefix+key;
  const fallback=()=>typeof initial==='function'?(initial as ()=>T)():initial;
  const[state,setState]=useState<T>(()=>{
    if(typeof window==='undefined')return fallback();
    return readSessionValue(window.sessionStorage.getItem(storageKey),fallback());
  });
  useEffect(()=>{window.sessionStorage.setItem(storageKey,JSON.stringify(state))},[state,storageKey]);
  return[state,setState] as const;
}
