// 响应
function reactive(obj) {
  Object.keys(obj).forEach(key => {
    definedReactive(obj, key)
  })
  return obj
}

function definedReactive(obj, key) {
  let val = obj[key] // 细节：通过闭包 将val存储
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    get() {
      dep.append() // 依赖收集 
      console.log(`getter ${key}: ${val}`)
      return val
    },
    set(newVal) {
      val = newVal
      dep.notify() // 分发
      console.log(`setter ${key}: ${newVal}`)
    }
  })
  return dep
}

class Dep{
  constructor(){
    this.deps = []
  }

  append() {
    if(Dep.target) {
      this.deps.push(Dep.target)
    }
  }

  notify() {
    this.deps.forEach(watcher => watcher.update())
  }
}
Dep.target = null

class Watcher{
  constructor(render) {
    this.render = render
    this.get()
  }

  get() { // get
    Dep.target = this
    this.render()
  }

  update = this.get
}