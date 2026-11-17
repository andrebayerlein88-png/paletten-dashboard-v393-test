export function validateSnapshot(body){
 if(!body||typeof body!=='object'||!Number.isSafeInteger(body.revision)||body.revision<0)return 'Invalid revision';
 const s=body.state;
 if(!s||typeof s!=='object'||Array.isArray(s)||s.schemaVersion!==14)return 'Invalid schema version';
 for(const k of ['employees','palettes','loads','errors','audits','closures','exportPlans','kanbanProducts','kanbanMovements','replenishmentRequests','tdsCustomers','tdsPreparations','inboundDeliveries'])if(!Array.isArray(s[k]))return 'Invalid '+k;
 if(!s.settings||typeof s.settings!=='object')return 'Invalid settings';
 return null;
}
