class AppViewModel extends ViewModel {
  constructor(model) {
    super(model)
    
    this.__toggle = this.__toggle.bind(this)
    this.__toggleAll = this.__toggleAll.bind(this)
    this.__filterDone = this.__filterDone.bind(this)
    this.__editItem = this.__editItem.bind(this)
    this.__endEditItem = this.__endEditItem.bind(this)
    this.__deleteItem = this.__deleteItem.bind(this)

    this.edited = false

    this.viewModel = {
      items: new ObservableArray(this.__prepareItems()),
      flags: new ObservableArray([{
          onlyDone: model.onlyDone.value,
          toggledAll: this.__toggledAll(),
          onToggleAll: this.__toggleAll,
          onFilterDone: this.__filterDone
        }])
    }

    Object.keys(model).forEach(key => {
      model[key].register(val => this.update(key, val))
    })

    this.render()
  }

  __toggleAll(e) {
    const items = this.model.items.value
    Object.keys(items).forEach(key => {
      items[key] = {...items[key], done: e.target.checked}
    })
  }

  __filterDone(e) {
    this.model.onlyDone.value = e.target.checked
  }

  __toggledAll() {
    const items = this.model.items.value
    const keys = Object.keys(items)
    return keys.length && !keys.filter(key => !items[key].done).length ? true : false
  }

  __editItem(e) {
    const key = e.target.getAttribute('data-key')
    const items = this.model.items
    items.value[key] = {...items.value[key], isEditMode: true}
  }

  __endEditItem(e) {
    const key = e.target.getAttribute('data-key')
    const items = this.model.items
    if (e instanceof KeyboardEvent) {
      switch(e.which) {
        case 27:
          this.edited = true
          items.value[key] = {...items.value[key], isEditMode: false}
          break
        case 13:
          this.edited = true
          items.value[key] = {...items.value[key], task: e.target.value, isEditMode: false}
          break
      }
      this.edited = false
    } else if (!this.edited) {
      this.edited = false
      items.value[key] = {...items.value[key], task: e.target.value, isEditMode: false}
    }
  }

  __deleteItem(e) {
    const key = e.target.getAttribute('data-key')
    const model = this.model
    delete model.items.value[key]
  }

  __toggle(e) {
    const items = this.model.items.value,
      key = e.target.getAttribute('data-key')
    items[key] = {...items[key], done: !items[key].done}
  }

  __prepareItems() {
    return utils.objToArr(this.model.items.value, '_key', {
        toggle: this.__toggle,
        delete: this.__deleteItem,
        onEdit: this.__editItem,
        endEdit: this.__endEditItem
      })
      .sort(this.__sortBy(this.model.orderBy.value))
      .filter(i => this.model.onlyDone.value ? i.done : i)
  }

  __sortBy(key) {
    return (a, b) => {
      return a[key] > b[key]
              ? 1
              : a[key] < b[key]
                ? -1
                : 0
    }
  }

  update(key, val) {
    const model = this.model
    const viewModel = this.viewModel

    switch(key) {
      case 'onlyDone':
      case 'items':
        viewModel.items.value = this.__prepareItems()
        viewModel.flags.set(0, { ...viewModel.flags.value[0], onlyDone: model.onlyDone.value, toggledAll: this.__toggledAll()})
        break
      case 'orderBy':
        viewModel.items.sort(this.__sortBy(val))
        break
    }
  }
}

const model = createModel({
  nextUID: 4,
  orderBy: '_key',
  onlyDone: false,
  items: {
    0: {task: 'D', done: false, isEditMode: false},
    1: {task: 'C', done: false, isEditMode: false},
    2: {task: 'B', done: false, isEditMode: false},
    3: {task: 'A', done: false, isEditMode: false}
  }
})

const viewModel = new AppViewModel(model)

utils.$('#add-task').addEventListener('submit', e => {
  e.preventDefault()
  const form = e.target
  const task = form.task
  const UID = model.nextUID.value
  
  if (task.value === '')
    return false

  model.items.value[UID] = {task: task.value, done: false, isEditMode: false}
  model.nextUID.value = UID + 1;
  form.reset()
})

utils.$('#order-by-task').addEventListener('change', e => {
  console.log(e.target.checked)
  e.target.checked
  ? model.orderBy.value = 'task'
  : model.orderBy.value = '_key'
})
