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
  }
}

class HyperTemplate {
  constructor(dom) {
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
          for (let i = 0; i < e.attributes.length; i++) {
            let attr = e.attributes[i]
            let match = attr.textContent.match(/{{([^{}]+)}}/);
            if (match) {
              let key = match[1]
              c[key] ? c[key].push(attr) : c[key] = [attr]
            }
          }
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
      hash[key].forEach(node =>
        node.nodeValue = data[key]
      )
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
    this.__value = { ...obj }
  }

  set(key, val) {
    this.__value[key] = val
    this.notify()
  }

  get(key) {
    return this.__value[key]
  }

  delete(key) {
    delete this.__value[key]
    this.notify()
  }
}

const tmpl = new HyperTemplate(utils.$('#test'))
const model = new ObservableArray()
model.register(val => tmpl.render(val))

model.value = [
  {id: 1, item1: 'ahoj'},
  {id: 2, item1: 'ahoj2'},
  {id: 3, item1: 'ahoj3'}
]

model.sort((a, b) => a.id < b.id)

/*
const t = utils.$('#test')
utils.walkNodes(t.content, (e) =>{
  console.log(e)
})
*/
