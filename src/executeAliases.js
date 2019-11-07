import { browser } from './browserApi';

const applyOptions = ({ tabsOnly, extensionId, excludeTabs }, sender) => {
    if (tabsOnly && !sender.tab) return false;
    if (excludeTabs && sender.tab) return false;
    if (extensionId && extensionId !== sender.id) return false;

    return true;
};

const validateAction = (action, options) => {
    if (typeof action !== 'object') return false;
    if (!action.aliasAction) return false;
    if (!action.type || !(action.payload instanceof Array)) {
        console.warn('Wrong action');
        console.warn(action);
        return false;
    }
    if (options.senderName) {
        if (!action.senderName) return false;
        if (options.senderName instanceof Array) {
            if (!options.senderName.includes(action.senderName)) return false;
        } else {
            if (options.senderName !== action.senderName) return false;
        }
    }

    return true;
};

const validateAlias = (alias) => {
    if (!alias || !(typeof alias === 'function')) {
        console.error('Error while validate alias');
        console.error(alias);
        return false;
    }

    return true;
};

const validateArgs = (aliases, options) => {
    if (!aliases || typeof aliases !== 'object') return false;
    if (!options || typeof options !== 'object') return false;

    return true;
};

export const executeAliases = (aliases = {}, options = {}) => {
    if (!validateArgs(aliases, options)) throw new Error('Invalid arguments when calling executeAliases function');
    browser.runtime.onMessage.addListener((action, sender, sendResponse) => {
        if (!applyOptions(options, sender)) return;
        if (!validateAction(action, options)) return;

        const alias = aliases[ action.type ];
        if (!validateAlias(alias)) return;

        const response = async () => {
            try {
                const result = await alias(...action.payload);
                sendResponse(result);
            } catch (e) {
                console.error(`Failed execute alias: ${action.type}`);
                console.error(e);
                sendResponse(undefined);
            }
        };

        response();

        return true;
    });
};

export const executeTabAliases = (aliases = {}, options = {}) => executeAliases(aliases, {
    ...options,
    tabsOnly: true,
    excludeTabs: false
});
