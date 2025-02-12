declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NEXT_PUBLIC_ASTRONOMY_API_KEY: string;
        ASTRONOMY_API_SECRET: string;
      }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}