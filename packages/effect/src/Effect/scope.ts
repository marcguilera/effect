import type * as Exit from "../Exit/exit"
import type * as Fiber from "../Fiber"
import type { Runtime } from "../Fiber/core"
import * as O from "../Option"
import type { Scope } from "../Scope"
import { globalScope } from "../Scope"
import type { Effect, RIO } from "./effect"
import { IFork, IGetForkScope, IRaceWith } from "./primitives"

/**
 * Forks the effect into a new fiber attached to the global scope. Because the
 * new fiber is attached to the global scope, when the fiber executing the
 * returned effect terminates, the forked fiber will continue running.
 */
export function forkDaemon<R, E, A>(
  value: Effect<R, E, A>
): RIO<R, Fiber.FiberContext<E, A>> {
  return new IFork(value, O.some(globalScope))
}

/**
 * Returns an effect that forks this effect into its own separate fiber,
 * returning the fiber immediately, without waiting for it to begin
 * executing the effect.
 *
 * The returned fiber can be used to interrupt the forked fiber, await its
 * result, or join the fiber. See `Fiber` for more information.
 *
 * The fiber is forked with interrupt supervision mode, meaning that when the
 * fiber that forks the child exits, the child will be interrupted.
 */
export function forkIn(scope: Scope<Exit.Exit<any, any>>) {
  return <R, E, A>(value: Effect<R, E, A>): RIO<R, Runtime<E, A>> =>
    new IFork(value, O.some(scope))
}

/**
 * Retrieves the scope that will be used to supervise forked effects.
 */
export function forkScopeWith<R, E, A>(
  f: (_: Scope<Exit.Exit<any, any>>) => Effect<R, E, A>
) {
  return new IGetForkScope(f)
}

/**
 * Returns an effect that races this effect with the specified effect, calling
 * the specified finisher as soon as one result or the other has been computed.
 */
export function raceWith<R, E, A, R1, E1, A1, R2, E2, A2, R3, E3, A3>(
  left: Effect<R, E, A>,
  right: Effect<R1, E1, A1>,
  leftWins: (exit: Exit.Exit<E, A>, fiber: Fiber.Fiber<E1, A1>) => Effect<R2, E2, A2>,
  rightWins: (exit: Exit.Exit<E1, A1>, fiber: Fiber.Fiber<E, A>) => Effect<R3, E3, A3>,
  scope: O.Option<Scope<Exit.Exit<any, any>>> = O.none
): Effect<R & R1 & R2 & R3, E2 | E3, A2 | A3> {
  return new IRaceWith(left, right, leftWins, rightWins, scope)
}
