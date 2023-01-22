const data = {
  text: "vue3",
  ok: true,
};

const bucket = new WeakMap<any, Map<string | symbol, Set<Function>>>();

let activeEffect: any;
function effect(fn: Function) {
  const effectFn: any = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    fn();
  };

  effectFn.deps = [];
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
  let deps = depsMap?.get(key) ?? [];
  const depsToRun = new Set(deps);
  depsToRun.forEach((fn) => fn());
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

effect(() => {
  console.log("effect runs");
  document.body.innerText = obj.ok ? obj.text : "not";
});

setTimeout(() => {
  obj.ok = false;
  obj.text = "hello, vue3";
}, 1000);
