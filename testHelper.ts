// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
/** @module testHelper */
'use strict'
/* !
    region header
    [Project page](https://torben.website/react-material-input)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import {afterEach, beforeEach} from '@jest/globals'
import {globalContext} from 'clientnode'
import {$Global} from 'clientnode/type'
import {
    createElement, FunctionComponentElement, ReactElement, ReactNode
} from 'react'
import {flushSync} from 'react-dom'
import {createRoot, Root as ReactRoot} from 'react-dom/client'
import {act} from 'react-dom/test-utils'

import {TestHookOptions, TestEnvironment, TestHookResult} from './type'
// endregion
;(globalContext as $Global & {IS_REACT_ACT_ENVIRONMENT:boolean})
    .IS_REACT_ACT_ENVIRONMENT = true

export const prepareTestEnvironment = (
    currentBeforeEach:typeof beforeEach, currentAfterEach:typeof afterEach
):TestEnvironment => {
    let root:null|ReactRoot = null

    const result:TestEnvironment = {
        container: null,
        render: <T = HTMLElement>(
            component:ReactNode, flush = true
        ):null|T => {
            void act(() => {
                if (root)
                    if (flush)
                        flushSync(():void => root!.render(component))
                    else
                        root.render(component)
                else
                    console.error(
                        'You call "render" outside a testing context.'
                    )
            })

            return (
                result.container?.childNodes?.length ?
                    result.container.childNodes[0] :
                    result.container
            ) as unknown as T
        },
        runHook: <
            R = unknown,
            P extends Array<unknown> = Array<unknown>,
            WP extends {
                children:FunctionComponentElement<{parameters:P}>|ReactElement
            } = {
                children:FunctionComponentElement<{parameters:P}>|ReactElement
            }
        >(
            hook:(...parameters:P) => R,
            givenOptions:Partial<TestHookOptions<P, WP>> = {}
        ):TestHookResult<R, P> => {
            const options:TestHookOptions<P, WP> = {
                flush: true,
                parameters: [] as unknown as P,
                wrapper: null,
                ...givenOptions
            }
            const hookResult = {} as unknown as {value:R}

            const TestComponent = ({parameters}:{parameters:P}) => {
                hookResult.value = hook(...parameters)

                return null
            }

            const render = (...parameters:P):void => {
                let componentElement:(
                    FunctionComponentElement<{parameters:P}> |
                    FunctionComponentElement<WP>
                ) = createElement<{parameters:P}>(TestComponent, {parameters})

                if (options.wrapper)
                    componentElement = createElement<WP>(
                        options.wrapper.component,
                        {
                            ...(options.wrapper.properties || {} as WP),
                            children: componentElement
                        } as WP
                    )

                void act(():void => {
                    if (root)
                        if (options.flush)
                            flushSync(() =>
                                root!.render(componentElement)
                            )
                        else
                            root.render(componentElement)
                    else
                        console.error(
                            'You call "render" outside a testing context.'
                        )
                })
            }

            render(...options.parameters)

            return {result: hookResult, render}
        }
    }

    currentBeforeEach(() => {
        result.container = document.createElement('div')
        result.container.setAttribute('class', 'test-wrapper')
        document.body.appendChild(result.container)

        if (!root)
            void act(() => {
                root = createRoot(result.container!)
            })
    })

    currentAfterEach(() => {
        if (root)
            void act(() => {
                root!.unmount()
                root = null
            })

        result.container!.remove()
        result.container = null
    })

    return result
}

export default prepareTestEnvironment
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
