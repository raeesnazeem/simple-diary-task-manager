const { createStore } = require('zustand/vanilla');
const { persist, createJSONStorage } = require('zustand/middleware');

const storage = {
  getItem: () => JSON.stringify({ state: { a: 2, data: 'hello' }, version: 0 }),
  setItem: () => {},
  removeItem: () => {}
};

const store = createStore(
  persist(
    () => ({ a: 1 }),
    {
      name: 'test',
      storage: createJSONStorage(() => storage),
      merge: (persistedState, currentState) => {
        console.log('persistedState:', persistedState);
        return { ...currentState, ...persistedState };
      }
    }
  )
);
