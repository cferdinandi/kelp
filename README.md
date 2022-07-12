# Kelp
A collection of small functions for creating reactive, state-based UIs.

Kelp is a simpler alternative to React, Vue, and other large frameworks.

## Getting Started

There are a few ways to install Kelp.

**ES Modules**

```js
import {store, component} from './dist/kelp.es.min.js';
```

**Global Script**

```html
<script src="./dist/kelp.min.js"></script>
```

With the global script, you can call API methods on the `kelp` object, or destructure them into their own variables.

```js
let {store, component} = kelp;
```



## API

### `kelp.store()`

Create a reactive data object. 

It accepts an object (`{}`) or array (`[]`) as an argument. If no value is provided, it uses an empty object by default.

```js
import {store} from './dist/kelp.es.js';

let data = store({
	greeting: 'Hello',
	name: 'World'
});
```

This emits a `kelp:store` event on the `document` whenever a property is modified. The `event.detail` property contains the current value of the data.

```js
// Listen for data changes
document.addEventListener('kelp:store', function (event) {
	console.log('The data was updated!');
	console.log(event.detail);
});

// Update the data
data.greeting = 'Hi there';
```

You can customize the event name by passing in a second argument into the `kelp.store()` method.

```js
let wizards = store([], 'wizards');

// A "wizards" event gets emitted
wizards.push('Merlin');
```

### `kelp.render()`

Render an HTML template string into the UI. 

It accepts the element (or a selector for the element) to render into, and the template to render as a string. Unlike the `Element.innerHTML` property, this diffs the DOM and sanitizes your HTML to reduce the risk of XSS attacks.

```js
import {render} from './dist/kelp.es.js';

// Create a template
function template () {
	return 'Hello, world!';
}

// Render it into the #app element
render('#app', template());
```

To reduce the risk of XSS attacks, dangerous properties, including `on*` events, are removed from the HTML before rendering.

```js
// The onerror event is removed before rendering
render('#app', `<p><img src="x" onerror="alert(1)"></p>`);
```

If you want to allow `on*` event listeners, pass in `true` as an optional third argument.

```js
// Track clicks
let n = 0;

// Log clicks
function log () {
	n++;
	console.log(`Clicked ${n} times.`);
}

// Render a button with an onclick event
render('#app', `<button onclick="log()">Activate Me</button>`, true);
```

_**Note:** Do NOT do this if your template contains any third-party data. It can expose you to XSS attacks._

### `kelp.component()`

Create a reactive component.

Pass in the element (or selector for the element) to render your template into, and the template to render. The `kelp.component()` method will render it into the UI, and automatically update the UI whenever your reactive data changes.

```js
import {store, component} from './dist/kelp.es.js';

// Create a reactive store
let todos = store(['Swim', 'Climb', 'Jump', 'Play']);

// Create a template
function template () {
	return `
		<ul>
			${todos.map(function (todo) {
				return `<li>${todo}</li>`;
			}).join('')}
		</ul>`;
}

// Create a reactive component
// It automatically renders into the UI
component('#app', template);

// After two seconds, add an item to the todo list
setTimeout(function () {
	todos.push('Take a nap... zzzz');
}, 2000);
```

The `kelp.component()` method accepts a third argument, an object of `options`.

- `events` - If `true`, will allow inline events on the template.
- `name` - A custom event name to use for `kelp.store()` events.

```js
// Allow on* events
component('#app', template, {events: true});

// Use a custom event name
let wizards = store([], 'wizards');
component('#app', template, {name: 'wizards'});

// Use a custom name AND allow on* events
component('#app', template, {name: 'wizards', events: true});
```



## Putting it all together

Using the `kelp.store()` and `kelp.component()` methods, you can create a reactive, state-based UI that automatically updates when your data changes.

```js
let {store, component} = kelp;

// Create a reactive store
let data = store({
	heading: 'My Todos',
	todos: ['Swim', 'Climb', 'Jump', 'Play'],
	emoji: '👋🎉'
});

// Create a template
function template () {
	let {heading, todos, emoji} = data;
	return `
		<h1>${heading} ${emoji}</h1>
		<ul>
			${todos.map(function (todo) {
				return `<li id="${todo.toLowerCase().replaceAll(' ', '-')}">${todo}</li>`;
			}).join('')}
		</ul>`;
}

// Create a reactive component
// It automatically renders into the UI
component('#app', template);

// After two seconds, add an item to the todo list
setTimeout(function () {
	data.todos.push('Take a nap... zzzz');
}, 2000);
```

If you have a more simple UI, you can instead combine the `kelp.store()` method with the browser-native `Element.addEventListener()` to manually update your UI as needed.

```html
Cart (<span id="cart-items">0</span>)
```

```js
import {store} from './dist/kelp.es.js';

// Create a reactive store
let cart = store([], 'cart-updated');

// Update how many cart items are displayed in the UI
document.addEventListener('cart-updated', function () {
	let cartCount = document.querySelector('#cart-items');
	cartCount.textContent = cart.length;
});

// Add an item to the cart
// The UI will automatically be updated
cart.push({
	item: 'T-Shirt',
	size: 'M',
	cost: 29
});
```