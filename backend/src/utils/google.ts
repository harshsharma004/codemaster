import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

const client = new OAuth2Client(env.CodeMaster_GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (idToken: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.CodeMaster_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    throw new Error('Failed to verify Google token');
  }
};
