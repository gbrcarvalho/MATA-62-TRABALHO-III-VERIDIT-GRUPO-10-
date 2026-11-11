// Enviado ao back (string)
export type UserTypeStr = 'COMMON' | 'LAWYER';

// Recebido do back — aceita numérico (0/1) OU string ("COMMON"/"LAWYER")
// para funcionar independentemente de o enum do back ser numérico ou string
export type UserTypeRaw = 0 | 1 | UserTypeStr;

export interface Account {
  id: string;
  name: string;
  email: string;
  cpf: string;
  oab: string | null;
  type: UserTypeRaw;
  createAt: string; // ⚠️ typo vem assim do back
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  accountResponseDto: Account;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  cpf: string;
  oab?: string;
  type: UserTypeStr;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Normaliza type (0/1/"COMMON"/"LAWYER") para label legível
export function userTypeLabel(type: UserTypeRaw): string {
  if (type === 0 || type === 'COMMON') return 'Comum';
  if (type === 1 || type === 'LAWYER') return 'Advogado';
  return 'Desconhecido';
}