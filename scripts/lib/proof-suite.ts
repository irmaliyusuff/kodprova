// The shape of a TypeScript or JavaScript question's proof file.
//
//   export default {
//     proofs: { "<bug id>": async (code) => { ...assert... } },
//     options: { a: (code) => { ... }, b: ..., c: ... },
//   } satisfies ProofSuite<typeof Code>;
//
// Each check receives a module and fails by throwing. In the web, api and
// security topics the module is the question's original or fixed code. In the
// testing topic there are no proofs (the original and fixed tests are run
// against subject and flawed-<bug id> instead) and options receive those
// implementations. The rules are in scripts/lib/gate.ts.

export type Check<Module> = (code: Module) => void | Promise<void>;

export interface ProofSuite<Module> {
  /** One per bug id; leave out in the testing topic. */
  proofs?: Record<string, Check<Module>>;
  /** One per test option id. */
  options: Record<string, Check<Module>>;
}
