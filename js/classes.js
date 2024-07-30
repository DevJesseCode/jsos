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
        const windowIcon = document.createElement("img")
        windowIcon.src = this.appIcon
        windowIcon.classList.add("window-icon")
        appWindow.src = this.fs.read(execFile, `storage/apps/${this.name}`)
        appWindowContainer.setAttribute("appwindowcontainer", "true")
        appWindow.setAttribute("appwindow", "true")
        appWindowContainer.style.top = `${20 + offset}px`
        appWindowContainer.style.left = `${20 + offset}px`
        appWindowContainer.style.zIndex = maxZIndex
        appWindowContainer.setAttribute("zIndex", `'${maxZIndex}'`)
        appWindow.height = height
        appWindow.width = width
        appWindow.__proto__.connectedCallback = () => {
            appWindow.load(appWindow.src)
            appWindow.src = ''
            appWindow.sandbox = '' + appWindow.sandbox || 'allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation' // all except allow-top-navigation
        }
        appWindow.__proto__.load = (url, options) => {
            if (!url || !url.startsWith('http'))
                throw new Error(`X-Frame-Bypass src ${url} does not start with http(s)://`)
            console.log('X-Frame-Bypass loading:', url)
            appWindow.src = url
            appWindow.srcdoc = `<html>
        <head>
            <style>
            .loader {
                position: absolute;
                top: calc(50% - 25px);
                left: calc(50% - 25px);
                width: 50px;
                height: 50px;
                background-color: #333;
                border-radius: 50%;  
                animation: loader 1s infinite ease-in-out;
            }
            @keyframes loader {
                0% {
                transform: scale(0);
                }
                100% {
                transform: scale(1);
                opacity: 0;
                }
            }
            </style>
        </head>
        <body>
            <div class="loader"></div>
        </body>
        </html>`
            appWindow.fetchProxy(url, options, 0).then(res => res.text()).then(data => {
                if (data)
                    appWindow.srcdoc = data.replace(/<head([^>]*)>/i, `<head$1>
            <base href="${url}">
            <script>
            // X-Frame-Bypass navigation event handlers
            document.addEventListener('click', e => {
                if (frameElement && document.activeElement && document.activeElement.href) {
                    e.preventDefault()
                    frameElement.src = document.activeElement.href
                    frameElement.load(document.activeElement.href)
                }
                if (frameElement && 
                    (frameElement.src === "https://www.google.com" ||
                    frameElement.src === "https://www.google.com/")) {
                        const buttonBounding = document.querySelector("[name=btnK]").getBoundingClientRect()
                        if (e.x >= buttonBounding.x && e.x <= buttonBounding.right &&
                            e.y >= buttonBounding.y && e.y <= buttonBounding.bottom) {
                            e.preventDefault()
                            let searchTerm = document.querySelector("[name=q]").value
                            let searchLink
                            searchTerm = searchTerm.replace(" ", "+")
                            searchTerm = encodeURIComponent(searchTerm)
                            searchLink = "https://www.google.com/search?q=" + searchTerm
                            frameElement.src = searchLink
                            frameElement.load(searchLink)
                        }
                }
            })
            document.addEventListener('submit', e => {
                if (frameElement && document.activeElement && document.activeElement.form && document.activeElement.form.action) {
                    e.preventDefault()
                    if (document.activeElement.form.method === 'post')
                        frameElement.load(document.activeElement.form.action, {method: 'post', body: new FormData(document.activeElement.form)})
                    else
                        frameElement.src = document.activeElement.form.action + '?' + new URLSearchParams(new FormData(document.activeElement.form))
                        frameElement.load(document.activeElement.form.action + '?' + new URLSearchParams(new FormData(document.activeElement.form)))
                }
            })
            </script>`)
            }).catch(e => console.error('Cannot load X-Frame-Bypass:', e))
        }
        appWindow.__proto__.fetchProxy = (url, options, i) => {
            const proxy = [
                'http://127.0.0.1:8080/',
                'https://api.allorigins.win/get?url=',
                'https://cors.io/?',
                'https://cors-anywhere.herokuapp.com/',
                'https://api.allorigins.win/raw?url=',
                'https://jsonp.afeld.me/?url=',
            ]
            return fetch(proxy[i] + (i === 1 ? encodeURIComponent(url) : url), options).then(res => {
                if (!res.ok)
                    throw new Error(`${res.status} ${res.statusText}`);
                return res
            }).catch(error => {
                if (i === proxy.length - 1)
                    throw error
                return appWindow.fetchProxy(url, options, i + 1)
            })
        }
        if (appWindow.src.startsWith("http")) {
            appWindow.load(appWindow.src)
        }
        appWindowContainer.addEventListener("click", switchWindow)
        maxZIndex++
        appWindowContainer.appendChild(windowIcon)
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
        appIconElement.src = this.appIcon || "./img/default/app-icon.svg"
        appIconElement.title = this.name
        appIconElement.addEventListener("click", () => {
            this.run()
        })
        taskbar.appendChild(appIconElement)
        this.installed = true
    }
}
