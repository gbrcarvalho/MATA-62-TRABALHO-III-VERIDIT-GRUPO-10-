import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AppModule } from '../src/app.module.js'
import { ACCOUNTS_REPOSITORY, AccountsRepository } from '../src/interfaces/accounts-repository.interface.js'
import type { Account } from '../src/models/account.model.js'
import { UserType } from '../src/enums/user-type.enum.js'
import { AuthService } from '../src/auth.service.js'
import { AuthGuard } from '../src/auth.guard.js'

/**
 * Repositório em memória usado só nos testes, para não depender
 * (nem alterar) o ./database/seed.json.
 */
class FakeAccountsRepository implements AccountsRepository {
  db: Account[] = []

  async findByEmail(email: string) {
    return this.db.find(a => a.email.toLowerCase() === email.toLowerCase())
  }

  async findByCpf(cpf: string) {
    const normalize = (v: string) => v.replace(/\D/g, '')
    return this.db.find(a => normalize(a.cpf) === normalize(cpf))
  }

  async create(account: Account) {
    this.db.push(account)
    return account
  }

  reset() {
    this.db = []
  }
}

const validCommon = () => ({
  name: 'Maria Silva',
  email: 'maria@example.com',
  password: 'senha-super-secreta',
  cpf: '123.456.789-09',
  type: 'COMMON',
})

const validLawyer = () => ({
  name: 'João Advogado',
  email: 'joao@example.com',
  password: 'senha-super-secreta',
  cpf: '987.654.321-00',
  oab: 'OAB/BA 12345',
  type: 'LAWYER',
})

describe('POST /accounts (e2e)', () => {
  let app: INestApplication
  const repository = new FakeAccountsRepository()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(AuthService)
      .useValue({})
      .overrideProvider(AuthGuard)
      .useValue({ canActivate: () => {} })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => {} })
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

  describe('criação com sucesso', () => {
    it('cria uma conta COMMON e retorna 201 sem expor a senha', async () => {
      const payload = validCommon()

      const res = await request(app.getHttpServer()).post('/accounts').send(payload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        name: payload.name,
        email: payload.email,
        cpf: payload.cpf,
        oab: null,
        type: UserType.COMMON,
      })
      expect(res.body.id).toEqual(expect.any(String))
      expect(res.body).not.toHaveProperty('password')
      expect(JSON.stringify(res.body)).not.toContain(payload.password)
    })

    it('cria uma conta LAWYER com OAB e retorna 201', async () => {
      const payload = validLawyer()

      const res = await request(app.getHttpServer()).post('/accounts').send(payload)

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({
        name: payload.name,
        email: payload.email,
        cpf: payload.cpf,
        oab: payload.oab,
        type: UserType.LAWYER,
      })
      expect(res.body).not.toHaveProperty('password')
    })

    it('gera ids diferentes para contas diferentes', async () => {
      const a = await request(app.getHttpServer()).post('/accounts').send(validCommon())
      const b = await request(app.getHttpServer()).post('/accounts').send(validLawyer())

      expect(a.status).toBe(201)
      expect(b.status).toBe(201)
      expect(a.body.id).not.toBe(b.body.id)
    })

    it('persiste a conta no repositório', async () => {
      const payload = validCommon()

      await request(app.getHttpServer()).post('/accounts').send(payload).expect(201)

      expect(repository.db).toHaveLength(1)
      expect(repository.db[0]).toMatchObject({ email: payload.email, cpf: payload.cpf })
    })

    it('ignora a OAB informada em contas COMMON? (documenta o comportamento atual)', async () => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validCommon(), oab: 'OAB/BA 999' })

      expect(res.status).toBe(201)
      expect(res.body.oab).toBeNull()
    })
  })

  describe('validação do corpo (400)', () => {
    const required = ['name', 'email', 'password', 'cpf', 'type'] as const

    it.each(required)('retorna 400 quando "%s" está ausente', async field => {
      const payload: Record<string, unknown> = validCommon()
      delete payload[field]

      const res = await request(app.getHttpServer()).post('/accounts').send(payload)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Dados inválidos!')
    })

    it.each(required)('retorna 400 quando "%s" não é string', async field => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validCommon(), [field]: 12345 })

      expect(res.status).toBe(400)
    })

    it('retorna 400 quando "type" é um valor desconhecido', async () => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validCommon(), type: 'ADMIN' })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Dados inválidos!')
    })

    it('retorna 400 quando o corpo é vazio', async () => {
      const res = await request(app.getHttpServer()).post('/accounts').send({})

      expect(res.status).toBe(400)
    })

    it('retorna 400 para LAWYER sem OAB', async () => {
      const payload: Record<string, unknown> = validLawyer()
      delete payload.oab

      const res = await request(app.getHttpServer()).post('/accounts').send(payload)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('The given OAB is invalid.')
      expect(repository.db).toHaveLength(0)
    })

    it('retorna 400 para LAWYER com OAB não-string', async () => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validLawyer(), oab: 12345 })

      expect(res.status).toBe(400)
    })

    it('retorna 400 para JSON malformado', async () => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .set('Content-Type', 'application/json')
        .send('{ "name": ')

      expect(res.status).toBe(400)
    })
  })

  describe('conflitos (409)', () => {
    it('retorna 409 quando o e-mail já está em uso', async () => {
      await request(app.getHttpServer()).post('/accounts').send(validCommon()).expect(201)

      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validLawyer(), email: validCommon().email })

      expect(res.status).toBe(409)
      expect(res.body.message).toBe('The given email is already being used.')
      expect(repository.db).toHaveLength(1)
    })

    it('trata e-mail case-insensitive', async () => {
      await request(app.getHttpServer()).post('/accounts').send(validCommon()).expect(201)

      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validLawyer(), email: validCommon().email.toUpperCase() })

      expect(res.status).toBe(409)
    })

    it('retorna 409 quando o CPF já está em uso', async () => {
      await request(app.getHttpServer()).post('/accounts').send(validCommon()).expect(201)

      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validLawyer(), cpf: validCommon().cpf })

      expect(res.status).toBe(409)
      expect(res.body.message).toBe('The given CPF is already being used.')
      expect(repository.db).toHaveLength(1)
    })

    it('considera o mesmo CPF com e sem formatação', async () => {
      await request(app.getHttpServer()).post('/accounts').send(validCommon()).expect(201)

      const res = await request(app.getHttpServer())
        .post('/accounts')
        .send({ ...validLawyer(), cpf: '12345678909' })

      expect(res.status).toBe(409)
    })

    it('dá prioridade ao conflito de e-mail quando e-mail e CPF repetem', async () => {
      await request(app.getHttpServer()).post('/accounts').send(validCommon()).expect(201)

      const res = await request(app.getHttpServer()).post('/accounts').send(validCommon())

      expect(res.status).toBe(409)
      expect(res.body.message).toBe('The given email is already being used.')
    })
  })
})
