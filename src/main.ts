const data = {
  foo: true,
  bar: true,
  count: 0,
};

const bucket = new WeakMap<any, Map<string | symbol, Set<Function>>>();

let activeEffect: any;
let effectStack: Function[] = [];
function effect(fn: Function, options = {}) {
  const effectFn: any = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);
    fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };

  effectFn.deps = [];
  effectFn.options = options;
  effectFn();
}

function cleanup(effectFn: any) {
  for (let index = 0; index < effectFn.deps.length; index++) {
    const deps = effectFn.deps[index];
    deps.delete(effectFn);
  }

  effectFn.deps.length = 0;
}

function track(target: any, key: string | symbol) {
  if (!activeEffect) {
    return;
  }

  let depsMap = bucket.get(target);
  if (!depsMap) {
    depsMap = new Map();
    bucket.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target: any, key: string | symbol) {
  const depsMap = bucket.get(target);
  let effects = depsMap?.get(key) ?? [];
  
  const effectsToRun = new Set<any>();
  effects.forEach((_effectFn) => {
    if (_effectFn !== activeEffect) {
      effectsToRun.add(_effectFn);
    }
  })
  
  effectsToRun.forEach((fn) => {
    if (fn?.options?.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
}

const obj = new Proxy(data, {
  get(target: any, key) {
    track(target, key);
    return target[key];
  },
  set(target, key, newValue) {
    target[key] = newValue;
    trigger(target, key);
    return true;
  },
});

const jobQueue = new Set<Function>();
let isFlushing = false;
function flushJob() {
  if (isFlushing) {
    return;
  }

  isFlushing = true;
  Promise.resolve().then(() => {
    jobQueue.forEach((job) => job());
  }).finally(
    () => {
      isFlushing = false;
    }
  )
}

effect(() => {
  console.log(obj.count);
}, {
  scheduler(fn: Function) {
    jobQueue.add(fn);
    flushJob();
  }
})

obj.count++;
obj.count++;
