import {test} from 'node:test';import assert from 'node:assert/strict';
import {safeAgent,freeAccount,sessionTarget} from '../server/tutor-safety.mjs';
const agent={platformSettings:{auth:{enableAuth:true}},conversationConfig:{agent:{language:'es'}}};
test('Only authenticated Spanish agent is admitted; no custom session/time caps',()=>{assert.ok(safeAgent(agent));assert.ok(safeAgent({...agent,conversationConfig:{agent:{language:'es'},conversation:{maxDurationSeconds:1800}}}));assert.ok(!safeAgent({...agent,platformSettings:{auth:{enableAuth:false}}}));assert.ok(!safeAgent({...agent,conversationConfig:{agent:{language:'en'}}}));});
test('Only free account with overages disabled is admitted',()=>{assert.ok(freeAccount({tier:'free',maxCreditLimitExtension:0,allowedToExtendCharacterLimit:false}));for(const x of [{tier:'creator',maxCreditLimitExtension:0},{tier:'free',maxCreditLimitExtension:'unlimited'},{tier:'free',maxCreditLimitExtension:0,allowedToExtendCharacterLimit:true}])assert.ok(!freeAccount(x));});

test('Published branch remains usable without version ID; explicit versions are pinned',()=>{assert.deepEqual(sessionTarget({versionId:null},'agent','branch'),{agentId:'agent',branchId:'branch',includeConversationId:true});assert.equal(sessionTarget({versionId:'published-v1'},'agent','branch').versionId,'published-v1');});
