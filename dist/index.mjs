// src/utils/tools.ts
import { promises as fs } from "fs";
import { Readable } from "stream";

// src/utils/validation.ts
function isURL(url2) {
  const urlRegex = /^(https?:\/\/)?(www\.)?([\da-z.-]+)(?::(\d{1,5}))?([\/\w .-]*)*\/?(\?[&\w=.+-]*)?(#[\w-]*)?$/i;
  const ipv4Regex = /^(https?:\/\/)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d{1,5}))?([\/\w .-]*)*\/?(\?[&\w=.+-]*)?(#[\w-]*)?$/i;
  const ipv6Regex = /^(https?:\/\/)?\[([a-f0-9:]+)\](?::(\d{1,5}))?([\/\w .-]*)*\/?(\?[&\w=.+-]*)?(#[\w-]*)?$/i;
  const localhostRegex = /^(https?:\/\/)?localhost(?::(\d{1,5}))?([\/\w .-]*)*\/?(\?[&\w=.+-]*)?(#[\w-]*)?$/i;
  const fileRegex = /^file:\/\/\/?([\/\w .-]*)*\/?$/i;
  return urlRegex.test(url2) || ipv4Regex.test(url2) || ipv6Regex.test(url2) || localhostRegex.test(url2) || fileRegex.test(url2);
}
function toBool(input, returnBool = true) {
  return /true|yes|ok|act|sure|enable/gi.test(input) ? returnBool ? true : "true" : returnBool ? false : "false";
}
var isEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function isArray(input) {
  return Array.isArray(input);
}

// src/utils/tools.ts
function getRandom(options = {}) {
  const { Alphabets = true, Numbers = true, Symbols = false, DateNow = false, length = 20, fileExtension = ".png", attachFileExtension = false } = options;
  let characters = "";
  if (Alphabets)
    characters += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  if (Numbers)
    characters += "0123456789";
  if (Symbols)
    characters += "!@#$%^&*()_+-=[]{}|;:,<>?/~";
  if (DateNow)
    characters += String(Date.now());
  if (characters === "") {
    throw new Error("At least one type of character must be included.");
  }
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return attachFileExtension ? randomString + fileExtension : randomString;
}
function randomizeArray(arr) {
  if (!isArray(arr)) {
    throw new Error("Input must be an array");
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function ReadMore(length = 4001) {
  return "\u200E".repeat(length);
}
var buffertoJson = (buffer) => {
  return JSON.parse(buffer.toString("utf-8"));
};
var jsontoBuffer = (json) => {
  return Buffer.from(JSON.stringify(json));
};
var transformBuffer = (buffer, transformFn) => {
  return transformFn(buffer);
};
var bufferToFile = async (buffer, filePath) => {
  await fs.writeFile(filePath, buffer);
};
function toBuffer(data) {
  if (data instanceof Buffer)
    return data;
  if (typeof data === "string")
    return Buffer.from(data);
  return Buffer.from(JSON.stringify(data));
}
var extractUrlFromString = (str) => {
  const urlRegex = /(https?:\/\/[^\s"'<>()]+)/i;
  const match = str.match(urlRegex);
  return match ? match[0] : null;
};
var getBufferFromStream = async (stream) => {
  if (!stream.readable) {
    throw new Error("Stream is not readable");
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
var getStreamFromBuffer = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};
var sleep = (ms = 3e3) => new Promise((resolve) => setTimeout(resolve, ms));
var randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
var truncate = (text, maxLength) => text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
var timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1e3);
  const intervals = [
    { label: "year", seconds: 31536e3 },
    { label: "month", seconds: 2592e3 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 }
  ];
  for (const { label, seconds: s } of intervals) {
    const interval = Math.floor(seconds / s);
    if (interval >= 1)
      return `${interval} ${label}${interval > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};
var uniqueArray = (arr) => [...new Set(arr)];
var randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
var toQueryString = (params) => new URLSearchParams(params).toString();
var randomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
var formatNumber = (num) => num.toLocaleString();
var formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0)
    return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizes[i]}`;
};
var getTime = (date, options) => {
  if (typeof date === "object" && !("getTime" in date)) {
    options = date;
    date = void 0;
  }
  const { utc = false, timezone, format12Hour = true } = options || {};
  let dateObj = date ? new Date(date) : /* @__PURE__ */ new Date();
  if (isNaN(dateObj.getTime()))
    return null;
  const formatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: format12Hour,
    timeZone: timezone || (utc ? "UTC" : void 0)
  };
  return new Intl.DateTimeFormat("en-US", formatOptions).format(dateObj);
};
var getDate = (date = /* @__PURE__ */ new Date(), options) => {
  const { format = "YYYY-MM-DD", utc = false, timezone } = options || {};
  const formatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone || (utc ? "UTC" : void 0)
  };
  const formattedDate = new Intl.DateTimeFormat("en-US", formatOptions).format(date);
  const [month, day, year] = formattedDate.split("/");
  switch (format) {
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY/MM/DD":
      return `${year}/${month}/${day}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

// src/modules/axium.ts
var FetchError = class extends Error {
  constructor(message, status, response) {
    super(message);
    this.message = message;
    this.status = status;
    this.response = response;
    this.name = "FetchError";
  }
};
var ProgressEvent = class {
  constructor(loaded, total) {
    this.loaded = loaded;
    this.total = total;
  }
  get percent() {
    return this.total > 0 ? this.loaded / this.total * 100 : 0;
  }
};
var Axium = class {
  constructor(defaults) {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.globalDefaults = {
      headers: {
        "Content-Type": "application/json"
      }
    };
    if (defaults) {
      this.globalDefaults = { ...this.globalDefaults, ...defaults };
    }
  }
  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }
  // Set global defaults
  setGlobalDefaults(defaults) {
    this.globalDefaults = { ...this.globalDefaults, ...defaults };
  }
  // Apply interceptors
  async applyInterceptors(interceptors, value) {
    let result = value;
    for (const interceptor of interceptors) {
      result = await interceptor(result);
    }
    return result;
  }
  // Build URL with query parameters
  buildUrl(url2, params) {
    if (!params)
      return url2;
    const urlObj = new URL(url2);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    return urlObj.toString();
  }
  // Core fetch request
  async request(url2, options = {}) {
    const { retries = 0, retryDelay = 0, timeout, params, onDownloadProgress, onUploadProgress, signal: externalSignal, ...fetchOptions } = await this.applyInterceptors(this.requestInterceptors, { ...this.globalDefaults, ...options });
    const finalUrl = this.buildUrl(url2, params);
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;
      const signal = externalSignal || controller.signal;
      try {
        const response = await fetch(finalUrl, {
          ...fetchOptions,
          signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
            ...fetchOptions.headers
          }
        });
        if (timeoutId)
          clearTimeout(timeoutId);
        if (!response.ok) {
          throw new FetchError(`HTTP error! Status: ${response.status}`, response.status, response);
        }
        if (onDownloadProgress && response.body) {
          const reader = response.body.getReader();
          const contentLength = Number(response.headers.get("content-length")) || 0;
          let loaded = 0;
          const stream = new ReadableStream({
            async start(controller2) {
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                loaded += value.length;
                onDownloadProgress(new ProgressEvent(loaded, contentLength));
                controller2.enqueue(value);
              }
              controller2.close();
            }
          });
          const newResponse = new Response(stream, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText
          });
          const interceptedResponse = await this.applyInterceptors(this.responseInterceptors, newResponse);
          const contentType = interceptedResponse.headers.get("content-type");
          let data;
          if (contentType?.includes("application/json")) {
            data = await interceptedResponse.json();
          } else if (contentType?.includes("text")) {
            data = await interceptedResponse.text();
          } else if (contentType?.includes("application/xml") || contentType?.includes("text/xml")) {
            data = await interceptedResponse.text();
          } else if (contentType?.includes("application/pdf")) {
            data = await interceptedResponse.blob();
          } else if (contentType?.includes("image/")) {
            data = await interceptedResponse.blob();
          } else if (contentType?.includes("application/octet-stream")) {
            data = await interceptedResponse.arrayBuffer();
          } else {
            data = await interceptedResponse.arrayBuffer();
          }
          return {
            data,
            status: interceptedResponse.status,
            statusText: interceptedResponse.statusText,
            headers: interceptedResponse.headers,
            config: options
          };
        } else {
          const interceptedResponse = await this.applyInterceptors(this.responseInterceptors, response);
          const contentType = interceptedResponse.headers.get("content-type");
          let data;
          if (contentType?.includes("application/json")) {
            data = await interceptedResponse.json();
          } else if (contentType?.includes("text")) {
            data = await interceptedResponse.text();
          } else if (contentType?.includes("application/xml") || contentType?.includes("text/xml")) {
            data = await interceptedResponse.text();
          } else if (contentType?.includes("application/pdf")) {
            data = await interceptedResponse.blob();
          } else if (contentType?.includes("image/")) {
            data = await interceptedResponse.blob();
          } else if (contentType?.includes("application/octet-stream")) {
            data = await interceptedResponse.arrayBuffer();
          } else {
            data = await interceptedResponse.arrayBuffer();
          }
          return {
            data,
            status: interceptedResponse.status,
            statusText: interceptedResponse.statusText,
            headers: interceptedResponse.headers,
            config: options
          };
        }
      } catch (error2) {
        if (timeoutId)
          clearTimeout(timeoutId);
        if (attempt === retries) {
          console.error(`Fetch failed after ${retries + 1} attempts:`, error2.message);
          throw new FetchError(error2.message || "Request failed");
        }
        if (retryDelay > 0) {
          console.warn(`Retrying... (${attempt + 1}/${retries + 1})`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
  }
  // Helper methods
  get(url2, options = {}) {
    return this.request(url2, { ...options, method: "GET" });
  }
  post(url2, data, options = {}) {
    return this.request(url2, { ...options, method: "POST", body: JSON.stringify(data) });
  }
  put(url2, data, options = {}) {
    return this.request(url2, { ...options, method: "PUT", body: JSON.stringify(data) });
  }
  patch(url2, data, options = {}) {
    return this.request(url2, { ...options, method: "PATCH", body: JSON.stringify(data) });
  }
  delete(url2, options = {}) {
    return this.request(url2, { ...options, method: "DELETE" });
  }
  // Multipart form data
  postFormData(url2, data, options = {}) {
    return this.request(url2, {
      ...options,
      method: "POST",
      body: data,
      headers: {
        ...options.headers
      }
    });
  }
  // URL-encoded form
  postUrlEncoded(url2, data, options = {}) {
    const encodedData = new URLSearchParams(data).toString();
    return this.request(url2, {
      ...options,
      method: "POST",
      body: encodedData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...options.headers
      }
    });
  }
  // Multiple concurrent requests
  all(requests) {
    return Promise.all(requests);
  }
  // Get buffer
  getBuffer(url2, options = {}) {
    return this.request(url2, { ...options, method: "GET" });
  }
  // Head request
  head(url2, options = {}) {
    return this.request(url2, { ...options, method: "HEAD" });
  }
};
var axium = new Axium();

// src/modules/crypto.ts
import crypto from "crypto";
var sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");
var randomBytes = (length = 16) => crypto.randomBytes(length).toString("hex");
var generateUUID = () => crypto.randomUUID();
var encryptAES = (text, key) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.alloc(16, 0));
  return cipher.update(text, "utf8", "hex") + cipher.final("hex");
};
var decryptAES = (encrypted, key) => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "hex"), Buffer.alloc(16, 0));
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};

// src/modules/fs.ts
import fs2 from "fs";
var readFile = (path3) => {
  try {
    return fs2.readFileSync(path3, "utf-8");
  } catch (error2) {
    console.error("File Read Error:", error2 instanceof Error ? error2.message : error2);
    return null;
  }
};
var writeFile = (path3, data) => {
  try {
    fs2.writeFileSync(path3, data, "utf-8");
  } catch (error2) {
    console.error("File Write Error:", error2 instanceof Error ? error2.message : error2);
  }
};
var appendToFile = (path3, data) => {
  try {
    fs2.appendFileSync(path3, data + "\n", "utf-8");
  } catch (error2) {
    console.error("File Append Error:", error2 instanceof Error ? error2.message : error2);
  }
};
var deleteFile = (path3) => {
  try {
    fs2.unlinkSync(path3);
  } catch (error2) {
    console.error("File Delete Error:", error2 instanceof Error ? error2.message : error2);
  }
};
var fileExists = (path3) => {
  return fs2.existsSync(path3);
};

// src/modules/os.ts
import os from "os";
var getSystemInfo = () => ({
  platform: os.platform(),
  osType: os.type(),
  release: os.release(),
  architecture: os.arch(),
  cpuModel: os.cpus()[0]?.model || "Unknown",
  cpuCores: os.cpus().length,
  totalMemory: `${(os.totalmem() / 1e9).toFixed(2)} GB`,
  freeMemory: `${(os.freemem() / 1e9).toFixed(2)} GB`,
  uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
  homeDir: os.homedir(),
  hostname: os.hostname()
});
var getCpuLoad = () => os.loadavg();
var getNetworkInterfaces = () => os.networkInterfaces();
var getUserInfo = () => os.userInfo();

// src/modules/path.ts
import path from "path";
var getFileName = (filePath, withExt = true) => {
  return withExt ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
};
var getAbsolutePath = (relativePath) => path.resolve(relativePath);
var normalizePath = (filePath) => path.normalize(filePath);
var getFileExtension = (filePath, withDot = true) => {
  const ext = path.extname(filePath);
  return withDot ? ext : ext.replace(".", "");
};
var joinPath = (...paths) => path.join(...paths);
var getRelativePath = (from, to) => path.relative(from, to);

// src/modules/url.ts
import { URL as URL2 } from "url";
import querystring from "querystring";
var pasrseURL = (urlString) => {
  const urlObj = new URL2(urlString);
  return {
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    pathname: urlObj.pathname,
    query: querystring.parse(urlObj.search.substring(1))
    // Convert query params to object
  };
};
var buildUrl = (baseUrl, params) => {
  return `${baseUrl}?${querystring.stringify(params)}`;
};

// src/modules/child_process.ts
import { exec, execSync, spawn } from "child_process";
var runCommand = (command, cwd, timeout = 5e3) => {
  return new Promise((resolve, reject) => {
    const process = exec(command, { cwd, timeout }, (error2, stdout, stderr) => {
      if (error2)
        return reject(`Error: ${error2.message}`);
      if (stderr)
        return reject(`Stderr: ${stderr}`);
      resolve(stdout.trim());
    });
    process.stdout?.on("data", (data) => console.log(data.toString()));
    process.stderr?.on("data", (data) => console.error(data.toString()));
  });
};
var runCommandSync = (command, cwd) => {
  try {
    return execSync(command, { cwd, encoding: "utf-8" }).trim();
  } catch (error2) {
    console.error(`Command Failed: ${error2 instanceof Error ? error2.message : error2}`);
    return null;
  }
};
var runSpawn = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { cwd, shell: true });
    let output = "";
    process.stdout.on("data", (data) => output += data.toString());
    process.stderr.on("data", (data) => console.error(`Stderr: ${data.toString()}`));
    process.on("close", (code) => code === 0 ? resolve(output.trim()) : reject(`Exited with code ${code}`));
  });
};

// src/modules/apex.ts
import http from "http";
import url from "url";
import fs3 from "fs";
import path2 from "path";
var Router = class {
  constructor() {
    this.routes = {};
    this.middlewares = [];
    this.settings = {};
    this.viewsDir = "";
    this.viewEngine = null;
    this.trustProxy = false;
    this.jsonSpaces = 0;
    this.flashMessages = {};
  }
  // Add middleware
  use(path3, middleware) {
    if (typeof path3 === "string" && middleware) {
      this.middlewares.push((req, res, next) => {
        if (req.url?.startsWith(path3)) {
          middleware(req, res, next);
        } else {
          next();
        }
      });
    } else if (typeof path3 === "function") {
      this.middlewares.push(path3);
    }
  }
  // Add GET route
  get(path3, handler) {
    this.addRoute(path3, "GET", handler);
  }
  // Add POST route
  post(path3, handler) {
    this.addRoute(path3, "POST", handler);
  }
  // Add PUT route
  put(path3, handler) {
    this.addRoute(path3, "PUT", handler);
  }
  // Add DELETE route
  delete(path3, handler) {
    this.addRoute(path3, "DELETE", handler);
  }
  // Add a route with a handler for a specific HTTP method
  addRoute(path3, method, handler) {
    if (!this.routes[path3]) {
      this.routes[path3] = {};
    }
    this.routes[path3][method.toUpperCase()] = handler;
  }
  // Set configuration
  set(key, value) {
    if (key === "view engine") {
      if (value === "ejs") {
        this.viewEngine = (filePath, data, callback) => {
          fs3.readFile(filePath, "utf8", (err, template) => {
            if (err)
              return callback(err);
            const rendered = template.replace(/<%=\s*(.*?)\s*%>/g, (_, key2) => data[key2] || "");
            callback(null, rendered);
          });
        };
      } else {
        throw new Error(`Unsupported view engine: ${value}`);
      }
    } else if (key === "views") {
      this.viewsDir = value;
    } else if (key === "trust proxy") {
      this.setTrustProxy(value);
    } else if (key === "json spaces") {
      this.setJsonSpaces(value);
    }
    this.settings[key] = value;
  }
  // Get configuration
  getSetting(key) {
    return this.settings[key];
  }
  // Set trust proxy
  setTrustProxy(value) {
    this.trustProxy = value;
  }
  // Get client IP address considering trust proxy
  getClientIp(req) {
    if (!this.trustProxy) {
      return req.socket.remoteAddress || "";
    }
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string") {
      const ips = forwardedFor.split(",");
      if (this.trustProxy === true || this.trustProxy === "all") {
        return ips[0].trim();
      } else if (typeof this.trustProxy === "number") {
        return ips[this.trustProxy - 1]?.trim() || req.socket.remoteAddress || "";
      }
    }
    return req.socket.remoteAddress || "";
  }
  // Set JSON spaces
  setJsonSpaces(spaces) {
    if (typeof spaces !== "number" || spaces < 0) {
      throw new Error("jsonSpaces must be a non-negative number");
    }
    this.jsonSpaces = spaces;
  }
  // Flash middleware
  useFlash() {
    return (req, res, next) => {
      req.flash = (type, message) => {
        if (!this.flashMessages[type]) {
          this.flashMessages[type] = [];
        }
        if (message) {
          this.flashMessages[type].push(message);
        }
        return this.flashMessages[type];
      };
      res.locals = res.locals || {};
      res.locals.messages = this.flashMessages;
      next();
    };
  }
  // Render a view
  render(res, viewName, data = {}) {
    if (!this.viewEngine) {
      throw new Error('View engine not set. Use router.set("view engine", "ejs") to configure a view engine.');
    }
    const viewExtension = this.getSetting("view engine");
    if (!viewExtension) {
      throw new Error('View engine not set. Use router.set("view engine", "ejs") to configure a view engine.');
    }
    const viewPath = path2.join(this.viewsDir, `${viewName}.${viewExtension}`);
    this.viewEngine(viewPath, data, (err, html) => {
      if (err) {
        console.error(`Error rendering view: ${err.message}`);
        apex.text(res, 500, `Error rendering view: ${err.message}`);
      } else {
        apex.html(res, 200, html || "");
      }
    });
  }
  // Handle incoming requests
  handleRequest(req, res) {
    const reqMethod = req;
    const resMethod = res;
    reqMethod.ip = this.getClientIp(reqMethod);
    reqMethod.query = parseUrl(req).query;
    resMethod.jsonSpaces = this.jsonSpaces;
    resMethod.status = function(code) {
      this.statusCode = code;
      return this;
    };
    resMethod.json = function(data, spaces) {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(data, null, spaces ?? this.jsonSpaces ?? 0));
    };
    resMethod.send = function(data) {
      if (typeof data === "object") {
        this.json(data);
      } else {
        this.setHeader("Content-Type", "text/plain");
        this.end(data);
      }
    };
    resMethod.cookie = function(name, value, options) {
      const cookie = `${name}=${value}; ${Object.entries(options || {}).map(([k, v]) => `${k}=${v}`).join("; ")}`;
      this.setHeader("Set-Cookie", cookie);
    };
    resMethod.clearCookie = function(name, options) {
      this.setHeader("Set-Cookie", `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    };
    resMethod.redirect = function(url2) {
      this.writeHead(302, { Location: url2 });
      this.end();
    };
    const executeMiddlewares = (index) => {
      if (index < this.middlewares.length) {
        try {
          this.middlewares[index](reqMethod, resMethod, () => executeMiddlewares(index + 1));
        } catch (err) {
          console.error("Middleware error:", err);
          apex.text(resMethod, 500, "Internal Server Error");
        }
      } else {
        if (this.routes[reqMethod.url] && this.routes[reqMethod.url][reqMethod.method]) {
          return this.routes[reqMethod.url][reqMethod.method](reqMethod, resMethod);
        }
        for (const route in this.routes) {
          if (route.endsWith("/*") && reqMethod.url.startsWith(route.slice(0, -2))) {
            if (this.routes[route][reqMethod.method]) {
              return this.routes[route][reqMethod.method](reqMethod, resMethod);
            }
          }
        }
        this.notFoundHandler(reqMethod, resMethod);
      }
    };
    executeMiddlewares(0);
  }
  // Default 404 handler
  notFoundHandler(req, res) {
    apex.text(res, 404, "Not Found");
  }
};
function createServer(router) {
  return http.createServer((req, res) => {
    router.handleRequest(req, res);
  });
}
var apex = {
  Router,
  createServer,
  text(res, statusCode, message) {
    res.writeHead(statusCode, { "Content-Type": "text/plain" });
    res.end(message);
  },
  json(res, statusCode, data, spaces) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, null, spaces || 0));
  },
  html(res, statusCode, html) {
    res.writeHead(statusCode, { "Content-Type": "text/html" });
    res.end(html);
  },
  sendFile(res, filePath) {
    const extname = path2.extname(filePath).toLowerCase();
    const contentType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".txt": "text/plain",
      ".pdf": "application/pdf",
      ".zip": "application/zip",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".flac": "audio/flac",
      ".aac": "audio/aac",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".eot": "application/vnd.ms-fontobject",
      ".xml": "application/xml",
      ".csv": "text/csv"
    }[extname] || "application/octet-stream";
    fs3.readFile(filePath, (err, data) => {
      if (err) {
        apex.text(res, 404, "File Not Found");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  },
  static(staticPath) {
    return (req, res, next) => {
      const { pathname } = parseUrl(req);
      const filePath = path2.join(staticPath, pathname);
      fs3.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          next();
        } else {
          apex.sendFile(res, filePath);
        }
      });
    };
  },
  favicon(iconPath) {
    return (req, res, next) => {
      if (req.url === "/favicon.ico") {
        apex.sendFile(res, iconPath);
      } else {
        next();
      }
    };
  },
  rateLimit: (options = {}) => {
    const {
      windowMs = 60 * 1e3,
      // 1 minute
      max = 100,
      // 100 requests per window
      message = "Too many requests, please try again later.",
      statusCode = 429,
      // 429 Too Many Requests
      skip = () => false,
      // Skip rate limiting for certain requests
      keyGenerator = (req) => req.ip || "global",
      // Default key generator (IP-based)
      handler = (req, res) => {
        const key = keyGenerator(req);
        const remainingTime = store[key] ? Math.ceil((store[key].resetTime - Date.now()) / 1e3) : 0;
        res.setHeader("RateLimit-Limit", max);
        res.setHeader("RateLimit-Remaining", 0);
        res.setHeader("RateLimit-Reset", remainingTime);
        res.setHeader("RateLimit-Policy", `${max};w=${windowMs / 1e3}`);
        res.status(statusCode).json({ message });
      }
    } = options;
    const store = {};
    setInterval(() => {
      const now = Date.now();
      for (const key in store) {
        if (store[key].resetTime <= now) {
          delete store[key];
        }
      }
    }, windowMs);
    return (req, res, next) => {
      if (skip(req)) {
        return next();
      }
      const key = keyGenerator(req);
      const now = Date.now();
      if (!store[key]) {
        store[key] = {
          count: 1,
          resetTime: now + windowMs
        };
      } else {
        store[key].count++;
      }
      const remainingTime = Math.ceil((store[key].resetTime - now) / 1e3);
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", Math.max(0, max - store[key].count));
      res.setHeader("RateLimit-Reset", remainingTime);
      res.setHeader("RateLimit-Policy", `${max};w=${windowMs / 1e3}`);
      if (store[key].count > max) {
        return handler(req, res);
      }
      next();
    };
  }
};
function parseUrl(req) {
  const parsedUrl = url.parse(req.url || "", true);
  const query = {};
  for (const key in parsedUrl.query) {
    const value = parsedUrl.query[key];
    if (value !== void 0) {
      query[key] = Array.isArray(value) ? value : value.toString();
    }
  }
  return {
    pathname: parsedUrl.pathname || "",
    query
  };
}

// src/modules/console.ts
function log(...args) {
  console.log(...args);
}
function error(...args) {
  console.error(...args);
}
function warn(...args) {
  console.warn(...args);
}
function info(...args) {
  console.info(...args);
}
function debug(...args) {
  console.debug(...args);
}
function table(data, columns) {
  console.table(data, columns);
}
function clear() {
  console.clear();
}
export {
  ReadMore,
  apex,
  appendToFile,
  axium,
  bufferToFile,
  buffertoJson,
  buildUrl,
  clear,
  debug,
  decryptAES,
  deleteFile,
  encryptAES,
  error,
  extractUrlFromString,
  fileExists,
  formatBytes,
  formatNumber,
  generateUUID,
  getAbsolutePath,
  getBufferFromStream,
  getCpuLoad,
  getDate,
  getFileExtension,
  getFileName,
  getNetworkInterfaces,
  getRandom,
  getRelativePath,
  getStreamFromBuffer,
  getSystemInfo,
  getTime,
  getUserInfo,
  info,
  isArray,
  isEmail,
  isObject,
  isURL,
  joinPath,
  jsontoBuffer,
  log,
  normalizePath,
  pasrseURL,
  randomBytes,
  randomElement,
  randomHexColor,
  randomInt,
  randomizeArray,
  readFile,
  runCommand,
  runCommandSync,
  runSpawn,
  sha256,
  sleep,
  table,
  timeAgo,
  toBool,
  toBuffer,
  toQueryString,
  transformBuffer,
  truncate,
  uniqueArray,
  warn,
  writeFile
};
