const { createStore } = require('zustand/vanilla');
const { persist, createJSONStorage } = require('zustand/middleware');

const store = createStore(
  persist(
    () => ({
      data: {},
      activeDate: '2026-07-02'
    }),
    {
      name: 'simple-diary-storage',
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          data: persistedState?.data || currentState.data,
          activeDate: persistedState?.activeDate || currentState.activeDate,
        };
      }
    }
  )
);
console.log(store.getState());
