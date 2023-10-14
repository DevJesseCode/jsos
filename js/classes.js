class Filesystem {
    constructor(...topLevelFolders) {
        this.dir = {
            storage: {
                type: "folder",
                contents: new Map()
            }
        }
        this.paths = ["storage/"]
        if (topLevelFolders[0]) {
            for (const folder of topLevelFolders) {
                this.dir.storage.contents.set(folder, {
                    type: "folder",
                    contents: new Map()
                })
                this.paths.push(`storage/${folder}/`)
            }
        }
    }
    read(file, from) {
        if (from) {
            const fromArray = new Array(...from)
            if (fromArray[fromArray.length - 1] !== "/") fromArray.push("/")
            from = fromArray.join("")
            if (this.paths.includes(from)) {
                const pathSegments = from.split("/")
                pathSegments.pop()
                let wd
                for (const directory of pathSegments) {
                    wd = wd ? wd.contents.get(directory) : this.dir[directory]
                }
                for (const entry of wd.contents.entries()) {
                    if (entry[0] === file && entry[1].type !== "folder") {
                        if (entry[1].type.includes("text") || entry[1].type.includes("svg")) {
                            // return `data:${entry[1].type},${encodeURIComponent(entry[1].contents)}`
                            return entry[1].contents
                        } else {
                            return entry[1].contents
                        }
                    } else {
                        throw new Error("A directory was passed to the read function or file not found")
                    }
                }
                return false
            } else {
                throw new Error("File read error: invalid directory")
            }
        } else {
            if (this.dir.storage.contents.get(file)) {
                if (this.dir.storage.contents.get(file).type !== "folder") {
                    return this.dir.storage.contents.get(file).contents
                } else {
                    throw new Error("A directory was passed to the read function")
                }
            } else {
                return false
            }
        }
    }
    write(file, to) {
        if (!file.name || !file.type || !file.contents) {
            throw new Error("The file argument must be an object and contain truthy values for name, type, and contents")
        }
        if (!to) {
            throw new Error("Directory to write to was not passed to the function")
        }
        const toArray = new Array(...to)
        if (toArray[toArray.length - 1] !== "/") toArray.push("/")
        to = toArray.join("")
        const pathSegments = to.split("/")
        pathSegments.pop()
        if (this.paths.includes(to)) {
            let wd
            for (const directory of pathSegments) {
                wd = wd ? wd.contents.get(directory) : this.dir[directory]
            }
            if (file.type !== "folder") {
                wd.contents.set(file.name, { type: file.type, contents: file.contents })
            } else {
                if (!(file.contents.entries === new Map().entries)) {
                    throw new Error("A folder's contents must be a Map object")
                }
                wd.contents.set(file.name, { type: file.type, contents: file.contents })
                if (!this.paths.includes(`${to}${file.name}/`)) this.paths.push(`${to}${file.name}/`)
            }
        } else {
            let dir = ""
            let wd
            for (const directory of pathSegments) {
                if (!dir) {
                    wd = wd ? wd.contents.get(directory) : this.dir[directory]
                    dir += `${directory}/`
                } else {
                    if (this.paths.includes(`${dir}${directory}/`)) {
                        wd = wd ? wd.contents.get(directory) : this.dir[directory]
                    } else {
                        wd.contents.set(directory, { type: "folder", contents: new Map() })
                        wd = wd ? wd.contents.get(directory) : this.dir[directory]
                        this.paths.push(`${dir}${directory}/`)
                    }
                    dir += `${directory}/`
                }
            }
            wd.contents.set(file.name, { type: file.type, contents: file.contents })
            if (file.type !== "folder") {
                wd.contents.set(file.name, { type: file.type, contents: file.contents })
            } else {
                if (!(file.contents.entries === new Map().entries)) {
                    throw new Error("A folder's contents must be a Map object")
                }
                wd.contents.set(file.name, { type: file.type, contents: file.contents })
                this.paths.push(`${dir}${file.name}/`)
            }
        }
    }
    query(file) {
        const fileArray = new Array(...file)
        if (fileArray[fileArray.length - 1] !== "/") fileArray.push("/")
        file = fileArray.join("")
        const pathSegments = file.split("/")
        pathSegments.pop()
        let wd
        for (const directory of pathSegments) {
            wd = wd ? wd.contents.get(directory) : this.dir[directory]
        }
        if (wd) {
            if (wd.type !== "folder") {
                return { exist: true, type: wd.type }
            } else {
                const contentsArray = Array.from(wd.contents.entries()).flat()
                const returnArray = []
                contentsArray.forEach((file) => {
                    if (typeof file === "string") {
                        returnArray.push(file)
                    }
                })
                return returnArray
            }
        } else {
            return false
        }
    }
}

class App {
    constructor(appObject) {
        const { name, version, description, author, appCode, appIcon, runOptions, fs } = appObject
        this.name = name
        this.version = version
        this.description = description
        this.author = author
        this.appCode = appCode
        if (appIcon) {
            if (!appIcon.indexOf("http://")) {
                throw new Error("All links must be secure🔒😇")
            } else {
                this.appIcon = appIcon
            }
        } else {
            this.appIcon = undefined
        }
        this.fs = fs
        this.runOptions = {
            width: runOptions.width,
            height: runOptions.height,
            execFile: runOptions.execFile || "index.html"
        }
        this.installed = false
    }
    run() {
        if (!this.installed) {
            throw new Error("You need to install an app before running it. Try `App.install()`")
        }
        if (!gui.running) {
            gui.running = {}
        }
        let offset = 0
        for (const [key, value] of Object.entries(gui.running)) {
            if (key === this.name) {
                for (let i = 0; i < value.length; i++) {
                    offset += 75
                }
            }
        }
        const { width, height, execFile } = this.runOptions
        const appWindowContainer = document.createElement("div")
        const appWindow = document.createElement("iframe")
        appWindow.src = this.fs.read(execFile, `storage/apps/${this.name}`)
        appWindowContainer.setAttribute("appWindowContainer", "true")
        appWindow.setAttribute("appWindow", "true")
        appWindowContainer.style.top = `${30 + offset}px`
        appWindowContainer.style.left = `${30 + offset}px`
        appWindowContainer.style.zIndex = maxZIndex
        appWindow.style.borderBottomLeftRadius = `10px`
        appWindow.style.borderBottomRightRadius = `10px`
        appWindow.height = height
        appWindow.width = width
        appWindowContainer.addEventListener("click", (event) => {
            document.querySelectorAll("[appWindowContainer=true]").forEach((window) => {
                window.style.zIndex--
            })
            event.target.style.zIndex = maxZIndex
        })
        maxZIndex++
        appWindowContainer.appendChild(appWindow)
        gui.appendChild(appWindowContainer)
        if (!gui.running[this.name]) {
            gui.running[this.name] = []
        }
        gui.running[this.name].push(appWindow)
    }
    install() {
        this.fs.write({ name: this.runOptions.execFile, type: "text/html", contents: this.appCode }, `storage/apps/${this.name}`)
        const appIconElement = document.createElement("img")
        appIconElement.classList.add("taskbar-icon")
        appIconElement.setAttribute("app", this.name)
        if (this.appIcon) {
            if (!this.appIcon.indexOf("https://") || !this.appIcon.indexOf("./")) {
                appIconElement.src = this.appIcon
            } else {
                appIconElement.src = "data:image/svg," + encodeURIComponent(this.appIcon)
            }
        } else {
            appIconElement.src = "./img/default/app-icon.svg"
        }
        appIconElement.addEventListener("click", () => {
            this.run()
        })
        taskbar.appendChild(appIconElement)
        this.installed = true
    }
}