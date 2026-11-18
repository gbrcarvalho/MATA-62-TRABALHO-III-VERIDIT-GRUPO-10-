import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService as NestJwt } from '@nestjs/jwt'
import { randomUUID } from 'crypto'
import { JwtPayload } from './interfaces/jwt-payload.interface.js'

@Injectable()
export class JwtService {
  private readonly jwt = new NestJwt()
  private readonly secret = process.env.JWT_SECRET ?? 'uma-senha-super-secreta-substituir-em-producao'
  readonly expiresInSeconds = Number(process.env.JWT_EXPIRATION ?? '1200')

  constructor() {
    if (!this.secret || this.secret.length < 32) {
      throw new Error('JWT_SECRET ausente ou fraco (mín. 32 caracteres)')
    }
  }

  sign(data: Pick<JwtPayload, 'sub' | 'email' | 'type'>): string {
    const payload = { email: data.email, type: data.type }
    return this.jwt.sign(payload, {
        algorithm: 'HS256',
        subject: data.sub,
        jwtid: randomUUID(),
        expiresIn: this.expiresInSeconds,
        secret: this.secret
    })
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwt.verify(token, {
        algorithms: ['HS256'],
        secret: this.secret
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }
}
