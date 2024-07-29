import { createMachine, createActor } from 'xstate';

const toggleMachine = createMachine({
  initial: 'inactive',
  states: {
    inactive: {
      on: {
        toggle: {
          target: 'active'
        }
      }
    },
    active: {
      on: {
        toggle: {
          target: 'inactive'
        }
      }
    }
  }
});

const toggleActor = createActor(toggleMachine);
toggleActor.subscribe(snapshot => {
  console.log(snapshot.value); // 'inactive' or 'active'
});
toggleActor.start();
// logs 'inactive'

toggleActor.send({ type: 'toggle' });
// logs 'active'

toggleActor.send({ type: 'toggle' });
// logs 'inactive'

export default toggleMachine;