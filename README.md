# vue-reactive

此项目为自己学习vue响应式原理的一个过程，内容参考 ssh大佬的 https://juejin.im/post/6844903981957791757#heading-2

第一版为自己学习熟悉的阶段，因此并没有做工程化。

### 问自己
下面是自己最开始想到的实现方法，setter中做触发
```js
const person = {name: 'zhq'}
const render = () => {
  document.getElementById('app').innerHTML = `person is ${person.name}`
}
// 最容易想到的实现方法
let val = person.name
Object.defineProperty(person, 'name', {
  get() {
    return val
  },
  set(newVal) {
    val = newVal
    render()
  }
})
```
问题来了：__如果有多个data，每个data有多个render函数怎么办，全部都在代码层面一个一个加到setter中吗__
自动化一点，就需要用到观察者模式
代码中提供添加观察者的add方法，提供触发方法
既然是观察者模式，就需要用到观察者，其实render方法就可以看做是观察者，但是因为观察者还需要有其他操作，所以后面会把观察者作为一个类提取出来。

可以想到的实现方式是
__在每一个obj中的每一个property添加一个deps依赖数组，把监听当前对象的render函数都添加在deps中，然后setter的时候forEach触发。__

### 初版
下面仅仅是思想，没有具体实现细节
```js
// reactive使对象变为可观察对象
function reactive(obj) {
  Object.keys(obj).forEach(key => {
    definedReactive(obj, key)
  })
}

function definedReactive(obj, key) {
  let val = obj[key] // 细节：通过闭包 将val存储
  const deps = [] // 存储每一个render函数
  Object.defineProperty(obj, key, {
    get() {
      deps.push(render) // 依赖收集 
      console.log(`getter ${key}: ${obj[key]}`)
      return val
    },
    set(newVal) {
      val = newVal
      deps.forEach(fn => fn()) // 分发
      console.log(`setter ${key}: ${obj[key]}`)
    }
  })
}
```
现在触发每一个依赖函数的功能有了，
问题：__怎么收集依赖函数呢?__
这个也是Vue中的巧妙之处，__在第一次访问data的时候来收集依赖。__

### dep
现在来看上面的deps的作用，每一个可观察的对象及其属性(只要加了getter，setter)就会有一个deps依赖管理，那么我们是否可以抽象出来deps呢？
撸起袖子就是干！
```js
// reactive使对象变为可观察对象
function reactive(obj) {
  Object.keys(obj).forEach(key => {
    const __dep = definedReactive(obj, key)
    obj.__dep = __dep
  })
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
```
现在要做的就是把上面的Dep功能实现
```js
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
```

### watcher
观察者就是数据变化要通知的对象
```js
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
```

