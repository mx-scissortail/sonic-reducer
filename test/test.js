import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import createMockDOM from 'jsdom-global';

import sr from '../index.js';
import zine from 'zine';

createMockDOM();

const ValueDiv = ({value}) => <div className={`test ${value}`} />;
const WrappedValueDiv = ({store: {value}}) => <div className={`test ${value}`} />;

const mountTest = (component, props) => mount(React.createElement(component, props));
const testClass = (wrapper, cn) => assert(wrapper.find('.test').hasClass(cn));

// defineAtom
describe('defineAtom', function () {
  it('retains initial state', function () {
    const atom = sr.defineAtom((state, x) => state + x, 0);
    assert(atom() == 0);
  });

  it('updates state w/ reducer', function () {
    const atom = sr.defineAtom((state, x) => state + x, 0);
    assert(atom() == 0);
    atom.update(1);
    assert(atom() == 1);
  });

  it('ignores "nah" as input to reducer', function () {
    const atom = sr.defineAtom((state, x) => x, 0);
    const callback = sinon.spy();
    zine.subscribe(atom, callback);
    atom.update(sr.nah);
    assert(atom() == 0);
    assert(!callback.called);
  });

  it('ignores "nah" output from reducer', function () {
    const atom = sr.defineAtom((state, x) => sr.nah, 0);
    const callback = sinon.spy();
    zine.subscribe(atom, callback);
    atom.update(1);
    assert(atom() == 0);
    assert(!callback.called);
  });

  it('publishes on update', function () {
    const atom = sr.defineAtom((state, x) => state + x, 0);
    const callback = sinon.spy();
    zine.subscribe(atom, callback);
    atom.update(1);
    assert(callback.calledOnce);
  });
});

// defineFormula
describe('defineFormula', function () {
  it('gets initial state', function () {
    const atomA = sr.defineAtom((state, x) => state + x, 0);
    const atomB = sr.defineAtom((state, x) => state * x, 2);
    const formula = sr.defineFormula((a, b) => `a: ${a}, b: ${b}`, atomA, atomB);

    assert(formula() == 'a: 0, b: 2');
  });

  it('updates state on atom argument change', function () {
    const atomA = sr.defineAtom((state, x) => state + x, 0);
    const atomB = sr.defineAtom((state, x) => state * x, 2);
    const formula = sr.defineFormula((a, b) => `a: ${a}, b: ${b}`, atomA, atomB);

    atomA.update(1);
    assert(formula() == 'a: 1, b: 2');
    atomB.update(3);
    assert(formula() == 'a: 1, b: 6');
  });

  it('ignores "nah" output from formula function', function () {
    const atomA = sr.defineValueAtom(true);
    const atomB = sr.defineValueAtom(true)
    const formula = sr.defineFormula((a, b) => ((a && b) || sr.nah), atomA, atomB);
    const callback = sinon.spy();

    zine.subscribe(formula, callback);
    assert(formula() === true);
    atomA.update(false);
    assert(formula() === true);
    assert(!callback.called);
  });

  // TODO: test ignoring 'nah' from atom argument?

  it('publishes on update', function () {
    const atomA = sr.defineAtom((state, x) => state + x, 0);
    const formula = sr.defineFormula((a) => `a: ${a}`, atomA);
    const callback = sinon.spy();

    zine.subscribe(formula, callback);
    atomA.update(1);
    assert(callback.calledWith('a: 1'));
  });
});

// defineValueAtom
describe('defineValueAtom', function () {
  it('retains initial state', function () {
    const atom = sr.defineValueAtom(0);
    assert(atom() == 0);
  });

  it('updates state', function () {
    const atom = sr.defineValueAtom(0);
    assert(atom() == 0);
    atom.update(1);
    assert(atom() == 1);
  });

  it('ignores "nah" as input', function () {
    const atom = sr.defineValueAtom(0);
    const callback = sinon.spy();
    zine.subscribe(atom, callback);
    atom.update(sr.nah);
    assert(atom() == 0);
    assert(!callback.called);
  });

  it('publishes on update', function () {
    const atom = sr.defineValueAtom(0);
    const callback = sinon.spy();
    zine.subscribe(atom, callback);
    atom.update(1);
    assert(callback.calledOnce);
  });
});

// atomify
describe('atomify', function () {
  it('updates state w/ supplied function', function () {
    const atom = sr.atomify((x) => x);
    assert(atom() === undefined);
    atom.update(1);
    assert(atom() == 1);
  });
});

// combine
describe('combine', function () {
  it('combines atoms', function () {
    const atomA = sr.defineValueAtom(0);
    const atomB = sr.defineValueAtom(1);
    const combined = sr.combine({
      a: atomA,
      b: atomB
    });

    assert(combined().a == 0);
    assert(combined().b == 1);
  });

  it('updates on change', function () {
    const atomA = sr.defineValueAtom(0);
    const atomB = sr.defineValueAtom(1);
    const combined = sr.combine({
      a: atomA,
      b: atomB
    });

    assert(combined().a == 0);
    atomA.update(2);
    assert(combined().a == 2);
    assert(combined().b == 1);
  });

  it('publishes on update', function () {
    const callback = sinon.spy();
    const atomA = sr.defineValueAtom(0);
    const combined = sr.combine({
      a: atomA
    });
    zine.subscribe(combined, callback);

    assert(!callback.called);
    atomA.update(2);
    assert(callback.called);
  });

  it('updates without mutation', function () {
    const atomA = sr.defineValueAtom(0);
    const combined = sr.combine({
      a: atomA
    });

    var oldState = combined();
    atomA.update(1);
    assert(combined() !== oldState);
  });
});

// sink
describe('sink', function () {
  it('sinks atoms', function () {
    const atomA = sr.defineValueAtom({a: 0, b: 1});
    const atomB = sr.defineValueAtom({b: 2});
    const sunk = sr.sink(atomA, atomB);

    assert(sunk().a == 0);
    assert(sunk().b == 2);
  });

  it('updates on sunk atom change', function () {
    const atomA = sr.defineValueAtom({a: 0, b: 1});
    const atomB = sr.defineValueAtom({b: 2});
    const sunk = sr.sink(atomA, atomB);

    atomA.update({a: 0, b: 1}); // this shouldn't do anything because atomB overwrites it
    assert(sunk().b == 2);
    atomB.update({b: 3});
    assert(sunk().b == 3);
  });
});

// atomConnector
describe('atomConnector', function () {
  it('updates component on atom update', function () {
    const atom = sr.defineValueAtom({value: 'untouched'});
    const wrapper = mountTest(sr.atomConnector(atom)(ValueDiv));
    testClass(wrapper, 'untouched');
    atom.update({value: 'touched'});
    testClass(wrapper, 'touched');
  });
});

// atomPropConnector
describe('atomPropConnector', function () {
  it('updates component on atom update w/ prop name wrapping', function () {
    const atom = sr.defineValueAtom({value: 'untouched'});
    const wrapper = mountTest(sr.atomPropConnector('store')(WrappedValueDiv), {store: atom});
    testClass(wrapper, 'untouched');
    atom.update({value: 'touched'});
    testClass(wrapper, 'touched');
  });
});


// actionSwitch
describe('actionSwitch', function () {
  it('switches when key is present, returns "nah" otherwise', function () {
    const aSwitch = sr.actionSwitch({
      action: (state, x) => x.value + state.value
    });

    assert(aSwitch({value: 1}, {type: 'action', value: 2}) == 3);
    assert(aSwitch({value: 1}, {type: 'fakeAction', value: 1}) == sr.nah);
  });
});

// bindActionCreator
describe('bindActionCreator', function () {
  it('composes', function () {
    const callback = sinon.spy();
    const dispatch = (x) => {callback(x); return x;};
    const boundFun = sr.bindActionCreator(dispatch, (x, y) => x + y);
    assert(boundFun(1, 2) == 3);
    assert(callback.calledWith(3));
  });

  it('curries', function () {
    const callback = sinon.spy();
    const dispatch = (x) => {callback(x); return x;};
    const binder = sr.bindActionCreator(dispatch);
    const boundFunA = binder((x, y) => x + y);
    const boundFunB = binder((x, y) => x * y);
    assert(boundFunA(1, 2) == 3);
    assert(callback.calledWith(3));
    assert(boundFunB(2, 3) == 6);
    assert(callback.calledWith(6));
  });
});

// lazify
describe('lazify', function () {
  it('returns update if state changed', function () {
    assert(sr.lazify((state, x) => x)(0, 1) == 1);
  });
  it('returns "nah" if state unchanged', function () {
    assert(sr.lazify((state, x) => state)(0, 1) === sr.nah);
  });
});

// link
describe('link', function () {
  it('subscribes atoms in a chain', function () {
    const atomA = sr.defineValueAtom(0);
    const atomB = sr.atomify((x) => x * 2);
    const atomC = sr.defineAtom((state, x) => state + x, 1);
    sr.link(atomA, atomB, atomC);
    assert(atomA() == 0);
    assert(atomB() === undefined);
    assert(atomC() == 1);
    atomA.update(1);
    assert(atomA() == 1);
    assert(atomB() === 2);
    assert(atomC() == 3);
    atomB.update(2);
    assert(atomA() == 1);
    assert(atomB() === 4);
    assert(atomC() == 7);
  });
});

// mapObject
describe('mapObject', function () {
  it('applies supplied function to each key', function () {
    const obj = {a: 1, b: 2};
    const newObj = sr.mapObject((value, key) => `${key} ${value}`, obj);
    assert(newObj.a == 'a 1');
    assert(newObj.b == 'b 2');
  });

  // TODO: test inheritance chain?
});

// merge
describe('merge', function () {
  it('merges, and in the appropriate order', function () {
    const a = {a: 1, b: 0};
    const b = {b: 2};
    const c = sr.merge(a, b);

    assert(c.a == 1);
    assert(c.b == 2);
    assert(c != a && c != b);
  });
});
