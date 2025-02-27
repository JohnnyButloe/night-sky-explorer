export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENWEATHERMAP_API_KEY: string;
      // Add other environment variables as needed
    }
  }
}
