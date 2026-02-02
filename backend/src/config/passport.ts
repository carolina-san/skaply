import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from '@/services/authService';

const authService = new AuthService();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    const email = profile.emails[0].value;
    const googleId = profile.id;

    const existingUser = await authService.getUserByEmail(email); 

    if (existingUser) {
      if (!existingUser.google_id) { 
        // no sé si se tiene que actualizar incluso si ya tiene el google id
        await authService.updateGoogleId(email, googleId);
      }

      // creo que con esto se hace el token, así que deberia de estar la misma info que siempre hay en el token (que creo que es solo email y rol?)
      return done(null, {
        id: existingUser.id,
        email: existingUser.email,
        company_name: existingUser.company_name,
        role: existingUser.role,
        loginMethod: 'google'
      });
    }

    // ---- De aqui para abajo está igual ----
    
    // Usuario no existe, crear uno nuevo con datos básicos de Google ??
    const newUser = {
      email,
      password: '', // No password for Google users
      company_name: profile.displayName || email.split('@')[0],
      cif: '', // Will need to be filled later
      tax_address: '',
      telephone: '',
      googleId
    };
    
    const result = await authService.registerGoogleUser(newUser);
    
    return done(null, {
      email,
      id: result.id,
      company_name: newUser.company_name,
      loginMethod: 'google'
    });
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));


// Serialization for session (aunque usaremos JWT)
passport.serializeUser((user: any, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email: string, done) => {
  const user = await authService.getUserByEmail(email);
  done(null, user || false);
});

export default passport;