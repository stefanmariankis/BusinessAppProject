import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { pool } from "./db";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configurare PostgreSQL session store
  const PostgresStore = connectPg(session);
  const sessionStore = new PostgresStore({
    pool,
    tableName: 'session', // Numele tabelului pentru sesiuni
    createTableIfMissing: true // Creează tabelul dacă nu există
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "aplicatie_bizflow_secretkey",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 zi
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Nume de utilizator sau parolă incorecte" });
        }
        
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Nume de utilizator sau parolă incorecte" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Rută pentru înregistrare
  app.post("/api/register", async (req, res) => {
    try {
      // Verificăm dacă username-ul există deja
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Numele de utilizator există deja" });
      }

      // Verificăm dacă email-ul există deja
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Adresa de email este deja folosită" });
      }

      // Hash-uim parola și creăm utilizatorul
      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Autentificăm noul utilizator
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Eroare la autentificare" });
        }
        
        // Returnăm datele utilizatorului (fără parolă)
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Eroare la înregistrare:", error);
      return res.status(500).json({ message: "Eroare internă la server" });
    }
  });

  // Rută pentru autentificare
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Autentificare eșuată" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Returnăm datele utilizatorului (fără parolă)
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Rută pentru delogare
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Eroare la deconectare" });
      }
      res.status(200).json({ message: "Deconectat cu succes" });
    });
  });

  // Rută pentru a verifica utilizatorul curent
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Neautentificat" });
    }
    
    // Returnăm datele utilizatorului (fără parolă)
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}

// Middleware pentru a verifica dacă utilizatorul este autentificat
export function isAuthenticated(req: Express.Request, res: Express.Response, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Trebuie să fiți autentificat" });
}