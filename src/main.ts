const data = {
  text: "vue3",
};

const bucket = new Set<Function>();

function effect() {
  document.body.innerText = obj.text;
}

const obj = new Proxy(data, {
  get(target: any, key) {
    bucket.add(effect);
    return target[key];
  },
  set(target, key, newValue) {
    target[key] = newValue;

    bucket.forEach((fn) => fn());

    return true;
  },
});

effect();

setTimeout(() => {
  obj.text = "hello, vue3";
}, 1000);
