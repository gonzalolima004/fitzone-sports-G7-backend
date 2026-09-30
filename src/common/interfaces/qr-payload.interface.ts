export interface IQrTokenPayload {
  sub: string;
  type: 'qr_acceso';
  totp: string;
  iat?: number;
  exp?: number;
}
