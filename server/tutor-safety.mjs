export function safeAgent(a){return a.platformSettings?.auth?.enableAuth===true && !a.platformSettings?.auth?.allowlist?.length && a.conversationConfig?.agent?.language==='es';}
export function freeAccount(s){return s.tier==='free' && s.maxCreditLimitExtension===0 && s.allowedToExtendCharacterLimit!==true;}
export const topics={cafe:'Pedir en un café: pedido, preguntas y pago.',weekend:'Proponer un plan de fin de semana y acordar hora.',free:'Conversación cotidiana sobre intereses o el día del alumno.'};
