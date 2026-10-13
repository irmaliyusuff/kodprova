"""Run a Python question's checks and print one "PROOF_RESULT {json}" line.

Usage: python -I -B scripts/runners/run_python.py < plan.json

The run plan and the output follow scripts/lib/runner-protocol.ts.
A proof file defines two dicts of checks that take a module:

    PROOFS = {"<bug id>": check, ...}   (not used in the testing topic)
    OPTIONS = {"a": check, "b": check, ...}

In a test file, every function whose name starts with "test_" is a test and
receives the implementation module as its only argument. A check or a test
fails by raising (a plain assert is enough).
"""

import asyncio
import functools
import importlib.util
import inspect
import json
import random
import sys
import time
import types

RESULT_MARKER = "PROOF_RESULT "
RANDOM_SEED = 20261010
OFFSET_PROBE_SECONDS = 1_768_435_200


def emit(payload):
    offset = time.localtime(OFFSET_PROBE_SECONDS).tm_gmtoff // 60
    payload = {**payload, "utcOffsetMinutes": offset}
    print(RESULT_MARKER + json.dumps(payload), flush=True)


def error_text(error):
    text = f"{type(error).__name__}: {error}".strip()
    return text.splitlines()[0]


def load(name, path):
    spec = importlib.util.spec_from_file_location(f"question_{name}", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def check_group(proof, name):
    value = getattr(proof, name, {})
    if not isinstance(value, dict):
        raise TypeError(f"proof file: {name} must be a dict of functions")
    for key, check in value.items():
        if not callable(check):
            raise TypeError(f"proof file: {name}[{key!r}] must be a function")
    return value


def call(function, argument):
    result = function(argument)
    if inspect.iscoroutine(result):
        asyncio.run(result)


def test_functions(suite):
    """The test functions of a test module, in the order the file defines them."""
    return [
        (name, value)
        for name, value in vars(suite).items()
        if name.startswith("test_") and callable(value)
    ]


def run_check(check, modules, paths):
    random.seed(RANDOM_SEED)
    try:
        if check["kind"] == "order":
            return run_order(check, paths)
        target = modules[check["target"]]
        if check["kind"] == "check":
            group = check_group(modules["proof"], check["group"].upper())
            call(group[check["key"]], target)
        else:
            tests = test_functions(modules[check["suite"]])
            if not tests:
                raise AssertionError(f"{check['suite']} has no test functions")
            for name, test in tests:
                try:
                    call(test, target)
                except Exception as error:
                    raise AssertionError(f"{name}: {error_text(error)}") from error
        return {"id": check["id"], "passed": True, "error": None}
    except Exception as error:  # Any failure fails the check.
        return {"id": check["id"], "passed": False, "error": error_text(error)}


def run_order(check, paths):
    """Runs every test of the suite in the check's order (see run-js.ts)."""

    def fresh_suite():
        return load("order_suite", paths[check["suite"]])

    def fresh_target():
        return InputWatch(load("order_target", paths[check["target"]]))

    suite = fresh_suite()
    names = [name for name, _ in test_functions(suite)]
    if not names:
        raise AssertionError(f"{check['suite']} has no test functions")
    if check["order"] == "alphabetical":
        names = sorted(names)
    elif check["order"] == "reverse":
        names = names[::-1]
    target = fresh_target()
    failed_tests = []
    error = None
    for index, name in enumerate(names):
        if check["order"] == "alone" and index > 0:
            suite = fresh_suite()
            target = fresh_target()
        target.test = name
        random.seed(RANDOM_SEED)
        try:
            call(getattr(suite, name), target.module)
        except Exception as failure:  # A failing test is a result here.
            failed_tests.append(name)
            error = error or f"{name}: {error_text(failure)}"
    return {
        "id": check["id"],
        "passed": not failed_tests,
        "error": error,
        "failedTests": failed_tests,
        "sharedInputs": target.shared,
    }


class InputWatch:
    """Records which test hands which list, dict or set to the module.

    The Python side of scripts/runners/shared-inputs.ts: a value two tests
    both hand over is reported in `shared`. Dicts holding functions (fakes)
    and other objects are not data and are not followed.
    """

    def __init__(self, module):
        self.test = ""
        self.shared = []
        # id -> (value, first test); keeping the value keeps its id unique.
        self._first = {}
        self.module = types.SimpleNamespace(
            **{
                name: self._watched(value, name) if inspect.isfunction(value) else value
                for name, value in vars(module).items()
            }
        )

    def _watched(self, function, name):
        @functools.wraps(function)
        def watched(*args, **kwargs):
            seen = set()
            for value in (*args, *kwargs.values()):
                self._record(value, name, seen)
            return function(*args, **kwargs)

        return watched

    def _record(self, value, receiver, seen):
        kind = data_kind(value)
        if kind is None or id(value) in seen:
            return
        seen.add(id(value))
        first = self._first.setdefault(id(value), (value, self.test))
        item = {"kind": kind, "tests": [first[1], self.test], "receiver": receiver}
        if first[1] != self.test and item not in self.shared:
            self.shared.append(item)
        for inner in value.values() if isinstance(value, dict) else value:
            self._record(inner, receiver, seen)


def data_kind(value):
    """The kind of data a value is ("list", "dict" or "set"), or None."""
    if isinstance(value, list):
        return "list"
    if isinstance(value, dict) and not any(map(callable, value.values())):
        return "dict"
    if isinstance(value, set):
        return "set"
    return None


def main():
    plan = json.load(sys.stdin)
    modules = {}
    try:
        for name, path in plan["modules"].items():
            try:
                modules[name] = load(name, path)
            except Exception as error:
                raise RuntimeError(f"{name}: {error_text(error)}") from error
        proof_keys = list(check_group(modules["proof"], "PROOFS"))
        option_keys = list(check_group(modules["proof"], "OPTIONS"))
    except Exception as error:
        emit({"loadError": error_text(error)})
        return
    results = [run_check(check, modules, plan["modules"]) for check in plan["checks"]]
    emit({"proofKeys": proof_keys, "optionKeys": option_keys, "results": results})


if __name__ == "__main__":
    main()
