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
      'data-checked': 'checked',
      'data-selected': 'selected',
      'data-hidden': 'hidden'
    }
    this.MACROS = {
      'data-if': (el, val) => {
        el.ownerElement.hidden = !val
        el.nodeValue = val
      },
      // experimental
      'data-for': (el, val) => {
        const node = el.ownerElement
        node.setAttribute('data-for-item', val.length - 1)
        node.removeAttribute(el.name)
        const parentNode = node.parentNode
        
        // TODO: cleanup
        /*for (let i = 1; i < val.length; i++) {
          parentNode.removeChild(node.nextSibling)
        }*/

        const frag = document.createDocumentFragment()
        let clone = node.cloneNode()
        node.textContent = val[val.length - 1]
        for (let i = 0; i < val.length - 1; i++) {
          clone.textContent = val[i]
          clone.setAttribute('data-for-item', i)
          frag.appendChild(clone)
          clone = node.cloneNode()
        }
        parentNode.insertBefore(frag, node)
      }
    }
    this.dom = dom
    this.data = []
    this.hash = []
  }

  __walkNodes(dom, fn, context) {
    if (!dom)
      return context

    const res = fn(dom, context)
    
    
    const next = dom.nextSibling
    if (next) {
      return this.__walkNodes(next, fn, this.__walkNodes(dom.firstChild, fn, res))
    } else {
      this.__walkNodes(dom.firstChild, fn, res)
    }

    return res
  }

  __deleteFragment(firstNode, length) {
    length--
    let parentNode = firstNode.parentNode

    for (let i = 0; i < length; i++) {
      parentNode.removeChild(firstNode.nextSibling)
    }
    parentNode.removeChild(firstNode)
  }

  __hashmap(arr, key) {
    const l = arr.length
    const hashmap = {}
    
    for (let i = 0; i < l; i++) {
      hashmap[arr[i][key]] = i
    }

    return hashmap
  }

  __parsePlaceholders(dom) {
    const hash = this.__walkNodes(dom, (e, c) => {
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

    this.__deleteFragment(dom, length)

    this.hash.splice(i, 1)
  }

  moveItemAt(oldPos, newPos) {
    if (newPos < 0 || newPos >= this.hash.length)
      return

    const item = this.hash[oldPos],
      length = this.tlength
    const beforeNode = newPos === (this.hash.length - 1) ? this.dom : this.hash[newPos]['__DOMNode']

    let i = 0,
      domNode = item['__DOMNode'],
      next = item['__DOMNode'].nextSibling
    while (i < length) {
      this.dom.parentNode.insertBefore(domNode, beforeNode)
      domNode = next
      next = next.nextSibling
      i++
    }

    this.hash.splice(oldPos, 1)
    this.hash.splice(newPos, 0, item)
  }

  __innerDiff(hash, left, right) {
    for (let key in hash) {
      if (left[key] !== right[key]) {
        hash[key].forEach(node => {
          //console.log('[~] ' + (node.name ? node.name : node) + ': ' + node.nodeValue + ' -> ' + right[key])
          this.__renderNode(node, right[key])
        })
      }
    }
  }

  __diff(left, right) {
    const leftMap = this.__hashmap(left, '_key'),
      rightMap = this.__hashmap(right, '_key')

    let i = 0
    while (i < left.length && i < right.length) {
      let l = left[i]['_key'],
        r = right[i]['_key']
      
      if (l === r) {
        this.__innerDiff(this.hash[i], left[i], right[i])
        i++
        continue
      }
      
      if (!(l in rightMap)) {
        left.splice(i, 1)
        this.deleteItem(i)
        continue
      }

      if (r in leftMap) {
        const oldPos = this.__hashmap(left, '_key')[r]
        const item = left[oldPos]
        //console.log(oldPos + ' -> ' + i)
        this.__innerDiff(this.hash[oldPos], left[oldPos], right[i])
        this.moveItemAt(oldPos, i)
        left.splice(oldPos, 1)
        left.splice(i, 0, item)
        i++
        continue
      }

      this.__renderItem(i, right[i], this.hash[i]['__DOMNode'])
      left.splice(i, 0, right[i])
      i++
    }

    let j = i
    while (j < left.length) {
      this.deleteItem(i)
      j++
    }

    while (i < right.length) {
      this.__renderItem(i, right[i], this.dom)
      left.push(right[i])
      i++
    }
  }

  __renderNode(node, val) {
    if (node.name in this.MACROS) {
      this.MACROS[node.name](node, val)
      return
    }
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      if (node.name in this.VALUELESS_ATTRS) {
        node.ownerElement[this.VALUELESS_ATTRS[node.name]] = val
      }
    }
    node.nodeValue = val
  }

  __renderItem(i, data, insertBefore) {
    const frag = document.importNode(this.dom.content, true)
    
    const hash = this.__parsePlaceholders(frag)

    for (let key in hash) {
      hash[key].forEach(node => {
        this.__renderNode(node, data[key])
      })
    }

    this.hash.splice(i, 0, { ...hash, __DOMNode: frag.firstChild })

    if (!this.tlength)
      this.tlength = frag.childNodes.length

    this.dom.parentNode.insertBefore(frag, insertBefore)
  }

  render(newData) {
    this.__diff(this.data, newData)
    this.data = [ ...newData ]
    return this
  }
}