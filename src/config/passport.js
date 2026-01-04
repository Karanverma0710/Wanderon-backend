const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./prisma');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        isVerified: true,
        isActive: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const avatar = profile.photos[0]?.value || null;
        const username = profile.displayName.replace(/\s+/g, '_').toLowerCase();

        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (!user) {
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            user = await prisma.user.update({
              where: { email },
              data: {
                googleId,
                provider: 'google',
                avatar,
                isVerified: true,
                lastLogin: new Date(),
              },
            });
          } else {
            let uniqueUsername = username;
            let counter = 1;

            while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
              uniqueUsername = `${username}${counter}`;
              counter++;
            }

            user = await prisma.user.create({
              data: {
                email,
                username: uniqueUsername,
                googleId,
                provider: 'google',
                avatar,
                isVerified: true,
                isActive: true,
                lastLogin: new Date(),
              },
            });
          }
        } else {
          user = await prisma.user.update({
            where: { googleId },
            data: {
              lastLogin: new Date(),
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
