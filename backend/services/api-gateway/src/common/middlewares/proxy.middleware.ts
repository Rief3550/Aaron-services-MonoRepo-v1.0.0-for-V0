/**
 * Proxy Middleware
 * Enruta requests a microservicios backend
 * 
 * /auth/* → AUTH_URL (auth-service)
 * /ops/* → OPS_URL (operations-service)
 * 
 * Aplica JWT guard antes de enrutar (excepto rutas públicas)
 */
import { Injectable, NestMiddleware, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Compose middleware functions (similar a Express compose)
 */
function composeMiddleware(...mws: any[]) {
  return (req: any, res: any, next: any) => {
    let idx = 0;
    const run = () => {
      const mw = mws[idx++];
      if (!mw) return next();
      mw(req, res, (err: any) => (err ? next(err) : run()));
    };
    run();
  };
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private authUrl: string;
  private opsUrl: string;
  private authProxy: any;
  private opsProxy: any;
  private usersProxy: any;
  private rolesProxy: any;
  private adminUsersProxy: any;
  private adminCrewsProxy: any;
  private adminWorkTypesProxy: any;
  private adminPlansProxy: any;
  private adminSubscriptionsProxy: any;
  private metricsProxy: any;
  private frontendProxy: any;

  constructor(private configService: ConfigService) {
    // Obtener URLs desde variables de entorno (con fallbacks)
    this.authUrl = this.configService.get<string>('AUTH_URL') 
      || this.configService.get<string>('AUTH_SERVICE_URL') 
      || 'http://localhost:3001';
    
    this.opsUrl = this.configService.get<string>('OPS_URL')
      || this.configService.get<string>('OPERATIONS_SERVICE_URL')
      || 'http://localhost:3002';
    
    console.log('[ProxyMiddleware] Initialized with Auth URL:', this.authUrl, 'Ops URL:', this.opsUrl);
    
    // Create proxy instances once
    // IMPORTANT: We use the proxy's built-in bodyParser to handle request bodies
    // This avoids issues with Express's json() middleware consuming the stream
    this.authProxy = createProxyMiddleware({
      target: this.authUrl,
      changeOrigin: true,
      timeout: 30000, // 30 segundos de timeout
      proxyTimeout: 30000,
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log('[ProxyMiddleware] Auth proxy - Method:', req.method, 'Path:', req.url, '→', this.authUrl);
        
        const rid = req.headers?.['x-request-id'];
        if (rid) proxyReq.setHeader('x-request-id', rid as string);

        const user = req.user;
        if (user) {
          proxyReq.setHeader('x-user-id', user.userId || user.sub);
          if (user.roles) {
            proxyReq.setHeader('x-user-roles', user.roles.join(','));
          }
        }
      },
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        console.log('[ProxyMiddleware] Auth Service responded with status:', proxyRes.statusCode);
        // Forward Set-Cookie headers so browser stores HttpOnly cookies
        const setCookie = proxyRes.headers['set-cookie'];
        if (setCookie) {
          res.setHeader('set-cookie', setCookie);
        }
      },
      onError: (err: any, req: any, res: any) => {
        console.error('[ProxyMiddleware] Auth proxy error:', err.message);
        console.error('[ProxyMiddleware] Auth URL was:', this.authUrl);
        if (!res.headersSent) {
          res.status(502).json({
            statusCode: 502,
            message: 'Bad Gateway: Failed to proxy request to auth-service',
            error: err.message,
          });
        }
      },
    } as any);

    this.opsProxy = createProxyMiddleware({
      target: this.opsUrl,
      changeOrigin: true,
      pathRewrite: { '^/ops': '' },
      onProxyReq(proxyReq: any, req2: any) {
        const rid = req2.headers?.['x-request-id'];
        if (rid) proxyReq.setHeader('x-request-id', rid as string);

        const user = (req2 as any).user;
        if (user) {
          proxyReq.setHeader('x-user-id', user.userId || user.sub);
          if (user.roles) {
            proxyReq.setHeader('x-user-roles', user.roles.join(','));
          }
        }
      },
      onError(err: any, req2: any, res2: any) {
        console.error('[ProxyMiddleware] Ops proxy error:', err.message);
        if (!res2.headersSent) {
          res2.status(502).json({
            statusCode: 502,
            message: 'Bad Gateway: Failed to proxy request to operations-service',
          });
        }
      },
    } as any);

    // Users and Roles proxies (no JWT guard, Auth Service handles auth)
    this.usersProxy = createProxyMiddleware({
      target: this.authUrl,
      changeOrigin: true,
      on: {
        proxyReq: (proxyReq: any, req: any, res: any) => {
          console.log('[ProxyMiddleware] Forwarding /users/* to Auth Service');
          
          // Forward Authorization header
          const authHeader = req.headers?.['authorization'];
          if (authHeader) {
            proxyReq.setHeader('Authorization', authHeader);
            console.log('[ProxyMiddleware] Authorization header forwarded');
          }
          
          const rid = req.headers?.['x-request-id'];
          if (rid) proxyReq.setHeader('x-request-id', rid as string);
        },
        proxyRes: (proxyRes: any, req: any, res: any) => {
          console.log('[ProxyMiddleware] Auth Service responded with status:', proxyRes.statusCode);
        },
        error: (err: any, req: any, res: any) => {
          console.error('[ProxyMiddleware] Users proxy error:', err.message);
          if (!res.headersSent) {
            res.status(502).json({
              statusCode: 502,
              message: 'Bad Gateway: Failed to proxy request to auth-service',
            });
          }
        },
      },
    } as any);

    this.rolesProxy = createProxyMiddleware({
      target: this.authUrl,
      changeOrigin: true,
      onProxyReq(proxyReq: any, req2: any) {
        const rid = req2.headers?.['x-request-id'];
        if (rid) proxyReq.setHeader('x-request-id', rid as string);
      },
      onError(err: any, req2: any, res2: any) {
        console.error('[ProxyMiddleware] Roles proxy error:', err.message);
        if (!res2.headersSent) {
          res2.status(502).json({
            statusCode: 502,
            message: 'Bad Gateway: Failed to proxy request to auth-service',
          });
        }
      },
    } as any);

    // Admin Users proxy → AUTH_URL
    this.adminUsersProxy = createProxyMiddleware({
      target: this.authUrl,
      changeOrigin: true,
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log('[ProxyMiddleware] Forwarding /admin/users/* to Auth Service');
        const rid = req.headers?.['x-request-id'];
        if (rid) proxyReq.setHeader('x-request-id', rid as string);
        const user = req.user;
        if (user) {
          proxyReq.setHeader('x-user-id', user.userId || user.sub);
          if (user.roles) {
            proxyReq.setHeader('x-user-roles', user.roles.join(','));
          }
        }
      },
      onError: (err: any, req: any, res: any) => {
        console.error('[ProxyMiddleware] Admin Users proxy error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({
            statusCode: 502,
            message: 'Bad Gateway: Failed to proxy request to auth-service',
          });
        }
      },
    } as any);

    // Admin Crews, WorkTypes, Plans, Subscriptions, Metrics → OPS_URL
    const createOpsAdminProxy = (routeName: string) => createProxyMiddleware({
      target: this.opsUrl,
      changeOrigin: true,
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log(`[ProxyMiddleware] Forwarding ${routeName} to Operations Service`);
        const rid = req.headers?.['x-request-id'];
        if (rid) proxyReq.setHeader('x-request-id', rid as string);
        const user = req.user;
        if (user) {
          proxyReq.setHeader('x-user-id', user.userId || user.sub);
          if (user.roles) {
            proxyReq.setHeader('x-user-roles', user.roles.join(','));
          }
        }
      },
      onError: (err: any, req: any, res: any) => {
        console.error(`[ProxyMiddleware] ${routeName} proxy error:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({
            statusCode: 502,
            message: 'Bad Gateway: Failed to proxy request to operations-service',
          });
        }
      },
    } as any);

    this.adminCrewsProxy = createOpsAdminProxy('/admin/crews/*');
    this.adminWorkTypesProxy = createOpsAdminProxy('/admin/work-types/*');
    this.adminPlansProxy = createOpsAdminProxy('/admin/planes/*');
    this.adminSubscriptionsProxy = createOpsAdminProxy('/admin/suscripciones/*');
    this.metricsProxy = createOpsAdminProxy('/metrics/*');

    // Frontend Proxy (Next.js) - para rutas que no son API
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3100';
    this.frontendProxy = createProxyMiddleware({
      target: frontendUrl,
      changeOrigin: true,
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        console.log('[ProxyMiddleware] Frontend proxy - Method:', req.method, 'Path:', req.url);
      },
      onError: (err: any, req: any, res: any) => {
        console.error('[ProxyMiddleware] Frontend proxy error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({
            statusCode: 502,
            message: 'Bad Gateway: Failed to proxy request to frontend',
          });
        }
      },
    } as any);
  }

  use(req: any, res: any, next: () => void) {
    const path = req.originalUrl || req.url;
    console.log(`[ProxyMiddleware] Incoming request: ${path}`);

    // ========================================
    // Ignorar requests de Next.js Server Components (_rsc)
    // Estas son requests internas de Next.js que deben ir al frontend
    // ========================================
    if (path.includes('?_rsc=') || path.includes('&_rsc=')) {
      console.log('[ProxyMiddleware] Next.js Server Component request, routing to Frontend');
      return this.frontendProxy(req, res, next);
    }

    // ========================================
    // JWT Guard (se ejecuta antes del proxy)
    // ========================================
    const jwtGuard = (req_: any, res_: any, next_: any) => {
      try {
        const guard = new JwtAuthGuard();
        const ctx = {
          switchToHttp: () => ({
            getRequest: () => req_,
            getResponse: () => res_,
          }),
        } as ExecutionContext;

        if (guard.canActivate(ctx as any)) {
          return next_();
        }
      } catch (e: any) {
        console.error('[ProxyMiddleware] JWT Validation Error:', e.message, e);
        return res_.status(e.status || 401).json({
          statusCode: e.status || 401,
          message: e.message || 'Unauthorized',
        });
      }
    };

    // ========================================
    // Proxy /auth/* → AUTH_URL (NO JWT guard - rutas de autenticación son públicas)
    // ========================================
    if (path.startsWith('/auth/')) {
      console.log('[ProxyMiddleware] Routing /auth/* to Auth Service (public route)');
      return this.authProxy(req, res, next);
    }

    // ========================================
    // Proxy /users/* → AUTH_URL (con JWT guard - requiere autenticación)
    // ========================================
    if (path.startsWith('/users')) {
      console.log('[ProxyMiddleware] Routing /users/* to Auth Service');
      return composeMiddleware(jwtGuard, this.usersProxy)(req, res, next);
    }

    // ========================================
    // Proxy /roles/* → AUTH_URL (no JWT guard)
    // ========================================
    if (path.startsWith('/roles/')) {
      console.log('[ProxyMiddleware] Routing /roles/* to Auth Service');
      return this.rolesProxy(req, res, next);
    }

    // ========================================
    // Proxy /ops/* → OPS_URL
    // ========================================
    if (path.startsWith('/ops/')) {
      return composeMiddleware(jwtGuard, this.opsProxy)(req, res, next);
    }

    // ========================================
    // Proxy /admin/users/* → AUTH_URL
    // ========================================
    if (path.startsWith('/admin/users')) {
      console.log('[ProxyMiddleware] Routing /admin/users/* to Auth Service');
      return composeMiddleware(jwtGuard, this.adminUsersProxy)(req, res, next);
    }

    // ========================================
    // Proxy /admin/crews/* → OPS_URL
    // ========================================
    if (path.startsWith('/admin/crews')) {
      console.log('[ProxyMiddleware] Routing /admin/crews/* to Operations Service');
      return composeMiddleware(jwtGuard, this.adminCrewsProxy)(req, res, next);
    }

    // ========================================
    // Proxy /admin/work-types/* → OPS_URL
    // ========================================
    if (path.startsWith('/admin/work-types')) {
      console.log('[ProxyMiddleware] Routing /admin/work-types/* to Operations Service');
      return composeMiddleware(jwtGuard, this.adminWorkTypesProxy)(req, res, next);
    }

    // ========================================
    // Proxy /admin/planes/* → OPS_URL
    // ========================================
    if (path.startsWith('/admin/planes')) {
      console.log('[ProxyMiddleware] Routing /admin/planes/* to Operations Service');
      return composeMiddleware(jwtGuard, this.adminPlansProxy)(req, res, next);
    }

    // ========================================
    // Proxy /admin/suscripciones/* → OPS_URL
    // ========================================
    if (path.startsWith('/admin/suscripciones') || path.startsWith('/admin/subscriptions')) {
      console.log('[ProxyMiddleware] Routing /admin/suscripciones/* to Operations Service');
      return composeMiddleware(jwtGuard, this.adminSubscriptionsProxy)(req, res, next);
    }

    // ========================================
    // Proxy /metrics/* → OPS_URL
    // ========================================
    if (path.startsWith('/metrics')) {
      console.log('[ProxyMiddleware] Routing /metrics/* to Operations Service');
      return composeMiddleware(jwtGuard, this.metricsProxy)(req, res, next);
    }

    // ========================================
    // No match - Proxy a Frontend (Next.js)
    // Excluir /health y otras rutas del gateway
    // ========================================
    if (path.startsWith('/health')) {
      return next(); // Dejar que el HealthController maneje esto
    }

    // Todas las demás rutas van al frontend (Next.js)
    console.log('[ProxyMiddleware] Routing to Frontend (Next.js):', path);
    return this.frontendProxy(req, res, next);
  }
}
