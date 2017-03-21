import zine from 'zine';

// Constants

export const nah = {};

// Atom defining functions

export function defineAtom (reducer, initialState) {
  var state = initialState;

  function atom () {
    return state;
  }

  atom.update = function (value) {
    if (value !== nah) {
      var newState = reducer(state, value);
      if (newState != nah) {
        state = newState;
        zine.publish(atom, state);
      }
    }
    return state;
  };

  return atom;
};

export function defineFormula (formula, ...atoms) {
  var state; // set below
  var values;

  function boundFormula (values) {
    return state;
  }

  values = atoms.map(function (atom, index) {
    zine.subscribe(atom, function (newValue) {
      if (newValue != nah) {
        values[index] = newValue;
        var newState = formula(...values);
        if (newState != nah) {
          state = newState;
          zine.publish(boundFormula, state);
        }
      }
    });
    return atom();
  });

  state = formula(...values);
  return boundFormula;
}

export function defineValueAtom (initialState) {
  var state = initialState;

  function atom () {
    return state;
  }

  atom.update = function (value) {
    if (value !== nah) {
      state = value;
      zine.publish(atom, state);
    }
    return state;
  };

  return atom;
};

// Atom definition helpers

export function atomify (fn, initialState) {
  return defineAtom(function (unused, value) {
    return fn(value);
  });
}

export function combine (atomMap) {
  var state = {};

  function combinator () {
    return state;
  }

  for (var key in atomMap) {
    var atom = atomMap[key];
    zine.subscribe(atom, function (newValue) {
      if (newValue != nah) {
        state = merge(state, {[key]: newValue});
        zine.publish(combinator, state);
      }
    });
    state[key] = atom();
  }

  return combinator;
}

export function sink (...atoms) {
  return defineFormula(merge, ...atoms);
}

// Connectors

function call (sub) { // not exported
  return sub();
}

export function atomConnector (subscriptionSpec) {
  return zine.connector(subscriptionSpec, call);
}

export function atomPropConnector (prop) {
  return zine.propConnector(prop, call);
}

// Utility functions

export function actionSwitch (actionMap) {
  // TODO: verify that all keys are functions?
  return function (state, action) {
    var caseFn = actionMap[action.type];
    return caseFn ? caseFn(state, action) : nah;
  }
}

export function bindActionCreator (dispatch, fn) {
  if (fn) {
    return function (...args) {
      return dispatch(fn(...args));
    }
  } else {
    return function (func) {
      return bindActionCreator(dispatch, func);
    }
  }
}

export function lazify (fn) {
  return function (state, value) {
    var newState = fn(state, value);
    return (newState === state) ? nah : newState;
  }
}

export function link (...atoms) {
  return atoms.reduce(function (a, b) {
    zine.subscribe(a, b.update);
    return b;
  });
}

export function mapObject (func, obj) {
  var newObj = {};
  for (var key in obj) {
    newObj[key] = func(newObj[key], key);
  }
  return newObj;
}

export function merge (...objects) {
  return Object.assign({}, ...objects);
}
