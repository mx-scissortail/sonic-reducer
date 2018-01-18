# Sonic Reducer [Deprecated!]

WARNING: Sonic Reducer has been deprecated for the time being - it's largely unnecessary given some recent updates to zine.

Sonic Reducer is an experimental extension to [zine](https://github.com/j-s-n/zine), inspired by [Redux](https://github.com/reactjs/redux) and various FRP/Dataflow frameworks.

Sonic Reducer is in pre-alpha state right now, so maybe don't depend on it. At present, it should probably be considered a proof-of-concept or a source of ideas. Unlike [zine](https://github.com/j-s-n/zine), it’s never been tested in production. It doesn’t presently emit useful errors or warnings, nor has it been optimized in any way. Furthermore, its API is likely to change substantially before the 1.0 release.

See the Medium article "[State Architecture Patterns in React, Part 4: Purity, Flux-duality and Dataflow](https://medium.com/@skylernelson_64801/state-architecture-patterns-in-react-part-4-purity-flux-duality-and-dataflow-d06016b3379a)" for an explanation.

## Installation

```
npm install sonic-reducer --save
```

## Importing

Sonic Reducer is written in ES6 and transpiled to ES5 for compatibility. Both versions are included in the npm package. If you're using ES5, do this:
```
var SonicReducer = require('sonic-reducer');
```
If you're using ES6+, you can include the original sources by importing the module like this:
```
import SonicReducer from 'sonic-reducer/es6';
```
...or importing the functions it exports individually, e.g.
```
import {defineAtom, atomConnector /* ...etc */} from 'sonic-reducer/es6';
```
Importing the ES5 source from ES6 should work fine too, but will likely add a tiny amount of overhead if you're transpiling anyway.

## API: Constants

### `nah`

Sonic Reducer exports a constant `nah`, which acts as a bailout value. Returning `nah` e.g. from a reducer function signals that no update has happened and stops all further work. If an atom's state would ever be set to `nah`, instead no state update occurs and the atom doesn't self-publish.

## API: Basic Atom Creators

### `defineAtom (reducer, [initialState])`

Defines an atomic reducer. Atomic reducers are a lot like stores in Redux. They’re defined by providing an initial state and a reducer function which maps a state and an optional value to a new state. An atomic reducer uses the reducer function to update its state via the update method:

```
const adder = defineAtom((state, n) => state + n, 0);
adder(); // 0
adder.update(1); // + reducer is called with args 0, 1
adder(); // 1
adder.update(2); // + reducer is called with args 1, 2
adder(); // 3
```

Whenever `update` is called on an atomic reducer, it publishes itself along with its new value. Note that this means you can chain atomic reducers together extremely easily:

```
const tracker = defineAtom((state, n) => state.concat([n]), []);
zine.subscribe(adder, tracker.update);
adder(); // 3, from before
adder.update(2); // adder() == 5 now, so tracker logs it
tracker(); // [5]
adder.update(-1); // adder() == 4 now, so tracker logs it
tracker(); // [5, 4]
```

Calling `atom.update(nah)` will never trigger a state update, nor will returning `nah` from the reducer function — the state simply won't update and the atom won't self-publish.

---
### `defineFormula (formulaFn, ...atoms)`

Defines an atomic formula. An atomic formula manages a value that’s determined by a function over the states of other atoms.
For example, given two atoms `X` and `Y` that emit numbers, we can make an atomic formula that represents their product as follows:

```
X(); // 2
Y(); // 4
const product = defineFormula((x, y) => x * y, X, Y);
product(); // 8
```

Atomic formulas work like spreadsheet cells — they’re defined to hold a value that’s calculated from other values and update themselves whenever necessary. They don’t have an `update` method, because they don’t need to be manually updated. They automatically subscribe to the atoms supplied to them when they’re defined, and use that to self-update. So, in our example, any time the state of `X` or `Y` changes, the state of `product` will automatically update to reflect their new product:

```
product(); 2*4 == 8
X.update(3); // now suppose X() == 3, so
product(); // 3*4 == 12
Y.update(1); // now suppose Y() == 5, so
product(); // 3*5 == 15
```

The above example computes a value determined by two atoms, but that’s just a feature of that particular example — you can provide a functional formula of any arity and any number of atomic arguments after the formula function.

A formula won't normally emit `nah`: if the formula function returns it, the state is not updated and the atom doesn't self-publish. Furthermore, if the formula function would be called with `nah` as an argument for any reason, it simply isn't and once again no state update or publishing happens.

---
### `defineValueAtom ([initialState])`

Defines a simple atomic value container. The current state is replaced on update:

```
const value = defineValueAtom(0);
value(); // 0
value.update(2);
value(); // 2
```

Whenever `value.update(newState)` is called, the `value` atom calls `zine.publish(value, newState)`, so you can subscribe to `value` and have its state published to a callback whenever it changes.

The `update` method won't accept `nah` as a new state — the state simply won't change, and the atom won't self-publish.

---
# API: Atom Creation Helpers

### `atomify (fn, [initialState])`

A synonym for `defineAtom((unused, value) => fn(value), initialState)`. Note that `initialState` need not be provided. Mostly useful for inserting regular 1-arity functions in the middle of a `link` chain.

---
### `combine (atomMap)`

`combine` provides a way of combining atoms in a key/value map. Given an a key/value map object `atomMap` where the values are atoms, `combine` returns an atom that emits the result of calling `mapObject((f) => f(), atomMap)`. For example:

```
var combinator = combine({
  foo: fooAtom,
  bar: barAtom
});

combinator().foo; // the state of fooAtom
fooAtom(action);
combinator().foo; // the new state of fooAtom
```

---
### `sink(...atoms)`

`atoms` should be a sequence of atoms that emit objects. `sink(...atoms)` is an atomic formula that emits an object that's just the result of merging the objects emitted by its arguments in the order they were provided. `sink(...atoms)` is equivalent to `defineFormula(merge, ...atoms)` which is in turn equivalent to `defineFormula((...states) => Object.assign({}, ...states), ...atoms)`. So:

```
atomA(); // {foo: 0}
atomB(); // {bar: 1}
var combo = sink(atomA, atomB);
combo(); // {foo: 0, bar: 1}
atomA(action); // atomA has a new state
combo().foo === atomA().foo; // still true
```

---
## API: UI Connectors

### `atomConnector (subscriptionSpec)`

A synonym for `zine.connector(subscriptionSpec, (f) => f())`. See zine's documentation for `connector` for more information.

---
### `atomPropConnector (prop)`

A synonym for `zine.propConnector(prop, (f) => f())`, which is the same as `zine.connector(prop, (f) => ({[prop]: f()}))`. See zine's documentation for `propConnector` for more information.

---
# API: Utility functions

### `actionSwitch (actionMap)`

A utility for reducing Flux switch-statement boilerplate. Takes a key/value map object `actionMap` where the values are simple reducer functions of the form `(state, action) => newState`. Returns a reducer `(state, action) => newState` such that:
1. `actionSwitch(state, action) === actionMap[action.type](state, action)` if `actionMap` has the key `action.type`, and
2. `actionSwitch(state, action) === nah` otherwise (signalling no state update).

So for example, where before you'd write:
```
const reducer = (state, action) {
  switch (action.type) {
    case 'add':
      return state + action.value;
    case 'multiply':
      return state * action.value;
    default:
      return nah;
  }
}
```
Instead, you can write:
```
const reducer = actionSwitch({
  add: (state, action) => state + action.value,
  multiply: (state, action) => state * action.value
});
```

---
### `bindActionCreator (dispatch, [fn])`

A simple curried compose operation for binding action creators to a `dispatch` function. `bindActionCreator(dispatch, fn)` is equivalent to `(...args) => dispatch(fn(...args))`. The `fn` argument can be curried so `bindActionCreator(dispatch)(fn)` is equivalent to `bindActionCreator(dispatch, fn)`.

Use `mapObject(bindActionCreator(dispatch), actionCreators)` to achieve essentially the same functionality as Redux's `bindActionCreators`.

---
### `lazify (fn)`

An immutability helper. Takes a reducer function `fn: (state, value) => newValue` and wraps it such that:
1. `lazify(fn)(state, value) === fn(state, value)` if `fn(state, value) !== state`, but
2. `lazify(fn)(state, value) === nah` if `fn(state, value) === state`.

Atoms defined with a lazified reducer won't self-publish when `update` is called unless their new state and their old state are unequal (in the `!==` sense). See the documentation for `nah` above.

---
### `link (...atoms)`

`link` is a (left) compose for atomic values and reducers. `link(a, b)` is equivalent to `zine.subscribe(a, b.update)`, while `link(a, b, c)` is equivalent to:

```
zine.subscribe(a, b.update);
zine.subscribe(b, c.update);
```

...and so on. `link` returns the last atom in the series. See `atomify` if you want to insert a regular 1-arity function in the middle. Note that returning `nah` from any of the reducer functions in the chain will cause that atom to not update or self-publish, and will thus stop any further updates from propagating.

---
### `mapObject(func, sourceObject)`

Like `Array.prototype.map` but for objects. Returns an object such that `mapObject(func, sourceObject)[key] == func(sourceObject[key])` for every `key` in `sourceObject`. For example:

```
mapObject((x) => x * 2, {foo: 1, bar: 2}); // {foo: 2, bar: 4}
```

---
### `merge(...objects)`

A synonym for `Object.assign({}, ...objects)`, provided for convenience.

## License

MIT
