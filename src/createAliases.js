import { browser } from './browserApi';

const validateArgs = (aliases, options) => {
    if (!aliases || typeof aliases !== 'object') return false;
    if (!options || typeof options !== 'object') return false;

    return true;
};

const sendAliasDefault = async (action, options, extensionId) => {
    return await new Promise((resolve, reject) => {
        browser.runtime.sendMessage(extensionId, action, options, (response) => {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError.message);
            }
            resolve(response);
        });
    });
};

const sendAliasToActiveTabOptimized = () => {
    let tab = new Promise((resolve, reject) => {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError.message);
            }
            resolve(tabs[ 0 ].id);
        });
    });

    return async (action, options) => {
        const id = await tab;
        return await new Promise((resolve, reject) => {
            browser.tabs.sendMessage(id, action, options, (response) => {
                if (browser.runtime.lastError) {
                    reject(browser.runtime.lastError.message);
                }
                resolve(response);
            });
        });
    };
};

const sendAliasToActiveTab = async (action, options) => {
    return await new Promise((resolve, reject) => {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            browser.tabs.sendMessage(tabs[ 0 ].id, action, options, (response) => {
                if (browser.runtime.lastError) {
                    reject(browser.runtime.lastError.message);
                }
                resolve(response);
            });
        });
    });
};

const sendAliasToTab = async (action, options, id) => {
    return await new Promise((resolve, reject) => {
        browser.tabs.sendMessage(id, action, options, (response) => {
            if (browser.runtime.lastError) {
                reject(browser.runtime.lastError.message);
            }
            resolve(response);
        });
    });
};

export const createAliases = (aliases = {}, options = {}) => {
    if (!validateArgs(aliases, options)) throw new Error('Invalid arguments when calling createAliases function');
    const resultObj = {};
    let id = options.extensionId;
    let sendAlias = sendAliasDefault;

    if (options.toActiveTab) {
        if (options.activeTabNotOptimized) sendAlias = sendAliasToActiveTab;
        else sendAlias = sendAliasToActiveTabOptimized();
    }

    if (options.tabId) {
        id = options.tabId;
        sendAlias = sendAliasToTab;
    }

    Object.keys(aliases).forEach((key) => {
        if (!aliases[ key ] || typeof aliases[ key ] !== 'string') {
            console.error(`Invalid function name for alias: ${key}`);
            return;
        }
        resultObj[ aliases[ key ] ] = async (...args) => {
            try {
                return await sendAlias({
                    type: key,
                    payload: args,
                    senderName: options.senderName,
                    aliasAction: true
                }, options.sendOptions, id);
            } catch (e) {
                if (options.showBrowserError) console.error(e);
                throw new Error(`Failed execute alias: ${key}`);
            }
        };
    });

    return resultObj;
};

export const createAliasesToTab = (aliases = {}, options = {}) => createAliases(aliases, {
    ...options,
    toActiveTab: !options.tabId
});
