# HyperTemplates

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

<script src="hyperTemplate.js"></script>
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

https://codepen.io/anon/pen/KevXjq
