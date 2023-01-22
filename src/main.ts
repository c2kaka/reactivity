const data = {
  text: "vue3",
};

const bucket = new WeakMap<any, Map<string | symbol, Set<Function>>>();

let activeEffect: Function;
function effect(fn: Function) {
  activeEffect = fn;
  fn();
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
}

function trigger(target: any, key: string | symbol) {
  const depsMap = bucket.get(target);
  let deps = depsMap?.get(key) ?? [];
  deps.forEach((fn) => fn());
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
  document.body.innerText = obj.text;
});

setTimeout(() => {
  obj.text = "hello, vue3";
}, 1000);
