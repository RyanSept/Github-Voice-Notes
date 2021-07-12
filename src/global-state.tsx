import * as React from "react"

export enum ACTION_TYPES {
    SET_IS_RECORDING_IN_PROGRESS,
}

const INITIAL_STATE = {
    isGlobalRecordingInProgress: false,
    foo: 1,
}

export type GlobalState = typeof INITIAL_STATE
export type GlobalStateAttrs = keyof GlobalState

type StoreAction = {
    type: ACTION_TYPES.SET_IS_RECORDING_IN_PROGRESS
    payload: GlobalState["isGlobalRecordingInProgress"]
}

export type TGlobalDispatch = React.Dispatch<StoreAction>

export const GlobalStore = {
    state: Object.assign({}, INITIAL_STATE) as GlobalState,
    subscribers: Object.fromEntries(
        Object.keys(INITIAL_STATE).map((attr: GlobalStateAttrs) => {
            return [attr, []]
        })
    ) as { GlobalStateAttrs: React.Component[] },

    /** Subscribe components to have given state attributes updated on changes */
    subscribe<Key extends GlobalStateAttrs>(
        component: React.Component<any, { [attrs in Key]: GlobalState[Key] }>,
        attrs: Key[]
    ): TGlobalDispatch {
        attrs.forEach((attr) => this.subscribers[attr].push(component))
        return this._dispatch
    },
    unsubscribe(id: string, attrs: GlobalStateAttrs[] | "all") {
        let arr = attrs === "all" ? Object.keys(this.subscribers) : attrs
        arr.forEach(
            (attr) =>
                (this.subscribers[attr] = this.subscribers[attr].filter(
                    // TODO: avoid forcing every component to have a props.id
                    (component) => component.props.id !== id
                ))
        )
    },
    /** Update this.store state and trigger subscriber state change
     */
    _dispatch(action: StoreAction) {
        let attr: GlobalStateAttrs
        switch (action.type) {
            case ACTION_TYPES.SET_IS_RECORDING_IN_PROGRESS:
                attr = "isGlobalRecordingInProgress"
                this.state[attr] = action.payload
            default:
        }
        this._updateSubscribersStates(attr)
    },
    /** For each subscriber listening for a given attribute, update their state
     */
    _updateSubscribersStates(attr: GlobalStateAttrs) {
        this.subscribers[attr].forEach((component: React.Component) => {
            component.setState({ [attr]: this.state[attr] })
        })
    },
}

for (let key in GlobalStore) {
    if (typeof GlobalStore[key] == "function") {
        GlobalStore[key] = GlobalStore[key].bind(GlobalStore)
    }
}
