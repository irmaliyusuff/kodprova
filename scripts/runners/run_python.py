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
import importlib.util
import inspect
import json
import random
import sys

RESULT_MARKER = "PROOF_RESULT "
RANDOM_SEED = 20261010


def emit(payload):
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


def run_check(check, modules):
    random.seed(RANDOM_SEED)
    target = modules[check["target"]]
    try:
        if check["kind"] == "check":
            group = check_group(modules["proof"], check["group"].upper())
            call(group[check["key"]], target)
        else:
            suite = modules[check["suite"]]
            tests = [
                (name, value)
                for name, value in vars(suite).items()
                if name.startswith("test_") and callable(value)
            ]
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
    results = [run_check(check, modules) for check in plan["checks"]]
    emit({"proofKeys": proof_keys, "optionKeys": option_keys, "results": results})


if __name__ == "__main__":
    main()
