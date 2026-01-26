// =====================================================
// CONFIGURACIÓN DE ELEVEN LABS TEXT-TO-SPEECH
// =====================================================

export const elevenLabsConfig = {
  // ⚡ ACTIVAR/DESACTIVAR ELEVEN LABS
  // true  = Usa Eleven Labs (voz premium)
  // false = Usa voz nativa del navegador (gratuita)
  ENABLED: false,

  // Reemplaza con tu API key de Eleven Labs
  // Puedes obtener tu API key en: https://elevenlabs.io/app/settings/api-keys
  API_KEY: 'sk_b7bb71c8bf337889ce0049e373617c5a251dbd437ce18297',

  // Voice ID por defecto (Diego - Voz masculina joven en español)
  // Puedes cambiar por cualquier otra voz disponible en tu cuenta
  DEFAULT_VOICE_ID: 'JBFqnCBsd6RMkjVDRZzb',

  // Configuración de la voz optimizada para voz masculina joven
  VOICE_SETTINGS: {
    stability: 0.6,        // Estabilidad de la voz (0.0 - 1.0) - más estable para voces masculinas
    similarity_boost: 0.7, // Similitud con la voz original (0.0 - 1.0) - mayor similitud
    style: 0.2,            // Estilo de la voz (0.0 - 1.0) - un poco de estilo para naturalidad
    use_speaker_boost: true // Mejora de la calidad del altavoz
  },

  // Modelo a usar
  MODEL_ID: 'eleven_multilingual_v2',

  // URL base de la API
  BASE_URL: 'https://api.elevenlabs.io/v1'
};

// Lista de voces disponibles en español (actualiza según tu cuenta)
export const spanishVoices = [
  {
    id: 'g5CIjZEefAph4nQFvHAz',
    name: 'Diego',
    description: 'Voz masculina joven en español - RECOMENDADA'
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    description: 'Voz masculina adulta en inglés/español'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: 'Voz femenina en español'
  },
  {
    id: 'oWAxZDx7w5VEj9dCyTzz',
    name: 'Grace',
    description: 'Voz femenina joven'
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    description: 'Voz masculina británica'
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    description: 'Voz masculina australiana'
  }
  // Agrega más voces según tengas disponibles
];