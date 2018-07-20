import setCookie from './cookieApi';
import {isFunction} from 'lodash';

/**
 * Middleware to persist state in cookies.
 * @param {Object} paths
 * @param {Object} customOptions
 */
const reduxCookiesMiddleware = (paths = {}, customOptions = {}) => {
    const options = {
        logger: console.error,
        setCookie,
        defaultEqualityCheck: (a, b) => (a === b),
        defaultDeleteCheck: value => (typeof value === 'undefined'),
        ...customOptions
    };

    const _getVal = (state, path) => {
        const pathPartsList = path.split('.');
        let value = state;
        let index;

        for (index = 0; index < pathPartsList.length; index += 1) {
            const pathPart = pathPartsList[index];

            if (Object.hasOwnProperty.call(value, pathPart)) {
                value = value[pathPart];
            } else {
                options.logger(`state not found at store.getState().${path}`);
                break;
            }
        }

        return (index === pathPartsList.length) ? value : null;
    };

    return store => next => (action) => {
        const prevState = store.getState();
        const result = next(action);
        const nextState = store.getState();

        Object.keys(paths).forEach(pathToState => {
            let data = [];
            if (isFunction(paths[pathToState])) {
                data = paths[pathToState](prevState, nextState);
            } else {
                data = [{
                    prevVal: _getVal(prevState, pathToState),
                    nextVal: _getVal(nextState, pathToState),
                    state: paths[pathToState]
                }];
            }

            data.forEach(item => {
                const {state, prevVal, nextVal} = item;
                const equalityCheck = state.equalityCheck || options.defaultEqualityCheck;
                const deleteCheck = state.deleteCheck || options.defaultDeleteCheck;

                if (!equalityCheck(prevVal, nextVal)) {
                    if (deleteCheck(nextVal)) {
                        options.setCookie(state.name, JSON.stringify(nextVal), 0);
                    } else {
                        options.setCookie(state.name, JSON.stringify(nextVal));
                    }
                }
            });
        });

        return result;
    };
};

export default reduxCookiesMiddleware;
