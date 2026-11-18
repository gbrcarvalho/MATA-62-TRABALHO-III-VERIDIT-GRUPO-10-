import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AppModule } from '../src/app.module.js'
import { ACCOUNTS_REPOSITORY } from '../src/interfaces/accounts-repository.interface.js'
import { UserType } from '../src/enums/user-type.enum.js'
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

/** Decodifica o payload de um JWT sem validar a assinatura (só para inspeção). */
const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const [, payload] = token.split('.')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
}

describe('POST /auth/login (e2e)', () => {
  let app: INestApplication
  const repository = new FakeAccountsRepository()

  // Usa o AuthService, o AuthGuard, o JwtService e o InMemoryTokenRepository
  // reais. O JWT_SECRET vem de `test.env` no vitest.config.e2e.ts.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ACCOUNTS_REPOSITORY)
      .useValue(repository)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  beforeEach(() => repository.reset())

  afterAll(async () => {
    await app.close()
  })

  /** Cadastra a conta pelo endpoint real, como um cliente faria. */
  const register = async (payload: Record<string, unknown>) => {
    const res = await request(app.getHttpServer()).post('/accounts').send(payload)
    expect(res.status).toBe(201)
    return res.body as { id: string }
  }

  const login = (body: unknown) =>
    request(app.getHttpServer()).post('/auth/login').send(body as object)

  describe('login com sucesso', () => {
    it('autentica uma conta COMMON e retorna o token', async () => {
      const account = commonAccount()
      await register(account)

      const res = await login({ email: account.email, password: account.password })

      // O controller não define @HttpCode, então o Nest usa 201 para POST.
      expect(res.status).toBe(201)
      expect(res.body.accessToken).toEqual(expect.any(String))
      expect(res.body.tokenType).toBe('Bearer')
      expect(res.body.expiresIn).toBe(1200)
    })

    it('retorna os dados da conta sem expor a senha', async () => {
      const account = commonAccount()
      const { id } = await register(account)

      const res = await login({ email: account.email, password: account.password })

      expect(res.body.accountResponseDto).toMatchObject({
        id,
        name: account.name,
        email: account.email,
        cpf: account.cpf,
        oab: null,
        type: UserType.COMMON,
      })
      const serialized = JSON.stringify(res.body)
      expect(serialized).not.toContain(account.password)
      expect(res.body.accountResponseDto).not.toHaveProperty('password')
      expect(res.body.accountResponseDto).not.toHaveProperty('passwordHash')
    })

    it('autentica uma conta LAWYER e retorna a OAB', async () => {
      const account = lawyerAccount()
      await register(account)

      const res = await login({ email: account.email, password: account.password })

      expect(res.status).toBe(201)
      expect(res.body.accountResponseDto).toMatchObject({
        email: account.email,
        oab: account.oab,
        type: UserType.LAWYER,
      })
    })

    it('emite um JWT com sub, email, type e jti', async () => {
      const account = commonAccount()
      const { id } = await register(account)

      const res = await login({ email: account.email, password: account.password })

      const token: string = res.body.accessToken
      expect(token.split('.')).toHaveLength(3)

      const payload = decodeJwtPayload(token)
      expect(payload).toMatchObject({
        sub: id,
        email: account.email,
        type: UserType.COMMON,
      })
      expect(payload.jti).toEqual(expect.any(String))
      expect(payload.exp).toEqual(expect.any(Number))
      expect(payload.iat).toEqual(expect.any(Number))
      expect(Number(payload.exp) - Number(payload.iat)).toBe(1200)
    })

    it('emite tokens diferentes (jti único) a cada login', async () => {
      const account = commonAccount()
      await register(account)
      const credentials = { email: account.email, password: account.password }

      const first = await login(credentials)
      const second = await login(credentials)

      expect(first.status).toBe(201)
      expect(second.status).toBe(201)
      expect(first.body.accessToken).not.toBe(second.body.accessToken)
      expect(decodeJwtPayload(first.body.accessToken).jti).not.toBe(
        decodeJwtPayload(second.body.accessToken).jti,
      )
    })

    it('aceita o e-mail com maiúsculas/minúsculas diferentes do cadastro', async () => {
      const account = commonAccount()
      await register(account)

      const res = await login({
        email: account.email.toUpperCase(),
        password: account.password,
      })

      expect(res.status).toBe(201)
      expect(res.body.accountResponseDto.email).toBe(account.email)
    })

    it('gera um token aceito pelo AuthGuard em POST /auth/verify', async () => {
      const account = commonAccount()
      const { id } = await register(account)
      const { body } = await login({ email: account.email, password: account.password })

      const res = await request(app.getHttpServer())
        .post('/auth/verify')
        .set('Authorization', `Bearer ${body.accessToken}`)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ sub: id, email: account.email, type: UserType.COMMON })
    })
  })

  describe('credenciais inválidas (401)', () => {
    const invalidMessage = 'Email e/ou senha, inválidos!'

    it('retorna 401 para senha incorreta', async () => {
      const account = commonAccount()
      await register(account)

      const res = await login({ email: account.email, password: 'senha-errada' })

      expect(res.status).toBe(401)
      expect(res.body.message).toBe(invalidMessage)
      expect(res.body).not.toHaveProperty('accessToken')
    })

    it('retorna 401 para e-mail não cadastrado', async () => {
      const res = await login({ email: 'ninguem@example.com', password: 'qualquer-senha' })

      expect(res.status).toBe(401)
      expect(res.body.message).toBe(invalidMessage)
    })

    it('usa a mesma mensagem para e-mail inexistente e senha errada (não revela qual falhou)', async () => {
      const account = commonAccount()
      await register(account)

      const wrongPassword = await login({ email: account.email, password: 'senha-errada' })
      const unknownEmail = await login({ email: 'ninguem@example.com', password: account.password })

      expect(wrongPassword.status).toBe(unknownEmail.status)
      expect(wrongPassword.body.message).toBe(unknownEmail.body.message)
    })

    it('trata a senha como case-sensitive', async () => {
      const account = commonAccount()
      await register(account)

      const res = await login({
        email: account.email,
        password: account.password.toUpperCase(),
      })

      expect(res.status).toBe(401)
    })

    it('não autentica com a senha de outra conta', async () => {
      const maria = commonAccount()
      const joao = lawyerAccount()
      await register(maria)
      await register(joao)

      const res = await login({ email: maria.email, password: joao.password })

      expect(res.status).toBe(401)
    })
  })

  describe('validação do corpo (400)', () => {
    const required = ['email', 'password'] as const

    it.each(required)('retorna 400 quando "%s" está ausente', async field => {
      const body: Record<string, unknown> = { email: 'maria@example.com', password: 'senha' }
      delete body[field]

      const res = await login(body)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Dados inválidos!')
    })

    it.each(required)('retorna 400 quando "%s" não é string', async field => {
      const res = await login({ email: 'maria@example.com', password: 'senha', [field]: 12345 })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Dados inválidos!')
    })

    it('retorna 400 quando o corpo é vazio', async () => {
      const res = await login({})

      expect(res.status).toBe(400)
    })

    it('retorna 400 para JSON malformado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ "email": ')

      expect(res.status).toBe(400)
    })
  })
})
