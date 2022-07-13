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

You can customize the event name by passing in a second argument into the `kelp.store()` method. It gets added to the end of the `kelp:store` event with a dash delimiter (`-`).

```js
let wizards = store([], 'wizards');

// A "kelp:store-wizards" event gets emitted
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
- `stores` - An array of custom event names to use for `kelp.store()` events.

```js
// Allow on* events
component('#app', template, {events: true});

// Use a custom event name
let wizards = store([], 'wizards');
component('#app', template, {stores: ['wizards']});

// Use a custom name AND allow on* events
component('#app', template, {stores: ['wizards'], events: true});
```

If you assign your component to a variable, you can stop reactive rendering with the `kelp.component.stop()` method, and start it again with the `kelp.component.start()` method.

```js
// Create a component
let app = component('#app', template);

// Stop reactive rendering
app.stop();

// Restart reactive rendering
app.start();
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



## Advanced Techniques

As your project gets bigger, the way you manage components and data may need to grow with it.


### Default and state-based HTML attributes

You can use data to conditionally include or change the value of HTML attributes in your template.

To dynamically set `checked`, `selected`, and `value` attributes, prefix them with an `@` symbol. Use a _falsy value_ when the item should _not_ be `checked` or `selected`.

In the example below, the checkbox is `checked` when `agreeToTOS` is `true`.

```js
// The reactive store
let data = store({
	agreeToTOS: true
});

// The template
function template () {
	return `
		<label>
			<input type="checkbox" @checked="${agreeToTOS}">
		</label>`;
}

// The component
component('#app', template);
```

You might instead want to use a default value when an element initially renders, but defer to any changes the user makes after that.

You can do that by prefixing your attributes with a `#` symbol.

In this example, `Merlin` has the `[selected]` attribute on it when first rendered, but will defer to whatever changes the user makes when diffing and updating the UI.

```js
function template () {
	return `
		<label for="wizards">Who is the best wizard?</label>
		<select>
			<option>Gandalf</option>
			<option #selected>Merlin</option>
			<option>Ursula</option>
		</select>`;
}
```


### Batch Rendering

With a `kelp.component()`, multiple reactive data updates are often batched into a single render that happens asynchronously.

```js
// Reactive store
let todos = store(['Swim', 'Climb', 'Jump', 'Play']);

// Create a component from a template
component('#app', template);

// These three updates would result in a single render
todos.push('Sleep');
todos.push('Wake up');
todos.push('Repeat');
```

You can detect when an element has been rendered by listening for the `kelp:render` event.

It's emitted directly on the element that was rendered, and also bubbles if you want to listen for all render events.

```js
document.addEventListener('kelp:render', function (event) {
	console.log(`The #${event.target.id} element has been rendered.`);
});
```


### More efficient diffing with IDs

Unique IDs can help Kelp more effectively handle UI updates.

For example, imagine you have a list of items, and you're rendering them into the UI as an unordered list.

```js
// Reactive store
let todos = store(['Swim', 'Climb', 'Jump', 'Play']);

// The template
function template () {
	return `
		<ul>
			${todos.map(function (todo) {
				return `<li>${todo}</li>`;
			})}
		</ul>`;
}

// Create a component
component('#app', template);
```

The resulting HTML would look like this.

```html
<ul>
	<li>Swim</li>
	<li>Climb</li>
	<li>Jump</li>
	<li>Play</li>
</ul>
```

Next, let's imagine that you remove an item from the middle of your array of `todos`.

```js
// remove "Climb"
todos.splice(1, 1);
```

Because of how Kelp diffs the UI, rather than removing the list item (`li`) with `Climb` as it's text, it would update the text of `Climb` to `Jump`, and the text of `Jump` to `Play`, and _then_ remove the last list item from the UI.

For larger and more complex UIs, this can be really inefficient.

You can help Kelp more effectively diff the UI by assigning unique IDs to elements that may change.

```js
// The template
function template () {
	return `
		<ul>
			${todos.map(function (todo) {
				let id = todo.toLowerCase();
				return `<li id="${id}">${todo}</li>`;
			})}
		</ul>`;
}
```

Now, the starting HTML looks like this.

```html
<ul>
	<li id="swim">Swim</li>
	<li id="climb">Climb</li>
	<li id="jump">Jump</li>
	<li id="play">Play</li>
</ul>
```

If you remove `Climb` from the `todos` array, Kelp will now remove the `#climb` element rather than updating all of the other list items (and any content within them).



## Lifecycle Events

Kelp emits custom events throughout the lifecycle of a component or reactive store.

- **`kelp:store`** is emitted when a reactive store is modified. The `event.detail` property contains the data object.
- **`kelp:start`** is emitted on a component element when kelp starts listening for reactive data changes.
- **`kelp:stop`** is emitted on a component element when kelp stops listening for reactive data changes.
- **`kelp:render`** is emitted on a component element when kelp renders a UI update.