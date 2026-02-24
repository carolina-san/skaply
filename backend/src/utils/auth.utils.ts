import { ApiError } from '@/utils/ApiError';
import bcrypt from "bcryptjs";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError('BAD_REQUEST', 'Invalid email format');
    }
};

export const validateCif = (cif: string) => {
    const cifRegex = /^[a-zA-Z]\d{7}[0-9a-zA-Z]$/;
    if (!cifRegex.test(cif)) {
      throw new ApiError('BAD_REQUEST', 'Invalid CIF format. Must be Letter + 7 digits + Control Character');
    }
};

export const validateTelephone = (telephone: string) => {
    const phoneRegex = /^\+?[0-9]{9,15}$/;
    if (!phoneRegex.test(telephone)) {
      throw new ApiError('BAD_REQUEST', 'Invalid telephone format');
    }
};

// podemos aumentar validaciones
export const validatePasswordStrenght = (password: string) => {
    if (password.length < 12) {
      throw new ApiError('BAD_REQUEST', 'Password must be at least 12 characters long');
    }
};

export const validateProviderData = (data: any) => {
  if (data.email) { validateEmail(data.email);}
  if (data.cif) { validateCif(data.cif); }
  if (data.telephone) { validateTelephone(data.telephone); }
  if (data.password) { validatePasswordStrenght(data.password);}
};


export const validateCorrectPassword = async (inputPassword: string, storedPassword: string):
Promise<boolean> => {
  // check stored password
  if (!storedPassword) {
    throw new ApiError('INTERNAL_SERVER', 'No stored password found');
  }
  let isValid = false;
  // compare passwords
  if (storedPassword.startsWith('$2b$')) {
    isValid = await bcrypt.compare(inputPassword, storedPassword);
  } else {
    isValid = inputPassword === storedPassword; // plain text (development only)
  }
  // error
  if (!isValid) {
    throw new ApiError('UNAUTHORIZED', 'Invalid password');
  }
  return isValid;
};

