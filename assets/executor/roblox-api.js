// Roblox API Constants and Classes
export const RobloxAPI = {
    Vector3: class {
        constructor(x = 0, y = 0, z = 0) { this.X = x; this.Y = y; this.Z = z; }
        static new(x, y, z) { return new RobloxAPI.Vector3(x, y, z); }
    },
    Color3: class {
        constructor(r = 0, g = 0, b = 0) { this.R = r; this.G = g; this.B = b; }
        static new(r, g, b) { return new RobloxAPI.Color3(r, g, b); }
        static fromRGB(r, g, b) { return new RobloxAPI.Color3(r/255, g/255, b/255); }
    },
    UDim2: class {
        constructor(xs = 0, xo = 0, ys = 0, yo = 0) {
            this.X = { Scale: xs, Offset: xo };
            this.Y = { Scale: ys, Offset: yo };
        }
        static new(xs, xo, ys, yo) { return new RobloxAPI.UDim2(xs, xo, ys, yo); }
    },
    Instance: {
        new: (className) => {
            const obj = {
                ClassName: className,
                Name: className,
                Parent: null,
                Destroy: () => console.log(`Destroyed ${className}`),
                GetChildren: () => [],
                FindFirstChild: (name) => null
            };
            return obj;
        }
    }
};

export const createRobloxEnv = (logFn) => ({
    print: (...args) => logFn(args.join(' ')),
    warn: (...args) => logFn('WARN: ' + args.join(' ')),
    error: (...args) => logFn('ERROR: ' + args.join(' ')),
    Vector3: {
        new: (x, y, z) => RobloxAPI.Vector3.new(Number(x) || 0, Number(y) || 0, Number(z) || 0)
    },
    Color3: {
        new: (r, g, b) => RobloxAPI.Color3.new(Number(r) || 0, Number(g) || 0, Number(b) || 0),
        fromRGB: (r, g, b) => RobloxAPI.Color3.fromRGB(Number(r) || 0, Number(g) || 0, Number(b) || 0)
    },
    UDim2: {
        new: (xs, xo, ys, yo) => RobloxAPI.UDim2.new(Number(xs) || 0, Number(xo) || 0, Number(ys) || 0, Number(yo) || 0)
    },
    Instance: {
        new: (className) => RobloxAPI.Instance.new(className)
    },
    game: {
        GetService: (name) => ({ Name: name, ClassName: "Service" }),
        Workspace: { Name: "Workspace", Gravity: 196.2, Terrain: {} },
        Players: { LocalPlayer: { Name: "Player1", UserId: 12345678 } }
    },
    wait: (s) => new Promise(r => setTimeout(r, (Number(s) || 0) * 1000)),
    tick: () => Date.now() / 1000,
    delay: (s, f) => setTimeout(f, (Number(s) || 0) * 1000)
});
