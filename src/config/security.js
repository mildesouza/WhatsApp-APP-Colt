// Configurações de segurança da aplicação
export const securityConfig = {
  // Configurações de CORS
  cors: {
    origin: process.env.VITE_NODE_ENV === 'production' 
      ? ['https://api.whatsapp-colt.com', 'https://whatsapp.whatsapp-colt.com']
      : ['http://localhost:8080', 'http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 horas
  },

  // Configurações de headers de segurança
  securityHeaders: {
    'Content-Security-Policy': 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' " + process.env.VITE_API_URL + " " + process.env.VITE_WHATSAPP_API_URL,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
} 