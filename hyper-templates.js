const utils = {
  $(selector, ctx) {
    return (ctx || document).querySelector(selector)
  },

  $$(selector, ctx) {
    return (ctx || document).querySelectorAll(selector)
  },

  deleteFragment(firstNode, length) {
    length--
    let parentNode = firstNode.parentNode

    for (let i = 0; i < length; i++) {
      parentNode.removeChild(firstNode.nextSibling)
    }
    parentNode.removeChild(firstNode)
  },

  walkNodes(dom, fn, context) {
    if (!dom)
      return context

    const res = fn(dom, context)
    
    
    const next = dom.nextSibling
    if (next) {
      return this.walkNodes(next, fn, this.walkNodes(dom.firstChild, fn, res))
    } else {
      this.walkNodes(dom.firstChild, fn, res)
    }

    return res
  },

  indexOfByKey(arr, key, value) {
    const res = arr.filter(i => i[key].toString() == value)
    
    if (res)
      return arr.indexOf(res[0])

    return -1
  },

  objToArr(obj, keyAs, extend) {
    const res = []
    Object.keys(obj).forEach(key => {
      res.push({[keyAs]: key, ...obj[key], ...extend})
    })
    return res
  }
}

class HyperTemplate {
  constructor(dom) {
    this.EVENTS = {
      onchange: 'change',
      onblur: 'blur',
      onmouseover: 'mouseover',
      onmouseout: 'mouseout',
      onmousedown: 'mousedown',
      onmouseup: 'mouseup',
      onclick: 'click',
      ondblclick: 'dblclick',
      onkeydown: 'keydown',
      onkeyup: 'keyup',
      onfocusout: 'focusout',
      onblur: 'blur'
    }
    this.VALUELESS_ATTRS = {
      checked: null,
      selected: null,
      hidden: null
    }
    this.dom = dom
    this.data = []
    this.hash = []
  }

  __parsePlaceholders(dom) {
    const hash = utils.walkNodes(dom, (e, c) => {
        if (e.nodeType === Node.TEXT_NODE) {
          const match = e.nodeValue.match(/{{([^{}]+)}}/)
          if (match) {
            const key = match[1]
            c[key] ? c[key].push(e) : c[key] = [e]
          }
        } else if (e.attributes) {
          let attrsToDestroy = []
          for (let i = 0; i < e.attributes.length; i++) {
            let attr = e.attributes[i]
            let match = attr.textContent.match(/{{([^{}]+)}}/);
            if (match) {
              let key = match[1]
              if (attr.name in this.EVENTS) {
                // todo causes bug
                attrsToDestroy.push(attr.name)
                const evHandler = {nodeValue: () => {}}
                e.addEventListener(this.EVENTS[attr.name], e => evHandler.nodeValue(e), true)
                c[key] ? c[key].push(evHandler) : c[key] = [evHandler]
              } else {
                c[key] ? c[key].push(attr) : c[key] = [attr]
              }
            }
          }
          attrsToDestroy.forEach(attrName => e.removeAttribute(attrName))
        }
        return c
      }, {})

    return hash
  }

  deleteItem(i) {
    if (i >= this.hash.length)
      return
    const hash = this.hash[i],
      dom = hash["__DOMNode"],
      length = this.tlength

    utils.deleteFragment(dom, length)

    this.hash.splice(i, 1)
  }

  moveItemAt(oldPos, newPos) {
    if (newPos < 0 || newPos >= this.hash.length)
      return

    const item = this.hash[oldPos]

  }

  __diff() {



  }

  __renderItem(i, data, insertBefore) {
    const frag = document.importNode(this.dom.content, true)
    
    const hash = this.__parsePlaceholders(frag)

    for (let key in hash) {
      hash[key].forEach(node => {
        if (node.nodeType === Node.ATTRIBUTE_NODE && node.name in this.VALUELESS_ATTRS) {
          data[key] ? node.nodeValue = data[key] : node.ownerElement.removeAttribute(node.name)
        } else {
          node.nodeValue = data[key]
        }
      })
    }
    this.hash.splice(i, 0, { ...hash, __DOMNode: frag.firstChild })
    if (!this.tlength)
      this.tlength = frag.childNodes.length

    this.dom.parentNode.insertBefore(frag, insertBefore)
  }

  render(newData) {
    if (!newData) {
      newData = this.dataPtr
    }
    for (let i = 0; i < this.data.length; i++) {
      this.deleteItem(0)
    }

    for (let i = 0; i < newData.length; i++) {
      this.__renderItem(i, newData[i], this.dom)
    }
    this.dataPtr = newData
    this.data = [ ...newData ]
    return this
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



