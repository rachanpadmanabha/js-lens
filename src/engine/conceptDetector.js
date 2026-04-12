const CONCEPT_PATTERNS = [
  {
    name: 'Closure',
    icon: '🔒',
    color: 'blue',
    test: (code) => {
      // Check for nested functions where inner references outer scope
      const hasFunctionNesting =
        /function\s+\w*\s*\([^)]*\)\s*\{[\s\S]*?(?:return\s+function|function\s+\w+)/.test(code);
      const hasArrowNesting =
        /(?:const|let|var)\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>)[\s\S]*?(?:return\s+(?:function|\([^)]*\)\s*=>|\w+\s*=>))/.test(code);
      return hasFunctionNesting || hasArrowNesting;
    },
    description:
      'A closure is a function that remembers the variables from its outer scope even after the outer function has finished executing.',
    detail:
      'When a function is created inside another function, it "closes over" the variables in the outer scope. This allows the inner function to access and modify those variables even when called later.',
  },
  {
    name: 'Promise / Async',
    icon: '⏳',
    color: 'purple',
    test: (code) =>
      /new Promise|\.then\s*\(|async\s+function|await\s|Promise\.resolve|Promise\.reject|Promise\.all/.test(
        code
      ),
    description:
      'Promises represent the eventual completion (or failure) of an asynchronous operation. Async/await is syntactic sugar over Promises.',
    detail:
      'Promise callbacks (.then/.catch) are queued as microtasks, which run before macrotasks (setTimeout). This is why Promises resolve before setTimeout even with a 0ms delay.',
  },
  {
    name: 'Higher-Order Function',
    icon: '🔄',
    color: 'indigo',
    test: (code) =>
      /\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.forEach\s*\(|\.find\s*\(|\.some\s*\(|\.every\s*\(|\.sort\s*\(/.test(
        code
      ) ||
      /function\s+\w+\s*\([^)]*(?:function|=>)[^)]*\)/.test(code) ||
      /return\s+function/.test(code),
    description:
      'A higher-order function either takes a function as an argument or returns a function as its result.',
    detail:
      'Array methods like .map(), .filter(), and .reduce() are common higher-order functions. They abstract iteration patterns, making code more declarative and composable.',
  },
  {
    name: 'Recursion',
    icon: '🌀',
    color: 'pink',
    test: (code) => {
      // Collect names from function declarations: function foo(...)
      const declNames = [...code.matchAll(/function\s+(\w+)/g)].map((m) => m[1]);
      // Collect names from const/let/var assignments to arrows or function expressions
      const assignNames = [
        ...code.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)/g),
      ].map((m) => m[1]);
      const allNames = [...new Set([...declNames, ...assignNames])];

      return allNames.some((name) => {
        // Try function declaration body
        const declBody = code.match(
          new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`)
        );
        if (declBody && declBody[1].includes(name + '(')) return true;

        // Try arrow / function expression body (brace-delimited)
        const arrowBody = code.match(
          new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s+)?(?:function\\s*\\w*\\s*\\([^)]*\\)|\\([^)]*\\)\\s*=>|\\w+\\s*=>)\\s*\\{([\\s\\S]*?)\\n\\}`)
        );
        if (arrowBody && arrowBody[1].includes(name + '(')) return true;

        // Try concise arrow expression (no braces): const f = (n) => n <= 1 ? 1 : n * f(n-1)
        const conciseArrow = code.match(
          new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s+)?(?:\\([^)]*\\)|\\w+)\\s*=>\\s*([^{][^\\n;]+)`)
        );
        if (conciseArrow && conciseArrow[1].includes(name + '(')) return true;

        return false;
      });
    },
    description:
      'Recursion is when a function calls itself to solve a problem by breaking it into smaller sub-problems.',
    detail:
      'Each recursive call adds a new frame to the call stack. Without a base case, recursion leads to a stack overflow. Watch the call stack panel to see frames pile up!',
  },
  {
    name: 'IIFE',
    icon: '⚡',
    color: 'amber',
    test: (code) => /\(\s*function|\(\s*\(\)\s*=>/.test(code),
    description:
      'An Immediately Invoked Function Expression (IIFE) is a function that runs as soon as it is defined.',
    detail:
      'IIFEs create a private scope, preventing variables from leaking into the global scope. They were essential before ES6 modules and are still used for encapsulation.',
  },
  {
    name: 'Generator',
    icon: '📦',
    color: 'green',
    test: (code) => /function\s*\*/.test(code),
    description:
      'Generators are special functions that can pause execution and resume later, yielding multiple values over time.',
    detail:
      'Using the yield keyword, generators produce a sequence of values lazily. Each call to .next() resumes execution until the next yield or return.',
  },
  {
    name: 'Prototype / Class',
    icon: '🏗️',
    color: 'teal',
    test: (code) => /\.prototype\.|class\s+\w+|extends\s+\w+/.test(code),
    description:
      'JavaScript uses prototypal inheritance. Classes are syntactic sugar over the prototype chain.',
    detail:
      'Every object has an internal [[Prototype]] link. When you access a property, JS walks up the prototype chain until it finds it or reaches null.',
  },
  {
    name: 'Event-driven',
    icon: '📡',
    color: 'orange',
    test: (code) =>
      /addEventListener|on\w+\s*=|setTimeout|setInterval|\.on\(/.test(code),
    description:
      'Event-driven code responds to events (timers, clicks, messages) rather than running sequentially.',
    detail:
      'setTimeout and setInterval register callbacks with the browser\'s Web APIs. When the timer expires, the callback is placed in the macrotask queue, waiting for the call stack to clear.',
  },
];

export function detectConcepts(code) {
  const detected = [];

  CONCEPT_PATTERNS.forEach((concept) => {
    if (concept.test(code)) {
      detected.push(concept.name);
    }
  });

  return CONCEPT_PATTERNS.filter((concept) => detected.includes(concept.name));
}

export { CONCEPT_PATTERNS };
