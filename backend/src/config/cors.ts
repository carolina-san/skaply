import cors from "cors"
import { defaultMaxListeners } from "events";


const allowedOrigins =
      process.env.NODE_ENV === "production"
    ? [
        "https://skaply.ovh", //  dominio de producción
      ]
    : [
        "http://localhost:3000", // backend
        "http://localhot:4200" // angular
      ];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen como Postman
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Permitir cookies o encabezados de autenticación
};

export default cors(corsOptions);