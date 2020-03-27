const tailwind = require('preact-cli-tailwind');
const envVars = require('preact-cli-plugin-env-vars');

module.exports = (config, env, helpers) => {
    envVars(config, env, helpers)
    config = tailwind(config, env, helpers);
    return config;
};