declare module 'pdf-parse' {
  function PDFParser(
    dataBuffer: Buffer, 
    options?: {
      max?: number;
      pagerender?: (pageData: any) => string;
    }
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;

  export = PDFParser;
} 