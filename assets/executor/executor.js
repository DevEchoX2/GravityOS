export async function executeCode(code, type = 'js') {
    if (type === 'js') {
        const logs = [];
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = (...args) => {
            logs.push(args.map(a => String(a)).join(' '));
            originalLog(...args);
        };
        console.error = (...args) => {
            logs.push('ERROR: ' + args.map(a => String(a)).join(' '));
            originalError(...args);
        };

        try {
            const result = eval(code);
            return {
                success: true,
                result: result !== undefined ? String(result) : 'undefined',
                logs: logs.join('\n')
            };
        } catch (err) {
            return {
                success: false,
                error: err.message,
                logs: logs.join('\n')
            };
        } finally {
            console.log = originalLog;
            console.error = originalError;
        }
    } else if (type === 'wasm') {
        try {
            const buffer = typeof code === 'string' ? hexToUint8Array(code) : code;
            
            let instance;
            const importObject = {
                env: {
                    redirect: (ptr, len) => {
                        if (!instance) return;
                        const memory = instance.exports.memory;
                        const url = new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));
                        console.log('WASM requested redirect to:', url);
                        // Using window.open as requested
                        window.open(url, '_blank');
                    },
                    log: (ptr, len) => {
                        if (!instance) return;
                        const memory = instance.exports.memory;
                        const msg = new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));
                        console.log('[WASM]:', msg);
                    }
                }
            };

            const wasmResult = await WebAssembly.instantiate(buffer, importObject);
            instance = wasmResult.instance;
            const exports = Object.keys(instance.exports);
            
            // If the WASM has a 'main' or 'start' function, run it
            if (instance.exports.main) instance.exports.main();
            else if (instance.exports._start) instance.exports._start();

            return {
                success: true,
                result: `WASM Module loaded. Exports: ${exports.join(', ')}`,
                instance: instance
            };
        } catch (err) {
            return {
                success: false,
                error: `WASM Error: ${err.message}`
            };
        }
    }
}

function hexToUint8Array(hex) {
    hex = hex.replace(/\s+/g, '');
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        array[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return array;
}
