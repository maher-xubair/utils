import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import tls from "tls";
import { mime } from "./mime";
import { IncomingMessage, ServerResponse } from "http";

interface Request extends IncomingMessage {
  body?: any;
  query?: { [key: string]: string | string[] };
  params: { [key: string]: string };
  ip?: string;
  ips?: string[];
  remoteAddress: string;
  xForwardedFor: string | string[] | undefined;
  cfConnectingIP: string | undefined;
  trueClientIP: string | undefined;
  flash?: (type: string, message?: string) => string[] | void;
  path?: string;
  protocol?: string;
  method?: string;
  files?: any;
  file?: any;
  originalUrl: string;
  baseUrl: string;
  secure: boolean;

  cookies?: { [key: string]: string };
  session?: any;
  hostname?: string;
  headers: http.IncomingHttpHeaders;
  get?: (headerName: string) => string | undefined;
  accepts: (type: string | string[]) => string | boolean | string[];
  is: (type: string) => string | boolean;
  fresh: boolean;
  stale: boolean;
  xhr: boolean;
}

interface Response extends ServerResponse {
  text: (data: any) => void;
  html: (data: any) => void;
  status: (code: number) => Response;
  type: (type: string) => Response;
  json: (data: any, spaces?: number) => void;
  send: (data: any) => void;
  sendFile: (filePath: string) => void;
  redirect: (url: string) => void;

  charset: (charset: string) => Response;
  links: (links: Record<string, string>) => Response;
  download: (filePath: string, filename?: string) => void;
  attachment: (filename?: string) => void;
  cookie: (name: string, value: string, options?: any) => void;
  clearCookie: (name: string, options?: any) => void;
  format: (obj: Record<string, () => void>) => void;
  getHeader: (name: string) => string | number | string[] | undefined;
  removeHeader: (name: string) => void;
  set: (headers: Record<string, string | number | string[]>) => Response;
  vary: (field: string) => Response;
  location: (url: string) => Response;

  locals?: { [key: string]: any };
  jsonSpaces: number;
  app: any;
}

interface RateLimiterOptions {
  windowMs?: number; // Time window in milliseconds (default: 1 minute)
  max?: number; // Maximum number of requests per window (default: 100)
  message?: string; // Error message when limit is exceeded
  statusCode?: number; // HTTP status code when limit is exceeded (default: 429)
  skip?: (req: Request) => boolean; // Function to skip rate limiting for certain requests
  keyGenerator?: (req: Request) => string; // Function to generate a unique key for each request (default: IP address)
  handler?: (req: Request, res: Response) => void; // Custom handler when limit is exceeded
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

type CorsOriginCallback = (err: Error | null, origin?: boolean | string) => void;
type CorsOrigin = boolean | string | RegExp | (string | RegExp)[] | ((req: Request, callback: CorsOriginCallback) => void);

interface CorsOptions {
  origin?: CorsOrigin;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

type Middleware = (req: Request, res: Response, next: () => void) => void;

class Router {
  private routes: { [path: string]: { [method: string]: (req: Request, res: Response) => void } } = {};
  private middlewares: Middleware[] = [];
  private settings: { [key: string]: any } = {};
  private viewsDir: string = "";
  private viewEngine: ((filePath: string, data: { [key: string]: any }, callback: (err: Error | null, html?: string) => void) => void) | null = null;
  private trustProxy: boolean | string | string[] | number = false;
  private jsonSpaces: number = 0;

  // Add middleware
  use(path: string | Middleware, middleware?: Middleware): void {
    if (typeof path === "string" && middleware) {
      this.middlewares.push((req, res, next) => {
        const { pathname } = parseUrl(req);

        if (pathname.startsWith(path)) {
          req.url = pathname.slice(path.length) || "/";
          middleware(req, res, next);
        } else {
          next();
        }
      });
    } else if (typeof path === "function") {
      this.middlewares.push(path);
    }
  }

  // Routes Handling
  get(path: string, ...handlers: ((req: Request, res: Response, next?: () => void) => void)[]): void {
    this.addRoute(path, "GET", ...handlers);
  }

  post(path: string, ...handlers: ((req: Request, res: Response, next?: () => void) => void)[]): void {
    this.addRoute(path, "POST", ...handlers);
  }

  put(path: string, ...handlers: ((req: Request, res: Response, next?: () => void) => void)[]): void {
    this.addRoute(path, "PUT", ...handlers);
  }

  delete(path: string, ...handlers: ((req: Request, res: Response, next?: () => void) => void)[]): void {
    this.addRoute(path, "DELETE", ...handlers);
  }

  // Add a route with a handler for a specific HTTP method
  private addRoute(path: string, method: string, ...handlers: ((req: Request, res: Response, next?: () => void) => void)[]): void {
    if (!this.routes[path]) {
      this.routes[path] = {};
    }
    this.routes[path][method.toUpperCase()] = (req, res) => {
      const executeHandler = (index: number) => {
        if (index < handlers.length) {
          const handler = handlers[index];
          if (handler.length === 3) {
            // Middleware with next
            handler(req, res, () => executeHandler(index + 1));
          } else {
            // Final handler
            handler(req, res);
          }
        }
      };
      executeHandler(0);
    };
  }

  // Set configuration
  set(key: string, value: any): void {
    if (key === "view engine") {
      if (value === "ejs") {
        this.viewEngine = (filePath: string, data: { [key: string]: any }, callback: (err: Error | null, html?: string) => void) => {
          fs.readFile(filePath, "utf8", (err, template) => {
            if (err) return callback(err);
            const rendered = template.replace(/<%=\s*(.*?)\s*%>/g, (_, key) => data[key] || "");
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
  getSetting(key: string): any {
    return this.settings[key];
  }

  // Set trust proxy
  setTrustProxy(value: boolean | string | string[] | number): void {
    this.trustProxy = value;
  }

  // Get client IP address considering trust proxy
  private getClientIp(req: Request): string {
    if (!this.trustProxy) {
      return req.socket?.remoteAddress || "";
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string") {
      const ips = forwardedFor.split(",").map((ip) => ip.trim());

      if (this.trustProxy === true || this.trustProxy === "all") {
        return ips[0] || req.socket?.remoteAddress || "";
      } else if (typeof this.trustProxy === "number") {
        const index = Math.max(0, Math.min(ips.length - 1, this.trustProxy - 1));
        return ips[index] || req.socket?.remoteAddress || "";
      }
    }

    return req.socket?.remoteAddress || "";
  }

  // Get all IPS if behind reverse proxy
  private getClientIps(req: Request): string[] {
    if (!this.trustProxy) {
      return [req.socket?.remoteAddress || ""];
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string") {
      return forwardedFor.split(",").map((ip) => ip.trim());
    }

    return [req.socket?.remoteAddress || ""];
  }

  // Set JSON spaces
  setJsonSpaces(spaces: number): void {
    if (typeof spaces !== "number" || spaces < 0) {
      throw new Error("jsonSpaces must be a non-negative number");
    }
    this.jsonSpaces = spaces;
  }

  // Render a view
  render(res: ServerResponse, viewName: string, data: { [key: string]: any } = {}): void {
    if (!this.viewEngine) {
      throw new Error('View engine not set. Use router.set("view engine", "ejs") to configure a view engine.');
    }

    const viewExtension = this.getSetting("view engine");
    if (!viewExtension) {
      throw new Error('View engine not set. Use router.set("view engine", "ejs") to configure a view engine.');
    }

    const viewPath = path.join(this.viewsDir, `${viewName}.${viewExtension}`);
    const resMethod = res as Response;

    this.viewEngine(viewPath, data, (err, html) => {
      if (err) {
        console.error(`Error rendering view: ${err.message}`);
        resMethod.status(500).send(`Error rendering view: ${err.message}`);
      } else {
        resMethod.status(200).send(html || "");
      }
    });
  }

  // Handle incoming requests
  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const reqMethod = req as Request;
    const resMethod = res as Response;
    const parsedUrl = parseUrl(req);

    // Request Methods
    reqMethod.query = parsedUrl.query;
    reqMethod.path = parsedUrl.pathname;
    reqMethod.ip = this.getClientIp(reqMethod);
    reqMethod.ips = this.getClientIps(reqMethod);
    reqMethod.remoteAddress = req.socket?.remoteAddress || "";
    reqMethod.xForwardedFor = req.headers["x-forwarded-for"];
    reqMethod.cfConnectingIP = req.headers["cf-connecting-ip"] as string | undefined;
    reqMethod.trueClientIP = req.headers["true-client-ip"] as string | undefined;
    reqMethod.protocol = req.socket instanceof tls.TLSSocket ? "https" : "http";
    reqMethod.method = req.method;
    reqMethod.originalUrl = req.url || "";
    reqMethod.baseUrl = "";
    reqMethod.secure = req.socket instanceof tls.TLSSocket;
    resMethod.jsonSpaces = this.jsonSpaces;
    reqMethod.params = {};
    reqMethod.body = {};

    // Request Heades
    reqMethod.xhr = req.headers["x-requested-with"] === "XMLHttpRequest";
    reqMethod.hostname = req.headers.host?.split(":")[0] || "";
    reqMethod.get = (headerName: string) => req.headers[headerName.toLowerCase()] as string | undefined;
    reqMethod.headers = req.headers;
    reqMethod.fresh = false;
    reqMethod.stale = true;

    const etag = req.headers["if-none-match"];
    const lastModified = req.headers["if-modified-since"];

    if (etag || lastModified) {
      const resEtag = res.getHeader("ETag");
      const resLastModified = res.getHeader("Last-Modified");

      if (etag && resEtag === etag) {
        reqMethod.fresh = true;
        reqMethod.stale = false;
      } else if (lastModified && resLastModified === lastModified) {
        reqMethod.fresh = true;
        reqMethod.stale = false;
      }
    }

    reqMethod.accepts = (type: string | string[]): string | boolean | string[] => {
      const acceptHeader = req.headers["accept"];
      if (!acceptHeader) return false;
      const acceptedTypes = acceptHeader.split(",").map((t) => t.trim());

      if (typeof type === "string") {
        return acceptedTypes.some((t) => t.includes(type));
      } else if (Array.isArray(type)) {
        return type.find((t) => acceptedTypes.some((at) => at.includes(t))) || false;
      }
      return false;
    };

    reqMethod.is = (type: string): string | boolean => {
      const contentType = req.headers["content-type"];
      if (!contentType) return false;

      return contentType.includes(type) ? type : false;
    };

    // Response Methods
    resMethod.status = function (code: number) {
      this.statusCode = code;
      return this;
    };

    resMethod.json = function (data: any, spaces?: number) {
      this.setHeader("Content-Type", "application/json");
      this.end(JSON.stringify(data, null, spaces ?? this.jsonSpaces ?? 0));
    };

    resMethod.send = function (data: any, filename = "file.bin") {
      const contentType = this.getHeader("Content-Type");

      if (typeof data === "object" && !Buffer.isBuffer(data)) {
        if (!contentType) this.setHeader("Content-Type", "application/json");
        this.end(JSON.stringify(data, null, this.jsonSpaces));
      } else if (Buffer.isBuffer(data)) {
        if (!contentType) {
          const detectedType = mime.get(filename) || "application/octet-stream";
          this.setHeader("Content-Type", detectedType);
        }
        this.end(data);
      } else if (typeof data.pipe === "function") {
        if (!contentType) {
          const detectedType = mime.get(filename) || "application/octet-stream";
          this.setHeader("Content-Type", detectedType);
        }
        data.pipe(this);
      } else {
        if (!contentType) {
          let detectedType = "text/plain";

          if (typeof data === "string") {
            if (data.trim().startsWith("<!DOCTYPE html>") || data.trim().startsWith("<html>") || data.trim().startsWith("<")) {
              detectedType = "text/html";
            } else if (filename.includes("css")) {
              detectedType = "text/css";
            } else if (filename.includes("js")) {
              detectedType = "application/javascript";
            }
          }

          this.setHeader("Content-Type", detectedType);
        }
        this.end(data);
      }
    };

    resMethod.sendFile = function (filePath: string): void {
      const extname = path.extname(filePath).toLowerCase();
      const contentType = mime.get(extname) || "application/octet-stream";
      const stream = fs.createReadStream(filePath);

      stream.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "ENOENT") {
          this.status(404).send("File Not Found");
        } else {
          this.status(500).send("Internal Server Error");
        }
      });

      this.setHeader("Content-Type", contentType);
      stream.pipe(this);
    };

    resMethod.html = function (data: any) {
      this.setHeader("Content-Type", "text/html");
      this.end(data);
    };

    resMethod.redirect = function (url: string) {
      this.writeHead(302, { Location: url });
      this.end();
    };

    resMethod.text = function (data: any) {
      this.setHeader("Content-Type", "text/plain");
      this.end(data);
    };

    resMethod.type = function (type: string) {
      const mimeType = mime.get(type) || type;
      this.setHeader("Content-Type", mimeType);
      return this;
    };

    resMethod.format = function (obj: Record<string, () => void>) {
      const acceptHeader = this.req.headers["accept"] || "*/*";
      const types = Object.keys(obj);

      for (const type of types) {
        if (acceptHeader.includes(type) || type === "*/*") {
          obj[type]();
          return;
        }
      }
      this.status(406).send("Not Acceptable");
    };

    // Response Headers
    resMethod.cookie = function (name: string, value: string, options?: any) {
      const cookie = `${name}=${value}; ${Object.entries(options || {})
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")}`;
      this.setHeader("Set-Cookie", cookie);
    };

    resMethod.clearCookie = function (name: string, options?: any) {
      this.setHeader("Set-Cookie", `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    };

    const nativeGetHeader = resMethod.getHeader.bind(resMethod);
    resMethod.getHeader = function (name: string) {
      return nativeGetHeader(name);
    };

    const nativeRemoveHeader = resMethod.removeHeader.bind(resMethod);
    resMethod.removeHeader = function (name: string) {
      nativeRemoveHeader(name);
    };

    resMethod.attachment = function (filename = "file") {
      this.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    };

    resMethod.download = function (filePath: string, filename = "file") {
      this.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      this.sendFile(filePath);
    };

    resMethod.set = function (headers: Record<string, string | number | string[]>) {
      for (const [name, value] of Object.entries(headers)) {
        this.setHeader(name, value);
      }
      return this;
    };

    resMethod.vary = function (field: string) {
      const varyHeader = String(this.getHeader("Vary") || "");
      const fields = varyHeader.split(", ").filter(Boolean);

      if (!fields.includes(field)) {
        fields.push(field);
        this.setHeader("Vary", fields.join(", "));
      }
      return this;
    };

    resMethod.location = function (url: string) {
      this.setHeader("Location", url);
      return this;
    };

    resMethod.links = function (links: Record<string, string>) {
      const linkHeader = Object.entries(links)
        .map(([rel, url]) => `<${url}>; rel="${rel}"`)
        .join(", ");
      this.setHeader("Link", linkHeader);
      return this;
    };

    resMethod.charset = function (charset: string) {
      const contentType = this.getHeader("Content-Type");
      if (typeof contentType === "string") {
        this.setHeader("Content-Type", `${contentType}; charset=${charset}`);
      }
      return this;
    };

    resMethod.app = {};

    // Execute middlewares
    const executeMiddlewares = (index: number) => {
      if (index < this.middlewares.length) {
        try {
          this.middlewares[index](reqMethod, resMethod, () => executeMiddlewares(index + 1));
        } catch (err) {
          console.error("Middleware error:", err);
          resMethod.status(500).send("Internal Server Error");
        }
      } else {
        // Use the pathname (without query string) for route matching
        const pathname = parsedUrl.pathname || "";

        // Check for exact match
        if (this.routes[pathname] && this.routes[pathname][reqMethod.method!]) {
          return this.routes[pathname][reqMethod.method!](reqMethod, resMethod);
        }

        // Check for parameterized routes
        for (const route in this.routes) {
          const routeRegex = this.convertRouteToRegex(route);
          const match = pathname.match(routeRegex);

          if (match && this.routes[route][reqMethod.method!]) {
            const paramNames = this.extractParamNames(route);
            paramNames.forEach((name, index) => {
              reqMethod.params[name] = decodeURIComponent(match[index + 1]);
            });

            return this.routes[route][reqMethod.method!](reqMethod, resMethod);
          }
        }

        // If no match found, send 404
        this.notFoundHandler(reqMethod, resMethod);
      }
    };

    executeMiddlewares(0);
  }

  // Convert route path to regex for parameter matching
  private convertRouteToRegex(route: string): RegExp {
    const pattern = route.replace(/:\w+/g, "([^/]+)");
    return new RegExp(`^${pattern}$`);
  }

  // Extract parameter names from route path
  private extractParamNames(route: string): string[] {
    const paramNames: string[] = [];
    route.replace(/:\w+/g, (match) => {
      paramNames.push(match.slice(1));
      return match;
    });
    return paramNames;
  }

  // Default 404 handler
  private notFoundHandler(req: Request, res: Response): void {
    res.status(404).send("404 Not Found");
  }
}

// Create an HTTP server with a router
function createServer(router: Router): http.Server {
  return http.createServer((req, res) => {
    router.handleRequest(req, res);
  });
}

// Middlewares
const apex = {
  Router,
  createServer,
  bodyParser: (): Middleware => {
    return (req: Request, res: Response, next: () => void) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        if (!body) {
          req.body = {};
          return next();
        }

        if (req.headers["content-type"] === "application/json") {
          try {
            req.body = JSON.parse(body);
          } catch (err) {
            console.error("Error parsing JSON body:", err);
            req.body = {};
          }
        } else if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
          req.body = Object.fromEntries(new URLSearchParams(body));
        } else if (req.headers["content-type"] === "text/plain") {
          req.body = body;
        } else {
          req.body = {};
        }
        next();
      });
    };
  },
  useFlash: (): Middleware => {
    return (req: Request, res: Response, next: () => void) => {
      const flashMessages: { [key: string]: string[] } = {};

      req.flash = (type: string, message?: string): string[] | void => {
        if (!flashMessages[type]) {
          flashMessages[type] = [];
        }
        if (message) {
          flashMessages[type].push(message);
        }
        return flashMessages[type];
      };

      res.locals = res.locals || {};
      res.locals.messages = flashMessages;

      next();
    };
  },
  cors: (options: CorsOptions = {}): Middleware => {
    const defaults = {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    const opts = { ...defaults, ...options };

    return (req: Request, res: Response, next: () => void) => {
      const origin = req.headers.origin as string;

      // Handle preflight requests
      if (req.method === "OPTIONS" && req.headers["access-control-request-method"]) {
        // Set methods
        if (opts.methods) {
          res.setHeader("Access-Control-Allow-Methods", Array.isArray(opts.methods) ? opts.methods.join(",") : opts.methods);
        }

        // Set allowed headers
        if (opts.allowedHeaders) {
          res.setHeader("Access-Control-Allow-Headers", Array.isArray(opts.allowedHeaders) ? opts.allowedHeaders.join(",") : opts.allowedHeaders);
        } else if (req.headers["access-control-request-headers"]) {
          res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);
        }

        // Set max age if specified
        if (opts.maxAge) {
          res.setHeader("Access-Control-Max-Age", String(opts.maxAge));
        }

        // Set credentials if enabled
        if (opts.credentials) {
          res.setHeader("Access-Control-Allow-Credentials", "true");
        }

        // Either continue or end the response
        if (opts.preflightContinue) {
          next();
          return;
        }

        res.statusCode = opts.optionsSuccessStatus || 204;
        res.setHeader("Content-Length", "0");
        res.end();
        return;
      }

      // Handle actual requests
      const setOrigin = () => {
        if (opts.origin === true) {
          res.setHeader("Access-Control-Allow-Origin", origin || "*");
          if (opts.credentials) {
            res.setHeader("Vary", "Origin");
          }
        } else if (typeof opts.origin === "string") {
          res.setHeader("Access-Control-Allow-Origin", opts.origin);
        } else if (opts.origin instanceof RegExp && origin && opts.origin.test(origin)) {
          res.setHeader("Access-Control-Allow-Origin", origin);
        } else if (Array.isArray(opts.origin)) {
          const allowed = opts.origin.some((o) => (o instanceof RegExp ? origin && o.test(origin) : o === origin));
          if (allowed && origin) {
            res.setHeader("Access-Control-Allow-Origin", origin);
          }
        } else if (typeof opts.origin === "function") {
          opts.origin(req, (err: Error | null, allowOrigin?: boolean | string) => {
            if (err || !allowOrigin) {
              next();
              return;
            }
            const finalOrigin = allowOrigin === true ? origin || "*" : allowOrigin;
            if (finalOrigin) {
              res.setHeader("Access-Control-Allow-Origin", finalOrigin);
            }
            if (opts.credentials) {
              res.setHeader("Access-Control-Allow-Credentials", "true");
            }
            next();
          });
          return;
        }

        if (opts.credentials) {
          res.setHeader("Access-Control-Allow-Credentials", "true");
        }
        next();
      };

      // Set exposed headers if specified
      if (opts.exposedHeaders) {
        res.setHeader("Access-Control-Expose-Headers", Array.isArray(opts.exposedHeaders) ? opts.exposedHeaders.join(",") : opts.exposedHeaders);
      }

      setOrigin();
    };
  },
  static(prefix: string, staticPath?: string): Middleware {
    if (!staticPath) {
      staticPath = prefix;
      prefix = "/";
    }

    return (req, res, next) => {
      const { pathname } = parseUrl(req);

      if (!pathname.startsWith(prefix)) {
        return next();
      }

      const relativePath = pathname.slice(prefix.length);
      const filePath = path.join(staticPath!, relativePath);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          next();
        } else {
          res.sendFile(filePath);
        }
      });
    };
  },
  favicon(iconPath?: string): Middleware {
    return (req, res, next) => {
      if (req.url === "/favicon.ico" && iconPath) {
        fs.stat(iconPath, (err, stats) => {
          if (err || !stats.isFile()) {
            res.status(404).send("Favicon not found");
          } else {
            res.sendFile(iconPath);
          }
        });
      } else {
        next();
      }
    };
  },
  rateLimit: (options: RateLimiterOptions = {}): Middleware => {
    const {
      windowMs = 60 * 1000, // 1 minute
      max = 100, // 100 requests per window
      message = "Too many requests, please try again later.",
      statusCode = 429, // 429 Too Many Requests
      skip = () => false, // Skip rate limiting for certain requests
      keyGenerator = (req) => req.ip || "global", // Default key generator (IP-based)
      handler = (req, res) => {
        const key = keyGenerator(req);
        const remainingTime = store[key] ? Math.ceil((store[key].resetTime - Date.now()) / 1000) : 0;

        // Set rate limit headers even when the limit is exceeded
        res.setHeader("RateLimit-Limit", max);
        res.setHeader("RateLimit-Remaining", 0); // No remaining requests
        res.setHeader("RateLimit-Reset", remainingTime); // Remaining time in seconds
        res.setHeader("RateLimit-Policy", `${max};w=${windowMs / 1000}`);
        res.status(statusCode).json({ message });
      },
    } = options;

    const store: RateLimitStore = {};

    // Clear old entries from the store periodically
    setInterval(() => {
      const now = Date.now();
      for (const key in store) {
        if (store[key].resetTime <= now) {
          delete store[key];
        }
      }
    }, windowMs);

    return (req: Request, res: Response, next: () => void) => {
      if (skip(req)) {
        return next(); // Skip rate limiting for this request
      }

      const key = keyGenerator(req);
      const now = Date.now();

      if (!store[key]) {
        store[key] = {
          count: 1,
          resetTime: now + windowMs,
        };
      } else {
        store[key].count++;
      }

      // Calculate remaining time in seconds
      const remainingTime = Math.ceil((store[key].resetTime - now) / 1000);

      // Set rate limit headers for every request
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", Math.max(0, max - store[key].count));
      res.setHeader("RateLimit-Reset", remainingTime); // Remaining time in seconds
      res.setHeader("RateLimit-Policy", `${max};w=${windowMs / 1000}`);

      if (store[key].count > max) {
        return handler(req, res); // Limit exceeded
      }

      next(); // Proceed to the next middleware/route
    };
  },
};

function parseUrl(req: IncomingMessage): { pathname: string; query: { [key: string]: string | string[] } } {
  const parsedUrl = url.parse(req.url || "", true);
  const query: { [key: string]: string | string[] } = {};

  for (const key in parsedUrl.query) {
    const value = parsedUrl.query[key];
    if (value !== undefined) {
      query[key] = Array.isArray(value) ? value : value.toString();
    }
  }

  return {
    pathname: parsedUrl.pathname || "",
    query,
  };
}

export { apex };
