// Configurações de autenticação
export const authConfig = {
  // Tempo de expiração do token (24 horas)
  tokenExpiration: 24 * 60 * 60 * 1000,
  
  // Configurações de senha
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },

  // Configurações de sessão
  session: {
    name: 'whatsapp-colt-session',
    secret: process.env.VITE_SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.VITE_NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }
} 