import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_CRYPT_SECRET_KEY; 
if (!process.env.REACT_APP_CRYPT_SECRET_KEY) {
    throw new Error("REACT_APP_SECRET_KEY is not defined in the environment variables.");
  }

// Encrypt function
export const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decryptData = <T>(cipherText: string): T => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  
      if (!decrypted) {
        throw new Error("Decrypted data is empty.");
      }
  
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      throw error;
    }
  };
  