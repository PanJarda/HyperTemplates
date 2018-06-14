# HyperTemplates

Super small class for binding html5 native template tag to data array.

No dependency.

Includes deep data diffing for absolutely minimal possible DOM changes.


## Basic usage

```html

<h1>Articles</h1>

<template id="articles">
  <article>
    <h2>{{title}}</h2>
    <p>{{perex}}</p>
  </article>
  <hr>
</template>

<script>
  const articles = [
    { title: 'First article', perex: 'Lorem ipsum...' },
    { title: 'Second article', perex: 'Lorem ipsum...' }
  ]
  
  const tmpl = document.getElementById('articles')
  const hyperTmpl = new HyperTemplate(tmpl)
  hyperTmpl.render(articles)
</script>
```

[codepen](https://codepen.io/anon/pen/KevXjq)

## Advanced example

```html
<h1>TODO</h1>

<form id="add-task">
  <input type="text" name="newTask">
  <input type="submit" value="Add task">
</form>

<table>
  <template id="todos">
    <tr>
      <td><input type="checkbox" data-checked="{{done}}" onchange="{{toggle}}" data-key="{{_key}}"></td>
      <td>{{task}}</td>
    </tr>
  </template>
</table>

<script>
  const todos = [
    {_key: 0, task: 'Carry out garbage', done: true, toggle: toggle},
    {_key: 1, task: 'Workout', done: false, toggle: toggle}
  ]

  const tmpl = document.getElementById('todos')
  const hyperTmpl = new HyperTemplate(tmpl)
  hyperTmpl.render(todos)

  const addTask = document.getElementById('add-task')

  function toggle(e) {
    const key = e.target.getAttribute('data-key')
    const task = todos.filter(task => task['_key'] == key)[0]
    const index = todos.indexOf(task)

    todos[index].done = e.target.checked
    hyperTmpl.render(todos)
  }

  addTask.addEventListener('submit', e => {
    e.preventDefault()

    if (!e.target.newTask.value)
      return

    todos.push({_key: todos.length, task: e.target.newTask.value, done: false, toggle: toggle})

    e.target.reset()
    hyperTmpl.render(todos)
  })
</script>
```
[codepen](https://codepen.io/anon/pen/GGvOzW)
  
## Todo

- [ ] macros (data-if, data-for)
- [ ] allow multiple texnodes: `<span>{{item}} - sometext</span>`
- [ ] conditional classnames: `<div class="{{done: 'done'}}">...`
- [ ] allow plugins?

