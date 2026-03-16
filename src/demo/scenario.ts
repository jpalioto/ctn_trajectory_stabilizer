import { StabilizingExecutor } from '../engine/executor.js';
import { toolRegistry } from '../tools/registry.js';
import { transitions } from '../engine/controlFlow.js';
import { ObjectStore } from '../store/objectStore.js';
import { State } from '../types/core.js';
import { ToolCallProposal, StepResult } from '../types/tools.js';

async function runDemo() {
  const store = new ObjectStore();
  const executor = new StabilizingExecutor(toolRegistry, transitions, store);
  let currentState: State = 'START';

  console.log('--- Scenario 1: Invalid Transition Attempt ---');
  const invalidTransition: ToolCallProposal = {
    toolName: 'send_text',
    args: { phoneNumber: '+15551234567', message: 'Hello' }
  };
  const res1 = await executor.executeStep(currentState, invalidTransition);
  printResult(res1);

  console.log('\n--- Scenario 2: Semantic Mismatch (PERSON_NAME as PHONE_NUMBER) ---');
  // We need to be in the correct state for semantic validation to trigger after control-flow
  // So let's skip to PHONE_RESOLVED manually for this specific demo scenario
  const res2 = await executor.executeStep('PHONE_RESOLVED', {
    toolName: 'send_text',
    args: { phoneNumber: 'John Smith', message: 'Hello' }
  });
  printResult(res2);

  console.log('\n--- Scenario 3: Repaired Valid Chain ---');
  currentState = 'START';
  
  const steps: ToolCallProposal[] = [
    { toolName: 'lookup_customer', args: { name: 'John Smith' } },
    { toolName: 'get_phone_number', args: { customerId: 'cust_1' } },
    { toolName: 'send_text', args: { phoneNumber: '+15551234567', message: 'Confirmed!' } }
  ];

  for (const step of steps) {
    console.log(`\nExecuting: ${step.toolName}...`);
    const res = await executor.executeStep(currentState, step);
    printResult(res);
    if (res.ok) {
      currentState = res.nextState;
    } else {
      break;
    }
  }

  console.log(`\nFinal State: ${currentState}`);
}

function printResult(res: StepResult) {
  if (res.ok) {
    console.log(`✅ Success! Next State: ${res.nextState}`);
    console.log(`   Result: ${JSON.stringify(res.rawResult)}`);
  } else {
    console.log(`❌ Blocked! Code: ${res.error.code}`);
    console.log(`   Message: ${res.error.message}`);
    if (res.error.repairHint) {
      console.log(`   Repair Hint: ${res.error.repairHint}`);
    }
    if (res.error.allowedNextTools) {
      console.log(`   Allowed Next Tools: ${res.error.allowedNextTools.join(', ')}`);
    }
  }
}

runDemo().catch(console.error);
