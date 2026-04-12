import { create } from 'zustand';

const PRESETS = {
  'Event Loop Order': `console.log('1 — sync');
setTimeout(() => console.log('4 — macrotask'), 0);
Promise.resolve().then(() => console.log('3 — microtask'));
console.log('2 — sync');`,

  'Classic Closure': `function makeCounter() {
  let count = 0;
  return function increment() {
    count++;
    console.log('Count:', count);
  };
}
const counter = makeCounter();
counter();
counter();
counter();`,

  'Promise Chain': `Promise.resolve(1)
  .then(val => { console.log('Step 1:', val); return val + 1; })
  .then(val => { console.log('Step 2:', val); return val + 1; })
  .then(val => console.log('Step 3:', val));`,

  'Async / Await': `async function fetchData() {
  console.log('start');
  const result = await Promise.resolve('data loaded');
  console.log(result);
  console.log('end');
}
fetchData();
console.log('this runs before end!');`,

  'setTimeout vs Promise': `console.log('A');
setTimeout(() => console.log('D — timeout 0'), 0);
setTimeout(() => console.log('E — timeout 100'), 100);
Promise.resolve().then(() => console.log('C — microtask'));
console.log('B');`,

  'Recursive Fibonacci': `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
console.log(fib(6));`,

  'IIFE Pattern': `const result = (function() {
  const secret = 'hidden';
  return { getSecret: () => secret };
})();
console.log(result.getSecret());`,

  'Array HOF Chain': `const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const result = nums
  .filter(n => n % 2 === 0)
  .map(n => n * n)
  .reduce((acc, n) => acc + n, 0);
console.log('Sum of squares of evens:', result);`,

  'Generator Function': `function* range(start, end) {
  for (let i = start; i <= end; i++) {
    console.log('yielding', i);
    yield i;
  }
}
const gen = range(1, 4);
console.log(gen.next().value);
console.log(gen.next().value);
console.log(gen.next().value);`,
};

const DEFAULT_PRESET = 'Event Loop Order';

const useEditorStore = create((set) => ({
  code: PRESETS[DEFAULT_PRESET],
  preset: DEFAULT_PRESET,
  stepMode: false,
  currentStep: 0,
  totalSteps: 0,
  isRunning: false,
  speed: 3, // 1 = slowest (1500ms), 5 = fastest (100ms)

  setCode: (code) => set({ code }),
  setPreset: (preset) => set({ code: PRESETS[preset] || '', preset }),
  toggleStepMode: () => set((state) => ({ stepMode: !state.stepMode })),
  setStepMode: (stepMode) => set({ stepMode }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setTotalSteps: (totalSteps) => set({ totalSteps }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setSpeed: (speed) => set({ speed }),
  reset: () =>
    set((state) => ({
      currentStep: 0,
      totalSteps: 0,
      isRunning: false,
      code: PRESETS[state.preset] || state.code,
    })),
}));

export { PRESETS };
export default useEditorStore;
