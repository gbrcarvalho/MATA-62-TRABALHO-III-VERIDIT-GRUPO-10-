import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { JwtService as NestJwt } from '@nestjs/jwt'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AppModule } from '../src/app.module.js'
import { ACCOUNTS_REPOSITORY } from '../src/interfaces/accounts-repository.interface.js'
import { FakeAccountsRepository } from './mock/fake-accounts.repository.js'

const commonAccount = () => ({
  name: 'Maria Silva',
  email: 'maria@example.com',
  password: 'senha-super-secreta',
  cpf: '123.456.789-09',
  type: 'COMMON',
})

const lawyerAccount = () => ({
  name: 'João Advogado',
  email: 'joao@example.com',
  password: 'outra-senha-secreta',
  cpf: '987.654.321-00',
  oab: 'OAB/BA 12345',
  type: 'LAWYER',
})

describe('POST /auth/logout (e2e)', () => {
  let app: INestApplication
  const repository = new FakeAccountsRepository()

  // AuthService, AuthGuard, JwtService e InMemoryTokenRepository reais.
  // Só o repositório de contas é trocado. O JWT_SECRET vem de `test.env`
  // no vitest.config.e2e.ts.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ACCOUNTS_REPOSITORY)
      .useValue(repository)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  // Não há reset da lista de tokens revogados (ela é interna ao app), mas
  // cada login gera um jti novo, então os testes não interferem entre si.
  beforeEach(() => repository.reset())

  afterAll(async () => {
    await app.close()
  })

  /** Cadastra a conta e faz login pelos endpoints reais; devolve o token. */
  const registerAndLogin = async (account: ReturnType<typeof commonAccount>) => {
    await request(app.getHttpServer()).post('/accounts').send(account).expect(201)
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password: account.password })
      .expect(201)
    return res.body.accessToken as string
  }

  /** Faz um novo login numa conta já cadastrada. */
  const loginAgain = async (account: ReturnType<typeof commonAccount>) => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password: account.password })
      .expect(201)
    return res.body.accessToken as string
  }

  const logout = (token?: string, scheme = 'Bearer') => {
    const req = request(app.getHttpServer()).post('/auth/logout')
    return token === undefined ? req : req.set('Authorization', `${scheme} ${token}`)
  }

  const verify = (token: string) =>
    request(app.getHttpServer()).post('/auth/verify').set('Authorization', `Bearer ${token}`)

  describe('logout com sucesso', () => {
    it('retorna 204 sem corpo para um token válido', async () => {
      const token = await registerAndLogin(commonAccount())

      const res = await logout(token)

      expect(res.status).toBe(204)
      expect(res.text).toBe('')
      expect(res.body).toEqual({})
    })

    it('revoga o token: ele deixa de ser aceito em /auth/verify', async () => {
      const token = await registerAndLogin(commonAccount())
      await verify(token).expect(201) // antes do logout, o token funciona

      await logout(token).expect(204)

      const res = await verify(token)
      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token revogado')
    })

    it('não permite repetir o logout com o mesmo token', async () => {
      const token = await registerAndLogin(commonAccount())

      await logout(token).expect(204)
      const res = await logout(token)

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token revogado')
    })

    it('revoga só o token usado: outro login da mesma conta continua válido', async () => {
      const account = commonAccount()
      const firstToken = await registerAndLogin(account)
      const secondToken = await loginAgain(account)

      await logout(firstToken).expect(204)

      expect((await verify(firstToken)).status).toBe(401)
      expect((await verify(secondToken)).status).toBe(201)
    })

    it('não afeta tokens de outras contas', async () => {
      const mariaToken = await registerAndLogin(commonAccount())
      const joaoToken = await registerAndLogin(lawyerAccount())

      await logout(mariaToken).expect(204)

      expect((await verify(mariaToken)).status).toBe(401)
      expect((await verify(joaoToken)).status).toBe(201)
    })

    it('permite fazer login de novo depois do logout e usar o novo token', async () => {
      const account = commonAccount()
      const oldToken = await registerAndLogin(account)
      await logout(oldToken).expect(204)

      const newToken = await loginAgain(account)

      expect(newToken).not.toBe(oldToken)
      expect((await verify(newToken)).status).toBe(201)
      expect((await verify(oldToken)).status).toBe(401)
    })
  })

  describe('autenticação inválida (401)', () => {
    it('retorna 401 sem o header Authorization', async () => {
      const res = await logout()

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token ausente')
    })

    it('retorna 401 quando o esquema não é Bearer', async () => {
      const token = await registerAndLogin(commonAccount())

      const res = await logout(token, 'Basic')

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token ausente')
    })

    it('retorna 401 quando o esquema é Bearer mas não há token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer')

      expect(res.status).toBe(401)
    })

    it('retorna 401 para um token malformado', async () => {
      const res = await logout('isto-nao-e-um-jwt')

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token inválido ou expirado')
    })

    it('retorna 401 para um token assinado com outro segredo', async () => {
      const forged = new NestJwt().sign(
        { email: 'maria@example.com', type: 'COMMON' },
        {
          secret: 'outro-segredo-diferente-com-mais-de-32-caracteres',
          algorithm: 'HS256',
          subject: randomUUID(),
          jwtid: randomUUID(),
          expiresIn: 600,
        },
      )

      const res = await logout(forged)

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token inválido ou expirado')
    })

    it('retorna 401 para um token expirado', async () => {
      const expired = new NestJwt().sign(
        { email: 'maria@example.com', type: 'COMMON' },
        {
          secret: process.env.JWT_SECRET,
          algorithm: 'HS256',
          subject: randomUUID(),
          jwtid: randomUUID(),
          expiresIn: -10,
        },
      )

      const res = await logout(expired)

      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Token inválido ou expirado')
    })

    it('não revoga nada quando a autenticação falha', async () => {
      const token = await registerAndLogin(commonAccount())

      await logout('isto-nao-e-um-jwt').expect(401)

      expect((await verify(token)).status).toBe(201)
    })
  })
})
