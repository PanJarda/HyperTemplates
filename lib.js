const utils = {
  $(selector, ctx) {
    return (ctx || document).querySelector(selector)
  },

  $$(selector, ctx) {
    return (ctx || document).querySelectorAll(selector)
  },

  objToArr(obj, keyAs, extend) {
    const res = []
    Object.keys(obj).forEach(key => {
      res.push({[keyAs]: key, ...obj[key], ...extend})
    })
    return res
  }
}

class Observable {
  constructor() {
    this.__registeredFns = []
  }

  register(fn) {
    this.__registeredFns.push(fn)
  }

  notify() {
    this.__registeredFns.forEach(fn => fn(this.__value))
  }
}

class ObservableArray extends Observable {
  constructor(arr) {
    super()
    this.__value = arr ? [ ...arr ] : []
  }

  set(index, value) {
    this.__value[index] = value
    this.notify()
  }

  get value() {
    return this.__value
  }

  set value(val) {
    this.__value = [ ...val ]
    this.notify()
  }

  splice(start, del, ...item) {
    if (item)
      this.__value.splice(start, del, ...item)
    else
      this.__value.splice(start, del)
    this.notify()
  }

  push(...item) {
    this.__value.push(...item)
    this.notify()
  }

  sort(fn) {
    this.__value.sort(fn)
    this.notify()
  }
}

class ObservableObject extends Observable {
  constructor(obj) {
    super()
    const self = this
    this.__handler = {
      set(target, key, value) {
        target[key] = value
        self.notify()
        return true
      },
      deleteProperty(target, key) {
        delete target[key]
        self.notify()
        return true
      }
    }
    this.__value = new Proxy(obj ? { ...obj } : {}, this.__handler)
  }

  get value() {
    return this.__value
  }

  set value(val) {
    this.__value = new Proxy(val, this.__handler)
    this.notify()
  }
}

class ObservableValue extends Observable {
  constructor(val) {
    super()
    this.__value = val
  }

  set value(val) {
    this.__value = val
    this.notify()
  }

  get value() {
    return this.__value
  }
}

class ViewModel {
  constructor(model) {
    this.model = model
  }

  render() {
    utils.$$('template[data-bind]').forEach(template => {
      const tmpl = new HyperTemplate(template)
      const key = template.getAttribute('data-bind')
      if (key in this.viewModel) {
        this.viewModel[key].register(data => {
          tmpl.render(data)
        })
        tmpl.render(this.viewModel[key].value)
      }
    })
  }
}

const createModel = obj => {
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])){
      newObj[key] = new ObservableArray(obj[key])
    } else if (typeof obj[key] === 'object') {
      newObj[key] = new ObservableObject(obj[key])
    } else {
      newObj[key] = new ObservableValue(obj[key])
    }
  })
  return newObj
}



