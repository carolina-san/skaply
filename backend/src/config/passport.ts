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
    
    // Verificar si el usuario ya existe por email
    const existingUser = await authService.checkPassword(email);
    
    if (existingUser.rows.length > 0) {
      // Usuario existe, actualizar googleId si no lo tiene
      await authService.updateGoogleId(email, googleId);
      return done(null, {
        email,
        id: existingUser.rows[0].id,
        company_name: existingUser.rows[0].company_name,
        loginMethod: 'google'
      });
    }
    
    // Usuario no existe, crear uno nuevo con datos básicos de Google
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
  try {
    const user = await authService.checkPassword(email);
    if (user.rows.length > 0) {
      done(null, user.rows[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;