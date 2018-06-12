class AppViewModel {
  constructor(model) {
    this.model = model
    
    this.__toggle = this.__toggle.bind(this)
    this.__toggleAll = this.__toggleAll.bind(this)
    this.__filterDone = this.__filterDone.bind(this)
    this.__deleteItem = this.__deleteItem.bind(this)

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
      model[key].register((val) => this.update(key, val))
    })
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
    return utils.objToArr(this.model.items.value, 'id', {toggle: this.__toggle, delete: this.__deleteItem})
      .sort(this.__sortBy(this.model.orderBy.value))
      .filter(i => this.model.onlyDone.value ? i.done : i)
  }

  __sortBy(key) {
    return (a, b) => a[key] > b[key]
  }

  update(key, val) {
    switch(key) {
      case 'onlyDone':
        this.viewModel.flags.set(0, { ...this.viewModel.flags.value[0], onlyDone: this.model.onlyDone.value})
      case 'items':
        this.viewModel.items.value = this.__prepareItems()
        this.viewModel.flags.set(0, { ...this.viewModel.flags.value[0], toggledAll: this.__toggledAll()})
        break
      case 'orderBy':
        this.viewModel.items.sort(this.__sortBy(val))
        break
    }
  }
}

const model = createModel({
  nextUID: 0,
  orderBy: 'id',
  onlyDone: false,
  items: {}
})

const viewModel = new AppViewModel(model)

bindViewModelToTemplates(viewModel.viewModel);

utils.$('#add-task').addEventListener('submit', e => {
  e.preventDefault()
  const form = e.target
  const task = form.task
  const UID = model.nextUID.value
  
  if (task.value === '')
    return false

  model.items.value[UID] = {task: task.value, done: false}
  model.nextUID.value = UID + 1;
  form.reset()
})