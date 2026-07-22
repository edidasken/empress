import{beforeEach,describe,expect,it}from'vitest';
import{clearEmpressSession,readSessionValue,sessionPrefix}from'../src/session';

describe('synthetic session persistence',()=>{
  beforeEach(()=>sessionStorage.clear());

  it('restores valid state and safely falls back from malformed data',()=>{
    expect(readSessionValue('{"done":true}',{done:false})).toEqual({done:true});
    expect(readSessionValue('not json',{done:false})).toEqual({done:false});
    expect(readSessionValue(null,{done:false})).toEqual({done:false});
  });

  it('clears only Empress synthetic-session values',()=>{
    sessionStorage.setItem(`${sessionPrefix}today`,'saved');
    sessionStorage.setItem('unrelated-app','keep');
    clearEmpressSession();
    expect(sessionStorage.getItem(`${sessionPrefix}today`)).toBeNull();
    expect(sessionStorage.getItem('unrelated-app')).toBe('keep');
  });
});
