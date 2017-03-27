import * as sr from '../index.js';
import zine from 'zine';

// defineAtom
describe('defineAtom', function () {
  it('retains initial state', function () {
    var atom = sr.defineAtom((state, x) => state + x, 0);
    assert(atom() == 0);
  });

  it('updates state w/ reducer', function () {
    var atom = sr.defineAtom((state, x) => state + x, 0);
    assert(atom() == 0);
    atom.update(1);
    assert(atom() == 1);
  });

  it('ignores "nah" as input to reducer', function () {
    var atom = sr.defineAtom((state, x) => x, 0);
    var flag = 0;
    zine.subscribe(atom, (x) => {flag = x;});
    atom.update(sr.nah);
    assert(atom() == 0);
    assert(flag == 0);
  });

  it('ignores "nah" output from reducer', function () {
    var atom = sr.defineAtom((state, x) => sr.nah, 0);
    var flag = 0;
    zine.subscribe(atom, (x) => {flag = x;});
    atom.update(1);
    assert(atom() == 0);
    assert(flag == 0);
  });

  it('publishes on update', function () {
    var atom = sr.defineAtom((state, x) => state + x, 0);
    var flag = 0;
    zine.subscribe(atom, (x) => {flag = x;});
    atom.update(1);
    assert(flag == 1);
  });
});

// defineFormula
describe('defineFormula', function () {
  it('gets initial state', function () {
    var atomA = sr.defineAtom((state, x) => state + x, 0);
    var atomB = sr.defineAtom((state, x) => state * x, 2);
    var formula = sr.defineFormula((a, b) => `a: ${a}, b: ${b}`, atomA, atomB);

    assert(formula() == 'a: 0, b: 2');
  });

  it('updates state on atom argument change', function () {
    var atomA = sr.defineAtom((state, x) => state + x, 0);
    var atomB = sr.defineAtom((state, x) => state * x, 2);
    var formula = sr.defineFormula((a, b) => `a: ${a}, b: ${b}`, atomA, atomB);

    atomA.update(1);
    assert(formula() == 'a: 1, b: 2');
    atomB.update(3);
    assert(formula() == 'a: 1, b: 6');
  });

  it('ignores "nah" output from formula function', function () {
    var atomA = sr.defineValueAtom(true);
    var atomB = sr.defineValueAtom(true)
    var formula = sr.defineFormula((a, b) => ((a && b) || sr.nah), atomA, atomB);
    var flag = false;

    zine.subscribe(formula, (x) => {flag = x;});
    assert(formula() === true);
    atomA.update(false);
    assert(formula() === true);
    assert(!flag);
  });

  // TODO: test ignoring 'nah' from atom argument?

  it('publishes on update', function () {
    var atomA = sr.defineAtom((state, x) => state + x, 0);
    var formula = sr.defineFormula((a) => `a: ${a}`, atomA);
    var flag = false;

    zine.subscribe(formula, (x) => {flag = x;});
    atomA.update(1);
    assert(flag == 'a: 1');
  });
});

// defineValueAtom
describe('defineValueAtom', function () {
  it('retains initial state', function () {
    var atom = sr.defineValueAtom(0);
    assert(atom() == 0);
  });

  it('updates state', function () {
    var atom = sr.defineValueAtom(0);
    assert(atom() == 0);
    atom.update(1);
    assert(atom() == 1);
  });

  it('ignores "nah" as input', function () {
    var atom = sr.defineValueAtom(0);
    var flag = false;
    zine.subscribe(atom, (x) => {flag = x;});
    atom.update(sr.nah);
    assert(atom() == 0);
    assert(!flag);
  });

  it('publishes on update', function () {
    var atom = sr.defineValueAtom(0);
    var flag = false;
    zine.subscribe(atom, (x) => {flag = x;});
    atom.update(1);
    assert(flag == 1);
  });
});

// atomify
describe('atomify', function () {
  it('updates state w/ supplied function', function () {
    var atom = sr.atomify((x) => x);
    assert(atom() === undefined);
    atom.update(1);
    assert(atom() == 1);
  });
});

// combine
describe('combine', function () {
  it('combines atoms', function () {
    var fooAtom = sr.defineValueAtom(0);
    var barAtom = sr.defineValueAtom(1);
    var combined = sr.combine({
      foo: fooAtom,
      bar: barAtom
    });

    assert(combined().foo == 0);
    assert(combined().bar == 1);
  });

  it('updates on change', function () {
    var fooAtom = sr.defineValueAtom(0);
    var barAtom = sr.defineValueAtom(1);
    var combined = sr.combine({
      foo: fooAtom,
      bar: barAtom
    });

    assert(combined().foo == 0);
    fooAtom.update(2);
    assert(combined().foo == 2);
    assert(combined().bar == 1);
  });

  it('publishes on update', function () {
    var flag = false;
    var fooAtom = sr.defineValueAtom(0);
    var combined = sr.combine({
      foo: fooAtom
    });
    zine.subscribe(combined, () => {flag = true;});

    assert(!flag);
    fooAtom.update(2);
    assert(flag);
  });

  it('updates without mutation', function () {
    var fooAtom = sr.defineValueAtom(0);
    var combined = sr.combine({
      foo: fooAtom
    });

    var oldState = combined();
    fooAtom.update(1);
    assert(combined() !== oldState);
  });
});

// sink
describe('sink', function () {
  it('sinks atoms', function () {
    var fooAtom = sr.defineValueAtom({foo: 0, bar: 1});
    var barAtom = sr.defineValueAtom({bar: 2});
    var sunk = sr.sink(fooAtom, barAtom);

    assert(sunk().foo == 0);
    assert(sunk().bar == 2);
  });

  it('updates on sunk atom change', function () {
    var fooAtom = sr.defineValueAtom({foo: 0, bar: 1});
    var barAtom = sr.defineValueAtom({bar: 2});
    var sunk = sr.sink(fooAtom, barAtom);

    fooAtom.update({foo: 0, bar: 1}); // this shouldn't do anything because barAtom overwrites it
    assert(sunk().bar == 2);
    barAtom.update({bar: 3});
    assert(sunk().bar == 3);
  });
});

// atomConnector
describe('atomConnector', function () {
  it('', function () {

  });
});

// atomPropConnector
describe('atomPropConnector', function () {
  it('', function () {

  });
});


// actionSwitch
describe('actionSwitch', function () {
  it('switches when key is present, returns "nah" otherwise', function () {
    var aSwitch = sr.actionSwitch({
      foo: (state, x) => x.bar + state.bar
    });

    assert(aSwitch({bar: 1}, {type: 'foo', bar: 2}) == 3);
    assert(aSwitch({bar: 1}, {type: 'baz', bar: 1}) == sr.nah);
  });
});

// bindActionCreator
describe('bindActionCreator', function () {
  it('composes', function () {
    var flag = 0;
    var dispatch = (x) => {flag = x; return x;};
    var boundFun = sr.bindActionCreator(dispatch, (x, y) => x + y);
    assert(boundFun(1, 2) == 3);
    assert(flag == 3);
  });

  it('curries', function () {
    var flag = 0;
    var dispatch = (x) => {flag = x; return x;};
    var binder = sr.bindActionCreator(dispatch);
    var boundFunA = binder((x, y) => x + y);
    var boundFunB = binder((x, y) => x * y);
    assert(boundFunA(1, 2) == 3);
    assert(flag == 3);
    assert(boundFunB(2, 3) == 6);
    assert(flag == 6);
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
    var atomA = sr.defineValueAtom(0);
    var atomB = sr.atomify((x) => x * 2);
    var atomC = sr.defineAtom((state, x) => state + x, 1);
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
    var obj = {foo: 1, bar: 2};
    var newObj = sr.mapObject((value, key) => `${key} ${value}`, obj);
    assert(newObj.foo == 'foo 1');
    assert(newObj.bar == 'bar 2');
  });

  // TODO: test inheritance chain?
});

// merge
describe('merge', function () {
  it('merges, and in the appropriate order', function () {
    var a = {foo: 1, bar: 0};
    var b = {bar: 2};
    var c = sr.merge(a, b);

    assert(c.foo == 1);
    assert(c.bar == 2);
    assert(c != a && c != b);
  });
});
