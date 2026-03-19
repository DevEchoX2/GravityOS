import { createRobloxEnv } from './roblox-api.js';
import { ScriptHub } from './script-hub.js';

export async function executeCode(code, type = 'js') {
    const logs = [];
    const logFn = (...args) => {
        const msg = args.map(a => String(a)).join(' ');
        logs.push(msg);
        console.log(msg);
    };

    if (type === 'js') {
        try {
            // Check if it's a ScriptHub shortcut
            if (code.startsWith('hub:')) {
                const [_, category, name] = code.split(':');
                code = ScriptHub[category]?.[name] || code;
            }

            const result = eval(code);
            return {
                success: true,
                result: result !== undefined ? String(result) : 'undefined',
                logs: logs.join('\n')
            };
        } catch (err) {
            return { success: false, error: err.message, logs: logs.join('\n') };
        }
    } else if (type === 'lua') {
        const robloxEnv = createRobloxEnv(logFn);
        try {
            if (!window.fengari) {
                await loadScript("https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js");
            }

            const { lua, lauxlib, lualib } = window.fengari;
            const L = lauxlib.luaL_newstate();
            lualib.luaL_openlibs(L);

            const pushValue = (val) => {
                if (typeof val === 'function') {
                    lua.lua_pushjsfunction(L, (L) => {
                        const n = lua.lua_gettop(L);
                        const args = [];
                        for (let i = 1; i <= n; i++) {
                            const type = lua.lua_type(L, i);
                            if (type === lua.LUA_TSTRING) args.push(fengari.to_jsstring(lua.lua_tostring(L, i)));
                            else if (type === lua.LUA_TNUMBER) args.push(lua.lua_tonumber(L, i));
                            else if (type === lua.LUA_TBOOLEAN) args.push(lua.lua_toboolean(L, i));
                            else args.push(null);
                        }
                        const res = val(...args);
                        if (res !== undefined) {
                            pushValue(res);
                            return 1;
                        }
                        return 0;
                    });
                } else if (typeof val === 'object' && val !== null) {
                    lua.lua_newtable(L);
                    Object.entries(val).forEach(([k, v]) => {
                        lua.lua_pushstring(L, fengari.to_luastring(k));
                        pushValue(v);
                        lua.lua_settable(L, -3);
                    });
                } else if (typeof val === 'string') {
                    lua.lua_pushstring(L, fengari.to_luastring(val));
                } else if (typeof val === 'number') {
                    lua.lua_pushnumber(L, val);
                } else if (typeof val === 'boolean') {
                    lua.lua_pushboolean(L, val);
                } else {
                    lua.lua_pushnil(L);
                }
            };

            // Register Roblox API
            Object.entries(robloxEnv).forEach(([key, value]) => {
                pushValue(value);
                lua.lua_setglobal(L, fengari.to_luastring(key));
            });

            const status = lauxlib.luaL_dostring(L, fengari.to_luastring(code));
            if (status !== 0) {
                return { success: false, error: fengari.to_jsstring(lua.lua_tostring(L, -1)), logs: logs.join('\n') };
            }
            return { success: true, result: "Lua Finished", logs: logs.join('\n') };
        } catch (err) {
            return { success: false, error: err.message, logs: logs.join('\n') };
        }
    } else if (type === 'wasm') {
        try {
            const buffer = typeof code === 'string' ? hexToUint8Array(code) : code;
            const importObject = {
                env: {
                    redirect: (ptr, len) => {
                        const url = new TextDecoder().decode(new Uint8Array(instance.exports.memory.buffer, ptr, len));
                        window.open(url, '_blank');
                    },
                    log: (ptr, len) => {
                        const msg = new TextDecoder().decode(new Uint8Array(instance.exports.memory.buffer, ptr, len));
                        logFn('[WASM]:', msg);
                    }
                }
            };

            const { instance } = await WebAssembly.instantiate(buffer, importObject);
            if (instance.exports.main) instance.exports.main();
            return { success: true, result: `WASM Loaded. Exports: ${Object.keys(instance.exports).join(', ')}` };
        } catch (err) {
            return { success: false, error: `WASM Error: ${err.message}` };
        }
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function hexToUint8Array(hex) {
    hex = hex.replace(/[^0-9a-fA-F]/g, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        array[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return array;
}
